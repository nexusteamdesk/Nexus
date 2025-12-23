
import { Worker } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import IORedis from 'ioredis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// --- OPTIMIZED API KEY ROTATION MANAGER (Production-Grade) ---
class GeminiClientManager {
    constructor() {
        let keys = [];

        if (process.env.GEMINI_API_KEYS) {
            keys = process.env.GEMINI_API_KEYS.split(',').map(k => k.trim()).filter(k => k.length > 0);
        } else if (process.env.GEMINI_API_KEY) {
            keys = [process.env.GEMINI_API_KEY];
        }

        if (keys.length === 0) {
            throw new Error("❌ CRITICAL: No GEMINI_API_KEYS configured! Add keys to .env");
        }

        // Initialize with comprehensive metrics
        this.clients = keys.map((key, index) => ({
            client: new GoogleGenerativeAI(key),
            keyId: `Key-${index + 1}`,
            keyMask: key.substring(0, 8) + "...",
            lastUsed: 0,
            rateLimitedUntil: 0,
            consecutiveFailures: 0,
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            rateLimitHits: 0
        }));

        this.currentIndex = 0;
        this.totalRequestsOverall = 0;
        console.log(`🔑 Production Mode: Loaded ${this.clients.length} Gemini API Keys`);
        console.log(`📊 Theoretical Capacity: ${this.clients.length * 60} requests/minute`);
    }

    getClient() {
        const now = Date.now();

        // 1. Try to find a healthy client (Round Robin with health score)
        for (let i = 0; i < this.clients.length; i++) {
            const ptr = (this.currentIndex + i) % this.clients.length;
            const candidate = this.clients[ptr];

            // Skip if rate limited
            if (candidate.rateLimitedUntil >= now) continue;

            // Exponential backoff for consecutive failures
            const backoffTime = Math.min(1000 * Math.pow(2, candidate.consecutiveFailures), 30000);
            if (now - candidate.lastUsed < backoffTime) continue;

            // Select this key
            this.currentIndex = (ptr + 1) % this.clients.length;
            candidate.lastUsed = now;
            candidate.totalRequests++;
            this.totalRequestsOverall++;

            return { gemini: candidate.client, id: ptr, keyId: candidate.keyId };
        }

        // 2. All blocked? Return least-recently rate-limited (emergency fallback)
        console.warn("⚠️ All keys blocked! Using emergency fallback...");
        const fallback = this.clients.reduce((min, curr) =>
            curr.rateLimitedUntil < min.rateLimitedUntil ? curr : min
        );
        const fallbackId = this.clients.indexOf(fallback);
        return { gemini: fallback.client, id: fallbackId, keyId: fallback.keyId };
    }

    reportSuccess(id) {
        if (this.clients[id]) {
            this.clients[id].successfulRequests++;
            this.clients[id].consecutiveFailures = 0; // Reset failure counter
        }
    }

    reportFailure(id, isRateLimit = false) {
        if (this.clients[id]) {
            this.clients[id].failedRequests++;
            this.clients[id].consecutiveFailures++;

            if (isRateLimit) {
                this.clients[id].rateLimitHits++;
                this.clients[id].rateLimitedUntil = Date.now() + 60000;
                console.warn(`⏳ ${this.clients[id].keyId} rate limited. Cooldown: 60s`);
            }
        }
    }

    getHealthMetrics() {
        return {
            totalKeys: this.clients.length,
            totalRequests: this.totalRequestsOverall,
            theoreticalCapacity: `${this.clients.length * 60} req/min`,
            keys: this.clients.map(c => ({
                id: c.keyId,
                mask: c.keyMask,
                status: c.rateLimitedUntil > Date.now() ? 'RATE_LIMITED' : 'HEALTHY',
                total: c.totalRequests,
                success: c.successfulRequests,
                failed: c.failedRequests,
                rateLimitHits: c.rateLimitHits,
                successRate: c.totalRequests > 0 ? `${((c.successfulRequests / c.totalRequests) * 100).toFixed(1)}%` : 'N/A'
            }))
        };
    }
}

const geminiManager = new GeminiClientManager();

console.log("👷 Nexus Worker Started. Waiting for jobs...");

const connection = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    reconnectOnError(err) {
        console.error('Worker Redis connection error:', err.message);
        return true;
    }
});

// --- REDIS CONNECTION HANDLERS ---
connection.on('connect', () => console.log('✅ Worker Redis connected'));
connection.on('error', (err) => console.error('❌ Worker Redis error:', err.message));
connection.on('close', () => console.warn('⚠️  Worker Redis connection closed'));

const worker = new Worker('nexus-ai-queue', async (job) => {
    const { rawText, token, source } = job.data;
    console.log(`[Worker] Processing Job ${job.id} (Source: ${source || 'W'})...`);

    // ============ STEP 1: URL CONTENT ENRICHMENT ============
    // If the input is primarily a URL (mobile share), fetch and enrich content
    let textToProcess = rawText;
    let urlExtracted = null;

    try {
        const { enrichTextWithUrlContent } = await import('./urlExtractor.js');
        const enrichResult = await enrichTextWithUrlContent(rawText);

        if (enrichResult.wasEnriched) {
            textToProcess = enrichResult.enrichedText;
            urlExtracted = enrichResult.extracted;
            console.log(`[Worker] URL content enriched for Job ${job.id} (Platform: ${urlExtracted.platform})`);
        }
    } catch (urlError) {
        console.warn(`[Worker] URL extraction skipped for Job ${job.id}:`, urlError.message);
        // Continue with original text if URL extraction fails
    }

    // Check if we should use NLP only mode (for when AI is unavailable)
    const useNlpOnly = process.env.USE_NLP_ONLY === 'true';

    let result = null;
    let usedAI = false;

    // ============ STEP 2: AI PROCESSING (PRIMARY) ============

    if (!useNlpOnly) {
        // Get a rotated client
        const { gemini: currentGemini, id: clientId } = geminiManager.getClient();

        try {
            // 1. Analyze with Gemini
            const model = currentGemini.getGenerativeModel({
                model: 'gemini-1.5-flash',
                generationConfig: {
                    responseMimeType: "application/json"
                }
            });

            const prompt = `Analyze the following text and extract key information. Return valid JSON with:
- title: concise title (max 80 characters)
- summary: brief summary (max 200 characters)
- keywords: relevant tags (array, maximum 5 items, single words preferred)
- emotions: detected emotions (array, maximum 3 items)
- source_url: extracted URL if present (string or null)

Text to analyze:
${textToProcess}`;

            const response = await model.generateContent(prompt);
            const text = response.response.text();
            result = JSON.parse(text);
            usedAI = true;
            geminiManager.reportSuccess(clientId);
            console.log(`[Worker] AI processing successful for Job ${job.id}`);

        } catch (aiError) {
            console.warn(`[Worker] AI failed for Job ${job.id}: ${aiError.message}`);

            // Handle Rate Limits specifically
            const isRateLimit = aiError.message.includes('429') ||
                aiError.message.includes('rate limit') ||
                aiError.message.toLowerCase().includes('rate_limit_exceeded') ||
                aiError.message.toLowerCase().includes('resource_exhausted');
            const isInvalidKey = aiError.message.includes('401') ||
                aiError.message.includes('Invalid API Key');

            if (isRateLimit) {
                geminiManager.reportFailure(clientId, true);
            } else {
                geminiManager.reportFailure(clientId, false);
            }

            // Don't throw - we'll fallback to NLP
            console.log(`[Worker] Falling back to local NLP processing...`);
        }
    }

    // ============ STEP 3: NLP FALLBACK ============

    if (!result) {
        try {
            // Dynamic import to avoid issues if module isn't loaded
            const { analyzeText } = await import('./nlpProcessor.js');
            result = analyzeText(textToProcess);
            console.log(`[Worker] NLP processing successful for Job ${job.id}`);
        } catch (nlpError) {
            console.error(`[Worker] NLP processing also failed:`, nlpError.message);

            // Last resort: basic extraction
            result = {
                title: textToProcess.substring(0, 80).replace(/\n/g, ' ').trim() || 'New Memory',
                summary: textToProcess.substring(0, 200).replace(/\n/g, ' ').trim(),
                keywords: ['Uncategorized'],
                emotions: ['Neutral'],
                source_url: null
            };
        }
    }

    // ============ STEP 4: SAVE TO DATABASE ============

    try {
        result.timestamp = new Date().toISOString();
        result.source = source || 'W';
        result.processed_by = usedAI ? 'ai' : 'nlp';
        result.url_enriched = urlExtracted !== null; // Track if URL was enriched

        // If we extracted URL data, ensure source_url is set
        if (urlExtracted && urlExtracted.url && !result.source_url) {
            result.source_url = urlExtracted.url;
        }

        // Extract user_id from JWT token
        const jwtPayload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        const userId = jwtPayload.sub;

        // Create user-scoped Supabase client
        const userSupabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: `Bearer ${token}` } }
        });

        const { data, error } = await userSupabase
            .from('retain_auth_memory')
            .insert([{ user_id: userId, metadata: result }])
            .select();

        if (error) throw new Error(error.message);

        console.log(`[Worker] Job ${job.id} Completed (${usedAI ? 'AI' : 'NLP'}). Memory ID: ${data[0].id}`);
        return { ...result, id: data[0].id };

    } catch (dbError) {
        console.error(`[Worker] Database error for Job ${job.id}:`, dbError.message);

        // If this is a token error, don't retry
        if (dbError.message.includes('JWT') || dbError.message.includes('auth')) {
            console.error(`[Worker] Authentication error - job will not be retried`);
        }

        throw dbError;
    }


}, {
    connection,
    concurrency: 10, // OPTIMIZED: 5 keys = 300 RPM capacity, 10 concurrent = safe
    limiter: {
        max: 300, // OPTIMIZED: 5 keys × 60 RPM/key = 300 total capacity
        duration: 60000
    }
});

// --- CIRCUIT BREAKER PATTERN ---
let consecutiveFailures = 0;
const MAX_FAILURES = 10;
const CIRCUIT_BREAKER_RESET_TIME = 5 * 60 * 1000; // 5 minutes

function tripCircuitBreaker() {
    console.error(`⚠️  CIRCUIT BREAKER TRIPPED! ${consecutiveFailures} consecutive failures`);
    console.log('⏸️  Pausing worker for 5 minutes...');
    worker.pause();

    setTimeout(() => {
        console.log('🔄 Circuit breaker reset. Resuming worker...');
        consecutiveFailures = 0;
        worker.resume();
    }, CIRCUIT_BREAKER_RESET_TIME);
}


// --- WORKER EVENT HANDLERS FOR MONITORING ---
worker.on('completed', (job, result) => {
    const duration = Date.now() - job.timestamp;
    console.log(`✅ [Worker] Job ${job.id} completed in ${duration}ms. Memory ID: ${result.id}`);

    // Reset circuit breaker on success
    consecutiveFailures = 0;
});

worker.on('failed', async (job, err) => {
    console.error(`❌ [Worker] Job ${job.id} failed after ${job.attemptsMade} attempts:`, err.message);

    // Increment circuit breaker counter
    consecutiveFailures++;
    if (consecutiveFailures >= MAX_FAILURES) {
        tripCircuitBreaker();
    }

    // If job has exhausted all retries, move to Dead Letter Queue
    if (job.attemptsMade >= (job.opts?.attempts || 1)) {
        console.log(`📮 [Worker] Moving job ${job.id} to Dead Letter Queue`);

        try {
            const { Queue } = await import('bullmq');
            const failedQueue = new Queue('nexus-failed-queue', { connection });

            await failedQueue.add('dlq_job', {
                originalJob: job.data,
                jobId: job.id,
                error: err.message,
                failedAt: new Date().toISOString(),
                attempts: job.attemptsMade
            });

            console.log(`✅ [Worker] Job ${job.id} moved to DLQ`);
        } catch (dlqError) {
            console.error(`❌ [Worker] Failed to move job ${job.id} to DLQ:`, dlqError.message);
        }
    }
});

worker.on('active', (job) => {
    console.log(`⚡ [Worker] Processing job ${job.id}...`);
});

worker.on('stalled', (jobId) => {
    console.warn(`⚠️  [Worker] Job ${jobId} stalled (may be retried)`);
});

worker.on('error', (err) => {
    console.error('💥 [Worker] Worker error:', err);
});

// --- GRACEFUL SHUTDOWN ---
const shutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down worker...`);

    try {
        // Close worker (wait for active jobs to complete)
        await worker.close();
        console.log('✅ Worker closed');

        // Close Redis connection
        await connection.quit();
        console.log('✅ Redis connection closed');

        console.log('👋 Worker shutdown complete');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during worker shutdown:', error);
        process.exit(1);
    }
};

// Listen for termination signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception in worker:', error);
    shutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason) => {
    console.error('💥 Unhandled Rejection in worker:', reason);
    shutdown('UNHANDLED_REJECTION');
});
