# DC Deck-Building Game Tracker

A browser-based tracker for the **DC Deck-Building Game** by Cryptozoic Entertainment. Log game sessions, track player performance, and view stats — all stored locally in your browser with no server required.

## Features

- **Log Games** — Log sessions with base game, crossover/expansion, date, players, oversized cards, scores (VPs), and nemesis defeats
- **Additional Cards** — Track promo and other extra cards per game session; select from a saved library by type
- **Crisis Mode** — Full support for team-based Crisis crossovers, including team win/loss and shared nemesis count
- **Rivals Mode** — Flag base games as Rivals (2-player max); enforced on the Log Game screen
- **Game History** — Browse and filter past games by base game or crossover; sort by game #, date, base game, crossover, or type; edit or delete any entry
- **Player Stats** — Win rates, average score, nemesis stats, hero usage, and Chart.js bar charts; compare two players side by side
- **Overall Stats** — Aggregate game counts, most-played sets, top oversized cards used, and game outcome breakdown
- **Settings** — Manage players, base games, crossovers, oversized cards, and additional cards (Promo/Other); set default player slots for new games
- **Archive & Restore** — Archive players, base games, crossovers, additional cards, and oversized cards instead of permanently deleting them; restore any archived item from the Settings archive sections; archived items are tagged in history and stats
- **Inline confirmations** — All destructive actions use inline Yes/No prompts; no browser popups
- **Data portability** — Export all data as JSON and re-import on any device
- **Dark/light theme** — Persisted per browser
- **No build step** — Plain HTML, CSS, and vanilla JavaScript; open `index.html` directly

## Supported Sets

Base games pre-loaded (with release year):

| Set | Year |
|-----|------|
| Original Core Set | 2012 |
| Heroes Unite | 2014 |
| Forever Evil | 2014 |
| Teen Titans | 2015 |
| Injustice | 2023 |
| Justice League: Dark | 2024 |
| Teen Titans Go! | 2025 |
| Arkham Asylum | 2025 |

Additional base games and crossovers can be added in Settings.

> **Compatibility:** Supports the standard competitive DC Deck-Building Game format. Solo play and the *Rebirth* DC Deck-Building Game are not yet supported.

## Getting Started

1. Clone or download this repository
2. Open `index.html` in any modern browser
3. Go to **Settings** and add your player names
4. Start logging games via **Log Game**

No installation, dependencies, or internet connection required (Chart.js is loaded from a CDN for stats charts).

## Project Structure

```
dc-deck-building-tracker/
├── index.html          # Single-page app shell and all page markup
├── css/
│   └── styles.css      # All styling, themes, and layout
└── js/
    ├── data.js         # localStorage persistence, import/export, migrations
    ├── ui.js           # Shared UI helpers (toast, theme, navigation)
    ├── game.js         # Log/edit game form logic
    ├── history.js      # Game history list and filtering
    ├── stats.js        # Player and overall stats with Chart.js
    ├── admin.js        # Settings page (players, sets, cards)
    └── main.js         # App bootstrap and global render orchestration
```

## Settings Reference

| Section | Notes |
|---------|-------|
| Active Players | Min 2, max 5. Use arrows to reorder. Archive removes from active roster. |
| Default Players | Choose which players pre-fill slots 1 and 2 on the Log Game form. |
| Base Games | Add custom sets; check **Rivals** for 2-player-only sets. Original Core Set is always present. |
| Crossovers / Expansions | Add custom crossovers; check **Crisis** for cooperative crossovers. |
| Saved Additional Cards | Promo and other extra cards selectable during game logging. Filter persisted per browser. |
| Saved Oversized Cards | Hero/villain oversized cards selectable per player. Minimum of 2 required. Filter defaults to Original Core Set and is persisted per browser. |
| Archived sections | Players, base games, crossovers, additional cards, and oversized cards can all be archived and restored. Archived items are tagged in game history and stats. |
| Data | Export your full data as JSON for backup or transfer; re-import on any device. Reset wipes all data. |

## Data Storage

All data is saved to `localStorage` under the key `dcData`. Settings panel filter preferences are stored separately under `dcAdminCardFilter` and `dcAdminOversizedFilter`. All `localStorage` values are browser-specific — clearing site data in the browser will remove them. Use **Settings > Data > Export JSON** to back up your history or transfer it to another browser/device.
