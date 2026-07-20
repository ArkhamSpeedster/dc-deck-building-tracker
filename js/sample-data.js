/*
 * sample-data.js — bundled demo data fallback for local file usage
 */
const DECKLEDGER_SAMPLE_DATA = {
  "app": "dc-deck-building-tracker",
  "version": 2,
  "exportedAt": "2026-07-20T12:00:00.000Z",
  "data": {
    "players": [
      "Jack",
      "Jill",
      "Harry",
      "Sally"
    ],
    "games": [
      {
        "name": "Original Core Set (2012)",
        "isRivals": false
      },
      {
        "name": "Heroes Unite (2014)",
        "isRivals": false
      },
      {
        "name": "Forever Evil (2014)",
        "isRivals": false
      },
      {
        "name": "Rivals 1: Batman vs Joker (2014)",
        "isRivals": true
      },
      {
        "name": "Teen Titans (2015)",
        "isRivals": false
      },
      {
        "name": "Confrontations (2017)",
        "isRivals": false
      },
      {
        "name": "Dark Nights: Metal (2018)",
        "isRivals": false
      },
      {
        "name": "Rivals 2: Green Lantern vs Sinestro (2018)",
        "isRivals": true
      },
      {
        "name": "Injustice (2023)",
        "isRivals": false
      },
      {
        "name": "Rivals 3: The Flash vs Reverse Flash (2023)",
        "isRivals": true
      },
      {
        "name": "Justice League: Dark (2024)",
        "isRivals": false
      },
      {
        "name": "Rivals 4: Shazam vs Black Adam (2024)",
        "isRivals": true
      },
      {
        "name": "Teen Titans Go! (2025)",
        "isRivals": false
      },
      {
        "name": "Arkham Asylum (2025)",
        "isRivals": false
      },
      {
        "name": "Rivals 5: Superman vs Lex Luthor (2025)",
        "isRivals": true
      }
    ],
    "crossovers": [
      {
        "name": "None",
        "isCrisis": false
      },
      {
        "name": "Crossover Pack 1: Justice Society of America (2015)",
        "isCrisis": false
      },
      {
        "name": "Crossover Pack 5: The Rogues (2017)",
        "isCrisis": false
      },
      {
        "name": "Crossover Pack 10: Flashpoint (2024)",
        "isCrisis": false
      },
      {
        "name": "Crisis Expansion Pack 1 (2014)",
        "isCrisis": true
      },
      {
        "name": "Crisis Expansion Pack 2 (2015)",
        "isCrisis": true
      },
      {
        "name": "Justice League Dark Expansion (2024)",
        "isCrisis": false
      }
    ],
    "knownCards": [
      {
        "name": "Reverse Flash",
        "set": "Other",
        "cardType": "Super-Villain",
        "tags": [
          "Promo"
        ]
      }
    ],
    "knownOversized": [
      {
        "name": "Batman",
        "fromSet": "Original Core Set (2012)"
      },
      {
        "name": "Superman",
        "fromSet": "Original Core Set (2012)"
      },
      {
        "name": "Aquaman",
        "fromSet": "Original Core Set (2012)"
      },
      {
        "name": "Cyborg",
        "fromSet": "Original Core Set (2012)"
      },
      {
        "name": "Green Lantern",
        "fromSet": "Original Core Set (2012)"
      },
      {
        "name": "The Flash",
        "fromSet": "Original Core Set (2012)"
      },
      {
        "name": "Shazam",
        "fromSet": "Heroes Unite (2014)"
      },
      {
        "name": "Batgirl",
        "fromSet": "Heroes Unite (2014)"
      },
      {
        "name": "Nightwing",
        "fromSet": "Heroes Unite (2014)"
      },
      {
        "name": "Black Canary",
        "fromSet": "Heroes Unite (2014)"
      },
      {
        "name": "Raven",
        "fromSet": "Teen Titans (2015)"
      },
      {
        "name": "Starfire",
        "fromSet": "Teen Titans (2015)"
      },
      {
        "name": "John Constantine",
        "fromSet": "Justice League: Dark (2024)"
      },
      {
        "name": "Zatanna",
        "fromSet": "Justice League: Dark (2024)"
      },
      {
        "name": "Catwoman",
        "fromSet": "Arkham Asylum (2025)",
        "tags": [
          "Promo"
        ]
      },
      {
        "name": "Doctor Fate, Lord of Order",
        "fromSet": "Justice League: Dark (2024)",
        "tags": [
          "Promo"
        ]
      },
      {
        "name": "Martian Manhunter",
        "fromSet": "Other",
        "tags": [
          "Promo"
        ]
      },
      {
        "name": "The Joker",
        "fromSet": "Other",
        "tags": [
          "Promo"
        ]
      }
    ],
    "cardTypes": [
      "Equipment",
      "Hero",
      "Location",
      "Multiverse Location",
      "Starter",
      "Super Power",
      "Super-Hero",
      "Super-Villain",
      "Villain"
    ],
    "archivedPlayers": [],
    "archivedGames": [],
    "archivedCrossovers": [],
    "archivedCards": [],
    "archivedOversized": [
      {
        "name": "Wonder Woman",
        "fromSet": "Original Core Set (2012)"
      },
      {
        "name": "Doctor Fate, Lord of Order",
        "fromSet": "Justice League: Dark (2024)",
        "tags": [
          "Promo"
        ]
      }
    ],
    "bannedCards": [],
    "bannedOversized": [
      {
        "name": "The Joker",
        "fromSet": "Other",
        "tags": [
          "Promo"
        ]
      }
    ],
    "removedCards": [],
    "removedOversized": [],
    "removedPlayers": [],
    "history": [
      {
        "gameNum": 1,
        "game": "Original Core Set (2012)",
        "cross": "None",
        "isCrisis": false,
        "isRivals": false,
        "players": [
          {
            "name": "Jack",
            "oversizedCard": "Batman",
            "oversizedFrom": "Original Core Set (2012)",
            "score": 42,
            "nemesis": 3,
            "result": "Win",
            "place": 1
          },
          {
            "name": "Jill",
            "oversizedCard": "Shazam",
            "oversizedFrom": "Heroes Unite (2014)",
            "score": 38,
            "nemesis": 2,
            "result": "Loss",
            "place": 2
          },
          {
            "name": "Harry",
            "oversizedCard": "Aquaman",
            "oversizedFrom": "Original Core Set (2012)",
            "score": 31,
            "nemesis": 1,
            "result": "Loss",
            "place": 3
          },
          {
            "name": "Sally",
            "oversizedCard": "The Joker",
            "oversizedFrom": "Other",
            "score": 29,
            "nemesis": 1,
            "result": "Loss",
            "place": 4
          }
        ],
        "additional": [
          {
            "name": "Gotham City Docks",
            "set": "Other",
            "cardType": "Location",
            "tags": [
              "Promo"
            ]
          }
        ],
        "date": "2026-01-04",
        "dateSort": 20260104,
        "comment": "Opening demo game mostly using Original Core Set, with a Heroes Unite oversized card and tagged promo additional card."
      },
      {
        "gameNum": 2,
        "game": "Original Core Set (2012)",
        "cross": "Crossover Pack 1: Justice Society of America (2015)",
        "isCrisis": false,
        "isRivals": false,
        "players": [
          {
            "name": "Jack",
            "oversizedCard": "Superman",
            "oversizedFrom": "Original Core Set (2012)",
            "score": 36,
            "nemesis": 2,
            "result": "Loss",
            "place": 3
          },
          {
            "name": "Jill",
            "oversizedCard": "Batgirl",
            "oversizedFrom": "Heroes Unite (2014)",
            "score": 44,
            "nemesis": 3,
            "result": "Win",
            "place": 1
          },
          {
            "name": "Harry",
            "oversizedCard": "Green Lantern",
            "oversizedFrom": "Original Core Set (2012)",
            "score": 39,
            "nemesis": 2,
            "result": "Loss",
            "place": 2
          }
        ],
        "additional": [
          {
            "name": "Reverse Flash",
            "set": "Other",
            "cardType": "Super-Villain",
            "tags": [
              "Promo"
            ]
          }
        ],
        "date": "2026-01-11",
        "dateSort": 20260111
      },
      {
        "gameNum": 3,
        "game": "Multiverse",
        "cross": "None",
        "isCrisis": false,
        "isRivals": false,
        "isMultiverse": true,
        "multiverseWinCondition": "lastPlayerStanding",
        "multiverseEventSets": [
          "Heroes Unite (2014)",
          "Forever Evil (2014)"
        ],
        "players": [
          {
            "name": "Jack",
            "oversizedCard": "Batman",
            "oversizedFrom": "Original Core Set (2012)",
            "score": 0,
            "nemesis": 0,
            "result": "Win",
            "place": 1,
            "multiverseLocation": "Metropolis",
            "multiverseLocationSet": "Multiverse",
            "multiverseLocationCardType": "Multiverse Location",
            "multiverseChampions": [
              {
                "name": "Shazam",
                "fromSet": "Heroes Unite (2014)"
              },
              {
                "name": "Raven",
                "fromSet": "Teen Titans (2015)"
              },
              {
                "name": "Zatanna",
                "fromSet": "Justice League: Dark (2024)"
              }
            ],
            "championsRemaining": 1
          },
          {
            "name": "Jill",
            "oversizedCard": "Shazam",
            "oversizedFrom": "Heroes Unite (2014)",
            "score": 0,
            "nemesis": 0,
            "result": "Loss",
            "place": 2,
            "multiverseLocation": "Fawcett City",
            "multiverseLocationSet": "Multiverse",
            "multiverseLocationCardType": "Multiverse Location",
            "multiverseChampions": [
              {
                "name": "Superman",
                "fromSet": "Original Core Set (2012)"
              },
              {
                "name": "Nightwing",
                "fromSet": "Heroes Unite (2014)"
              },
              {
                "name": "Catwoman",
                "fromSet": "Arkham Asylum (2025)",
                "tags": [
                  "Promo"
                ]
              }
            ],
            "championsRemaining": 0
          },
          {
            "name": "Harry",
            "oversizedCard": "Aquaman",
            "oversizedFrom": "Original Core Set (2012)",
            "score": 0,
            "nemesis": 0,
            "result": "Loss",
            "place": 3,
            "multiverseLocation": "Hub City",
            "multiverseLocationSet": "Multiverse",
            "multiverseLocationCardType": "Multiverse Location",
            "multiverseChampions": [
              {
                "name": "Green Lantern",
                "fromSet": "Original Core Set (2012)"
              },
              {
                "name": "Black Canary",
                "fromSet": "Heroes Unite (2014)"
              },
              {
                "name": "Doctor Fate, Lord of Order",
                "fromSet": "Justice League: Dark (2024)",
                "tags": [
                  "Promo"
                ]
              }
            ],
            "championsRemaining": 0
          },
          {
            "name": "Sally",
            "oversizedCard": "Martian Manhunter",
            "oversizedFrom": "Other",
            "score": 0,
            "nemesis": 0,
            "result": "Loss",
            "place": 4,
            "multiverseLocation": "Earth-2",
            "multiverseLocationSet": "Multiverse",
            "multiverseLocationCardType": "Multiverse Location",
            "multiverseChampions": [
              {
                "name": "The Flash",
                "fromSet": "Original Core Set (2012)"
              },
              {
                "name": "Starfire",
                "fromSet": "Teen Titans (2015)"
              },
              {
                "name": "John Constantine",
                "fromSet": "Justice League: Dark (2024)"
              }
            ],
            "championsRemaining": 0
          }
        ],
        "additional": [],
        "date": "2026-01-15",
        "dateSort": 20260115,
        "comment": "Multiverse demo ending by last player standing, using mostly Original Core with newer Champions mixed in.",
        "multiverseStyle": "standard",
        "multiverseBaseSets": [
          "Original Core Set (2012)"
        ]
      },
      {
        "gameNum": 4,
        "game": "Original Core Set (2012)",
        "cross": "None",
        "isCrisis": false,
        "isRivals": false,
        "players": [
          {
            "name": "Jack",
            "oversizedCard": "Batman",
            "oversizedFrom": "Original Core Set (2012)",
            "score": 40,
            "nemesis": 2,
            "result": "Loss",
            "place": 2
          },
          {
            "name": "Jill",
            "oversizedCard": "Catwoman",
            "oversizedFrom": "Arkham Asylum (2025)",
            "score": 40,
            "nemesis": 2,
            "result": "Win",
            "place": 1
          },
          {
            "name": "Harry",
            "oversizedCard": "The Flash",
            "oversizedFrom": "Original Core Set (2012)",
            "score": 36,
            "nemesis": 2,
            "result": "Loss",
            "place": 3
          },
          {
            "name": "Sally",
            "oversizedCard": "Zatanna",
            "oversizedFrom": "Justice League: Dark (2024)",
            "score": 34,
            "nemesis": 1,
            "result": "Loss",
            "place": 4
          }
        ],
        "additional": [],
        "date": "2026-01-18",
        "dateSort": 20260118,
        "isMultiverse": false,
        "comment": "Demo Official tie-breaker: equal VP and equal Nemesis defeated, with newer oversized cards mixed into the table. Most recent Super-Villain defeated by Jill.",
        "standardTieBreakerWinner": "Jill"
      },
      {
        "gameNum": 5,
        "game": "Teen Titans (2015)",
        "cross": "None",
        "isCrisis": false,
        "isRivals": false,
        "players": [
          {
            "name": "Jack",
            "oversizedCard": "Raven",
            "oversizedFrom": "Teen Titans (2015)",
            "score": 35,
            "nemesis": 2,
            "result": "Loss",
            "place": 2
          },
          {
            "name": "Jill",
            "oversizedCard": "Starfire",
            "oversizedFrom": "Teen Titans (2015)",
            "score": 45,
            "nemesis": 3,
            "result": "Win",
            "place": 1
          }
        ],
        "additional": [],
        "date": "2026-01-25",
        "dateSort": 20260125,
        "isMultiverse": false
      },
      {
        "gameNum": 6,
        "game": "Original Core Set (2012)",
        "cross": "Crisis Expansion Pack 1 (2014)",
        "isCrisis": true,
        "isRivals": false,
        "teamWon": true,
        "teamNemesis": 7,
        "players": [
          {
            "name": "Jack",
            "oversizedCard": "Batman",
            "oversizedFrom": "Original Core Set (2012)",
            "score": 33,
            "nemesis": 1,
            "result": "Loss",
            "place": 3
          },
          {
            "name": "Jill",
            "oversizedCard": "Aquaman",
            "oversizedFrom": "Original Core Set (2012)",
            "score": 39,
            "nemesis": 2,
            "result": "Win",
            "place": 1
          },
          {
            "name": "Harry",
            "oversizedCard": "John Constantine",
            "oversizedFrom": "Justice League: Dark (2024)",
            "score": 37,
            "nemesis": 2,
            "result": "Loss",
            "place": 2
          }
        ],
        "additional": [
          {
            "name": "Reverse Flash",
            "set": "Other",
            "cardType": "Super-Villain",
            "tags": [
              "Promo"
            ]
          }
        ],
        "date": "2026-02-01",
        "dateSort": 20260201,
        "comment": "Crisis win with the full table."
      },
      {
        "gameNum": 7,
        "game": "Teen Titans (2015)",
        "cross": "Crossover Pack 5: The Rogues (2017)",
        "isCrisis": false,
        "isRivals": false,
        "players": [
          {
            "name": "Jack",
            "oversizedCard": "Aquaman",
            "oversizedFrom": "Original Core Set (2012)",
            "score": 33,
            "nemesis": 1,
            "result": "Loss",
            "place": 3
          },
          {
            "name": "Jill",
            "oversizedCard": "Martian Manhunter",
            "oversizedFrom": "Promo",
            "score": 45,
            "nemesis": 3,
            "result": "Win",
            "place": 1
          },
          {
            "name": "Sally",
            "oversizedCard": "Superman",
            "oversizedFrom": "Original Core Set (2012)",
            "score": 43,
            "nemesis": 3,
            "result": "Loss",
            "place": 2
          }
        ],
        "additional": [],
        "date": "2026-02-08",
        "dateSort": 20260208
      },
      {
        "gameNum": 8,
        "game": "Multiverse",
        "cross": "None",
        "isCrisis": false,
        "isRivals": false,
        "isMultiverse": true,
        "multiverseWinCondition": "deimos",
        "multiverseEventSets": [
          "Dark Nights: Metal (2018)",
          "Crossover Pack 10: Flashpoint (2024)"
        ],
        "players": [
          {
            "name": "Jack",
            "oversizedCard": "Superman",
            "oversizedFrom": "Original Core Set (2012)",
            "score": 40,
            "nemesis": 0,
            "result": "Loss",
            "place": 2,
            "multiverseLocation": "30th Century Metropolis",
            "multiverseLocationSet": "Multiverse",
            "multiverseLocationCardType": "Multiverse Location",
            "multiverseChampions": [
              {
                "name": "Aquaman",
                "fromSet": "Original Core Set (2012)"
              },
              {
                "name": "Black Canary",
                "fromSet": "Heroes Unite (2014)"
              },
              {
                "name": "Doctor Fate, Lord of Order",
                "fromSet": "Justice League: Dark (2024)",
                "tags": [
                  "Promo"
                ]
              }
            ],
            "championsRemaining": 1
          },
          {
            "name": "Jill",
            "oversizedCard": "Green Lantern",
            "oversizedFrom": "Original Core Set (2012)",
            "score": 46,
            "nemesis": 0,
            "result": "Win",
            "place": 1,
            "multiverseLocation": "Flashpoint Gotham City",
            "multiverseLocationSet": "Multiverse",
            "multiverseLocationCardType": "Multiverse Location",
            "multiverseChampions": [
              {
                "name": "Batman",
                "fromSet": "Original Core Set (2012)"
              },
              {
                "name": "Batgirl",
                "fromSet": "Heroes Unite (2014)"
              },
              {
                "name": "Raven",
                "fromSet": "Teen Titans (2015)"
              }
            ],
            "championsRemaining": 2
          },
          {
            "name": "Harry",
            "oversizedCard": "Doctor Fate, Lord of Order",
            "oversizedFrom": "Justice League: Dark (2024)",
            "score": 30,
            "nemesis": 0,
            "result": "Loss",
            "place": 4,
            "multiverseLocation": "Gotham City",
            "multiverseLocationSet": "Multiverse",
            "multiverseLocationCardType": "Multiverse Location",
            "multiverseChampions": [
              {
                "name": "Cyborg",
                "fromSet": "Original Core Set (2012)"
              },
              {
                "name": "Nightwing",
                "fromSet": "Heroes Unite (2014)"
              },
              {
                "name": "Starfire",
                "fromSet": "Teen Titans (2015)"
              }
            ],
            "championsRemaining": 0
          },
          {
            "name": "Sally",
            "oversizedCard": "Black Canary",
            "oversizedFrom": "Heroes Unite (2014)",
            "score": 35,
            "nemesis": 0,
            "result": "Loss",
            "place": 3,
            "multiverseLocation": "Metropolis",
            "multiverseLocationSet": "Multiverse",
            "multiverseLocationCardType": "Multiverse Location",
            "multiverseChampions": [
              {
                "name": "The Flash",
                "fromSet": "Original Core Set (2012)"
              },
              {
                "name": "Shazam",
                "fromSet": "Heroes Unite (2014)"
              },
              {
                "name": "Zatanna",
                "fromSet": "Justice League: Dark (2024)"
              }
            ],
            "championsRemaining": 1
          }
        ],
        "additional": [],
        "date": "2026-02-12",
        "dateSort": 20260212,
        "comment": "Multiverse demo ending by VP after Deimos.",
        "multiverseStyle": "standard",
        "multiverseBaseSets": [
          "Original Core Set (2012)"
        ]
      },
      {
        "gameNum": 9,
        "game": "Dark Nights: Metal (2018)",
        "cross": "Crossover Pack 10: Flashpoint (2024)",
        "isCrisis": false,
        "isRivals": false,
        "players": [
          {
            "name": "Jack",
            "oversizedCard": "Green Lantern",
            "oversizedFrom": "Original Core Set (2012)",
            "score": 58,
            "nemesis": 4,
            "result": "Win",
            "place": 1
          },
          {
            "name": "Jill",
            "oversizedCard": "Batman",
            "oversizedFrom": "Original Core Set (2012)",
            "score": 49,
            "nemesis": 3,
            "result": "Loss",
            "place": 3
          },
          {
            "name": "Harry",
            "oversizedCard": "Superman",
            "oversizedFrom": "Original Core Set (2012)",
            "score": 41,
            "nemesis": 2,
            "result": "Loss",
            "place": 4
          },
          {
            "name": "Sally",
            "oversizedCard": "Wonder Woman",
            "oversizedFrom": "Original Core Set (2012)",
            "score": 52,
            "nemesis": 4,
            "result": "Loss",
            "place": 2
          }
        ],
        "additional": [],
        "date": "2026-02-15",
        "dateSort": 20260215
      },
      {
        "gameNum": 10,
        "game": "Rivals 2: Green Lantern vs Sinestro (2018)",
        "cross": "None",
        "isCrisis": false,
        "isRivals": true,
        "players": [
          {
            "name": "Harry",
            "oversizedCard": "Green Lantern",
            "oversizedFrom": "Original Core Set (2012)",
            "score": 40,
            "nemesis": 3,
            "result": "Win",
            "place": 1
          },
          {
            "name": "Sally",
            "oversizedCard": "The Joker",
            "oversizedFrom": "Promo",
            "score": 37,
            "nemesis": 2,
            "result": "Loss",
            "place": 2
          }
        ],
        "additional": [],
        "date": "2026-02-22",
        "dateSort": 20260222
      },
      {
        "gameNum": 11,
        "game": "Justice League: Dark (2024)",
        "cross": "Crisis Expansion Pack 2 (2015)",
        "isCrisis": true,
        "isRivals": false,
        "teamWon": false,
        "teamNemesis": 4,
        "players": [
          {
            "name": "Jack",
            "oversizedCard": "Martian Manhunter",
            "oversizedFrom": "Promo"
          },
          {
            "name": "Jill",
            "oversizedCard": "Cyborg",
            "oversizedFrom": "Original Core Set (2012)"
          },
          {
            "name": "Harry",
            "oversizedCard": "Aquaman",
            "oversizedFrom": "Original Core Set (2012)"
          }
        ],
        "additional": [
          {
            "name": "Gotham City Docks",
            "set": "Other",
            "cardType": "Location",
            "tags": [
              "Promo"
            ]
          }
        ],
        "date": "2026-03-01",
        "dateSort": 20260301
      },
      {
        "gameNum": 12,
        "game": "Injustice (2023)",
        "cross": "Justice League Dark Expansion (2024)",
        "isCrisis": false,
        "isRivals": false,
        "players": [
          {
            "name": "Jack",
            "oversizedCard": "Batman",
            "oversizedFrom": "Original Core Set (2012)",
            "score": 46,
            "nemesis": 3,
            "result": "Loss",
            "place": 3
          },
          {
            "name": "Jill",
            "oversizedCard": "Superman",
            "oversizedFrom": "Original Core Set (2012)",
            "score": 54,
            "nemesis": 5,
            "result": "Win",
            "place": 1
          },
          {
            "name": "Harry",
            "oversizedCard": "Cyborg",
            "oversizedFrom": "Original Core Set (2012)",
            "score": 48,
            "nemesis": 4,
            "result": "Loss",
            "place": 2
          },
          {
            "name": "Sally",
            "oversizedCard": "Martian Manhunter",
            "oversizedFrom": "Promo",
            "score": 42,
            "nemesis": 2,
            "result": "Loss",
            "place": 4
          }
        ],
        "additional": [
          {
            "name": "Reverse Flash",
            "set": "Other",
            "cardType": "Super-Villain",
            "tags": [
              "Promo"
            ]
          }
        ],
        "date": "2026-03-08",
        "dateSort": 20260308
      },
      {
        "gameNum": 13,
        "game": "Arkham Asylum (2025)",
        "cross": "None",
        "isCrisis": false,
        "isRivals": false,
        "isMultiverse": false,
        "players": [
          {
            "name": "Jack",
            "oversizedCard": "Aquaman",
            "oversizedFrom": "Original Core Set (2012)",
            "score": 57,
            "nemesis": 4,
            "result": "Loss",
            "place": 2
          },
          {
            "name": "Harry",
            "oversizedCard": "Cyborg",
            "oversizedFrom": "Original Core Set (2012)",
            "score": 57,
            "nemesis": 4,
            "result": "Win",
            "place": 1
          },
          {
            "name": "Jill",
            "oversizedCard": "Green Lantern",
            "oversizedFrom": "Original Core Set (2012)",
            "score": 49,
            "nemesis": 2,
            "result": "Loss",
            "place": 3
          },
          {
            "name": "Sally",
            "oversizedCard": "Martian Manhunter",
            "oversizedFrom": "Promo",
            "score": 44,
            "nemesis": 2,
            "result": "Loss",
            "place": 4
          }
        ],
        "additional": [],
        "date": "2026-03-15",
        "dateSort": 20260315,
        "comment": "Demo Official tie-breaker for collapsed history result scanning. Most recent Super-Villain defeated by Harry.",
        "standardTieBreakerWinner": "Harry"
      },
      {
        "gameNum": 14,
        "game": "Multiverse (World Hopper)",
        "cross": "None",
        "isCrisis": false,
        "isRivals": false,
        "isMultiverse": true,
        "multiverseWinCondition": "brainiac",
        "multiverseEventSets": [
          "Crossover Pack 5: The Rogues (2017)",
          "Justice League Dark Expansion (2024)"
        ],
        "players": [
          {
            "name": "Jack",
            "oversizedCard": "Batman",
            "oversizedFrom": "Original Core Set (2012)",
            "score": 35,
            "nemesis": 0,
            "result": "Loss",
            "place": 2,
            "multiverseLocation": "Metropolis",
            "multiverseLocationSet": "Multiverse",
            "multiverseLocationCardType": "Multiverse Location",
            "multiverseChampions": [
              {
                "name": "Cyborg",
                "fromSet": "Original Core Set (2012)"
              },
              {
                "name": "Raven",
                "fromSet": "Teen Titans (2015)"
              },
              {
                "name": "Catwoman",
                "fromSet": "Arkham Asylum (2025)",
                "tags": [
                  "Promo"
                ]
              }
            ],
            "championsRemaining": 1
          },
          {
            "name": "Jill",
            "oversizedCard": "Superman",
            "oversizedFrom": "Original Core Set (2012)",
            "score": 42,
            "nemesis": 0,
            "result": "Win",
            "place": 1,
            "multiverseLocation": "Fawcett City",
            "multiverseLocationSet": "Multiverse",
            "multiverseLocationCardType": "Multiverse Location",
            "multiverseChampions": [
              {
                "name": "Green Lantern",
                "fromSet": "Original Core Set (2012)"
              },
              {
                "name": "Batgirl",
                "fromSet": "Heroes Unite (2014)"
              },
              {
                "name": "Zatanna",
                "fromSet": "Justice League: Dark (2024)"
              }
            ],
            "championsRemaining": 2
          },
          {
            "name": "Harry",
            "oversizedCard": "Shazam",
            "oversizedFrom": "Heroes Unite (2014)",
            "score": 31,
            "nemesis": 0,
            "result": "Loss",
            "place": 3,
            "multiverseLocation": "Hub City",
            "multiverseLocationSet": "Multiverse",
            "multiverseLocationCardType": "Multiverse Location",
            "multiverseChampions": [
              {
                "name": "Aquaman",
                "fromSet": "Original Core Set (2012)"
              },
              {
                "name": "Nightwing",
                "fromSet": "Heroes Unite (2014)"
              },
              {
                "name": "John Constantine",
                "fromSet": "Justice League: Dark (2024)"
              }
            ],
            "championsRemaining": 0
          }
        ],
        "additional": [],
        "date": "2026-03-22",
        "dateSort": 20260322,
        "comment": "World Hopper demo ending by VP after Brainiac, using two base sets.",
        "multiverseStyle": "worldHopper",
        "multiverseBaseSets": [
          "Original Core Set (2012)",
          "Heroes Unite (2014)"
        ]
      }
    ],
    "nextGameNum": 15,
    "renames": [],
    "defaultSlot1": "Jack",
    "defaultSlot2": "Jill"
  },
  "stats": {
    "note": "Demo data; stats recalculate in the app."
  },
  "preferences": {
    "dcTheme": "light",
    "dcAdminCardFilter": "Original Core Set (2012)",
    "dcAdminOversizedFilter": "Original Core Set (2012)"
  }
};
