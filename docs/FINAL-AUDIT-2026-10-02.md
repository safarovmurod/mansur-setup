# Final setup audit — 2026-10-02

Current publication target: main. Historical AUDIT and AI-RULES-AUDIT files describe earlier work before the explicitly requested history consolidation.

## Fixes
- Restored the empty ChatGPT Custom Instructions copy file from its last committed working content. Added a check for required preferences and the 1500-character field limit. Saving this file does not apply it in ChatGPT.
- Replaced the blocking browser smoke test with asynchronous CLI calls and bounded command timeouts. Used agent-browser's actual pixel comparison instead of comparing compressed PNG scanline bytes. Confirmed matching renders, changed background, and button interaction. Only the test's own browser session is closed.
- Added npm run test:browser as a separate runtime check; it requires the installed agent-browser and Chrome.
- Updated active installation commands to default/main so they do not reference the removed working branch.

## Current verification
- npm test: 14 passed, 0 failed, 0 skipped. Covers installer preview/repeat/restore, invalid JSON protection, future asset discovery, Git practice guards, panel handlers, secrets audit, and persistent agent rules.
- npm run test:browser: 1 passed, 0 failed, 0 skipped. Real local HTTP pages in an isolated Chrome session, screenshot dimensions 800x600, identical-page diff 0%, changed background diff over 50%, click changes button from 0 to 1.
- Doctor: 52 passed, 0 warnings, 0 failures on a separate completed run. An earlier concurrent run returned an unavailable extension listing; direct CLI and the subsequent Doctor run confirmed all 22 registered IDs. Their installation was not repeated.
- SHA-256 comparison: 983 source/global skill, agent and GSD runtime files match. All source settings keys match the active profile. Existing MCP configuration hashes remain unchanged.
- Syntax: 18 owned JavaScript runtime/test files passed node --check.
- Live read-only MCP checks: GitHub initialize/list 45 tools and get_me response; GSD initialize/list 3 tools; sequential-thinking initialize/list 1 tool. No credentials or account identity were exported.
- npm pack: extracted package preview/install/repeat passed in a temporary profile with spaces; 77 skill bundles, 64 agent files, Codex/Antigravity AI-rules install/repeat passed. Isolated tests do not install extensions into the real profile.

## History and scope
The user explicitly requested a single main branch and one root commit named Mancho setting antigraviti. A verified complete Git bundle and all working source files were backed up outside the repository before the rewrite. This replaces published branch history; it does not guarantee removal of old cached commit or pull-request references from GitHub. No other project is included.

## Verification limits
Native Antigravity UI, new Gemini chat consumption, logged-in ChatGPT Personalization, Tailwind popup and format-on-save UI were not newly tested. Configuration checks and file existence do not prove those UI behaviors. Personal tokens/accounts remain local and require each installing user's own authorization. No claim of 100% runtime coverage or testing on every Windows PC is made.
