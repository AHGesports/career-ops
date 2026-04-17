# Portal Scraping Guide — Austrian Job Sites

Reference for agents scraping Austrian job portals. Each portal has specific quirks.
**TESTED 2026-04-14** — all methods verified with Chrome DevTools MCP.

## Required Tool

**Use `chrome-devtools-mcp` (Chrome DevTools MCP server) for all portal scraping.**
- `navigate_page` → load URLs
- `take_snapshot` → read page content (a11y tree)
- `evaluate_script` → run JS for filtering, pagination, data extraction
- `click` → interact with UI elements via uid

**Do NOT use:** WebFetch (rate limited), WebSearch (returns category pages not listings), or raw Playwright. Chrome DevTools MCP is the only reliable method for these SPA-heavy Austrian portals.

---

## devjobs.at ⭐ (MOST RELIABLE)

**Type:** Dev-focused job board
**Direct URL:** `https://en.devjobs.at/jobs/search?osmState=salzburg-at&sort=date`

### What works (TESTED ✅):
- **URL params work perfectly** for both filtering and sorting
- `&sort=date` → sorts by date ✅
- `&page=2`, `&page=3` → URL pagination works ✅
- Combined: `?osmState=salzburg-at&sort=date&page=2` ✅

### Specs:
- **Listings per page:** ~15
- **Total pages:** 5 (for Salzburg)
- **Date info:** "NEW" tag = recent. No exact dates per listing.
- **Job URLs:** `https://en.devjobs.at/job/{hash}` (direct links)
- **Tech tags:** Stack badges on each card (Angular, C#, Docker, etc.)
- **Salary:** Yes, on cards (e.g. "56k - 70k €")
- **No login required**

---

## metajob.at ⭐ (BEST AGGREGATOR)

**Type:** Aggregator (stepstone, derstandard, karriere.at, etc.)
**Direct URL:** `https://www.metajob.at/Software%20Developer-Salzburg%20(Bundesland)`

### Sort by date (TESTED ✅):
- Click "Sortierung: Relevanz" button → changes to "Sortierung: Datum"
- **⚠️ Sort is CLIENT-SIDE ONLY** — no URL param. Must click each session.
- Sort state may persist via cookies between pages in same session.

### Pagination (TESTED ✅):
- Click "Mehr Ergebnisse" button at bottom → loads next 10
- Button stays until all loaded

### Specs:
- **Listings per page:** 10
- **Date format:** "Heute", "Gestern", "vor X T", "vor X M"
- **⚠️ No source URLs** — metajob shows inline cards with source portal name (e.g. "via stepstone.at") but no direct links to actual job posts.
- **No login required**

---

## karriere.at (AUSTRIA'S #1)

**Type:** Major Austrian job board (SPA / React-like)
**Direct URL (IT/EDV + Salzburg):** `https://www.karriere.at/jobs/salzburg?jobFields%5B%5D=2172`

### IT/EDV filter (TESTED ✅):
- URL param `?jobFields%5B%5D=2172` → filters to IT/EDV (~209 jobs) ✅
- This is the ONLY reliable way to filter

### ⚠️ Date filter: DOES NOT EXIST
- **No UI date filter** — karriere.at only has: Berufsfelder, Anstellungsart, Positionsebene, Homeoffice
- **`&dateCreated=1` URL param DOES NOT WORK** — tested, ignored, still shows 209 ❌
- **The selector `#desktop-filters-container`** is from jobs.at, NOT karriere.at ❌
- **Only way to filter by date:** Read date text from listings and stop at reference point

### Pagination (TESTED ✅):
- **URL pagination does NOT work** — karriere.at strips `?page=` params (SPA) ❌
- Uses "load more" button. **Exact selector:**
  ```
  #jobsearchListing > div.c-jobsSearch__jobsSearchList > div.m-jobsSearchList > div.m-jobsSearchList__loadMoreJobsButton > nav > button
  ```
- **Working JS for load more:**
```javascript
const selector = '#jobsearchListing > div.c-jobsSearch__jobsSearchList > div.m-jobsSearchList > div.m-jobsSearchList__loadMoreJobsButton > nav > button';
for (let i = 0; i < N; i++) {
  const btn = document.querySelector(selector);
  if (!btn) break;
  btn.scrollIntoView();
  await new Promise(r => setTimeout(r, 300));
  btn.click();
  await new Promise(r => setTimeout(r, 2500));
}
```
- Each click loads ~15 more jobs
- Initial page: ~18 jobs. After 5 clicks: 92 loaded. Button disappears when all loaded.

### Cookie dismiss:
- First visit shows cookie dialog — click "Alle ablehnen" button before interacting

### Specs:
- **Date format:** "Heute veröffentlicht", "Gestern veröffentlicht", "vor X Tagen veröffentlicht"
- **Job URLs:** `https://www.karriere.at/jobs/{id}` (7-8 digit numeric)
- **Company URLs:** `https://www.karriere.at/f/{slug}`
- **Salary:** Yes (monthly or yearly)
- **No login required**

---

## jobs.at (LOW PRIORITY)

**Type:** Austrian job board
**Base URL:** `https://www.jobs.at/j/-/salzburg`

### IT filter (TESTED ✅):
**Must use JS — URL params unreliable for initial filter. But result URL works for revisit.**

**Full JS sequence (tested, works):**
```javascript
// 1. Click Filtern button
const filterBtn = [...document.querySelectorAll('button')].find(b => b.textContent.trim().startsWith('Filtern'));
if (filterBtn) { filterBtn.click(); await new Promise(r => setTimeout(r, 1000)); }

// 2. Expand Berufsfelder
const berufBtn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Berufsfelder'));
if (berufBtn) { berufBtn.click(); await new Promise(r => setTimeout(r, 1000)); }

// 3. Click IT checkbox using exact selector
const itLabel = document.querySelector('#desktop-filters-container > div > div.j-u-padding.j-u-padding-vertical-none > div:nth-child(4) > div > div > div > div:nth-child(1) > div > div:nth-child(11) > label');
if (itLabel) itLabel.click();
await new Promise(r => setTimeout(r, 500));

// 4. Click Speichern
const saveBtn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Speichern'));
if (saveBtn) { saveBtn.click(); await new Promise(r => setTimeout(r, 2000)); }
```
**Result URL:** `https://www.jobs.at/j/-/salzburg?jobField%5B0%5D=19`

### Pagination (TESTED ✅):
- **No "load more" button** — jobs.at uses **infinite scroll**
- Scroll to bottom of page → new jobs appear automatically
- **Working JS for infinite scroll:**
```javascript
let prevCount = 0;
let staleRounds = 0;
while (staleRounds < 3) {
  window.scrollTo(0, document.body.scrollHeight);
  await new Promise(r => setTimeout(r, 2000));
  const currentCount = /* count job elements */;
  if (currentCount === prevCount) staleRounds++;
  else { staleRounds = 0; prevCount = currentCount; }
}
```
- Loads ~15 jobs per scroll batch
- With IT filter: 44 of 101 loaded via scroll (some may be behind login/ads)
- Loads in batches as you scroll — not all at once

### Date filter:
- jobs.at has "Online seit" radio buttons: "Egal", "24 Stunden", "7 Tagen"
- Inside filter panel → Sucheinstellungen section

### Specs:
- **Date format:** "Heute" (badge image), "vor X T"
- **Job URLs:** `https://www.jobs.at/i/{id}` (7-digit numeric) — some jobs use root URL `https://www.jobs.at/` instead
- **⚠️ High noise** — IT category includes SAP admin, service desk, telecom, network
- **Medium priority** — infinite scroll works but noisy results

---

## stepstone.at (SKIP — DUPLICATES)

**Type:** Major Austrian job board
**Direct URL:** `https://www.stepstone.at/jobs/software-developer/in-salzburg?sort=date`
**Note:** Mostly duplicates listings from karriere.at and metajob.at. Low unique value.
**WebSearch `site:stepstone.at` sufficient** — no Playwright needed.

---

## hokify.at (SKIP — TOO FEW)

**Type:** Mobile-first Austrian job board
**URL:** `https://hokify.at/jobs/m/softwareentwickler/salzburg`
**Note:** ~7 listings in Salzburg. WebSearch sufficient.

---

## AMS (jobs.ams.at) — GOVERNMENT JOB PORTAL

**Type:** Austrian Public Employment Service (Arbeitsmarktservice)
**Base URL:** `https://jobs.ams.at/public/emps/`

### Search (TESTED ✅):
- URL params work: `https://jobs.ams.at/public/emps/jobs?query={keyword}&location=Salzburg&locationId=TOWN_13582&vicinity=20`
- **Best keywords for dev roles:**
  - `Softwareentwickler` → 52 results (best, broadest)
  - `Software Developer` → 8 results
  - `Full Stack` → 6 results
  - `Software Entwickler` → 47 results
  - `Programmierer` → 3 results (mostly CNC, not IT)
  - `.NET` → noise (returns construction jobs)
  - `Angular`, `C# Entwickler` → need browser rendering, fetch returns 0

### Cookie dismiss:
- First visit: click "Nicht Einverstanden" button

### Date filter (TESTED ✅):
- **IDs are dynamic** — cannot use ID/for selectors
- Find by text content: `label` containing "letzten Woche" or "letzten 24 Stunden"
```javascript
const labels = [...document.querySelectorAll('label')];
const weekLabel = labels.find(l => l.textContent.includes('letzten Woche'));
if (weekLabel) weekLabel.click();
// or for daily: labels.find(l => l.textContent.includes('24 Stunden'))
```

### Pagination:
- Uses infinite scroll — scroll to bottom to load more
- ~12 jobs per batch
- Same pattern as jobs.at

### Specs:
- **Date format:** "dd.MM.yyyy" (e.g. "14.04.2026") in "Inseriert/Aktualisiert" field
- **Job URLs:** `https://jobs.ams.at/public/emps/jobs/{uuid}` (UUID format)
- **Salary:** Usually NOT shown (AMS listings often omit salary)
- **Job detail page:** Full JD text available on detail page
- **Dedup note:** Multiple recruiting agencies (ManpowerGroup, ACTIEF, talentmonkeys, laturo) often post SAME underlying job. Compare by C# + Hallein/Salzburg + similar description to dedup.

### Important AMS quirks:
- AMS is SPA — `fetch()` returns empty shell. Must use Chrome DevTools MCP navigate + evaluate.
- AMS aggregates from AMS itself + external crawled listings (finden.at, etc.)
- Some results are crawled duplicates of karriere.at/stepstone.at listings
- Good for government-sourced listings not on commercial portals

---

## Scan Priority Order

1. **devjobs.at** ⭐ — most reliable, URL params work, dev-focused, tech tags
2. **metajob.at** ⭐ — best aggregator, 120+ listings, but no source URLs
3. **karriere.at** — Austria's #1, 209 IT/EDV, but no date filter + SPA pagination
4. **AMS (jobs.ams.at)** — government portal, 52 dev results, unique listings, date filter works
5. **jobs.at** — infinite scroll works, 101 IT jobs, noisy but functional
6. **stepstone.at** — duplicates only
7. **hokify.at** — too few listings

## Daily Scan Strategy

For incremental daily scans:
1. **devjobs.at:** Browse `?osmState=salzburg-at&sort=date&page=1` → stop at reference point
2. **metajob.at:** Click sort → Datum, check first few entries against reference
3. **karriere.at:** Load `?jobFields%5B%5D=2172`, check "Heute" entries only, click load-more if needed
4. **AMS:** Search `Softwareentwickler` + Salzburg, click "24 Stunden" label for daily filter
5. **jobs.at:** Infinite scroll with IT filter, check new entries
