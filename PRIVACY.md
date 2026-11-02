# Privacy

Reddit Preflight is a local Chrome extension. It has no backend, analytics, remote scripts, advertising trackers, external fonts or API keys.

## What it reads

When you start a check, the extension opens one reusable tab on `https://www.reddit.com/r/<community>/submit/`. It reads rendered page text, editable-field availability, visible dialogs and explicit account-menu identifiers. It inspects open shadow roots because Reddit uses web components.

It does not read password fields, input values, cookies, access tokens, private messages or arbitrary browsing history. It does not click Reddit controls, fill in a post, submit content, join communities, vote or message anyone.

When you choose **Collect & check**, it also reads community links from the selected open Reddit Communities search and scrolls that results pane. Only eligible Reddit search tabs are offered in the selector. Clicking the extension icon on a Communities search remembers that tab ID in `chrome.storage.session` for the source picker. Collected names are stored locally as part of your list. The search tab is not closed or navigated by the collector.

## Account identity

The extension uses Reddit as it is already signed in within the current Chrome profile. It does not implement a separate Reddit login or OAuth flow. A username is displayed only if the page exposes a unique explicit account-menu identifier. Otherwise it remains unidentified. A detected change between two known usernames pauses a scan, but unidentified accounts cannot be reliably compared. Recheck the list after changing accounts.

## What it saves

Community names, observations, restriction messages, timestamps, detected usernames, manual notes, scan progress and the checker tab ID are stored in `chrome.storage.local`. This storage is local to the extension in this Chrome profile and is not synced by the extension. No private scan data is bundled with the extension.

CSV, HTML reports and JSON backups are written only when you choose an export. They can include usernames and restriction messages. Review exported reports before sharing them publicly.

## Network activity

The extension itself does not send scan results to a server. Opening Reddit pages makes normal requests to Reddit, which are subject to Reddit's own policies. Creator and GitHub links open only when clicked and are ordinary external websites with their own policies.

## Deletion and permissions

Use **More options → Clear list and results** to remove the saved list and observations. Downloaded reports remain on your computer until you delete them. Removing the extension removes its local storage according to Chrome's behavior.

- `storage`: save your queue and results locally
- `scripting`: run the read-only page inspector
- `https://www.reddit.com/*`: inspect the checker-owned Reddit tab

No `cookies`, `history`, `identity` or broad `<all_urls>` permission is requested.

For issues, open a GitHub issue without attaching unredacted personal reports: https://github.com/sunch0x/reddit-preflight/issues
