// Gemini API Key Rotation Manager
// Handles multiple Gemini API keys with automatic failover

import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiKeyRotation {
  constructor() {
    // Load all API keys from environment
    this.keys = this.loadKeys();
    this.currentIndex = 0;
    this.keyStats = new Map(); // Track usage per key
    this.initializeStats();
  }

  loadKeys() {
    const keys = [];
    
    // Support multiple formats
    // GEMINI_API_KEY_1, GEMINI_API_KEY_2, GEMINI_API_KEY_3
    // OR GEMINI_API_KEYS="key1,key2,key3"
    
    if (process.env.GEMINI_API_KEYS) {
      // Comma-separated keys
      const keysStr = process.env.GEMINI_API_KEYS.split(',');
      keys.push(...keysStr.map(k => k.trim()));
    } else {
      // Individual keys
      for (let i = 1; i <= 10; i++) {
        const key = process.env[`GEMINI_API_KEY_${i}`];
        if (key) keys.push(key);
      }
    }

    // Fallback to single key
    if (keys.length === 0 && process.env.GEMINI_API_KEY) {
      keys.push(process.env.GEMINI_API_KEY);
    }

    if (keys.length === 0) {
      throw new Error('❌ No Gemini API keys found in environment');
    }

    console.log(`✅ Loaded ${keys.length} Gemini API key(s)`);
    return keys;
  }

  initializeStats() {
    this.keys.forEach((key, index) => {
      this.keyStats.set(index, {
        requests: 0,
        errors: 0,
        lastUsed: null,
        rateLimited: false,
        rateLimitResetTime: null,
      });
    });
  }

  getCurrentKey() {
    return this.keys[this.currentIndex];
  }

  getClient() {
    const key = this.getCurrentKey();
    return new GoogleGenerativeAI(key);
  }

  async executeWithRotation(apiCall, maxRetries = 3) {
    const startIndex = this.currentIndex;
    let attempts = 0;

    while (attempts < Math.min(maxRetries, this.keys.length)) {
      const stats = this.keyStats.get(this.currentIndex);
      
      // Check if key is rate limited and cooldown hasn't expired
      if (stats.rateLimited && stats.rateLimitResetTime) {
        if (Date.now() < stats.rateLimitResetTime) {
          console.log(`⏭️  Key ${this.currentIndex + 1} is rate limited, rotating...`);
          this.rotateKey();
          continue;
        } else {
          // Cooldown expired, reset flag
          stats.rateLimited = false;
          stats.rateLimitResetTime = null;
        }
      }

      try {
        const client = this.getClient();
        stats.requests++;
        stats.lastUsed = new Date();
        
        console.log(`🔑 Using API key ${this.currentIndex + 1}/${this.keys.length}`);
        
        const result = await apiCall(client);
        return result;

      } catch (error) {
        stats.errors++;
        
        // Check if rate limit error
        if (this.isRateLimitError(error)) {
          console.warn(`⚠️  Key ${this.currentIndex + 1} hit rate limit!`);
          
          // Mark as rate limited for 60 seconds
          stats.rateLimited = true;
          stats.rateLimitResetTime = Date.now() + 60 * 1000;
          
          // Try next key
          this.rotateKey();
          attempts++;
          continue;
        }

        // Other errors - throw immediately
        throw error;
      }
    }

    // All keys exhausted
    throw new Error('❌ All API keys are rate limited or failed. Please try again in 1 minute.');
  }

  isRateLimitError(error) {
    // Check for rate limit indicators
    const message = error.message?.toLowerCase() || '';
    const status = error.status || error.statusCode;
    
    return (
      status === 429 ||
      message.includes('rate limit') ||
      message.includes('too many requests') ||
      message.includes('quota exceeded') ||
      message.includes('resource_exhausted')
    );
  }

  rotateKey() {
    const previousIndex = this.currentIndex;
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    
    console.log(`🔄 Rotated from key ${previousIndex + 1} to key ${this.currentIndex + 1}`);
    
    // If we've rotated back to start, all keys might be limited
    if (this.currentIndex === 0 && previousIndex !== this.keys.length - 1) {
      console.warn('⚠️  Cycled through all keys, potential rate limit on all');
    }
  }

  getStats() {
    const stats = [];
    this.keyStats.forEach((stat, index) => {
      stats.push({
        keyNumber: index + 1,
        requests: stat.requests,
        errors: stat.errors,
        lastUsed: stat.lastUsed?.toISOString() || 'Never',
        rateLimited: stat.rateLimited,
        isActive: index === this.currentIndex,
      });
    });
    return stats;
  }

  reset() {
    this.currentIndex = 0;
    this.initializeStats();
    console.log('🔄 API key rotation reset');
  }
}

// Singleton instance
let rotationInstance = null;

export function getRotationManager() {
  if (!rotationInstance) {
    rotationInstance = new GeminiKeyRotation();
  }
  return rotationInstance;
}

// Helper function for easy use
export async function callGeminiWithRotation(apiCallFunction) {
  const manager = getRotationManager();
  return await manager.executeWithRotation(apiCallFunction);
}

// Get stats endpoint
export function getAPIKeyStats() {
  const manager = getRotationManager();
  return manager.getStats();
}
