# Musical Borrowing and Reworking

Front end for *Musical Borrowing and Reworking: An Annotated Bibliography*, a
Svelte 5 + Vite single-page app. The bibliography ships with the app as
`src/lib/data.json` and is topped up at runtime with anything newer from the
PocketBase server configured in `src/lib/pb.js`.

## Development

```sh
npm ci
npm run dev      # local dev server
npm test         # unit tests (vitest)
npm run build    # production build into dist/
```

Pushes to `main` are tested, built and deployed by `.github/workflows/deploy.yml`.
Other branches and pull requests run the tests and build via `test.yml`.

## Layout

| Path | What it is |
|---|---|
| `src/App.svelte` | Shell, navigation and routing (`elegua`) |
| `src/lib/BibDisplay.svelte` | Browse, search, index pages and record pages |
| `src/lib/AdminView.svelte` | Editor login, record editing and the suggestions queue (`/admin`) |
| `src/Suggest.svelte` | Public "suggest an item" form (`/suggest`) |
| `src/lib/search.js` | Search matching, date extraction and works/sources index helpers |
| `src/lib/citation.js` | Citation parsing and RIS / BibTeX / Highwire meta export |
| `src/lib/related.js` | "Related records" by shared works, sources and composers |
| `src/lib/data.json` | Bundled snapshot of the bibliography |
| `src/lib/data_meta.js` | Timestamp of that snapshot; newer server records are fetched on load |
| `boolean.pegjs` | Advanced search grammar; run `npm run grammar` after editing to regenerate `src/lib/boolean.js` |
| `pocketbase/` | Server schema migrations (see its README) |
| `tests/` | Unit tests, including checks that run over the full bundled data |

## Releasing

Bump `version` in `package.json`; the footer shows it with the build date.

## Refreshing the bundled data

Replace `src/lib/data.json` with a fresh export of the `borrowing` collection and
set `localDataLastUpdated` in `src/lib/data_meta.js` to the export time, so
visitors only download records changed after it. `npm test` checks the whole
file parses and exports cleanly.
