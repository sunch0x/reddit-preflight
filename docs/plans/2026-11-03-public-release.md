# Reddit Preflight public release

Goal: a small English Chrome extension for inspecting visible submission-form restrictions using the current browser session. Independent from the Unison application.

Approved UI: Unison's dark neutral palette, blue accent, pill controls and subtle hover/press motion. Creator attribution links to https://linkdeck.co/sunch0x. Product attribution links to https://unison.ink.

Tasks:
1. Test the classifier, account identity, session changes, delayed blocking signals, navigation identity and export safety. Treat open forms as observations, never permission to post.
2. Translate UI and exports, start with an empty community list, accept pasted names/URLs or plain-text files. No personal results, private source datasets or user-specific skip list.
3. Identify account only from explicit account-menu metadata in the rendered DOM. Do not infer identity from arbitrary user links or read cookies/tokens. Unknown identity remains unknown. Pause if a known account changes.
4. Keep one owned Reddit tab, no extra pacing delay, pause/resume, retry unknown results, local backup, exports and delete controls. Pause on login, rate limiting and browser challenges.
5. Add README, installation, limitations, privacy statement, MIT source license, icons, screenshot, CI and distributable ZIP. Test with simulated DOM and Chrome APIs; clearly distinguish these from authenticated Reddit acceptance.
6. Inspect tracked files and packaged artifacts, then publish a separate GitHub repository under the authorized account. Do not change or publish the Unison application.
