import type {NpcDefinition} from '../game/types';
export const CIBAR_RESIDENTS:NpcDefinition[]=[
  {
    "id": "celia-brook",
    "name": "Celia Brook",
    "title": "Grain Keeper",
    "spriteTexture": "npc_villager",
    "spriteFrame": 0,
    "townId": "cibar-plains",
    "worldOffset": {
      "x": -130,
      "y": -390
    },
    "role": "Coordinates seed reserves and relief grain for the river-halls",
    "family": "Nella Brook’s niece; works with Asha and Iren",
    "faction": "Southern Grain Compact",
    "homeLocation": {
      "x": -130,
      "y": -390
    },
    "connections": [
      {
        "npcId": "celia-brook",
        "relationship": "Nella Brook’s niece; works with Asha and Iren"
      }
    ],
    "dialoguePersonality": "Practical, communal, attentive to the price of food",
    "schedule": [
      {
        "startHour": 6,
        "activity": "Coordinates seed reserves and relief grain for the river-halls",
        "location": {
          "x": -130,
          "y": -390
        }
      },
      {
        "startHour": 18,
        "activity": "Shares the evening reserve tally",
        "location": {
          "x": -106,
          "y": -358
        }
      },
      {
        "startHour": 22,
        "activity": "Returns to the home court",
        "location": {
          "x": -130,
          "y": -390
        }
      }
    ],
    "relationshipToLeigneron": {
      "kind": "family-friend",
      "trust": 58,
      "summary": "Remembers Leigneron bringing Nella’s seed sacks to Torren’s wagon"
    },
    "dialogue": [
      "Nella Brook’s niece; works with Asha and Iren.",
      "Coordinates seed reserves and relief grain for the river-halls. The southern road carries more than gold: it carries next winter’s food."
    ],
    "questIds": [
      "water-stops"
    ],
    "patrolRadius": 52,
    "weaponId": "roadwarden-sword",
    "combatant": false,
    "storyConsequences": [
      "Irrigation repair reopens the shared allotment; the reserve decision changes later conversations."
    ]
  },
  {
    "id": "asha-stonevein",
    "name": "Asha Stonevein",
    "title": "Irrigation Smith",
    "spriteTexture": "npc_blacksmith",
    "spriteFrame": 0,
    "townId": "cibar-plains",
    "worldOffset": {
      "x": 820,
      "y": 560
    },
    "role": "Repairs pumps and water fittings without taking food reserves as payment",
    "family": "Mara Stonevein’s niece; trained by Joren during a relief season",
    "faction": "Southern Grain Compact",
    "homeLocation": {
      "x": 820,
      "y": 560
    },
    "connections": [
      {
        "npcId": "deepford-runesmith",
        "relationship": "Mara Stonevein’s niece; trained by Joren during a relief season"
      }
    ],
    "dialoguePersonality": "Practical, communal, attentive to the price of food",
    "schedule": [
      {
        "startHour": 6,
        "activity": "Repairs pumps and water fittings without taking food reserves as payment",
        "location": {
          "x": 820,
          "y": 560
        }
      },
      {
        "startHour": 18,
        "activity": "Shares the evening reserve tally",
        "location": {
          "x": 844,
          "y": 592
        }
      },
      {
        "startHour": 22,
        "activity": "Returns to the home court",
        "location": {
          "x": 820,
          "y": 560
        }
      }
    ],
    "relationshipToLeigneron": {
      "kind": "family-friend",
      "trust": 58,
      "summary": "Helped Joren repair the family cart Leigneron once drove"
    },
    "dialogue": [
      "Mara Stonevein’s niece; trained by Joren during a relief season.",
      "Repairs pumps and water fittings without taking food reserves as payment. The southern road carries more than gold: it carries next winter’s food."
    ],
    "questIds": [],
    "patrolRadius": 52,
    "weaponId": "roadwarden-sword",
    "combatant": false,
    "storyConsequences": [
      "Irrigation repair reopens the shared allotment; the reserve decision changes later conversations."
    ]
  },
  {
    "id": "iren-copperwake",
    "name": "Iren Copperwake",
    "title": "Field Steward",
    "spriteTexture": "npc_general",
    "spriteFrame": 0,
    "townId": "cibar-plains",
    "worldOffset": {
      "x": -720,
      "y": 780
    },
    "role": "Shares irrigation turns and keeps crop rows accessible to families",
    "family": "Thrain Copperwake’s younger cousin; Celia’s field partner",
    "faction": "Southern Grain Compact",
    "homeLocation": {
      "x": -720,
      "y": 780
    },
    "connections": [
      {
        "npcId": "celia-brook",
        "relationship": "Thrain Copperwake’s younger cousin; Celia’s field partner"
      }
    ],
    "dialoguePersonality": "Practical, communal, attentive to the price of food",
    "schedule": [
      {
        "startHour": 6,
        "activity": "Shares irrigation turns and keeps crop rows accessible to families",
        "location": {
          "x": -720,
          "y": 780
        }
      },
      {
        "startHour": 18,
        "activity": "Shares the evening reserve tally",
        "location": {
          "x": -696,
          "y": 812
        }
      },
      {
        "startHour": 22,
        "activity": "Returns to the home court",
        "location": {
          "x": -720,
          "y": 780
        }
      }
    ],
    "relationshipToLeigneron": {
      "kind": "family-friend",
      "trust": 58,
      "summary": "Traded harvest notes with Leigneron’s mother on a relief caravan"
    },
    "dialogue": [
      "Thrain Copperwake’s younger cousin; Celia’s field partner.",
      "Shares irrigation turns and keeps crop rows accessible to families. The southern road carries more than gold: it carries next winter’s food."
    ],
    "questIds": [],
    "patrolRadius": 52,
    "weaponId": "roadwarden-sword",
    "combatant": false,
    "storyConsequences": [
      "Irrigation repair reopens the shared allotment; the reserve decision changes later conversations."
    ]
  },
  {
    "id": "kellan-ashfield",
    "name": "Kellan Ashfield",
    "title": "Plains Guard",
    "spriteTexture": "npc_guard",
    "spriteFrame": 0,
    "townId": "cibar-plains",
    "worldOffset": {
      "x": 820,
      "y": -550
    },
    "role": "Guards the Deepford grain road and escorts seed deliveries",
    "family": "Torren Ashfield’s nephew; trusts Iren’s field reports",
    "faction": "Plains Watch",
    "homeLocation": {
      "x": 820,
      "y": -550
    },
    "connections": [
      {
        "npcId": "torren-ashfield",
        "relationship": "Torren Ashfield’s nephew; trusts Iren’s field reports"
      }
    ],
    "dialoguePersonality": "Practical, communal, attentive to the price of food",
    "schedule": [
      {
        "startHour": 6,
        "activity": "Guards the Deepford grain road and escorts seed deliveries",
        "location": {
          "x": 820,
          "y": -550
        }
      },
      {
        "startHour": 18,
        "activity": "Shares the evening reserve tally",
        "location": {
          "x": 844,
          "y": -518
        }
      },
      {
        "startHour": 22,
        "activity": "Returns to the home court",
        "location": {
          "x": 820,
          "y": -550
        }
      }
    ],
    "relationshipToLeigneron": {
      "kind": "family-friend",
      "trust": 58,
      "summary": "Walked beside Leigneron on his first grain convoy"
    },
    "dialogue": [
      "Torren Ashfield’s nephew; trusts Iren’s field reports.",
      "Guards the Deepford grain road and escorts seed deliveries. The southern road carries more than gold: it carries next winter’s food."
    ],
    "questIds": [],
    "patrolRadius": 52,
    "weaponId": "oak-shield-blade",
    "combatant": true,
    "storyConsequences": [
      "Irrigation repair reopens the shared allotment; the reserve decision changes later conversations."
    ]
  },
  {
    "id": "meral-gull",
    "name": "Meral Gull",
    "title": "Seed Exchange Trader",
    "spriteTexture": "npc_attendant",
    "spriteFrame": 0,
    "townId": "cibar-plains",
    "worldOffset": {
      "x": 360,
      "y": 140
    },
    "role": "Trades tools and records every allotment at the market",
    "family": "Jessa Gull’s cousin; supplies Celia’s reserve barn",
    "faction": "Southern Grain Compact",
    "homeLocation": {
      "x": 360,
      "y": 140
    },
    "connections": [
      {
        "npcId": "celia-brook",
        "relationship": "Jessa Gull’s cousin; supplies Celia’s reserve barn"
      }
    ],
    "dialoguePersonality": "Practical, communal, attentive to the price of food",
    "schedule": [
      {
        "startHour": 6,
        "activity": "Trades tools and records every allotment at the market",
        "location": {
          "x": 360,
          "y": 140
        }
      },
      {
        "startHour": 18,
        "activity": "Shares the evening reserve tally",
        "location": {
          "x": 384,
          "y": 172
        }
      },
      {
        "startHour": 22,
        "activity": "Returns to the home court",
        "location": {
          "x": 360,
          "y": 140
        }
      }
    ],
    "relationshipToLeigneron": {
      "kind": "family-friend",
      "trust": 58,
      "summary": "Bought herbs from Mira and remembers Leigneron helping weigh them"
    },
    "dialogue": [
      "Jessa Gull’s cousin; supplies Celia’s reserve barn.",
      "Trades tools and records every allotment at the market. The southern road carries more than gold: it carries next winter’s food."
    ],
    "questIds": [],
    "patrolRadius": 52,
    "weaponId": "roadwarden-sword",
    "combatant": false,
    "storyConsequences": [
      "Irrigation repair reopens the shared allotment; the reserve decision changes later conversations."
    ]
  }
];
