#!/usr/bin/env node
/**
 * Script to generate quality instances list
 * Run with: npx tsx scripts/generate-instances.ts
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

interface SearxngInstance {
    network_type: string;
    http: {
        status_code: number;
        error: string | null;
    };
    timing: {
        initial: {
            success_percentage: number;
        };
        search: {
            success_percentage: number;
        };
    };
}

interface SearchResult {
    title: string;
    url: string;
    content?: string;
}

interface QualityTestResult {
    instance: string;
    isWorking: boolean;
    results: SearchResult[];
    similarityScore: number;
    responseTime: number;
    error?: string;
}

const TEST_QUERIES = [
    "typescript tutorial",
    "climate change facts", 
    "open source software",
    "javascript array methods",
    "machine learning basics"
];

const SIMILARITY_THRESHOLD = 0.8;
const MAX_RESPONSE_TIME = 10000;

async function fetchQualityInstances(): Promise<string[]> {
    try {
        const response = await fetch("https://searx.space/data/instances.json");
        if (!response.ok) {
            throw new Error(`Failed to fetch instances: ${response.status}`);
        }

        const data = await response.json();
        const instancesObj: Record<string, SearxngInstance> = data.instances;

        const qualityInstances: string[] = [];
        Object.entries(instancesObj).forEach(([url, instance]) => {
            if (
                instance.network_type === "normal" &&
                instance.http?.status_code === 200 &&
                instance.http?.error === null &&
                instance.timing?.search?.success_percentage === 100 &&
                instance.timing?.initial?.success_percentage === 100
            ) {
                qualityInstances.push(url);
            }
        });

        return qualityInstances;
    } catch (error) {
        console.error("Error fetching instances:", error);
        return [];
    }
}

async function searchInstance(instanceUrl: string, query: string): Promise<SearchResult[]> {
    const searchUrl = `${instanceUrl.replace(/\/$/, '')}/search`;
    const params = new URLSearchParams({
        q: query
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MAX_RESPONSE_TIME);

    try {
        const response = await fetch(`${searchUrl}?${params}`, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Searloc-QualityChecker/1.0'
            }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();
        const results: SearchResult[] = [];
        
        // Parse HTML to extract search results
        // Using regex to find result items (this mimics what users see)
        const resultRegex = /<article[^>]*class="result"[^>]*>[\s\S]*?<\/article>/gi;
        const matches = html.match(resultRegex) || [];
        
        for (const match of matches.slice(0, 10)) {
            try {
                // Extract title
                const titleMatch = match.match(/<h3[^>]*><a[^>]*>([^<]+)<\/a><\/h3>/i) ||
                                  match.match(/<h3[^>]*><a[^>]*>([\s\S]*?)<\/a><\/h3>/i);
                const title = titleMatch?.[1]?.replace(/<[^>]*>/g, '').trim();
                
                // Extract URL
                const urlMatch = match.match(/<h3[^>]*><a[^>]*href="([^"]+)"/i);
                const url = urlMatch?.[1];
                
                // Extract content/description
                const contentMatch = match.match(/<p[^>]*class="content"[^>]*>([\s\S]*?)<\/p>/i) ||
                                    match.match(/<div[^>]*class="content"[^>]*>([\s\S]*?)<\/div>/i);
                const content = contentMatch?.[1]?.replace(/<[^>]*>/g, '').trim() || "";
                
                if (title && url) {
                    results.push({
                        title,
                        url,
                        content
                    });
                }
            } catch (parseError) {
                // Skip malformed results
                continue;
            }
        }

        return results;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

function calculateSimilarity(results1: SearchResult[], results2: SearchResult[]): number {
    if (results1.length === 0 && results2.length === 0) return 1.0;
    if (results1.length === 0 || results2.length === 0) return 0.0;

    const urls1 = new Set(results1.map(r => normalizeUrl(r.url)));
    const urls2 = new Set(results2.map(r => normalizeUrl(r.url)));

    const intersection = new Set([...urls1].filter(url => urls2.has(url)));
    const union = new Set([...urls1, ...urls2]);

    const jaccardSimilarity = intersection.size / union.size;

    const titles1 = results1.map(r => normalizeText(r.title));
    const titles2 = results2.map(r => normalizeText(r.title));
    
    let titleMatches = 0;
    const maxTitles = Math.max(titles1.length, titles2.length);
    
    for (const title1 of titles1) {
        for (const title2 of titles2) {
            if (calculateTextSimilarity(title1, title2) > 0.7) {
                titleMatches++;
                break;
            }
        }
    }

    const titleSimilarity = maxTitles > 0 ? titleMatches / maxTitles : 0;
    return (jaccardSimilarity * 0.7) + (titleSimilarity * 0.3);
}

function normalizeUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        return `${urlObj.hostname}${urlObj.pathname}`;
    } catch {
        return url.toLowerCase();
    }
}

function normalizeText(text: string): string {
    return text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function calculateTextSimilarity(text1: string, text2: string): number {
    if (text1 === text2) return 1.0;
    if (text1.length === 0 || text2.length === 0) return 0.0;

    const words1 = text1.split(' ');
    const words2 = text2.split(' ');
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = new Set([...set1].filter(word => set2.has(word)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
}

async function testInstance(instanceUrl: string, referenceResults: Map<string, SearchResult[]>): Promise<QualityTestResult> {
    const startTime = Date.now();
    let totalSimilarity = 0;
    let successfulQueries = 0;
    const allResults: SearchResult[] = [];

    try {
        for (const query of TEST_QUERIES) {
            try {
                const results = await searchInstance(instanceUrl, query);
                allResults.push(...results);
                
                const referenceResultsForQuery = referenceResults.get(query) || [];
                if (referenceResultsForQuery.length > 0) {
                    const similarity = calculateSimilarity(results, referenceResultsForQuery);
                    totalSimilarity += similarity;
                    successfulQueries++;
                }
            } catch (error) {
                console.warn(`Query "${query}" failed for ${instanceUrl}:`, error);
            }
        }

        const responseTime = Date.now() - startTime;
        const averageSimilarity = successfulQueries > 0 ? totalSimilarity / successfulQueries : 0;

        return {
            instance: instanceUrl,
            isWorking: successfulQueries > 0,
            results: allResults,
            similarityScore: averageSimilarity,
            responseTime,
        };
    } catch (error) {
        return {
            instance: instanceUrl,
            isWorking: false,
            results: [],
            similarityScore: 0,
            responseTime: Date.now() - startTime,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

async function createReferenceResults(instances: string[]): Promise<Map<string, SearchResult[]>> {
    const referenceResults = new Map<string, SearchResult[]>();
    
    const referenceInstances = instances.slice(0, Math.min(3, instances.length));
    
    for (const query of TEST_QUERIES) {
        const allResultsForQuery: SearchResult[] = [];
        
        for (const instance of referenceInstances) {
            try {
                const results = await searchInstance(instance, query);
                allResultsForQuery.push(...results);
            } catch (error) {
                console.warn(`Reference search failed for ${instance}:`, error);
            }
        }
        
        const uniqueResults = allResultsForQuery.filter((result, index, arr) => 
            arr.findIndex(r => normalizeUrl(r.url) === normalizeUrl(result.url)) === index
        );
        
        referenceResults.set(query, uniqueResults.slice(0, 15));
    }
    
    return referenceResults;
}

async function generateQualityInstancesList(): Promise<string[]> {
    console.log("Starting instance quality assessment...");
    
    const instances = await fetchQualityInstances();
    console.log(`Found ${instances.length} potentially quality instances`);
    
    if (instances.length === 0) {
        console.error("No instances found to test");
        return [];
    }
    
    console.log("Creating reference results...");
    const referenceResults = await createReferenceResults(instances);
    
    console.log("Testing instances...");
    const testResults: QualityTestResult[] = [];
    
    // Limit to first 20 instances for testing to avoid overwhelming servers
    const instancesToTest = instances.slice(0, 20);
    
    for (let i = 0; i < instancesToTest.length; i++) {
        const instance = instancesToTest[i];
        console.log(`Testing ${i + 1}/${instancesToTest.length}: ${instance}`);
        
        try {
            const result = await testInstance(instance, referenceResults);
            testResults.push(result);
            
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        } catch (error) {
            console.error(`Failed to test ${instance}:`, error);
        }
    }
    
    const qualityInstances = testResults
        .filter(result => 
            result.isWorking && 
            result.similarityScore >= SIMILARITY_THRESHOLD &&
            result.responseTime < MAX_RESPONSE_TIME
        )
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .map(result => result.instance);
    
    console.log(`Quality assessment complete:`);
    console.log(`- Tested: ${testResults.length} instances`);
    console.log(`- Passed: ${qualityInstances.length} instances`);
    console.log(`- Success rate: ${((qualityInstances.length / testResults.length) * 100).toFixed(1)}%`);
    
    testResults.forEach(result => {
        const status = result.isWorking ? 'WORKING' : 'FAILED';
        const similarity = (result.similarityScore * 100).toFixed(1);
        const passed = result.similarityScore >= SIMILARITY_THRESHOLD ? '✓' : '✗';
        console.log(`${passed} ${result.instance}: ${status} - Similarity: ${similarity}% - Response time: ${result.responseTime}ms`);
    });
    
    return qualityInstances;
}

async function main() {
    try {
        const qualityInstances = await generateQualityInstancesList();
        
        // Generate instances.json in a format that the main application can use
        const instancesData = {
            instances: qualityInstances.reduce((obj, instance) => {
                obj[instance] = instance;
                return obj;
            }, {} as Record<string, string>),
            meta: {
                generatedAt: new Date().toISOString(),
                count: qualityInstances.length,
                generator: "searloc-quality-checker",
                version: "1.0"
            }
        };
        
        const outputPath = join(process.cwd(), '/public/instances.json');
        writeFileSync(outputPath, JSON.stringify(instancesData, null, 2));
        console.log(`\nSaved ${qualityInstances.length} quality instances to ${outputPath}`);
        console.log(`This file can be used by the main application to provide quality-tested instances.`);
        
    } catch (error) {
        console.error('Error generating quality instances:', error);
        process.exit(1);
    }
}

main();
