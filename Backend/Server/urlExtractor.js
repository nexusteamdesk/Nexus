/**
 * Nexus URL Content Extractor
 * 
 * Fetches and extracts content from URLs for better AI/NLP analysis.
 * Supports special handling for popular platforms like YouTube, Twitter, etc.
 */

import * as cheerio from 'cheerio';

// =============================================================================
// URL DETECTION
// =============================================================================

/**
 * Detect if text contains primarily a URL (mobile share scenario)
 * @param {string} text - Input text
 * @returns {Object} { hasUrl: boolean, url: string|null, isUrlOnly: boolean }
 */
export function detectUrl(text) {
    if (!text || typeof text !== 'string') {
        return { hasUrl: false, url: null, isUrlOnly: false };
    }

    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
    const matches = text.match(urlRegex);
    
    if (!matches || matches.length === 0) {
        return { hasUrl: false, url: null, isUrlOnly: false };
    }

    // Clean the URL
    const url = matches[0].replace(/[.,;:!?)]+$/, '');
    
    // Check if text is primarily just the URL (mobile share case)
    const textWithoutUrl = text.replace(urlRegex, '').trim();
    const isUrlOnly = textWithoutUrl.length < 50; // Less than 50 chars of other content

    return {
        hasUrl: true,
        url: url,
        isUrlOnly: isUrlOnly,
        allUrls: matches.map(u => u.replace(/[.,;:!?)]+$/, ''))
    };
}

/**
 * Detect platform from URL
 * @param {string} url - URL to analyze
 * @returns {string} Platform name
 */
export function detectPlatform(url) {
    if (!url) return 'unknown';
    
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) return 'youtube';
    if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) return 'twitter';
    if (urlLower.includes('linkedin.com')) return 'linkedin';
    if (urlLower.includes('instagram.com')) return 'instagram';
    if (urlLower.includes('reddit.com')) return 'reddit';
    if (urlLower.includes('github.com')) return 'github';
    if (urlLower.includes('medium.com')) return 'medium';
    if (urlLower.includes('dev.to')) return 'devto';
    if (urlLower.includes('stackoverflow.com')) return 'stackoverflow';
    if (urlLower.includes('facebook.com')) return 'facebook';
    if (urlLower.includes('tiktok.com')) return 'tiktok';
    if (urlLower.includes('pinterest.com')) return 'pinterest';
    
    return 'article';
}

// =============================================================================
// CONTENT FETCHING
// =============================================================================

/**
 * Fetch URL content with timeout and error handling
 * @param {string} url - URL to fetch
 * @param {number} timeout - Timeout in ms (default 10000)
 * @returns {Promise<string|null>} HTML content or null
 */
async function fetchUrl(url, timeout = 10000) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn(`[URL Extractor] HTTP ${response.status} for ${url}`);
            return null;
        }

        const html = await response.text();
        return html;
    } catch (error) {
        console.error(`[URL Extractor] Fetch error for ${url}:`, error.message);
        return null;
    }
}

// =============================================================================
// CONTENT EXTRACTION
// =============================================================================

/**
 * Extract metadata from HTML using Open Graph and meta tags
 * @param {CheerioAPI} $ - Cheerio instance
 * @returns {Object} Extracted metadata
 */
function extractMetadata($) {
    const metadata = {
        title: null,
        description: null,
        image: null,
        author: null,
        siteName: null,
        type: null
    };

    // Open Graph tags
    metadata.title = $('meta[property="og:title"]').attr('content') ||
                    $('meta[name="og:title"]').attr('content') ||
                    $('title').text().trim();
    
    metadata.description = $('meta[property="og:description"]').attr('content') ||
                          $('meta[name="description"]').attr('content') ||
                          $('meta[name="twitter:description"]').attr('content');
    
    metadata.image = $('meta[property="og:image"]').attr('content') ||
                    $('meta[name="twitter:image"]').attr('content');
    
    metadata.author = $('meta[name="author"]').attr('content') ||
                     $('meta[property="article:author"]').attr('content');
    
    metadata.siteName = $('meta[property="og:site_name"]').attr('content');
    
    metadata.type = $('meta[property="og:type"]').attr('content');

    // Clean up
    if (metadata.title) {
        // Remove common suffixes like " - YouTube", " | LinkedIn"
        metadata.title = metadata.title
            .replace(/\s*[-|]\s*YouTube$/i, '')
            .replace(/\s*[-|]\s*LinkedIn$/i, '')
            .replace(/\s*[-|]\s*Twitter$/i, '')
            .replace(/\s*[-|]\s*X$/i, '')
            .replace(/\s*[-|]\s*Medium$/i, '')
            .trim();
    }

    return metadata;
}

/**
 * Extract main content text from HTML
 * @param {CheerioAPI} $ - Cheerio instance
 * @returns {string} Extracted text content
 */
function extractMainContent($) {
    // Remove script, style, nav, footer, header, aside elements
    $('script, style, nav, footer, header, aside, noscript, iframe, .ad, .advertisement, .sidebar').remove();

    // Try to find main content area
    const contentSelectors = [
        'article',
        '[role="main"]',
        'main',
        '.post-content',
        '.article-content',
        '.entry-content',
        '.content',
        '#content',
        '.post-body',
        '.article-body'
    ];

    let content = '';
    
    for (const selector of contentSelectors) {
        const element = $(selector);
        if (element.length > 0) {
            content = element.text().trim();
            if (content.length > 100) break;
        }
    }

    // Fallback to body if no specific content area found
    if (content.length < 100) {
        content = $('body').text().trim();
    }

    // Clean up whitespace
    content = content
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();

    // Limit to reasonable length
    if (content.length > 2000) {
        content = content.substring(0, 2000) + '...';
    }

    return content;
}

// =============================================================================
// PLATFORM-SPECIFIC EXTRACTORS
// =============================================================================

/**
 * Extract YouTube video info
 * @param {CheerioAPI} $ - Cheerio instance
 * @param {string} url - Original URL
 * @returns {Object} YouTube specific data
 */
function extractYouTube($, url) {
    const metadata = extractMetadata($);
    
    // Extract video ID
    let videoId = null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
    if (match) videoId = match[1];

    // Try to get channel name
    const channelName = $('link[itemprop="name"]').attr('content') ||
                       $('meta[itemprop="author"]').attr('content') ||
                       $('[itemprop="author"] [itemprop="name"]').text().trim();

    return {
        platform: 'youtube',
        type: 'video',
        title: metadata.title,
        description: metadata.description,
        channel: channelName,
        videoId: videoId,
        thumbnail: metadata.image,
        url: url
    };
}

/**
 * Extract Twitter/X post info
 * @param {CheerioAPI} $ - Cheerio instance
 * @param {string} url - Original URL
 * @returns {Object} Twitter specific data
 */
function extractTwitter($, url) {
    const metadata = extractMetadata($);
    
    // Twitter meta tags are often useful
    const tweetText = $('meta[property="og:description"]').attr('content') ||
                     $('meta[name="twitter:description"]').attr('content');
    
    // Extract username from URL
    const userMatch = url.match(/(?:twitter\.com|x\.com)\/([^/]+)/);
    const username = userMatch ? userMatch[1] : null;

    return {
        platform: 'twitter',
        type: 'tweet',
        title: metadata.title || `Tweet by @${username}`,
        content: tweetText,
        author: username ? `@${username}` : metadata.author,
        url: url
    };
}

/**
 * Extract LinkedIn post info
 * @param {CheerioAPI} $ - Cheerio instance
 * @param {string} url - Original URL
 * @returns {Object} LinkedIn specific data
 */
function extractLinkedIn($, url) {
    const metadata = extractMetadata($);
    
    return {
        platform: 'linkedin',
        type: url.includes('/posts/') ? 'post' : 'article',
        title: metadata.title,
        description: metadata.description,
        author: metadata.author,
        url: url
    };
}

/**
 * Extract Reddit post info
 * @param {CheerioAPI} $ - Cheerio instance
 * @param {string} url - Original URL
 * @returns {Object} Reddit specific data
 */
function extractReddit($, url) {
    const metadata = extractMetadata($);
    
    // Extract subreddit from URL
    const subredditMatch = url.match(/reddit\.com\/r\/([^/]+)/);
    const subreddit = subredditMatch ? subredditMatch[1] : null;

    return {
        platform: 'reddit',
        type: 'post',
        title: metadata.title,
        description: metadata.description,
        subreddit: subreddit ? `r/${subreddit}` : null,
        url: url
    };
}

/**
 * Extract GitHub repo info
 * @param {CheerioAPI} $ - Cheerio instance
 * @param {string} url - Original URL
 * @returns {Object} GitHub specific data
 */
function extractGitHub($, url) {
    const metadata = extractMetadata($);
    
    // Extract repo info from URL
    const repoMatch = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    const owner = repoMatch ? repoMatch[1] : null;
    const repo = repoMatch ? repoMatch[2] : null;

    // Try to get description
    const description = $('p.f4.my-3').text().trim() || 
                       $('[itemprop="about"]').text().trim() ||
                       metadata.description;

    return {
        platform: 'github',
        type: 'repository',
        title: metadata.title || (repo ? `${owner}/${repo}` : 'GitHub'),
        description: description,
        owner: owner,
        repo: repo,
        url: url
    };
}

/**
 * Extract generic article info
 * @param {CheerioAPI} $ - Cheerio instance
 * @param {string} url - Original URL
 * @returns {Object} Article data
 */
function extractArticle($, url) {
    const metadata = extractMetadata($);
    const mainContent = extractMainContent($);

    return {
        platform: 'article',
        type: 'article',
        title: metadata.title,
        description: metadata.description || mainContent.substring(0, 300),
        author: metadata.author,
        siteName: metadata.siteName,
        content: mainContent,
        url: url
    };
}

// =============================================================================
// MAIN EXTRACTION FUNCTION
// =============================================================================

/**
 * Extract content from a URL
 * @param {string} url - URL to extract content from
 * @returns {Promise<Object>} Extracted content
 */
export async function extractUrlContent(url) {
    console.log(`[URL Extractor] Fetching content from: ${url}`);
    const startTime = Date.now();

    try {
        const html = await fetchUrl(url);
        
        if (!html) {
            console.warn(`[URL Extractor] Could not fetch content from ${url}`);
            return {
                success: false,
                platform: detectPlatform(url),
                url: url,
                error: 'Failed to fetch content'
            };
        }

        const $ = cheerio.load(html);
        const platform = detectPlatform(url);
        
        let result;
        
        switch (platform) {
            case 'youtube':
                result = extractYouTube($, url);
                break;
            case 'twitter':
                result = extractTwitter($, url);
                break;
            case 'linkedin':
                result = extractLinkedIn($, url);
                break;
            case 'reddit':
                result = extractReddit($, url);
                break;
            case 'github':
                result = extractGitHub($, url);
                break;
            default:
                result = extractArticle($, url);
        }

        result.success = true;
        result.extractedAt = new Date().toISOString();

        const duration = Date.now() - startTime;
        console.log(`[URL Extractor] Extracted ${platform} content in ${duration}ms`);

        return result;

    } catch (error) {
        console.error(`[URL Extractor] Error extracting ${url}:`, error.message);
        return {
            success: false,
            platform: detectPlatform(url),
            url: url,
            error: error.message
        };
    }
}

/**
 * Enrich text with URL content extraction
 * If text contains a URL (especially URL-only from mobile share),
 * fetch the content and create enriched text for AI/NLP processing.
 * 
 * @param {string} originalText - Original text from user
 * @returns {Promise<Object>} { enrichedText, extracted, wasEnriched }
 */
export async function enrichTextWithUrlContent(originalText) {
    const urlInfo = detectUrl(originalText);
    
    if (!urlInfo.hasUrl) {
        return {
            enrichedText: originalText,
            extracted: null,
            wasEnriched: false
        };
    }

    // Only fetch if it's primarily a URL (mobile share case)
    if (!urlInfo.isUrlOnly) {
        return {
            enrichedText: originalText,
            extracted: null,
            wasEnriched: false,
            reason: 'Text has enough content already'
        };
    }

    console.log(`[URL Extractor] Detected URL-only content, enriching...`);
    
    const extracted = await extractUrlContent(urlInfo.url);
    
    if (!extracted.success) {
        return {
            enrichedText: originalText,
            extracted: extracted,
            wasEnriched: false,
            reason: extracted.error
        };
    }

    // Create enriched text for AI/NLP processing
    let enrichedText = '';
    
    enrichedText += `Platform: ${extracted.platform}\n`;
    enrichedText += `Type: ${extracted.type || 'content'}\n`;
    enrichedText += `URL: ${extracted.url}\n`;
    enrichedText += `─────────────────────────────────────\n\n`;
    
    if (extracted.title) {
        enrichedText += `TITLE: ${extracted.title}\n\n`;
    }
    
    if (extracted.author || extracted.channel) {
        enrichedText += `AUTHOR: ${extracted.author || extracted.channel}\n\n`;
    }
    
    if (extracted.subreddit) {
        enrichedText += `SUBREDDIT: ${extracted.subreddit}\n\n`;
    }
    
    if (extracted.description) {
        enrichedText += `DESCRIPTION:\n${extracted.description}\n\n`;
    }
    
    if (extracted.content && extracted.content !== extracted.description) {
        enrichedText += `CONTENT:\n${extracted.content}\n`;
    }

    return {
        enrichedText: enrichedText.trim(),
        extracted: extracted,
        wasEnriched: true
    };
}

// Export all functions
export default {
    detectUrl,
    detectPlatform,
    extractUrlContent,
    enrichTextWithUrlContent
};
