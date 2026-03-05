# DC Deck-Building Game Tracker

A browser-based tracker for the **DC Deck-Building Game** by Cryptozoic Entertainment. Log game sessions, track player performance, and view stats — all stored locally in your browser with no server required.

## Features

- **Add Games** — Log sessions with base game, crossover/expansion, date, players, oversized cards, scores (VPs), and nemesis defeats
- **Crisis Mode** — Full support for team-based Crisis crossovers, including team win/loss and shared nemesis count
- **Rivals Mode** — Flag base games as Rivals (2-player max)
- **Game History** — Browse and filter past games by base game or crossover; edit or delete any entry
- **Player Stats** — Win rates, average score, nemesis stats, hero usage, and Chart.js bar charts; compare two players side by side
- **Overall Stats** — Aggregate game counts, most-played sets, and game outcome breakdown
- **Settings** — Manage players, base games, crossovers, oversized cards, and additional promo cards; archive/restore players
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
4. Start logging games via **Add Game**

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
    ├── game.js         # Add/edit game form logic
    ├── history.js      # Game history list and filtering
    ├── stats.js        # Player and overall stats with Chart.js
    ├── admin.js        # Settings page (players, sets, cards)
    └── main.js         # App bootstrap and global render orchestration
```

## Data Storage

All data is saved to `localStorage` under the key `dcData`. Use **Settings > Data > Export JSON** to back up your history or transfer it to another browser/device.
