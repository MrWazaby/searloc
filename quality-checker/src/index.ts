import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Builder, WebDriver, By, until, Key } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';

interface SearxInstance {
  url: string;
  timing?: {
    initial?: {
      success_percentage?: number;
    };
    search?: {
      success_percentage?: number;
    };
    search_go?: {
      success_percentage?: number;
    };
  };
  [key: string]: any;
}

interface InstancesData {
  instances: Record<string, SearxInstance>;
}

interface SearchTest {
  query: string;
  expectedStrings: string[];
}

const SEARCH_TESTS: SearchTest[] = [
  {
    query: 'god emperor of dune',
    expectedStrings: [
      'https://en.wikipedia.org/wiki/God_Emperor_of_Dune',
      'https://www.goodreads.com/book/show/44439415-god-emperor-of-dune',
      'https://dune.fandom.com/wiki/God_Emperor_of_Dune'
    ]
  },
  {
    query: 'Debian',
    expectedStrings: [
      'https://www.debian.org/',
      'https://www.debian.org/distrib/'
    ]
  },
  {
    query: 'remove commit from git history',
    expectedStrings: [
      'https://stackoverflow.com/questions/30893040/remove-commit-from-history',
      'https://www.reddit.com/r/github/comments/wjog1l/how_do_i_delete_commits_from_commit_history/',
      'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository'
    ]
  }
];

async function fetchInstancesData(): Promise<InstancesData> {
  console.log('Fetching SearX instances data...');
  
  // First try to use local sample file if the API is not accessible
  const sampleFile = join(__dirname, '..', 'sample-instances.json');
  
  try {
    const response = await axios.get('https://searx.space/data/instances.json', { timeout: 10000 });
    console.log('Successfully fetched data from searx.space API');
    return response.data;
  } catch (error) {
    console.warn('Failed to fetch from API, trying local sample file...', error instanceof Error ? error.message : error);
    throw error;
  }
}

function filterHighQualityInstances(data: InstancesData, minSuccessRate: number = 80): string[] {
  console.log(`Filtering instances with search success rate >= ${minSuccessRate}%...`);
  
  const highQualityUrls: string[] = [];
  
  for (const [url, instance] of Object.entries(data.instances)) {
    // Check both search and search_go success percentages
    const searchSuccessRate = instance.timing?.search?.success_percentage;
    const searchGoSuccessRate = instance.timing?.search_go?.success_percentage;
    
    // Instance passes if either search OR search_go has >= minSuccessRate
    if ((searchSuccessRate !== undefined && searchSuccessRate >= minSuccessRate) ||
        (searchGoSuccessRate !== undefined && searchGoSuccessRate >= minSuccessRate)) {
      highQualityUrls.push(url);
    }
  }
  
  console.log(`Found ${highQualityUrls.length} high-quality instances`);
  return highQualityUrls;
}

async function createWebDriver(): Promise<WebDriver> {
  const options = new chrome.Options();
  options.addArguments('--headless');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--disable-gpu');
  options.addArguments('--window-size=1920,1080');
  options.addArguments('--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  return new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();
}

async function testInstanceSearch(instanceUrl: string, query: string): Promise<string> {
  let driver: WebDriver | null = null;
  
  try {
    console.log(`Testing search on ${instanceUrl} for "${query}"`);
    
    // Create a new WebDriver instance
    driver = await createWebDriver();
    
    // Set timeouts
    await driver.manage().setTimeouts({ implicit: 5000, pageLoad: 15000 });
    
    // Remove trailing slash for consistency
    const baseUrl = instanceUrl.replace(/\/$/, '');
    
    // Navigate to the instance homepage
    console.log(`  Navigating to ${baseUrl}`);
    await driver.get(baseUrl);
    
    // Wait a moment for page to load
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Try to find the search input field using common selectors
    let searchInput;
    const searchSelectors = [
      'input[name="q"]',
      'input[type="search"]', 
      '#q',
      '.search-field',
      'input[placeholder*="Search"]',
      'input[placeholder*="search"]'
    ];
    
    for (const selector of searchSelectors) {
      try {
        searchInput = await driver.findElement(By.css(selector));
        console.log(`  Found search input using selector: ${selector}`);
        break;
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!searchInput) {
      throw new Error('Could not find search input field');
    }
    
    // Clear and enter the search query
    await searchInput.clear();
    await searchInput.sendKeys(query);
    
    // Submit the search (try Enter key first, then look for submit button)
    try {
      await searchInput.sendKeys(Key.RETURN);
    } catch (e) {
      // If Enter doesn't work, try to find and click submit button
      const submitSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        '.search-button',
        '#search-button'
      ];
      
      let submitted = false;
      for (const selector of submitSelectors) {
        try {
          const submitButton = await driver.findElement(By.css(selector));
          await submitButton.click();
          submitted = true;
          break;
        } catch (e) {
          // Try next selector
        }
      }
      
      if (!submitted) {
        throw new Error('Could not submit search form');
      }
    }
    
    // Wait for search results to load
    console.log(`  Waiting for search results...`);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Get the page HTML
    const html = await driver.getPageSource();
    
    return html;
    
  } catch (error) {
    console.error(`Failed to search on ${instanceUrl}:`, error instanceof Error ? error.message : error);
    throw error;
  } finally {
    if (driver) {
      try {
        await driver.quit();
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
}

function checkExpectedStrings(html: string, expectedStrings: string[]): { found: string[], missing: string[] } {
  const found: string[] = [];
  const missing: string[] = [];
  
  for (const expectedString of expectedStrings) {
    if (html.includes(expectedString)) {
      found.push(expectedString);
    } else {
      missing.push(expectedString);
    }
  }
  
  return { found, missing };
}

async function testInstance(instanceUrl: string): Promise<boolean> {
  console.log(`\n=== Testing instance: ${instanceUrl} ===`);
  
  for (let i = 0; i < SEARCH_TESTS.length; i++) {
    const test = SEARCH_TESTS[i];
    try {
      const html = await testInstanceSearch(instanceUrl, test.query);
      const { found, missing } = checkExpectedStrings(html, test.expectedStrings);
      
      console.log(`Query: "${test.query}"`);
      console.log(`  Found: ${found.length}/${test.expectedStrings.length} expected strings`);
      
      if (missing.length > 0) {
        console.log(`  Missing: ${missing.join(', ')}`);
        console.log(`Instance ${instanceUrl}: FAILED (test ${i + 1} failed, stopping)`);
        return false;
      }
      
      // Short delay between tests to be respectful
      if (i < SEARCH_TESTS.length - 1) {
        console.log(`  Test ${i + 1} passed, waiting before next test...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (error) {
      console.log(`  Failed to test query "${test.query}": ${error instanceof Error ? error.message : error}`);
      console.log(`Instance ${instanceUrl}: FAILED (test ${i + 1} failed, stopping)`);
      return false;
    }
  }
  
  console.log(`Instance ${instanceUrl}: PASSED (all tests completed successfully)`);
  return true;
}

async function main() {
  try {
    // Step 1: Fetch instances data
    const data = await fetchInstancesData();
    
    // Step 2: Filter high-quality instances
    const highQualityUrls = filterHighQualityInstances(data);
    
    // Step 3: Test each high-quality instance
    console.log('\n=== Testing High-Quality Instances ===');
    const validInstances: Record<string, SearxInstance> = {};
    
    console.log(`Testing all ${highQualityUrls.length} instances...`);
    
    for (const url of highQualityUrls) {
      try {
        console.log(`\nTesting instance: ${url}`);
        // Add a timeout for each instance test
        const testPromise = testInstance(url);
        const timeoutPromise = new Promise<boolean>((_, reject) => {
          setTimeout(() => reject(new Error('Instance test timeout after 120 seconds')), 120000);
        });
        
        const passed = await Promise.race([testPromise, timeoutPromise]);
        if (passed) {
          validInstances[url] = data.instances[url];
        }
      } catch (error) {
        console.error(`Failed to test instance ${url}:`, error instanceof Error ? error.message : error);
      }
    }
    
    // Step 4: Create filtered instances.json
    const filteredData: InstancesData = {
      instances: validInstances
    };
    
    writeFileSync('../public/instances.json', JSON.stringify(filteredData, null, 2));

    console.log(`\n=== Results ===`);
    console.log(`Total instances in original data: ${Object.keys(data.instances).length}`);
    console.log(`High-quality instances (${80}%+ success rate): ${highQualityUrls.length}`);
    console.log(`Instances that passed all tests: ${Object.keys(validInstances).length}`);
    console.log('Filtered instances saved to filtered-instances.json');

    if (Object.keys(validInstances).length < 5) {
      console.error('Error: Less than 5 valid instances found. Exiting with error.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
