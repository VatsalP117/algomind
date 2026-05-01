# Extension AGENTS.md

## Commands
```bash
npm run build        # Build extension into dist/
npm run typecheck    # Type-check extension source
```

## Structure
- `manifest.json` - Chrome MV3 manifest
- `popup.html` / `src/popup.ts` - popup UI
- `options.html` / `src/options.ts` - local configuration page
- `src/background.ts` - auth, API calls, save flow
- `src/content-script.ts` - LeetCode page detection

## Notes
- Keep permissions narrow; only request what the extension needs.
- Store long-lived tokens only in `chrome.storage.local`, never in the content script.
- The extension talks to Algomind through the dedicated extension auth and capture endpoints.
