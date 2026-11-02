# Verification

## Automated checks

Run `npm test` and `npm run check` from the repository root. The suite covers visible gate classification, missing communities, shadow-agnostic snapshots, account identity resolution, detected session changes, list validation, HTML escaping, CSV formula injection protection, navigation ownership, sequential scanning, delayed visible gates and pause behavior.

The scanner tests use simulated Chrome APIs. They do not make requests to Reddit or publish content.

The collector tests cover supported search URLs, virtualized batches, case-insensitive deduplication, preservation of existing observations, stable-bottom termination, challenges, manual Stop and user navigation. A browser UI fixture also exercises the full Collect & check button flow through a simulated Chrome adapter, verifying that collected names transition into checked results. This fixture does not establish live Reddit lazy-loading compatibility.

## Browser inspection used for the first release

The dashboard was rendered in an isolated headless Chrome profile at desktop width and at a 390 px viewport. A local Chrome API adapter supplied empty storage so the real UI module could add the public sample list. These views verify layout and local UI execution, not authenticated Reddit compatibility.

A separate local DOM fixture exercised the actual `collectSnapshot` function against an editable composer inside an open shadow root, an explicit account-menu profile link, an unrelated author link and a visible account-age dialog. The unrelated author was not used as the signed-in identity, and the dialog was classified as a restriction.

## Live acceptance checklist

These checks must be performed in an ordinary Chrome profile with the unpacked extension installed. Automated tests do not establish them for every Reddit account or layout.

1. Add a small list and start a scan while signed in to Reddit
2. Compare one result with the real form, including any eligibility message
3. Check a community requiring moderator approval
4. Confirm an account is only identified when the account menu exposes its username
5. Pause and resume; close and reopen the dashboard; confirm saved results survive
6. Export and inspect the HTML and CSV reports
7. Navigate the scanning tab elsewhere; confirm the extension leaves it alone
8. If the account changes, recheck all results instead of combining reports

Do not submit test content to prove eligibility. Hidden requirements and submission-time checks remain outside the tool's scope.

## Custom menus (0.2.3)
Local Chromium DOM fixture verified filter selection, source-tab selection, Escape returning focus, disabled-state synchronization and 390px layout without horizontal overflow. This fixture does not validate authenticated Reddit behavior.

## Layout cleanup (0.3.3)
Local Chromium verified the Manage list dialog opens and closes, no footer or hero divider remains, and 105 rendered rows grow the page rather than creating a vertical table scroll area. The 390px viewport has no horizontal page overflow. Existing select interaction checks still pass.

## Ambient world (0.4.0)
Browser fixture verifies the fixed emblem does not move during scroll or overlap the content rail, canvas is bounded to one third viewport resolution, and prefers-reduced-motion produces zero canvas draws during a subsequent observation window and no emblem CSS animation.

## Eclipse interaction (0.5.0)
Four state-machine tests cover a complete bounded cycle, repeat-click rejection, static reduced-motion toggles and reset. Local Chromium exercises a real pointer click and restoration, plus static reduced-motion behavior.

## Scan-reactive corona (0.5.1)
Two state tests verify scan intensity approaches active/inactive levels and reduced motion uses immediate static changes. Local Chromium starts the real scanner against simulated Chrome/Reddit responses, observes activity true then false, checks five completed results, and verifies the eclipse returns to idle scan intensity. This is local integration evidence, not live authenticated Reddit verification.

## Layered scenery (0.5.4)
Local browser instrumentation verified pointer-driven mountain translations remain under five CSS pixels and become zero at mobile width. Reduced-motion static drawing and existing eclipse/menu/scroll checks still pass.

## Functional recheck (0.5.5)
40 unit tests pass after removing cloud-overlay timing. Local Chromium rechecked actual scanner activity transitions, the collect-to-scan sequence with two simulated search results, menu selection, keyboard dismissal, list dialog, 105-row expansion, SVG alignment at 100%/150%, 390px layout, fixed emblem placement, and static reduced-motion interaction. These are local fixtures; live authenticated Reddit is not verified.
