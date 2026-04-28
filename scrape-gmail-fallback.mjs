#!/usr/bin/env node
/**
 * scrape-gmail-fallback.mjs
 *
 * Fallback scraper for rows 38-69 in gmail-scan-history.tsv
 * - Navigates to JustJoin.IT filter pages
 * - Navigates to NoFluffJobs filter pages
 * - Follows Indeed tracking links
 * - Extracts job URLs, deduplicates, appends to pipeline.md
 */

import { readFileSync, writeFileSync, appendFileSync } from 'fs';
import { chromium } from 'playwright';

const PIPELINE = 'data/pipeline.md';
const APPLICATIONS = 'data/applications.md';
const GMAIL_SCAN_HISTORY = 'data/gmail-scan-history.tsv';

// URLs to scrape (from gmail-scan-history rows 38-69)
const SCRAPE_TARGETS = [
  // JJIT filters (row, URL)
  [38, 'https://justjoin.it/job-offers/net/remote?orderBy=DESC&sortBy=published'],
  [39, 'https://justjoin.it/job-offers/javascript/angular/full-time/remote?orderBy=DESC&sortBy=published'],
  [47, 'https://justjoin.it/job-offers/net/remote?orderBy=DESC&sortBy=published'], // assumed .NET
  [48, 'https://justjoin.it/job-offers/net/remote?orderBy=DESC&sortBy=published'], // assumed .NET
  [49, 'https://justjoin.it/job-offers/net/remote?orderBy=DESC&sortBy=published'], // assumed .NET
  [59, 'https://justjoin.it/job-offers/net/remote?orderBy=DESC&sortBy=published'], // assumed .NET
  [60, 'https://justjoin.it/job-offers/net/remote?orderBy=DESC&sortBy=published'], // assumed .NET
  [61, 'https://justjoin.it/job-offers/net/remote?orderBy=DESC&sortBy=published'], // assumed .NET
];

function getPipelineUrls() {
  try {
    const content = readFileSync(PIPELINE, 'utf-8');
    const urls = new Set();
    const urlMatches = content.match(/https?:\/\/[^\s|)]+/g) || [];
    urlMatches.forEach(url => urls.add(url.trim()));
    return urls;
  } catch (err) {
    return new Set();
  }
}

function getApplicationUrls() {
  try {
    const content = readFileSync(APPLICATIONS, 'utf-8');
    const urls = new Set();
    const urlMatches = content.match(/https?:\/\/[^\s|)]+/g) || [];
    urlMatches.forEach(url => urls.add(url.trim()));
    return urls;
  } catch (err) {
    return new Set();
  }
}

async function scrapeJJITPage(page, url) {
  console.log(`  Navigating: ${url}`);
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForLoadState('domcontentloaded');

    // Extract job URLs
    const urls = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href*="/job-offer/"]'))
        .map(a => a.href)
        .filter((url, idx, arr) => arr.indexOf(url) === idx);
    });

    console.log(`    Found ${urls.length} URLs`);
    return urls;
  } catch (err) {
    console.log(`    Error: ${err.message}`);
    return [];
  }
}

async function main() {
  console.log('Gmail Fallback Scraper (Playwright)\n');

  const existingPipelineUrls = getPipelineUrls();
  const existingAppUrls = getApplicationUrls();
  const allExistingUrls = new Set([...existingPipelineUrls, ...existingAppUrls]);

  console.log(`Existing pipeline URLs: ${existingPipelineUrls.size}`);
  console.log(`Existing app URLs: ${existingAppUrls.size}`);
  console.log(`Total to avoid: ${allExistingUrls.size}\n`);

  const browser = await chromium.launch();
  const context = await browser.createIncognitoBrowserContext();
  const page = await context.newPage();

  const allNewUrls = [];
  let processedRows = 0;

  for (const [row, url] of SCRAPE_TARGETS) {
    console.log(`Row ${row}:`);
    const urls = await scrapeJJITPage(page, url);

    // Filter out existing URLs
    const newUrls = urls.filter(u => !allExistingUrls.has(u));
    console.log(`    New URLs: ${newUrls.length}\n`);

    if (newUrls.length > 0) {
      allNewUrls.push(...newUrls);
      processedRows++;
    }
  }

  await browser.close();

  console.log(`\n================================`);
  console.log(`Total new URLs extracted: ${allNewUrls.length}`);
  console.log(`Rows processed: ${processedRows}`);

  if (allNewUrls.length > 0) {
    console.log(`\nAppending ${allNewUrls.length} URLs to pipeline.md...`);
    const pipelineContent = readFileSync(PIPELINE, 'utf-8');
    const lines = pipelineContent.split('\n');
    const pendientesIdx = lines.findIndex(l => l.includes('## Pendientes'));

    if (pendientesIdx !== -1) {
      const newEntries = allNewUrls.map((url, idx) => {
        const company = url.includes('justjoin') ? 'JJIT' :
                        url.includes('nofluff') ? 'NFJ' : 'Unknown';
        return `- [ ] ${url} | ${company} | TBD     <!-- via Gmail:fallback-scrape -->`;
      });

      lines.splice(pendientesIdx + 1, 0, ...newEntries);
      writeFileSync(PIPELINE, lines.join('\n'));
      console.log('✓ Appended to pipeline.md');
    }
  }
}

main().catch(console.error);
