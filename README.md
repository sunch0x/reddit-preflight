![Reddit Preflight](docs/assets/project-banner.png)

# Reddit Preflight

Check Reddit communities before spending time on a post.

Paste a list of subreddits, or collect them from Reddit search. Preflight visits each community in one reusable browser tab and records visible posting restrictions for your current Reddit session.

**Free and open source. Runs in Chrome. No extra account, API key or AI subscription.**

Built by [sunch0x](https://linkdeck.co/sunch0x).

## Interface

![Reddit Preflight dashboard with five communities waiting to be checked](docs/assets/dashboard.png)

Current local 0.8.2 interface, shown before a scan with an example list. The published release is still 0.5.6; this screenshot previews the updated build. No eligibility results are prefilled.

## What it checks

- Visible account-age and karma requirements
- Moderator approval and unavailable communities
- Sign-in requests, rate limits and browser challenges
- Whether an editable title and text field appear

**An available form does not guarantee that Reddit will accept your post.** Hidden filters and later moderation decisions are outside the check.

Preflight never submits posts, fills a Reddit draft, joins communities, votes or sends messages.

## Get started

1. Download and extract the ZIP from [Releases](https://github.com/sunch0x/reddit-preflight/releases), or clone this repository
2. Open `chrome://extensions` in the Chrome profile you use for Reddit
3. Turn on **Developer mode** and click **Load unpacked**
4. Select the extracted extension folder, or `extension/` inside the cloned repository
5. Open Reddit Preflight from the extensions menu

Sign in to Reddit normally. You never enter your Reddit password in Preflight.

### Paste a list

Add community names or Reddit links, then click **Add to list** and **Start checking**. You can also import a `.txt` file.

```text
r/socialmedia
r/content_marketing
https://www.reddit.com/r/creators/
```

### Collect from search

Open a Reddit search and choose its **Communities** tab. In Preflight, select that search tab and click **Collect & check**.

Preflight scrolls the loaded results, removes duplicate names and checks the collected list. Existing checked entries are preserved. It collects what Reddit loads for that search, not every community on Reddit.

## Review and export

Search or filter the results, open the details behind an observation, and export a CSV, HTML report or JSON backup.

Checks run sequentially in one reusable tab. Keep the dashboard open while scanning. Pause whenever you need to. If Reddit asks you to sign in, rate-limits the session or shows a challenge, the scan pauses rather than bypassing it.

Use the retry and recheck controls after resolving a problem or switching accounts. Never treat checks from another Reddit account as your own eligibility results.

## Updated local build

The local 0.8.2 build also includes:

- Collection of visible community rules with source links
- **Check a draft:** compare your text against explicit collected requirements
- **Posting history:** manually record post links and outcomes
- A compact settings menu, download menu and separate list deletion

These additions have local automated and browser-fixture coverage, but are not yet included in the published 0.5.6 release or the current GitHub source. Live Reddit behavior can differ from fixtures.

## Privacy

Lists, observations and backups stay in your browser or files you export. No results are uploaded to a Preflight server. The extension uses your existing Reddit session and requests access to `www.reddit.com`.

See [PRIVACY.md](PRIVACY.md) for details. This independent project is not affiliated with Reddit.

## Development

Node.js 20.11+ and the system `zip` command are sufficient. No npm dependencies are required.

```sh
npm test
npm run check
npm run package
```

Load `extension/` unpacked. After an update, reload the extension on `chrome://extensions` and reload its dashboard.

MIT licensed.
