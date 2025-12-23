/**
 * Test Script for NLP Processor
 * Run: node test-nlp.js
 */

import { analyzeText, extractKeywords, generateSummary, detectEmotions, extractUrl, generateTitle } from './nlpProcessor.js';

// Test cases representing real user content
const testCases = [
    {
        name: "YouTube Video",
        text: `Platform: YouTube
Type: Video
URL: https://www.youtube.com/watch?v=abc123
Captured: 2024-01-15

TITLE: How to Build a React App in 10 Minutes - Complete Tutorial

CONTENT:
Today we're going to learn how to create a React application from scratch. 
React is a powerful JavaScript library for building user interfaces. 
We'll cover components, state management, and hooks.
This tutorial is perfect for beginners who want to learn modern web development.
By the end, you'll have a fully functional todo app running locally.`
    },
    {
        name: "LinkedIn Post",
        text: `Platform: LinkedIn
Type: Post
URL: https://www.linkedin.com/posts/123

AUTHOR: John Smith
CONTENT:
🚀 Excited to announce that I've just been promoted to Senior Engineer!

After 3 years of hard work, late nights, and continuous learning, 
this achievement means so much to me. Thank you to my amazing team 
and mentors who believed in me.

Never give up on your dreams! #CareerGrowth #Engineering #Success`
    },
    {
        name: "Technical Article",
        text: `Platform: Web
Type: Article
URL: https://blog.example.com/ai-trends-2024

TITLE: Top 10 AI Trends to Watch in 2024

Artificial Intelligence continues to evolve rapidly. Here are the key trends:

1. Generative AI becomes mainstream in enterprise applications
2. Edge AI brings processing closer to devices
3. AI regulation increases globally
4. Multimodal models combine text, image and video understanding
5. AI-powered cybersecurity detects threats faster

These trends will reshape how businesses operate and compete.`
    },
    {
        name: "Sad/Emotional Content",
        text: `Just found out my grandmother passed away this morning. 
She was my biggest supporter and always believed in me. 
I'm heartbroken and don't know how to cope with this loss.
Missing her already. Life feels so empty without her.`
    },
    {
        name: "Simple Note",
        text: `Title: Meeting Notes

Discussed project timeline with the team.
Need to complete phase 1 by next Friday.
Action items: Review design docs, set up development environment.`
    }
];

console.log('=' .repeat(60));
console.log('NEXUS NLP PROCESSOR - QUALITY TEST');
console.log('=' .repeat(60));
console.log('');

for (const testCase of testCases) {
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`📝 TEST: ${testCase.name}`);
    console.log(`${'─'.repeat(50)}`);
    
    const startTime = Date.now();
    const result = analyzeText(testCase.text);
    const duration = Date.now() - startTime;
    
    console.log(`\n📌 Title: ${result.title}`);
    console.log(`📝 Summary: ${result.summary}`);
    console.log(`🏷️  Keywords: ${result.keywords.join(', ')}`);
    console.log(`💭 Emotions: ${result.emotions.join(', ')}`);
    console.log(`🔗 URL: ${result.source_url || 'None'}`);
    console.log(`⏱️  Processing Time: ${duration}ms`);
    
    // Quality checks
    const issues = [];
    if (!result.title || result.title.length < 5) issues.push('Title too short');
    if (!result.summary || result.summary.length < 20) issues.push('Summary too short');
    if (!result.keywords || result.keywords.length === 0) issues.push('No keywords');
    if (!result.emotions || result.emotions.length === 0) issues.push('No emotions');
    
    if (issues.length > 0) {
        console.log(`⚠️  Issues: ${issues.join(', ')}`);
    } else {
        console.log(`✅ Quality Check: PASSED`);
    }
}

console.log(`\n${'='.repeat(60)}`);
console.log('INDIVIDUAL FUNCTION TESTS');
console.log(`${'='.repeat(60)}`);

// Test keyword extraction
console.log('\n📌 Keyword Extraction Test:');
const keywords = extractKeywords('Machine learning and artificial intelligence are transforming healthcare, finance, and education industries.');
console.log(`   Result: ${keywords.join(', ')}`);
console.log(`   ✅ Expected: AI/ML related keywords`);

// Test URL extraction
console.log('\n🔗 URL Extraction Test:');
const url = extractUrl('Check out this article: https://example.com/article?id=123 for more info');
console.log(`   Result: ${url}`);
console.log(`   ✅ Expected: https://example.com/article?id=123`);

// Test emotion detection
console.log('\n💭 Emotion Detection Tests:');
const happyText = 'I am so happy and excited about this amazing news! This is the best day ever!';
const sadText = 'I am feeling very sad and depressed today. Life is so difficult.';
console.log(`   Happy text → ${detectEmotions(happyText).join(', ')}`);
console.log(`   Sad text → ${detectEmotions(sadText).join(', ')}`);

console.log(`\n${'='.repeat(60)}`);
console.log('TEST COMPLETE');
console.log(`${'='.repeat(60)}\n`);
