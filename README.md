# Unofficial DC Deck-Building Game Tracker

A browser-based fan-made tracker for the **DC Deck-Building Game** by Cryptozoic Entertainment. Log game sessions, track player performance, and view stats — all stored locally in your browser with no server required.

> **Disclaimer:** This is an unofficial fan project with no affiliation to, endorsement by, or association with Cryptozoic Entertainment, DC Comics, or Warner Bros. Discovery. The *DC Deck-Building Game* is a product of Cryptozoic Entertainment; DC and all related characters, names, logos, and elements are trademarks of and © DC Comics / Warner Bros. Discovery. All trademarks are referenced for identification purposes only. This tool is free, non-commercial, and reproduces no official artwork, cards, or rules content.

## Features

- **Log Games** — Log sessions with base game, crossover/expansion, date, players, oversized cards, scores (VPs), and nemesis defeats
- **Additional Cards** — Track promo and other extra cards per game session; select from a saved library by type
- **Crisis Mode** — Full support for team-based Crisis crossovers, including team win/loss and shared nemesis count
- **Rivals Mode** — Flag base games as Rivals (2-player max); enforced on the Log Game screen
- **Session Comments** — Add optional notes to a logged game for memorable plays, house rules, or other context; comments appear collapsed in Game History
- **Game History** — Browse and filter past games by base game or crossover; sort by game #, date, base game, crossover, or type; edit or delete any entry; player rows keep names, oversized cards, scores, nemesis counts, and results aligned for readability
- **Player Stats** — Win rates, average score, nemesis stats, placements, most-used oversized cards, Rivals/Crisis breakdowns, and Chart.js bar charts; compare two players side by side
- **Overall Stats** — Aggregate game counts, most-played sets, sortable set/crossover tables, top oversized cards used, and game outcome breakdown
- **Settings** — Manage players, base games, crossovers, oversized cards, and additional cards (Promo/Other); set default player slots for new games
- **Archive & Restore** — Archive players, base games, crossovers, additional cards, and oversized cards instead of permanently deleting them; restore any archived item from the Settings archive sections; archived items are tagged in history and stats
- **Ban & Unban** — Ban oversized cards or additional cards to permanently block them from being selected in new games; banned cards are labelled in game history and stats; unbanning restores them to the active list
- **Archived Player Stats** — View archived players separately without returning them to the active roster
- **Validation & Safeguards** — Prevent duplicate players, duplicate oversized cards, duplicate additional cards, invalid scores, and leaving Settings with unsaved changes
- **Inline confirmations** — All destructive actions use inline Yes/No prompts; no browser popups
- **Data portability** — Export all data as JSON and re-import on any device
- **Dark/light theme** — Persisted per browser
- **No build step** — Plain HTML, CSS, and vanilla JavaScript; open `index.html` directly

## Supported Sets

Base games pre-loaded (with release year):

| Set | Year | Mode |
|-----|------|------|
| Original Core Set | 2012 | |
| Heroes Unite | 2014 | |
| Forever Evil | 2014 | |
| Rivals: Batman vs. The Joker | 2014 | Rivals |
| Teen Titans | 2015 | |
| Confrontations | 2017 | |
| Dark Nights: Metal | 2018 | |
| Rivals: Green Lantern vs. Sinestro | 2018 | Rivals |
| Injustice | 2023 | |
| Rivals: The Flash vs. Reverse-Flash | 2023 | Rivals |
| Justice League: Dark | 2024 | |
| Rivals: Shazam! vs. Black Adam | 2024 | Rivals |
| Teen Titans Go! | 2025 | |
| Arkham Asylum | 2025 | |
| Rivals: Superman vs. Lex Luthor | 2025 | Rivals |

Crossovers and expansions pre-loaded:

| Expansion | Year | Mode |
|-----------|------|------|
| Crossover Pack 1: Justice Society of America | 2015 | |
| Crossover Pack 2: Arrow | 2015 | |
| Crossover Pack 3: Legion of Super-Heroes | 2015 | |
| Crossover Pack 4: Watchmen | 2015 | |
| Crossover Pack 5: The Rogues | 2017 | |
| Crossover Pack 6: Birds of Prey | 2017 | |
| Crossover Pack 7: New Gods | 2018 | |
| Crossover Pack 8: Batman Ninja | 2019 | |
| Crossover Pack 9: DC Bombshells | 2023 | |
| Crossover Pack 10: Flashpoint | 2024 | |
| Crossover Pack 11: Dark Knights Rising | 2025 | |
| Crossover Pack 12: Hush | 2025 | |
| Crisis Expansion Pack 1 | 2014 | Crisis |
| Crisis Expansion Pack 2 | 2015 | Crisis |
| Crisis Expansion Pack 3 | 2016 | Crisis |
| Crisis Expansion Pack 4 | 2018 | Crisis |
| Crisis Expansion Pack 5: Dark Nights – Death Metal | 2025 | Crisis |
| Justice League Dark Expansion | 2024 | |
| Legion of Doom Expansion Pack | 2024 | |
| Crossover Crisis Pack 1 | 2024 | Crisis |
| Arkham Asylum Shadows Expansion | 2025 | |
| Super Friends Expansion Pack | 2025 | |
| Peacemaker Pack | 2025 | |
| Teen Titans Go! Expansion | 2025 | |

Rivals sets are limited to 2 players; Crisis expansions use the cooperative team rules. All defaults are seeded into existing saved data on load — anything you archive stays archived. Additional base games and crossovers can be added in Settings.

> **Compatibility:** Supports the standard competitive DC Deck-Building Game format. Solo play and the *Rebirth* DC Deck-Building Game are not yet supported.

## Getting Started

1. Clone or download this repository
2. Open `index.html` in any modern browser
3. Go to **Settings** and add your player names
4. Start logging games via **Log Game**
5. Add optional session comments when you want a note preserved with the game history

No installation or build step is required. The app itself is plain static files; Chart.js is loaded from a CDN for the stats charts, so charts require network access unless that script is cached by the browser.

## Project Structure

```
dc-deck-building-tracker/
├── index.html          # Single-page app shell and all page markup
├── img/
│   └── dc-logo.png     # Home page logo asset
├── css/
│   └── styles.css      # All styling, themes, and layout
└── js/
    ├── data.js         # localStorage persistence, import/export, migrations
    ├── ui.js           # Shared UI helpers (toast, theme, navigation)
    ├── game.js         # Log/edit game form logic
    ├── history.js      # Game history list and filtering
    ├── stats.js        # Player and overall stats with Chart.js
    ├── settings.js     # Settings page (players, sets, cards, bans)
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
| Archived | Players, base games, crossovers, additional cards, and oversized cards can all be archived and restored from a single combined section. Archived items are tagged in game history and stats. |
| Banned Cards | Oversized and additional cards banned for being potentially game-breaking. Banned cards cannot be selected in new games and are labelled in history/stats. At least 2 active oversized cards must remain. Unbanning restores a card to the active list. |
| Data | Export your full data as JSON for backup or transfer; re-import on any device. Reset wipes all data. |

## Game Logging Notes

- Games receive a stable game number when saved; history defaults to newest first.
- Normal and Rivals games calculate Win/Loss/Tie and player placement from scores.
- Crisis games store team result and team nemesis count instead of individual scores.
- Additional cards can be filtered by card type while logging.
- Oversized card dropdowns can be filtered by set and prevent choosing the same oversized card twice in one game.
- Editing a game removes the original entry temporarily; cancelling the edit restores it.
- Resetting the Log Game form clears current unsaved form fields and comments.

## Stats Notes

- Player stats split normal, Rivals, and Crisis results so cooperative games do not distort competitive win rates.
- Overall stats include normal base-game counts, Rivals set counts, crossover usage, Crisis win rates, and top oversized card usage.
- Archived and banned labels remain visible in history and stats so older entries stay understandable after Settings changes.

## Data Storage

All data is saved to `localStorage` under the key `dcData`. Theme preference is saved under `dcTheme`. Settings panel filter preferences are stored separately under `dcAdminCardFilter` and `dcAdminOversizedFilter`. All `localStorage` values are browser-specific — clearing site data in the browser will remove them. Use **Settings > Data > Export JSON** to back up your history or transfer it to another browser/device.
