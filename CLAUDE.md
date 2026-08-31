# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm start` — run the dev server (Create React App / react-scripts) at http://localhost:3000
- `npm run build` — production build to `build/`
- `npm test` — run tests via react-scripts (Jest) in watch mode; `CI=true npm test` for a single non-watch run
- `npm test -- --coverage` — run with coverage; `CI=true npm test -- --coverage --watchAll=false` for a single non-watch run
- `npm test -- -t "<name>"` — run a single test by name

There is no lint script; ESLint runs through `react-scripts` using the `react-app` config in `package.json`.

## Architecture

This is a Create React App single-page site for a Sleeper.com fantasy football league ("Sierra League"). It has no backend of its own — all data comes from two external sources:

- **Sleeper API** (`api.sleeper.app`) — read-only, public, no auth: league users/rosters, NFL week/season state, winners/losers playoff brackets. Docs: https://docs.sleeper.com/
- **Firebase Realtime Database** — stores league-specific data the Sleeper API doesn't provide: weekly rankings (`rankings/{season}`) and predicted brackets (`brackets/{season}`). Config/keys are inline in `src/App.js` (not secret — this is a public Firebase RTDB project keyed by security rules, not by hiding the API key). Security rules are managed only in the Firebase console, not checked into this repo.

### League selection via `?league=` query param

Every route depends on a `league` query param (a Sleeper league ID) rather than a backend session. `src/index.js` defines a `sierraLoader` used on most routes: if `league` is missing from the URL, it redirects to the same path with `league=<sierraId>` appended (the hardcoded default league). `App.js` reads `league` from `location.search` into context on every navigation.

This site is intentionally single-league (Sierra League only) — the `?league=` param isn't meant to support arbitrary leagues as first-class citizens, it's just how the app threads the league ID through routes/loaders. Note: Sleeper technically creates a new league ID each season (leagues "renew" into a new league object year over year), so `sierraId` in `App.js` needs to be updated manually at the start of each season.

### Global state via `AppContext`

`App.js` is the router's root element (see `src/index.js`). It owns nearly all shared state (`teams`, `allRankings`, `scores`, `newestWeek`, `season`, `db`, `rankingsRef`, `league`, `sierraId`) fetched on mount/league-change and exposes it through `AppContext` (`src/contexts/AppContext.js`). Route components consume this via `useContext(AppContext)` instead of fetching independently — check `AppContext` before adding a new fetch in a route.

The bottom nav footer in `App.js` is conditionally rendered only when `league === sierraId`, so anonymous/other leagues get a chromeless view.

### Routes (`src/routes/`) map to CRA-router paths (`src/index.js`)

Most interesting: weekly rankings editing uses a sequence of decoy word paths (`angry`, `boring`, `cash`, `dance`, ... `oasis`) mapped 1:1 to `<EditRankings week={N}/>` for weeks 1–15. This is deliberate: each week the site owner shares that week's link privately with whichever league member had the lowest score, so only they can submit that week's rankings — the plain-word paths keep the URL from being guessable/discoverable by others. Read-only pages use normal names: `rankings`, `rankings/:week`, `trades`, `schedules`, `list` (tier list), `brackets`, `bracketresults`.

### Bracket scoring (`src/utils/bracketScoring.js`, used by `src/routes/BracketResults.js`; also `src/routes/Brackets.js`, `src/components/Bracket.js`)

Predicted brackets (stored per-user in Firebase under `brackets/{season}`) are scored against the real winners/losers brackets pulled live from Sleeper. `scoreBrackets` (`src/utils/bracketScoring.js`) walks each round of a user's prediction and compares it to the actual bracket, awarding points that scale by round (`2 ** (round - 1) * 10`) with separate handling for placement games (3rd/5th place, etc.) in both the winners and losers brackets. This logic is intentionally duplicated between winners/losers handling (see the `//TODO: abstract` comment in the code). It's recently-written and working but known to be rough — refactoring/cleanup here is welcome, not a sign something's broken.

### Rich text editing

`RichEditor.js` wraps `react-draft-wysiwyg`/`draft-js` for the trades/rankings editors; `draft-js-export-html` converts editor state to HTML for storage/display.

### Player data caching

`src/utils/utils.js` (`fetchPlayerInfo`) caches individual Sleeper player lookups in `localStorage` keyed by player ID to avoid repeat network calls, since player metadata rarely changes.

## Testing

Strategy: meaningful unit tests on real logic, not coverage-chasing. Route/component files (`src/routes/*.js`, `src/components/*.js`) are thin — they fetch from Sleeper/Firebase, hold state, and render. That glue is verified by running the app (`npm start`), not by unit tests; rendering it in Jest would mean mocking `fetch`, Firebase's `get`/`ref`, and react-router's `useLocation`/`Outlet` for low-severity, visually-obvious failure modes.

Instead, non-trivial calculations get pulled out of components into plain, side-effect-free functions in `src/utils/`, each with a same-named `.test.js`. This is the pattern to follow for new logic: if you're about to write a `.reduce`/nested-loop/branchy calculation inside a component or `useEffect`, consider extracting it to `src/utils/<name>.js` first so it's independently testable, matching these existing examples:

- `bracketScoring.js` — scores predicted brackets against real Sleeper brackets (extracted from `BracketResults.js`)
- `schedules.js` — what-if/strength-of-schedule record math, position sorting (extracted from `Schedules.js`)
- `trades.js` — trade-week attribution and traded-player point value (extracted from `Trades.js`)
- `teams.js`, `week.js` — team/roster merging and playoff-week clamping (extracted from `App.js`)
- `leagueHistory.js` — season grouping and `previous_league_id` chain-walking (extracted from `LeaguePicker.js`)
- `sierraLoader.js` — the `?league=` redirect computation (extracted from `index.js`)

`src/setupTests.js` wires in `@testing-library/jest-dom`; `@testing-library/react` is available for hook/component tests where warranted (see `src/hooks/useWaSelectChange.test.js`).
