# DeckLedger

An unofficial companion and statistics tracker for the **DC Deck-Building Game** created by Cryptozoic Entertainment.

DeckLedger is currently in beta. It helps you log game nights, track player stats, compare performance, and remember which oversized and additional cards saw play. It is built as a simple responsive browser app with no account, no server, and no build step.

> **Important data note:** DeckLedger stores your data only in your browser's `localStorage`. Browser cleanup, private/incognito mode, clearing site data, switching browsers, using a different device, or future version changes can erase or affect saves. Export JSON backups regularly. Only import JSON files you trust; imported files overwrite local data and may contain unwanted or misleading data.

> **Disclaimer:** DeckLedger is an unofficial fan project with no affiliation to, endorsement by, or association with Cryptozoic Entertainment, DC Comics, or Warner Bros. Discovery. The *DC Deck-Building Game* is a product of Cryptozoic Entertainment; DC and all related characters, names, and elements are trademarks of and © DC Comics / Warner Bros. Discovery. All trademarks are referenced for identification purposes only. This tool is free, non-commercial, and reproduces no official artwork, cards, or rules content.

## Try The Demo Data

A demo dataset is included so you can quickly see History and Stats populated.

`sample-data/deckledger_demo_data.json`

It includes four players, fourteen logged games, an extra Promo card named Reverse Flash, archived/banned cards that appear in history, a true tie example, three Multiverse examples including World Hopper, and enough variety to show off History and Stats views.

To try it:

1. Open `index.html` in a modern browser.
2. Go to `Settings`.
3. Open `Data Management`.
4. Click `Load Sample Data`.
5. Review `Game History` and `Game Stats`.

The sample data is also bundled in the app so `Load Sample Data` works when opening `index.html` directly.

## What It Tracks

- Game sessions with base game, crossover/expansion, date, players, oversized cards, scores, nemesis defeats, and optional comments.
- Normal, Rivals, Crisis, and Multiverse variant games.
- Rivals-specific character assignment and win/loss results.
- Multiverse-specific character, Location, 3 Champion oversized cards, base sets, Event sets, style, and ending condition tracking.
- Player win rates, average scores, placements, Crisis results, Rivals results, Multiverse results, and most-used oversized cards.
- Overall set usage, crossover usage, top oversized cards, top additional cards, Multiverse Locations/Champions, and outcome summaries.
- Saved additional cards with set and card type.
- Saved oversized cards by source set.
- Multiverse Locations are managed in the Additional Cards settings list with card type `Multiverse Location`, but they are only selectable in Multiverse games and are shown as player setup details in History/Stats. Champions use the Oversized Cards list.
- Archived, banned, and removed labels in history and stats so old entries still make sense.
- JSON export/import for backups and device transfer.
- Import preview before overwriting local data.
- App/export format version details in Data Management.
- Backup reminders after every 5 logged games.
- Built-in sample data loader for quick demos.
- No external app dependencies at runtime; Chart.js is bundled locally.
- Light/dark theme, defaulting to light mode.
- Responsive layouts for desktop, tablets, and small phone screens.

## Third-Party Library

DeckLedger bundles Chart.js locally for charts. Chart.js is released under the MIT License; its notice is included in `vendor/chartjs.LICENSE.txt`.

## License And Changelog

DeckLedger's original app code is shared for free personal, non-commercial use. See `LICENSE`.

See `CHANGELOG.md` for release notes.

## Local Data And Backups

DeckLedger does not send your data anywhere. Everything is saved in your browser under `localStorage`.

That also means your data can be lost if the browser clears site data, if you use a private/incognito window, if you switch browsers, if you move to another device, or if future app changes alter the data format. Use `Settings > Data Management > Export JSON` to keep backups.

Exports include the app data, preferences, and a stats snapshot for readability. History is still the source of truth, and stats are recalculated when the app runs.

Treat exported JSON like personal app data. Do not import JSON files from people or places you do not trust.

## Default Cards

Default card types:

- Equipment
- Hero
- Location
- Multiverse Location
- Starter
- Super Power
- Super-Hero
- Super-Villain
- Villain

Default additional cards:

- Gotham City Docks — Original Core Set (2012), Location
- 30th Century Metropolis — Multiverse, Multiverse Location
- Earth-2 — Multiverse, Multiverse Location
- Fawcett City — Multiverse, Multiverse Location
- Flashpoint Gotham City — Multiverse, Multiverse Location
- Gotham City — Multiverse, Multiverse Location
- Hub City — Multiverse, Multiverse Location
- Metropolis — Multiverse, Multiverse Location

Default oversized cards:

- Batman — Original Core Set (2012)
- Superman — Original Core Set (2012)
- Wonder Woman — Original Core Set (2012)
- The Flash — Original Core Set (2012)
- Aquaman — Original Core Set (2012)
- Cyborg — Original Core Set (2012)
- Green Lantern — Original Core Set (2012)
- Martian Manhunter — Promo
- The Joker — Promo

Default additional and oversized cards are maintained by DeckLedger. They can be archived or banned, but they cannot be edited or permanently removed. User-added cards can be edited, archived, banned, or removed.

## Supported Sets

Base games are pre-loaded with release years and Rivals flags where applicable. These are maintained by DeckLedger updates instead of being editable in Settings, which keeps game logging from breaking.

Crossovers and Crisis expansions are also pre-loaded, including Crossover Packs, Crisis Expansion Packs, and Justice League Dark Expansion. These are maintained by DeckLedger updates as well.

Rivals games are numbered for cleaner sorting, such as `Rivals 1: Batman vs Joker`. They use a shared Rivals character pool, so you can mix playable characters across Rivals sets, such as Batman vs. Lex Luthor or The Flash vs. Sinestro.

## Settings Overview

- Settings sections start collapsed to keep the page compact. Open only the section you want to edit.
- `Archive` hides an item from new games while keeping it restorable and labelled in history/stats.
- `Ban` blocks additional or oversized cards from new games while keeping them labelled in history/stats.
- `Remove` deletes an item from Settings after confirmation. Existing history stays unchanged and can show a removed label.
- Settings can store up to 25 active players.
- Logged games use 2 to 5 players, Rivals uses exactly 2, Standard Multiverse supports 2 to 5 players with at least one base set selected, and World Hopper supports 2 to 6 players with at least two actual base sets selected. Multiverse VP endings require real scoring data and allow at most one player to finish on 0 VP.
- Card lists and logged game history do not have app-imposed count limits, though browser storage still has practical limits.
- Player comparison in Stats supports up to 5 players at a time for readability.
- Settings include compact controls for exporting/importing JSON, loading demo data, and resetting local data.

## Compatibility

DeckLedger supports the standard competitive DC Deck-Building Game format, Rivals, Crisis mode, and a Multiverse variant tracker. Multiverse and Multiverse (World Hopper) are selected from the Base Game dropdown. Multiverse logging records each player's character, Multiverse Location, 3 Champion oversized cards, base sets, Event sets, style, ending condition, and VP only when the ending calls for VP scoring. Standard Multiverse requires one base set; World Hopper requires at least two actual base sets. Base-game variant rules are not specifically modeled yet, though you can note house rules or variants in game comments. Solo play and the *Rebirth* DC Deck-Building Game are not currently supported.

## Project Structure

```text
dc-deck-building-tracker/
├── CHANGELOG.md
├── LICENSE
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── data.js
│   ├── game.js
│   ├── history.js
│   ├── main.js
│   ├── sample-data.js
│   ├── settings.js
│   ├── stats.js
│   └── ui.js
├── vendor/
│   ├── chart.umd.min.js
│   └── chartjs.LICENSE.txt
└── sample-data/
    └── deckledger_demo_data.json
```

## Running Locally

No build step is required. Open `index.html` directly in a modern browser.

For the public site, upload the static files to your host for `DeckLedger.app`.
