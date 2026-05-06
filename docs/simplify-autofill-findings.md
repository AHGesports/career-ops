# Simplify Copilot autofill — automation findings

Extension: Simplify Copilot (id `pbanhockgagggenencehbnadejlgchfc`, v2.4.6).

## Key insight

The extension does **not** require clicking the toolbar icon or opening the popup. The content script (`js/contentScript.bundle.js`, matches `*://*/*`, `run_at: document_end`) injects the full Simplify side panel directly into the page DOM as a shadow root **whenever the page is a supported job application**. The "Autofill this page" button (`#fill-button`) the user normally clicks lives inside that shadow root and is reachable from page JS via shadow DOM traversal.

This bypasses every CDP limitation around browser chrome (toolbar, popup) and reduces automation to:

1. Detect injected shadow root.
2. Click `#fill-button` inside it.
3. Wait for completion.

## Detection signal — supported page

```js
let supported = false, hasFillButton = false;
for (const r of document.querySelectorAll('.simplify-jobs-shadow-root')) {
  if (r.shadowRoot?.childElementCount > 0) supported = true;
  if (r.shadowRoot?.querySelector('#fill-button')) { hasFillButton = true; break; }
}
```

| URL | shadow roots | `#fill-button` |
|---|---|---|
| `https://job-boards.greenhouse.io/remotecom/jobs/7703224003?quickApply=true` (activating) | 19 | yes |
| `https://job-boards.greenhouse.io/remotecom` (non-activating) | 0 | no |

Reliability: high. The class name `simplify-jobs-shadow-root` is the extension's own naming and unlikely to clash. Shadow root empty / 0 shadow roots = not supported.

## Click signal — autofill triggered

Calling `.click()` on the shadow-root `#fill-button` in page JS produces a real autofill run. Side effect: the extension **navigates the page** by appending `?utm_source=Simplify&gh_src=Simplify` to the current URL (Simplify attribution / referral tracking). Form fields populate after the new page load.

Confirmed populated fields on Greenhouse Remote.com test posting: `first_name`, `last_name`, `email`, `phone`, LinkedIn URL field, GDPR consent checkbox.

## Start signal

`startedAt = Date.now()` immediately before calling `.click()`. The navigation is a hard reload (Playwright `Page.evaluate` execution context is destroyed on click), so the click and navigation are effectively atomic.

Optional sharper start signal: `page.waitForURL(u => /utm_source=Simplify/.test(u))` — once the URL contains the Simplify attribution params, the autofill flow is guaranteed underway.

## End signal

Two complementary signals:

1. **Fill button disappears** from the panel after fill completes (panel re-renders without it). Post-fill panel `textContent` is empty in observed runs.
2. **Form input values are stable**. Poll `document.querySelectorAll('input, textarea, select')` values; once the concatenated signature is unchanged for 1.5 s, autofill is done.

Production module uses signal 2 (more robust; signal 1 may change with extension UI updates).

## Already-filled state

If the panel shadow root is injected (supported = true) but `#fill-button` is absent, the page has been autofilled already (or extension determined no action needed). Production module surfaces this as `alreadyFilled: true` and skips the click.

## What we cannot do via CDP / Playwright / chrome-devtools MCP

- **Click the toolbar icon** — no API. Not needed; in-page panel gives same affordance.
- **Read toolbar icon color** — no API. Not needed; presence of populated shadow root is the equivalent signal.
- **Attach to extension service worker via chrome-devtools MCP** — MCP only exposes page targets. Standalone Playwright `connectOverCDP` + `context.serviceWorkers()` does work, but is unnecessary for this workflow because the content script's shadow-DOM panel exposes everything.

## externally_connectable

Manifest `externally_connectable.matches`: `https://*.simplify.jobs/*`, `https://*.village.do/*`, `https://*.village.ai/*`. Arbitrary page origins (or your localhost) cannot use `chrome.runtime.sendMessage(extensionId, ...)`. Not needed — DOM-level click suffices.

## Production driver

`scripts/simplify-autofill.mjs` — exports `runSimplifyAutofill(jobUrl, opts?)` returning:

```ts
{
  supported: boolean,
  clicked: boolean,
  alreadyFilled: boolean,
  startedAt: number,        // ms epoch, before click
  endedAt: number,          // ms epoch, when fields stabilized
  durationMs: number,
  filledFieldCount: number,
  filledFields: { name: string, type: string, value: string }[],
  finalUrl: string,
  error?: string,
}
```

CLI: `node scripts/simplify-autofill.mjs <jobUrl>` → prints JSON.

Requires `launch-chrome.bat` running (Chrome on `localhost:9222`) with the Simplify extension installed and the user signed in.

## Risks / failure modes

- **Webstore auto-update** to the extension may rename `.simplify-jobs-shadow-root` or `#fill-button`. Mitigation: monitor by health-check; the strings are stable across known versions of v2.x.
- **Login session expiration**: handled manually by you (per requirement). On expiration the panel injects but `#fill-button` may either be absent or click into a no-op. Driver returns `clicked: true` but `filledFieldCount: 0`. Caller should treat that as a re-login signal.
- **MV3 service worker idle**: not relevant — driver does not interact with SW directly.
- **Active tab race**: not relevant — driver operates entirely on the page DOM, not the popup, so there is no "active tab" dependency.
