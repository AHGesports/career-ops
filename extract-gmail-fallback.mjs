#!/usr/bin/env node
import { readFileSync, writeFileSync, appendFileSync } from 'fs';

const GMAIL_SCAN_HISTORY = 'data/gmail-scan-history.tsv';
const PIPELINE = 'data/pipeline.md';
const APPLICATIONS = 'data/applications.md';

// Rows 38-69 that need fallback scraping
const ROWS_TO_SCRAPE = {
  // JustJoin.IT
  38: { sender: 'no-reply@justjoin.it', subject: 'Net, Remote', thread: '19dcdca196127b68' },
  39: { sender: 'no-reply@justjoin.it', subject: 'JavaScript, Angular, Full-time, Remote', thread: '19dcdc839fde7f08' },
  47: { sender: 'no-reply@justjoin.it', thread: '19dc898f98854008' },
  48: { sender: 'no-reply@justjoin.it', thread: '19dc8985859f455e' },
  49: { sender: 'no-reply@justjoin.it', thread: '19dc898273ac6b64' },
  59: { sender: 'no-reply@justjoin.it', thread: '19dc375e71e10b14' },
  60: { sender: 'no-reply@justjoin.it', thread: '19dc3721cdd6ce8f' },
  61: { sender: 'no-reply@justjoin.it', thread: '19dc371c2ab58e72' },

  // Indeed tracking
  40: { sender: 'donotreply@jobalert.indeed.com', thread: '19dca4c484ba0d6b' },
  41: { sender: 'donotreply@jobalert.indeed.com', thread: '19dca3c9083fd419' },
  45: { sender: 'donotreply@jobalert.indeed.com', thread: '19dc9cd4bff467c6' },
  46: { sender: 'donotreply@jobalert.indeed.com', thread: '19dc9cb2e179e3a5' },
  50: { sender: 'donotreply@jobalert.indeed.com', thread: '19dc505554ef68f6' },
  51: { sender: 'donotreply@jobalert.indeed.com', thread: '19dc4ee1d84c0957' },
  52: { sender: 'donotreply@jobalert.indeed.com', thread: '19dc4cae188a3be7' },
  53: { sender: 'donotreply@jobalert.indeed.com', thread: '19dc4ae6638fc41d' },
  54: { sender: 'donotreply@jobalert.indeed.com', thread: '19dc468d9f18f12b' },
  55: { sender: 'donotreply@jobalert.indeed.com', thread: '19dc455e03b6bce2' },
  56: { sender: 'donotreply@jobalert.indeed.com', thread: '19dc442496b5a005' },
  66: { sender: 'donotreply@jobalert.indeed.com', thread: '19dbfd0045303e03' },
  67: { sender: 'donotreply@jobalert.indeed.com', thread: '19dbfaa8ae02d527' },
  68: { sender: 'donotreply@jobalert.indeed.com', thread: '19dbf6a3fb7c7846' },
  69: { sender: 'donotreply@jobalert.indeed.com', thread: '19dbf587918ebd23' },

  // NoFluffJobs
  42: { sender: 'notifications@nofluffjobs.com', thread: '19dc9e77579408ef' },
  43: { sender: 'notifications@nofluffjobs.com', thread: '19dc9e67df363744' },
  44: { sender: 'notifications@nofluffjobs.com', thread: '19dc9e67c500c433' },
  62: { sender: 'notifications@nofluffjobs.com', thread: '19dc2a3970ac4824' },
  63: { sender: 'notifications@nofluffjobs.com', thread: '19dc2a396803099d' },
  64: { sender: 'notifications@nofluffjobs.com', thread: '19dc2a395c3a1c96' },

  // WTJ tracking
  57: { sender: 'alerts@welcometothejungle.com', thread: '19dc42351fa61bcf' },
  58: { sender: 'alerts@welcometothejungle.com', thread: '19dc4224acefbc86' },
};

function getPipelineUrls() {
  try {
    const content = readFileSync(PIPELINE, 'utf-8');
    const lines = content.split('\n');
    const urls = new Set();
    lines.forEach(line => {
      const match = line.match(/https?:\/\/[^\s|]+/);
      if (match) urls.add(match[0]);
    });
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
    urlMatches.forEach(url => urls.add(url));
    return urls;
  } catch (err) {
    return new Set();
  }
}

function constructJJITFilterUrl(subject) {
  // Parse subject like "Net, Remote" -> net/remote
  if (!subject) return null;
  const parts = subject.split(',').map(p => p.trim().toLowerCase());
  return `https://justjoin.it/job-offers/${parts.join('/')}?orderBy=DESC&sortBy=published`;
}

function constructNFJFilterUrl(subject) {
  // Parse subject patterns - need to examine actual emails
  if (!subject) return null;
  return null; // Will need to handle separately
}

// Main processing
console.log('Gmail Fallback Scrape Extractor');
console.log('================================\n');

const pipelineUrls = getPipelineUrls();
const applicationUrls = getApplicationUrls();
const allExistingUrls = new Set([...pipelineUrls, ...applicationUrls]);

console.log(`Existing URLs in pipeline: ${pipelineUrls.size}`);
console.log(`Existing URLs in applications: ${applicationUrls.size}`);
console.log(`Total unique URLs to avoid: ${allExistingUrls.size}\n`);

// Group rows by sender
const rowsByType = {
  jjit: [],
  nfj: [],
  indeed: [],
  wtj: []
};

Object.entries(ROWS_TO_SCRAPE).forEach(([row, data]) => {
  if (data.sender === 'no-reply@justjoin.it') {
    rowsByType.jjit.push({ row: parseInt(row), ...data });
  } else if (data.sender === 'notifications@nofluffjobs.com') {
    rowsByType.nfj.push({ row: parseInt(row), ...data });
  } else if (data.sender === 'donotreply@jobalert.indeed.com') {
    rowsByType.indeed.push({ row: parseInt(row), ...data });
  } else if (data.sender === 'alerts@welcometothejungle.com') {
    rowsByType.wtj.push({ row: parseInt(row), ...data });
  }
});

console.log('Threads to process:');
console.log(`  JustJoin.IT: ${rowsByType.jjit.length} threads (rows ${rowsByType.jjit.map(r => r.row).join(', ')})`);
console.log(`  NoFluffJobs: ${rowsByType.nfj.length} threads (rows ${rowsByType.nfj.map(r => r.row).join(', ')})`);
console.log(`  Indeed: ${rowsByType.indeed.length} threads (rows ${rowsByType.indeed.map(r => r.row).join(', ')})`);
console.log(`  WTJ: ${rowsByType.wtj.length} threads (rows ${rowsByType.wtj.map(r => r.row).join(', ')})\n`);

console.log('NEXT STEPS:');
console.log('1. Use Chrome DevTools MCP to navigate to filter URLs');
console.log('2. Extract job URLs from each page');
console.log('3. Deduplicate against existing URLs');
console.log('4. Append to pipeline.md under ## Pendientes');
console.log('5. Update gmail-scan-history.tsv with extracted counts\n');

// Output sample filter URLs to construct
console.log('Sample JJIT filter URLs to scrape:');
rowsByType.jjit.forEach(r => {
  if (r.subject) {
    const url = constructJJITFilterUrl(r.subject);
    console.log(`  Row ${r.row}: ${url}`);
  }
});
