# Gmail ingestion setup — click-and-save guide

Pre-built URLs. Click each link → sign in if needed → click "Save search" / "Create alert" / "Jobalarm" button on page → confirm. Done.

**Research context**: [../remote-job-research/final.md](../remote-job-research/final.md)

**Total time**: ~45 min clicks + 15 min Gmail filter + 48h passive wait.

---

## Legend

- **Click link** → page opens with query pre-filled
- **Find button** → look for "Create alert" / "Save search" / "Jobalarm erstellen" / "Benachrichtigen" etc.
- **Name the alert** → use suggested name (helps debug)
- **Set cadence** → always pick Daily (or Instant if offered and rate sane)

---

## Phase 1A.1 — CONFIRMED rich sources (click all 9)

### 1. LinkedIn — 5 alerts (max is 20, we use 5) -> DONE BUT NOT SET ALERT YET

Sign in first: https://www.linkedin.com/login

Then click each, hit **"Create alert"** button (bell icon top-right of job search page):

1. **EU remote .NET/C#** → https://www.linkedin.com/jobs/search/?keywords=%22.NET%22%20OR%20%22C%23%22&geoId=91000000&f_WT=2&f_TPR=r86400&sortBy=DD
2. **EU remote Angular/TS** → https://www.linkedin.com/jobs/search/?keywords=Angular%20OR%20TypeScript&geoId=91000000&f_WT=2&f_TPR=r86400&sortBy=DD
3. **DACH fullstack Home Office** → https://www.linkedin.com/jobs/search/?keywords=Fullstack%20OR%20%22Full%20Stack%22&geoId=91000006&f_WT=2&f_TPR=r86400&sortBy=DD
4. **EU Applied AI / AI Engineer remote** → https://www.linkedin.com/jobs/search/?keywords=%22AI%20Engineer%22%20OR%20%22Applied%20AI%22&geoId=91000000&f_WT=2&f_TPR=r86400&sortBy=DD
5. **Austria senior dev** → https://www.linkedin.com/jobs/search/?keywords=Senior%20(.NET%20OR%20Angular%20OR%20Node)&geoId=103883259&f_TPR=r86400&sortBy=DD

**UI for each**: page loads with filters pre-set. Top-left toggle **"Set alert"** to ON (green). Choose **"Daily"**. Done.

**Sender**: `jobalerts-noreply@linkedin.com`

---

### 2. Indeed — 3 countries × 2 queries = 6 alerts -> DONE

Each link → page shows results → above results click **"Get new jobs for this search by email"**.

**Germany (de.indeed.com):**
1. **.NET remote DE** → https://de.indeed.com/jobs?q=.NET&l=Home+Office&sc=0kf%3Aattr(DSQF7)%3B&sort=date
2. **Angular remote DE** → https://de.indeed.com/jobs?q=Angular&l=Home+Office&sc=0kf%3Aattr(DSQF7)%3B&sort=date

**Austria (at.indeed.com):**
3. **Fullstack remote AT** → https://at.indeed.com/jobs?q=Fullstack&l=Remote&sc=0kf%3Aattr(DSQF7)%3B&sort=date
4. **.NET Salzburg / remote AT** → https://at.indeed.com/jobs?q=.NET&l=&sc=0kf%3Aattr(DSQF7)%3B&sort=date

**Netherlands (nl.indeed.com):**
5. **.NET remote NL** → https://nl.indeed.com/jobs?q=.NET&l=Thuiswerken&sc=0kf%3Aattr(DSQF7)%3B&sort=date
6. **Angular remote NL** → https://nl.indeed.com/jobs?q=Angular&l=Thuiswerken&sc=0kf%3Aattr(DSQF7)%3B&sort=date

**UI**: yellow bar "Get new jobs..." near top of results → enter email → submit.

**Sender**: `alert@indeed.com` or `noreply@indeed.com`

---

### 3. We Work Remotely — 1 subscription -> Pay only not worth it

**Click**: https://weworkremotely.com/remote-jobs/email-subscription

**UI**: check these categories → submit email:
- ✅ Full-Stack Programming
- ✅ Back-End Programming
- ✅ Front-End Programming
- ✅ DevOps and Sysadmin

**Sender**: verify after first email

---

### 4. Remotive — 1 subscription -> Pay only not worth it

**Click** (signup): https://remotive.com/accounts/signup?next=/accounts/remote-jobs-by-email

**UI**: create free account → navigate to "Jobs by email" in profile → select:
- Category: **Software Development**
- Location preference: **EMEA / Worldwide**
- Frequency: **Daily**

**Sender**: `hi@remotive.com`

---

### 5. RemoteOK — 1 subscription -> Pay only not worth it

**Click**: https://remoteok.com/jobs-by-email

**UI**: scroll to form → select tags:
- ✅ dev
- ✅ remote
- ✅ fullstack
- ✅ dotnet
- ✅ angular
- ✅ typescript
- ✅ europe (if option)

Enter email → submit.

**Sender**: `email@remoteok.com`

**⚠️**: JDs contain anti-LLM honeypot phrases. Scanner filters them.

---

### 6. Hacker News "Who is hiring" via IFTTT — 1 applet -> us only

**Click**: https://ifttt.com/applets/kbGwp62r-get-a-weekly-email-with-new-hacker-news-job-postings

**UI**: click **"Connect"** → sign in with Gmail → applet runs weekly.

**Sender**: `notifications@ifttt.com`

---

### 7. Welcome to the Jungle — 2 alerts -> DONE

Requires account first: https://www.welcometothejungle.com/en/signup

Then click each, hit **"Create alert"** (bell icon on results page):

1. **EU remote .NET** → https://www.welcometothejungle.com/en/jobs?query=.NET&refinementList%5Bcontract_type%5D%5B%5D=full_time&refinementList%5Boffices.country_code%5D%5B%5D=DE&refinementList%5Boffices.country_code%5D%5B%5D=AT&refinementList%5Boffices.country_code%5D%5B%5D=CH&refinementList%5Boffices.country_code%5D%5B%5D=FR&refinementList%5Boffices.country_code%5D%5B%5D=NL&refinementList%5Bremote%5D%5B%5D=fulltime
2. **EU remote Angular/TypeScript** → https://www.welcometothejungle.com/en/jobs?query=Angular%20TypeScript&refinementList%5Boffices.country_code%5D%5B%5D=DE&refinementList%5Boffices.country_code%5D%5B%5D=AT&refinementList%5Boffices.country_code%5D%5B%5D=CH&refinementList%5Boffices.country_code%5D%5B%5D=FR&refinementList%5Bremote%5D%5B%5D=fulltime

**UI**: toggle **"Remote: Full remote"** filter + set **country chips** (DE/AT/CH/FR/NL). Bell icon → daily.

**Sender**: `noreply@welcometothejungle.com`

---

### 8. NoFluffJobs — 1-2 alerts -> DONE

**Click**: https://nofluffjobs.com/pl/remote?criteria=category%3Dbackend,fullstack

**UI**: above results click **"Save search"** / **"Zapisz wyszukiwanie"** → give name `Remote backend/fullstack` → daily.

Optional second:
https://nofluffjobs.com/pl/remote?criteria=requirement%3Ddotnet,angular,typescript

**Sender**: `noreply@nofluffjobs.com`

---

### 9. JustJoin.IT — 2 alerts -> DONE

Sign in: https://justjoin.it/login

1. **Remote .NET** → https://justjoin.it/job-offers/remote/net?orderBy=DESC&sortBy=published
2. **Remote JS/TS** → https://justjoin.it/job-offers/remote/javascript?orderBy=DESC&sortBy=published

**UI**: click **bell icon** top of results → daily.

**Sender**: `no-reply@justjoin.it`

---

## Phase 1A.2 — UNVERIFIED sources (subscribe, inspect 48h later)

### 10. Xing Jobagent — 5 alerts (HARD CAP) -> NOT DONE

Sign in: https://login.xing.com

Click each, hit **"Suche speichern"** / **"Job-Alarm erstellen"**:

1. **.NET Remote DACH** → https://www.xing.com/jobs/search?keywords=.NET&remoteOption=FULL_REMOTE&location=Deutschland
2. **Angular Remote DACH** → https://www.xing.com/jobs/search?keywords=Angular&remoteOption=FULL_REMOTE&location=Deutschland
3. **Fullstack Salzburg** → https://www.xing.com/jobs/search?keywords=Fullstack&location=Salzburg
4. **Fullstack Wien** → https://www.xing.com/jobs/search?keywords=Fullstack&location=Wien
5. **TypeScript Remote AT** → https://www.xing.com/jobs/search?keywords=TypeScript&remoteOption=FULL_REMOTE&location=%C3%96sterreich

**UI**: each page → click **"Suche speichern"** button top-right → name it → daily email.

**Sender**: `jobs@xing.com`

---

### 11. karriere.at Jobalarm — 3 alerts -> DONE

Sign in / create account: https://www.karriere.at/login

1. **Remote dev** → https://www.karriere.at/jobs/home-office/softwareentwickler
2. **.NET remote** → https://www.karriere.at/jobs/home-office/.net
3. **Angular remote** → https://www.karriere.at/jobs/home-office/angular

**UI**: above results click **"Jobalarm erstellen"** → daily.

**Sender**: `alert@karriere.at` or `no-reply@karriere.at`

---

### 12. devjobs.at — 2 alerts -> DONE

**Click**:
1. **Remote all AT** → https://devjobs.at/jobs?employment=Full-time&remote=Home-office
2. **Salzburg dev** → https://devjobs.at/jobs?location=Salzburg

**UI**: above results find **"Job alert"** / bell icon → enter email → daily.

**Sender**: verify

---

### 13. Arbeitsagentur Jobagent — 3 alerts -> DO LATER

Create free account: https://www.arbeitsagentur.de/bewerbung/anmelden

Then click each + hit **"Als Suchauftrag speichern"**:

1. **Softwareentwickler Homeoffice** → https://www.arbeitsagentur.de/jobsuche/suche?was=Softwareentwickler&arbeitszeit=ho&veroeffentlichtseit=7
2. **.NET Homeoffice** → https://www.arbeitsagentur.de/jobsuche/suche?was=.NET&arbeitszeit=ho&veroeffentlichtseit=7
3. **Angular Homeoffice** → https://www.arbeitsagentur.de/jobsuche/suche?was=Angular&arbeitszeit=ho&veroeffentlichtseit=7

**UI**: each results page → **"Als Suchauftrag speichern"** button → name → daily email.

**Sender**: `jobagent@arbeitsagentur.de`

---

### 14. StepStone.at — 2 alerts -> DONE

1. **.NET remote** → https://www.stepstone.at/jobs/.net/arbeitsort/home-office
2. **Fullstack remote** → https://www.stepstone.at/jobs/fullstack/arbeitsort/home-office

**UI**: above results **"Jobmail erstellen"** → enter email → daily.

**Sender**: `alert@stepstone.at`

---

### 15. StepStone.de — 2 alerts -> DONE

1. **.NET remote** → https://www.stepstone.de/jobs/.net/arbeitsort/home-office
2. **Angular remote** → https://www.stepstone.de/jobs/angular/arbeitsort/home-office

**UI**: same as StepStone.at, German text.

**Sender**: `alert@stepstone.de`

---

### 16. Himalayas — 1 alert -> NOT Alertable

Sign in / create account: https://himalayas.app/signup

**Click**: https://himalayas.app/jobs/api/search?categories=Engineering&timezoneRestrictions=0,1,2,3

Or browse and save: https://himalayas.app/jobs?category=Engineering

**UI**: account settings → email alerts → engineering + EU TZ → daily.

**Sender**: `alerts@himalayas.app`

(API also covers this — email mainly to compare.)

---

### 17. GermanTechJobs.de — 1 newsletter -> DONE

**Click**: https://germantechjobs.de → scroll to footer → newsletter signup

**UI**: enter email → submit.

Cadence: weekly.

**Sender**: verify after first send

---

### 18. theprotocol.it — 2 alerts -> DONE

Sign in: https://theprotocol.it/logowanie

1. **Fullstack remote** → https://theprotocol.it/filtry/fullstack;sp/zdalna;rw
2. **Backend remote** → https://theprotocol.it/filtry/backend;sp/zdalna;rw

**UI**: bell icon top of results → daily email.

**Sender**: verify

---

## Phase 1A.3 — Gmail label + filter (15 min)

### Step 1 — create label

**Click**: https://mail.google.com/mail/u/0/#settings/labels

Scroll to "Labels" → **Create new label** → name: `job-alerts` → Save.

### Step 2 — create filter

**Click**: https://mail.google.com/mail/u/0/#settings/filters

Click **Create a new filter**.

In **From** field, paste this single line:

```
jobalerts-noreply@linkedin.com OR alert@indeed.com OR noreply@indeed.com OR jobs-noreply@indeed.com OR jobs@weworkremotely.com OR hi@remotive.com OR noreply@remotive.com OR email@remoteok.com OR notifications@ifttt.com OR noreply@welcometothejungle.com OR noreply@nofluffjobs.com OR no-reply@justjoin.it OR jobs@xing.com OR noreply@xing.com OR alert@karriere.at OR no-reply@karriere.at OR alerts@devjobs.at OR jobagent@arbeitsagentur.de OR alert@stepstone.at OR alert@stepstone.de OR alerts@himalayas.app
```

Click **Create filter** → check:
- ✅ **Skip the Inbox** (Archive it)
- ✅ **Apply the label**: `job-alerts`
- ✅ **Never send it to Spam**
- ✅ **Also apply filter to matching conversations**

Click **Create filter**.

### Step 3 — verify after 24h

**Click**: https://mail.google.com/mail/u/0/#search/label%3Ajob-alerts+newer_than%3A1d

Should show alerts. If empty → domain guess wrong, edit filter with real senders.

---

## Phase 1A.4 — DO NOT subscribe

| Source | Why skip |
|--------|----------|
| **Pragmatic Engineer Jobs Digest** | DEAD April 27, 2024 |
| **Jobgether** | Marketing-nudge emails |
| **Wellfound / AngelList** | Nudge + login-gated destinations |
| **Hiring.cafe** | Weak/delayed alerts, no rich cards |

---

## Status tracker

Update after subscribing each:

| # | Source | Subscribed | First email arrived | Category A/B | Keep |
|---|--------|-----------|---------------------|--------------|------|
| 1 | LinkedIn (5 alerts) | [ ] | [ ] | A (confirmed) | ✅ |
| 2 | Indeed DE+AT+NL (6) | [ ] | [ ] | A (confirmed) | ✅ |
| 3 | WeWorkRemotely | [ ] | [ ] | A (confirmed) | ✅ |
| 4 | Remotive | [ ] | [ ] | A (confirmed) | ✅ |
| 5 | RemoteOK | [ ] | [ ] | A (confirmed) | ✅ |
| 6 | HNHiring IFTTT | [ ] | [ ] | A (confirmed) | ✅ |
| 7 | WTTJ (2) | [ ] | [ ] | A (likely) | ? |
| 8 | NoFluffJobs | [ ] | [ ] | A (likely) | ? |
| 9 | JustJoin.IT (2) | [ ] | [ ] | A (likely) | ? |
| 10 | Xing (5) | [ ] | [ ] | ? | ? |
| 11 | karriere.at (3) | [ ] | [ ] | ? | ? |
| 12 | devjobs.at (2) | [ ] | [ ] | ? | ? |
| 13 | Arbeitsagentur (3) | [ ] | [ ] | ? | ? |
| 14 | StepStone.at (2) | [ ] | [ ] | ? | ? |
| 15 | StepStone.de (2) | [ ] | [ ] | ? | ? |
| 16 | Himalayas | [ ] | [ ] | ? | ? |
| 17 | GermanTechJobs | [ ] | [ ] | ? | ? |
| 18 | theprotocol.it (2) | [ ] | [ ] | ? | ? |

---

## When all done

Tell Claude: **"Gmail setup done, start Phase 1B"** → builds `scan.mjs --gmail` parser + dry-runs against your inbox.

---

## Troubleshooting

**Link opens but no filters applied**: some sites strip query params for logged-out users. Sign in first, then click again.

**Button says "Enter email" even though signed in**: provide email, the alert attaches to that email (same as user's Gmail) — still works.

**Xing 5-alert cap warning**: consolidate — drop Salzburg-only alert, merge into DACH remote query.

**Arbeitsagentur form rejects**: they require German address / Steuer-ID for full account. Workaround: use email-only "Jobagent ohne Anmeldung" (anonymous) if offered on results page.

**Gmail filter not catching specific sender**: open one such email → three-dot menu → "Filter messages like this" → same settings → save. Adds real sender to filter chain.
