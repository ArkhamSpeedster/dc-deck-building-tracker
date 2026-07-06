# DeckLedger

An unofficial companion and statistics tracker for the **DC Deck-Building Game**.

DeckLedger helps you log game nights, track player stats, compare performance, and remember which oversized and additional cards saw play. It is built as a simple responsive browser app with no account, no server, and no build step.

> **Important data note:** DeckLedger stores your data only in your browser's `localStorage`. Browser cleanup, private/incognito mode, clearing site data, switching browsers, using a different device, or future version changes can erase or affect saves. Export JSON backups regularly. Only import JSON files you trust; imported files overwrite local data and may contain unwanted or misleading data.

> **Disclaimer:** DeckLedger is an unofficial fan project with no affiliation to, endorsement by, or association with Cryptozoic Entertainment, DC Comics, or Warner Bros. Discovery. The *DC Deck-Building Game* is a product of Cryptozoic Entertainment; DC and all related characters, names, and elements are trademarks of and © DC Comics / Warner Bros. Discovery. All trademarks are referenced for identification purposes only. This tool is free, non-commercial, and reproduces no official artwork, cards, or rules content.

## Try The Demo Data

A demo dataset is included so you can quickly see History and Stats populated.

`sample-data/deckledger_demo_data.json`

It includes four players, ten logged games, an extra Promo card named Reverse Flash, archived/banned cards that appear in history, and enough variety to show off History and Stats views.

To try it:

1. Open `index.html` in a modern browser.
2. Go to `Settings`.
3. Open `Data`.
4. Click `Load Sample Data`.
5. Review `Game History` and `Game Stats`.

If your browser blocks loading the sample directly from a local file, use `Import JSON` and choose `sample-data/deckledger_demo_data.json`.

## What It Tracks

- Game sessions with base game, crossover/expansion, date, players, oversized cards, scores, nemesis defeats, and optional comments.
- Normal, Rivals, and Crisis games.
- Player win rates, average scores, placements, Crisis results, Rivals results, and most-used oversized cards.
- Overall set usage, crossover usage, top oversized cards, top additional cards, and outcome summaries.
- Saved additional cards with set and card type.
- Saved oversized cards by source set.
- Archived, banned, and removed labels in history and stats so old entries still make sense.
- JSON export/import for backups and device transfer.
- Built-in sample data loader for quick demos.
- Light/dark theme, defaulting to light mode.
- Responsive layouts for desktop, tablets, and small phone screens.

## Local Data And Backups

DeckLedger does not send your data anywhere. Everything is saved in your browser under `localStorage`.

That also means your data can be lost if the browser clears site data, if you use a private/incognito window, if you switch browsers, if you move to another device, or if future app changes alter the data format. Use `Settings > Data > Export JSON` to keep backups.

Exports include the app data, preferences, and a stats snapshot for readability. History is still the source of truth, and stats are recalculated when the app runs.

Treat exported JSON like personal app data. Do not import JSON files from people or places you do not trust.

## Default Cards

Default card types:

- Equipment
- Hero
- Location
- Starter
- Super Power
- Super-Hero
- Super-Villain
- Villain

Default additional cards:

- Gotham City Docks — Original Core Set (2012), Location

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

Batman and Superman from the Original Core Set are required defaults so a new game always has enough oversized cards to begin. Other default cards can be archived, banned, or removed by the user.

## Supported Sets

Base games are pre-loaded with release years and Rivals flags where applicable. You can archive, remove, or add your own sets in Settings.

Crossovers and Crisis expansions are also pre-loaded, including Crossover Packs, Crisis Expansion Packs, and Justice League Dark Expansion. You can archive, remove, or add your own expansions.

## Settings Overview

- Settings sections start collapsed to keep the page compact. Open only the section you want to edit.
- `Archive` hides an item from new games while keeping it restorable and labelled in history/stats.
- `Ban` blocks additional or oversized cards from new games while keeping them labelled in history/stats.
- `Remove` deletes an item from Settings after confirmation. Existing history stays unchanged and can show a removed label.
- Settings can store up to 25 active players.
- Logged games still use 2 to 5 players, with Rivals limited to exactly 2.
- Player comparison in Stats supports up to 5 players at a time for readability.
- Settings include compact controls for exporting/importing JSON, loading demo data, and resetting local data.

## Compatibility

DeckLedger supports the standard competitive DC Deck-Building Game format, Rivals, and Crisis mode. Solo play and the *Rebirth* DC Deck-Building Game are not currently supported.

## Project Structure

```text
dc-deck-building-tracker/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── data.js
│   ├── game.js
│   ├── history.js
│   ├── main.js
│   ├── settings.js
│   ├── stats.js
│   └── ui.js
└── sample-data/
    └── deckledger_demo_data.json
```

## Running Locally

No build step is required. Open `index.html` directly in a modern browser.

For the public site, upload the static files to your host for `DeckLedger.app`.
