#!/usr/bin/env node

/**
 * Link Checker Script
 * 
 * This script checks for broken links in blog posts and other content.
 * It can be run on specific files or directories.
 * 
 * Usage:
 *   node scripts/check-links.js [path]
 *   
 * Examples:
 *   node scripts/check-links.js                    # Check all blog posts
 *   node scripts/check-links.js src/posts/         # Check specific directory
 *   node scripts/check-links.js src/posts/post.md  # Check specific file
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { URL } from 'url';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const TIMEOUT = 10000; // 10 seconds
const USER_AGENT = 'Mozilla/5.0 (compatible; LinkChecker/1.0)';
const MAX_REDIRECTS = 5;

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

class LinkChecker {
  constructor() {
    this.checkedUrls = new Map(); // Cache for checked URLs
    this.results = {
      total: 0,
      working: 0,
      broken: 0,
      skipped: 0
    };
    this.brokenLinks = [];
  }

  /**
   * Extract URLs from markdown content
   */
  extractUrls(content, filePath) {
    const urls = [];
    
    // Match markdown links: [text](url)
    const markdownLinkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
    let match;
    
    while ((match = markdownLinkRegex.exec(content)) !== null) {
      const url = match[2].trim();
      const text = match[1];
      const line = content.substring(0, match.index).split('\n').length;
      
      if (this.isValidUrl(url)) {
        urls.push({
          url,
          text,
          line,
          filePath,
          type: 'markdown'
        });
      }
    }
    
    // Match HTML links: <a href="url">
    const htmlLinkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
    
    while ((match = htmlLinkRegex.exec(content)) !== null) {
      const url = match[1].trim();
      const line = content.substring(0, match.index).split('\n').length;
      
      if (this.isValidUrl(url)) {
        urls.push({
          url,
          text: 'HTML link',
          line,
          filePath,
          type: 'html'
        });
      }
    }
    
    // Match JSX/TSX links: to="url" or href="url"
    const jsxLinkRegex = /(?:to|href)=["']([^"']+)["']/g;
    
    while ((match = jsxLinkRegex.exec(content)) !== null) {
      const url = match[1].trim();
      const line = content.substring(0, match.index).split('\n').length;
      
      if (this.isValidUrl(url)) {
        urls.push({
          url,
          text: 'JSX link',
          line,
          filePath,
          type: 'jsx'
        });
      }
    }
    
    return urls;
  }

  /**
   * Check if a URL is valid and should be checked
   */
  isValidUrl(url) {
    // Skip relative URLs, anchors, and mailto links
    if (url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:')) {
      return false;
    }
    
    // Skip relative paths (but include protocol-relative URLs)
    if (!url.startsWith('http') && !url.startsWith('//')) {
      return false;
    }
    
    return true;
  }

  /**
   * Check if a URL is accessible
   */
  async checkUrl(url) {
    // Return cached result if available
    if (this.checkedUrls.has(url)) {
      return this.checkedUrls.get(url);
    }

    try {
      const result = await this.makeRequest(url);
      this.checkedUrls.set(url, result);
      return result;
    } catch (error) {
      const result = {
        status: 'error',
        statusCode: null,
        error: error.message
      };
      this.checkedUrls.set(url, result);
      return result;
    }
  }

  /**
   * Make HTTP request to check URL
   */
  makeRequest(url, redirectCount = 0) {
    return new Promise((resolve, reject) => {
      if (redirectCount > MAX_REDIRECTS) {
        reject(new Error('Too many redirects'));
        return;
      }

      let parsedUrl;
      try {
        parsedUrl = new URL(url);
      } catch (error) {
        reject(new Error('Invalid URL'));
        return;
      }

      const isHttps = parsedUrl.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'HEAD', // Use HEAD to avoid downloading content
        timeout: TIMEOUT,
        headers: {
          'User-Agent': USER_AGENT
        }
      };

      const req = client.request(options, (res) => {
        const statusCode = res.statusCode;
        
        // Handle redirects
        if (statusCode >= 300 && statusCode < 400 && res.headers.location) {
          const redirectUrl = new URL(res.headers.location, url).href;
          this.makeRequest(redirectUrl, redirectCount + 1)
            .then(resolve)
            .catch(reject);
          return;
        }
        
        if (statusCode >= 200 && statusCode < 300) {
          resolve({
            status: 'ok',
            statusCode,
            error: null
          });
        } else {
          resolve({
            status: 'error',
            statusCode,
            error: `HTTP ${statusCode}`
          });
        }
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.end();
    });
  }

  /**
   * Process a single file
   */
  async processFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const urls = this.extractUrls(content, filePath);
      
      console.log(`${colors.blue}Checking ${filePath}...${colors.reset}`);
      
      for (const linkInfo of urls) {
        this.results.total++;
        
        console.log(`  Checking: ${linkInfo.url}`);
        
        const result = await this.checkUrl(linkInfo.url);
        
        if (result.status === 'ok') {
          this.results.working++;
          console.log(`    ${colors.green}✓ OK (${result.statusCode})${colors.reset}`);
        } else {
          this.results.broken++;
          console.log(`    ${colors.red}✗ BROKEN (${result.error})${colors.reset}`);
          
          this.brokenLinks.push({
            ...linkInfo,
            error: result.error,
            statusCode: result.statusCode
          });
        }
      }
      
    } catch (error) {
      console.error(`${colors.red}Error processing ${filePath}: ${error.message}${colors.reset}`);
    }
  }

  /**
   * Find all files to check
   */
  findFiles(targetPath) {
    const files = [];
    
    if (!fs.existsSync(targetPath)) {
      console.error(`${colors.red}Path does not exist: ${targetPath}${colors.reset}`);
      return files;
    }
    
    const stat = fs.statSync(targetPath);
    
    if (stat.isFile()) {
      files.push(targetPath);
    } else if (stat.isDirectory()) {
      const entries = fs.readdirSync(targetPath);
      
      for (const entry of entries) {
        const fullPath = path.join(targetPath, entry);
        const entryStat = fs.statSync(fullPath);
        
        if (entryStat.isFile() && this.isCheckableFile(fullPath)) {
          files.push(fullPath);
        } else if (entryStat.isDirectory()) {
          files.push(...this.findFiles(fullPath));
        }
      }
    }
    
    return files;
  }

  /**
   * Check if file should be checked for links
   */
  isCheckableFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return ['.md', '.mdx', '.tsx', '.jsx', '.html'].includes(ext);
  }

  /**
   * Print summary report
   */
  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log(`${colors.bold}LINK CHECK SUMMARY${colors.reset}`);
    console.log('='.repeat(60));
    console.log(`Total links checked: ${this.results.total}`);
    console.log(`${colors.green}Working links: ${this.results.working}${colors.reset}`);
    console.log(`${colors.red}Broken links: ${this.results.broken}${colors.reset}`);
    
    if (this.brokenLinks.length > 0) {
      console.log(`\n${colors.red}${colors.bold}BROKEN LINKS:${colors.reset}`);
      console.log('-'.repeat(60));
      
      for (const link of this.brokenLinks) {
        console.log(`${colors.red}✗${colors.reset} ${link.url}`);
        console.log(`  File: ${link.filePath}:${link.line}`);
        console.log(`  Text: ${link.text}`);
        console.log(`  Error: ${link.error}`);
        console.log('');
      }
    }
    
    console.log('='.repeat(60));
    
    // Exit with error code if broken links found
    if (this.results.broken > 0) {
      process.exit(1);
    }
  }

  /**
   * Main execution function
   */
  async run(targetPath = 'src/posts') {
    console.log(`${colors.bold}Starting link check...${colors.reset}\n`);
    
    const files = this.findFiles(targetPath);
    
    if (files.length === 0) {
      console.log(`${colors.yellow}No files found to check in: ${targetPath}${colors.reset}`);
      return;
    }
    
    console.log(`Found ${files.length} file(s) to check\n`);
    
    for (const file of files) {
      await this.processFile(file);
    }
    
    this.printSummary();
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const targetPath = process.argv[2] || 'src/posts';
  const checker = new LinkChecker();
  
  checker.run(targetPath).catch(error => {
    console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

export default LinkChecker;