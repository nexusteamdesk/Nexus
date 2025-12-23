/**
 * Nexus NLP Processor - AI-Free Text Analysis
 * 
 * This module provides traditional NLP algorithms for text analysis
 * without requiring external AI APIs. It serves as a fallback or
 * primary processor depending on configuration.
 * 
 * Features:
 * - TF-IDF Keyword Extraction
 * - Extractive Summarization
 * - Sentiment-based Emotion Detection
 * - URL Extraction
 * - Title Generation
 */

import natural from 'natural';
import keywordExtractor from 'keyword-extractor';
import Sentiment from 'sentiment';

const TfIdf = natural.TfIdf;
const tokenizer = new natural.WordTokenizer();
const sentenceTokenizer = new natural.SentenceTokenizer();
const sentiment = new Sentiment();

// Common stopwords to filter out
const STOPWORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
    'used', 'it', 'its', 'this', 'that', 'these', 'those', 'i', 'you', 'he',
    'she', 'we', 'they', 'what', 'which', 'who', 'whom', 'where', 'when',
    'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
    'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
    'so', 'than', 'too', 'very', 's', 't', 'just', 'don', 'now', 'http',
    'https', 'www', 'com', 'org', 'net', 'io', 'url', 'link', 'captured',
    'platform', 'type', 'content', 'title', 'author', 'posted'
]);

// Emotion keywords mapping
const EMOTION_KEYWORDS = {
    happy: ['happy', 'joy', 'excited', 'amazing', 'wonderful', 'great', 'fantastic', 'love', 'celebrate', 'success', 'achievement', 'win', 'congratulations', 'blessed', 'grateful', 'thrilled'],
    sad: ['sad', 'depressed', 'unhappy', 'cry', 'tears', 'grief', 'loss', 'miss', 'lonely', 'heartbroken', 'disappointed', 'regret', 'sorry', 'tragic', 'devastating'],
    angry: ['angry', 'furious', 'mad', 'hate', 'rage', 'frustrated', 'annoyed', 'irritated', 'outraged', 'disgusted', 'terrible', 'awful', 'worst'],
    fear: ['fear', 'scared', 'afraid', 'worried', 'anxious', 'nervous', 'terrified', 'panic', 'dread', 'horror', 'alarming', 'concerning'],
    surprise: ['surprise', 'shocked', 'amazed', 'astonished', 'unexpected', 'unbelievable', 'wow', 'incredible', 'stunning', 'mindblowing'],
    neutral: ['informative', 'update', 'news', 'article', 'report', 'announcement', 'information', 'data', 'facts', 'analysis']
};

/**
 * Extract keywords using TF-IDF algorithm
 * @param {string} text - Input text
 * @param {number} maxKeywords - Maximum keywords to return (default: 5)
 * @returns {string[]} Array of keywords
 */
export function extractKeywords(text, maxKeywords = 5) {
    if (!text || typeof text !== 'string' || text.trim().length < 10) {
        return [];
    }

    try {
        // Method 1: Use keyword-extractor (RAKE algorithm)
        const rakeKeywords = keywordExtractor.extract(text, {
            language: 'english',
            remove_digits: false,
            return_changed_case: true,
            remove_duplicates: true
        });

        // Method 2: Use TF-IDF
        const tfidf = new TfIdf();
        tfidf.addDocument(text.toLowerCase());
        
        const tfidfTerms = [];
        tfidf.listTerms(0).forEach(item => {
            if (!STOPWORDS.has(item.term) && 
                item.term.length > 2 && 
                item.term.length < 20 &&
                !/^\d+$/.test(item.term)) {
                tfidfTerms.push(item.term);
            }
        });

        // Combine and deduplicate
        const combined = [...new Set([...rakeKeywords.slice(0, 10), ...tfidfTerms.slice(0, 10)])];
        
        // Filter and clean
        const filtered = combined
            .filter(kw => {
                const lower = kw.toLowerCase();
                return !STOPWORDS.has(lower) && 
                       kw.length > 2 && 
                       kw.length < 25 &&
                       !/^https?:\/\//.test(kw) &&
                       !/^\d+$/.test(kw);
            })
            .map(kw => kw.charAt(0).toUpperCase() + kw.slice(1).toLowerCase())
            .slice(0, maxKeywords);

        return filtered.length > 0 ? filtered : ['General'];
    } catch (error) {
        console.error('[NLP] Keyword extraction error:', error.message);
        return ['Uncategorized'];
    }
}

/**
 * Generate extractive summary from text
 * @param {string} text - Input text
 * @param {number} maxLength - Maximum summary length (default: 200)
 * @returns {string} Summary text
 */
export function generateSummary(text, maxLength = 200) {
    if (!text || typeof text !== 'string') {
        return '';
    }

    try {
        // Clean the text
        const cleanText = text
            .replace(/Platform:.*?\n/gi, '')
            .replace(/Type:.*?\n/gi, '')
            .replace(/URL:.*?\n/gi, '')
            .replace(/Captured:.*?\n/gi, '')
            .replace(/─+/g, '')
            .replace(/📍|👤|📄|💬|📝|🏷️|@️|🔖|🎵|🔰|📅|📊|🎥|🔗|🖼️|📂|🌐/g, '')
            .replace(/TITLE:|AUTHOR:|CONTENT:|CAPTION:|DESCRIPTION:|HASHTAGS:|MENTIONS:|TAGS:/gi, '')
            .replace(/\s+/g, ' ')
            .trim();

        if (cleanText.length < 50) {
            return cleanText;
        }

        // Tokenize into sentences
        const sentences = sentenceTokenizer.tokenize(cleanText);
        
        if (sentences.length === 0) {
            return cleanText.substring(0, maxLength);
        }

        // Score sentences based on position and content
        const scoredSentences = sentences.map((sentence, index) => {
            let score = 0;
            
            // Position score (first sentences are important)
            if (index === 0) score += 3;
            else if (index === 1) score += 2;
            else if (index === 2) score += 1;
            
            // Length score (prefer medium-length sentences)
            const words = tokenizer.tokenize(sentence);
            if (words.length >= 5 && words.length <= 25) score += 2;
            
            // Keyword density
            const keywords = extractKeywords(sentence, 3);
            score += keywords.length * 0.5;
            
            return { sentence, score, index };
        });

        // Sort by score and take top sentences
        scoredSentences.sort((a, b) => b.score - a.score);
        
        let summary = '';
        const usedIndices = [];
        
        for (const item of scoredSentences) {
            if (summary.length + item.sentence.length <= maxLength) {
                usedIndices.push(item.index);
                summary += (summary ? ' ' : '') + item.sentence;
            }
            if (summary.length >= maxLength * 0.8) break;
        }

        // If summary is too short, just use first part of text
        if (summary.length < 50 && cleanText.length > 50) {
            summary = cleanText.substring(0, maxLength);
            if (summary.lastIndexOf('.') > 50) {
                summary = summary.substring(0, summary.lastIndexOf('.') + 1);
            }
        }

        return summary.trim() || cleanText.substring(0, maxLength);
    } catch (error) {
        console.error('[NLP] Summary generation error:', error.message);
        return text.substring(0, maxLength);
    }
}

/**
 * Detect emotions from text using sentiment analysis
 * @param {string} text - Input text
 * @param {number} maxEmotions - Maximum emotions to return (default: 3)
 * @returns {string[]} Array of detected emotions
 */
export function detectEmotions(text, maxEmotions = 3) {
    if (!text || typeof text !== 'string') {
        return ['Neutral'];
    }

    try {
        const lowerText = text.toLowerCase();
        const emotionScores = {};

        // Check for emotion keywords
        for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
            emotionScores[emotion] = 0;
            for (const keyword of keywords) {
                if (lowerText.includes(keyword)) {
                    emotionScores[emotion]++;
                }
            }
        }

        // Use sentiment analysis
        const sentimentResult = sentiment.analyze(text);
        
        // Adjust scores based on sentiment
        if (sentimentResult.score > 2) {
            emotionScores.happy = (emotionScores.happy || 0) + 2;
        } else if (sentimentResult.score < -2) {
            emotionScores.sad = (emotionScores.sad || 0) + 1;
            emotionScores.angry = (emotionScores.angry || 0) + 1;
        }

        // Sort and get top emotions
        const sortedEmotions = Object.entries(emotionScores)
            .filter(([_, score]) => score > 0)
            .sort((a, b) => b[1] - a[1])
            .map(([emotion, _]) => emotion.charAt(0).toUpperCase() + emotion.slice(1))
            .slice(0, maxEmotions);

        // Default to Neutral if no strong emotions detected
        if (sortedEmotions.length === 0) {
            // Classify based on content type
            if (lowerText.includes('learn') || lowerText.includes('tutorial') || lowerText.includes('how to')) {
                return ['Informative'];
            }
            if (lowerText.includes('inspire') || lowerText.includes('motivation')) {
                return ['Inspiring'];
            }
            return ['Neutral'];
        }

        return sortedEmotions;
    } catch (error) {
        console.error('[NLP] Emotion detection error:', error.message);
        return ['Neutral'];
    }
}

/**
 * Extract URL from text
 * @param {string} text - Input text
 * @returns {string|null} Extracted URL or null
 */
export function extractUrl(text) {
    if (!text || typeof text !== 'string') {
        return null;
    }

    try {
        const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
        const matches = text.match(urlRegex);
        
        if (matches && matches.length > 0) {
            // Return the first non-common URL
            for (const url of matches) {
                if (!url.includes('example.com') && 
                    !url.includes('localhost') &&
                    url.length > 10) {
                    return url.replace(/[.,;:!?)]+$/, ''); // Clean trailing punctuation
                }
            }
            return matches[0].replace(/[.,;:!?)]+$/, '');
        }
        return null;
    } catch (error) {
        console.error('[NLP] URL extraction error:', error.message);
        return null;
    }
}

/**
 * Generate a title from text
 * @param {string} text - Input text
 * @param {number} maxLength - Maximum title length (default: 80)
 * @returns {string} Generated title
 */
export function generateTitle(text, maxLength = 80) {
    if (!text || typeof text !== 'string') {
        return 'Untitled Memory';
    }

    try {
        // Check if there's already a title in the text
        const titleMatch = text.match(/Title:\s*(.+?)(?:\n|$)/i);
        if (titleMatch && titleMatch[1].trim().length > 3) {
            return titleMatch[1].trim().substring(0, maxLength);
        }

        // Clean the text
        const cleanText = text
            .replace(/Platform:.*?\n/gi, '')
            .replace(/Type:.*?\n/gi, '')
            .replace(/URL:.*?\n/gi, '')
            .replace(/Captured:.*?\n/gi, '')
            .replace(/─+/g, '')
            .replace(/📍|👤|📄|💬|📝|🏷️|@️|🔖|🎵|🔰|📅|📊|🎥|🔗|🖼️|📂|🌐/g, '')
            .replace(/TITLE:|AUTHOR:|CONTENT:|CAPTION:/gi, '')
            .replace(/https?:\/\/\S+/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        if (cleanText.length < 3) {
            return 'New Memory';
        }

        // Get first sentence or meaningful phrase
        const sentences = sentenceTokenizer.tokenize(cleanText);
        let title = sentences[0] || cleanText;
        
        // Clean and truncate
        title = title.replace(/^[\s\-_]+/, '').trim();
        
        if (title.length > maxLength) {
            title = title.substring(0, maxLength);
            // Try to cut at a word boundary
            const lastSpace = title.lastIndexOf(' ');
            if (lastSpace > maxLength * 0.6) {
                title = title.substring(0, lastSpace) + '...';
            }
        }

        return title || 'New Memory';
    } catch (error) {
        console.error('[NLP] Title generation error:', error.message);
        return 'New Memory';
    }
}

/**
 * Process text and return complete analysis
 * This is the main function that mimics AI output format
 * @param {string} text - Input text to analyze
 * @returns {Object} Analysis result matching AI output format
 */
export function analyzeText(text) {
    console.log('[NLP] Processing text with local NLP...');
    
    const startTime = Date.now();
    
    const result = {
        title: generateTitle(text, 80),
        summary: generateSummary(text, 200),
        keywords: extractKeywords(text, 5),
        emotions: detectEmotions(text, 3),
        source_url: extractUrl(text)
    };
    
    const duration = Date.now() - startTime;
    console.log(`[NLP] Local processing completed in ${duration}ms`);
    
    return result;
}

// Export all functions
export default {
    extractKeywords,
    generateSummary,
    detectEmotions,
    extractUrl,
    generateTitle,
    analyzeText
};
