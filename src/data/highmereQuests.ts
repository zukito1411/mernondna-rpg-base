import type { QuestDefinition } from '../game/types';

export const HIGHMERE_QUESTS:QuestDefinition[] = [
  {
    "id": "shadows-highmere",
    "name": "The Empty Granary",
    "giverNpcId": "mairin-reed",
    "summary": "Flour meant for Oakmere has vanished, and Tovin Reed has not come home. Mairin believes the missing carter found the truth behind the theft—and that someone in Highmere wants him silenced.",
    "rewardGold": 140,
    "rewardXp": 360,
    "objectives": [
      {
        "id": "kitchen",
        "type": "talk",
        "targetId": "mairin-reed",
        "amount": 1,
        "text": "Find out why Tovin vanished from the Lower Ward kitchen.",
        "dialogue": [
          "Tovin has been gone three nights. They call him a thief, but he was carrying flour to feed our neighbors.",
          "Find the torn waybill by the well. If it bears the mark I fear, someone has stolen more than a cartload."
        ]
      },
      {
        "id": "receipt",
        "type": "investigate",
        "targetId": "clue:grain-receipt",
        "contentId": "clue:grain-receipt",
        "amount": 1,
        "text": "Search beside the Lower Ward well for the torn waybill."
      },
      {
        "id": "customs",
        "type": "talk",
        "targetId": "davin-bridge",
        "amount": 1,
        "text": "Ask the bridge warden what he remembers about the missing flour cart.",
        "dialogue": [
          "The crown's mark is true, but the date was scratched in later. That cart never reached the palace storehouse.",
          "Pell Rusk saw where it turned aside. I dare not leave my post; the man who changed that mark may still be watching."
        ]
      },
      {
        "id": "runner",
        "type": "choice",
        "targetId": "pell-rusk",
        "amount": 1,
        "text": "Win Pell's trust and learn where Tovin is hiding.",
        "dialogue": [
          "You brought a guard’s sword into our lane. Tell me why I should lead you to Tovin."
        ],
        "choices": [
          {
            "id": "protect",
            "text": "I will keep Tovin safe. Show me where he is.",
            "response": "The old weighhouse, beyond the south lane. Go quietly; the watch there takes orders from Sevrin.",
            "flag": "witness-protected"
          },
          {
            "id": "warrant",
            "text": "No one will lay a hand on him. Highmere will hear his story.",
            "response": "Then I will take you there. Remember your promise when the guards arrive.",
            "flag": "witness-public-hearing"
          }
        ]
      },
      {
        "id": "yard",
        "type": "investigate",
        "targetId": "clue:weighhouse-ledger",
        "contentId": "clue:weighhouse-ledger",
        "amount": 1,
        "text": "Search the abandoned weighhouse for the hidden grain tally.",
        "cinematicId": "lower-meeting"
      },
      {
        "id": "missing-worker",
        "type": "talk",
        "targetId": "tovin-reed",
        "amount": 1,
        "text": "Find Tovin hiding beside the old weighhouse.",
        "dialogue": [
          "I saw Sevrin's mark on the flour sacks. His men told me to burn the waybill.",
          "I found their tally hidden under a loose stone. I will tell the truth, but I cannot cross the ward alone."
        ]
      },
      {
        "id": "escort",
        "type": "escort",
        "targetId": "tovin-reed",
        "contentId": "npc:tovin-reed",
        "amount": 1,
        "text": "Lead Tovin safely through the Lower Ward to Mairin's kitchen."
      },
      {
        "id": "confront",
        "type": "talk",
        "targetId": "sevrin-hale",
        "amount": 1,
        "text": "Face Sevrin with Tovin and the hidden tally.",
        "dialogue": [
          "I kept the grain for Highmere. A city must look to its own before it feeds every village on the road.",
          "You have a frightened carter and a scrap of marks. Take them to Renna, if you mean to make a spectacle of this."
        ]
      },
      {
        "id": "resolution",
        "type": "choice",
        "targetId": "mairin-reed",
        "amount": 1,
        "text": "Decide how Highmere should answer for the stolen grain.",
        "dialogue": [
          "Tovin is home. Now tell me who should hear what he saw."
        ],
        "choices": [
          {
            "id": "public",
            "text": "Tell the whole story in the town square.",
            "response": "Renna will speak before the people, and Tovin can tell them what he saw. No kitchen should beg in secret.",
            "flag": "grain-public-inquiry"
          },
          {
            "id": "guard",
            "text": "Have Captain Yselle guard Tovin and seize the stolen grain.",
            "response": "I will trust her watch if it keeps Tovin safe. Let the flour go to the kitchens before another cart leaves.",
            "flag": "grain-guarded-inquiry"
          }
        ],
        "cinematicId": "grain-resolution"
      }
    ]
  },
  {
    "id": "royal-guard-trial",
    "name": "The Captain's Trial",
    "giverNpcId": "captain-yselle-ward",
    "summary": "Captain Yselle will not trust a sword arm alone. Prove your skill in the yard, then help the watch uncover how a stolen wagon slipped through Highmere after dark.",
    "rewardGold": 120,
    "rewardXp": 320,
    "objectives": [
      {
        "id": "orders",
        "type": "talk",
        "targetId": "captain-yselle-ward",
        "amount": 1,
        "text": "Hear Captain Yselle's challenge at the western watch.",
        "dialogue": [
          "Aldren taught you to survive. Sir Caldus will see whether you can keep others safe.",
          "Meet him in the yard. Keep your blade from the townsfolk, and your pride out of the way."
        ]
      },
      {
        "id": "instructor",
        "type": "talk",
        "targetId": "ser-caldus-rowe",
        "amount": 1,
        "text": "Meet Sir Caldus beside the practice yard.",
        "dialogue": [
          "Show me a clean sword stroke, a quick dash, and Azure Cleave. Do it without striking anyone outside the yard.",
          "The straw dummies are brave enough to take the blows. Save your strength for the road."
        ]
      },
      {
        "id": "sword",
        "type": "train",
        "targetId": "drill-sword",
        "contentId": "training:highmere-target",
        "amount": 3,
        "text": "Strike the practice dummy three times."
      },
      {
        "id": "dash",
        "type": "train",
        "targetId": "drill-dash",
        "contentId": "training:highmere-target",
        "amount": 2,
        "text": "Dash across the yard twice without leaving its bounds."
      },
      {
        "id": "art",
        "type": "train",
        "targetId": "azure-cleave",
        "contentId": "training:highmere-target",
        "amount": 1,
        "text": "Show Sir Caldus Azure Cleave in the yard."
      },
      {
        "id": "stores",
        "type": "talk",
        "targetId": "barric-thorne",
        "amount": 1,
        "text": "Ask the keeper of the king's stores about a wagon that vanished at dusk.",
        "dialogue": [
          "I heard wheels after the west gate was barred. By dawn, a wagon was gone and the watch swore it had never passed.",
          "The old signal board shows where the guards stood that night. Read the marks, and we may find which way the wagon went."
        ]
      },
      {
        "id": "signal",
        "type": "investigate",
        "targetId": "clue:watch-signals",
        "contentId": "clue:watch-signals",
        "amount": 1,
        "text": "Examine the old watch board in the armory."
      },
      {
        "id": "decode",
        "type": "puzzle",
        "targetId": "ser-caldus-rowe",
        "amount": 1,
        "text": "Tell Sir Caldus where the watch stood through the day.",
        "dialogue": [
          "The marks were made at dawn, noon, and dusk. Where was the watch sent first, and where did it leave the road unguarded?"
        ],
        "choices": [
          {
            "id": "correct",
            "text": "East gate → river bridge → old storehouse.",
            "response": "That's it. The guards were drawn away from the old storehouse. Take word to Iven before nightfall.",
            "flag": "watch-code-decoded",
            "correct": true
          },
          {
            "id": "wrong",
            "text": "Old storehouse → east gate → river bridge.",
            "response": "No. That would leave the east road open first. Look again at the marks and their order.",
            "flag": "",
            "correct": false
          }
        ]
      },
      {
        "id": "dispatch",
        "type": "deliver",
        "targetId": "iven-harrow",
        "amount": 1,
        "text": "Warn Iven at the old storehouse before the next wagon arrives.",
        "dialogue": [
          "So that is why they sent the watch away. Stay here with me; if another wagon comes, we will meet it at the gate."
        ]
      },
      {
        "id": "watch",
        "type": "train",
        "targetId": "relief-watch",
        "contentId": "watch:relief-yard",
        "amount": 1,
        "text": "Keep watch at the storehouse until Iven finishes his search."
      },
      {
        "id": "report",
        "type": "talk",
        "targetId": "captain-yselle-ward",
        "amount": 1,
        "text": "Tell Captain Yselle the storehouse is safe.",
        "dialogue": [
          "You stood your ground without drawing blood. That is the sort of strength I can trust.",
          "The stolen flour is safe, and the watch has its honor back. Aldren will be glad to hear it."
        ],
        "cinematicId": "guard-muster"
      }
    ]
  },
  {
    "id": "kingdom-divided",
    "name": "The King's Bread",
    "giverNpcId": "renna-vale",
    "prerequisiteQuestId": "shadows-highmere",
    "summary": "The stolen grain is found, but Highmere's kitchens are still hungry. Hear the merchants and the workers, then help Lady Matilda choose how the crown will feed the city before winter closes the roads.",
    "rewardGold": 180,
    "rewardXp": 450,
    "objectives": [
      {
        "id": "archive",
        "type": "talk",
        "targetId": "renna-vale",
        "amount": 1,
        "text": "Ask Renna how Highmere can keep its kitchens fed.",
        "dialogue": [
          "One thief can be punished. That will not fill an empty bowl.",
          "Hear Beatrice at the market and Agnes among the workers. Then we can ask Lady Matilda to make good the crown's promise."
        ]
      },
      {
        "id": "merchant",
        "type": "talk",
        "targetId": "maela-quill",
        "amount": 1,
        "text": "Hear Beatrice's fears for the market.",
        "dialogue": [
          "If the wagons stop, the stalls go bare. But what good is a full storehouse if its doors stay shut?",
          "I will help carry flour to the kitchens, if the crown shares the burden with the market."
        ]
      },
      {
        "id": "worker",
        "type": "talk",
        "targetId": "nella-harrow",
        "amount": 1,
        "text": "Ask Agnes what the missing grain has meant to the workers.",
        "dialogue": [
          "A late cart is a small matter in the castle. Here, it means a child goes to bed hungry.",
          "We do not ask for a feast. Only enough bread to see us through the cold."
        ]
      },
      {
        "id": "tally",
        "type": "investigate",
        "targetId": "clue:relief-tally",
        "contentId": "clue:relief-tally",
        "amount": 1,
        "text": "Search the storehouse and see how much grain remains for the hungry."
      },
      {
        "id": "petition",
        "type": "deliver",
        "targetId": "lady-adria-vale",
        "amount": 1,
        "text": "Take the words of the market and the kitchens to Lady Matilda.",
        "dialogue": [
          "You have brought the voices of the market and the kitchens together. That is worth more than a chest of gold.",
          "Tell me, then: how should the crown see the people through winter?"
        ]
      },
      {
        "id": "decision",
        "type": "choice",
        "targetId": "lady-adria-vale",
        "amount": 1,
        "text": "Choose how the crown will feed Highmere through winter.",
        "dialogue": [
          "The road will soon freeze. There is little time to choose."
        ],
        "choices": [
          {
            "id": "charter",
            "text": "Open the crown granaries and feed every household.",
            "response": "The granaries will open at dawn. Let every family take enough to last through the first snow.",
            "flag": "relief-household-charter"
          },
          {
            "id": "joint",
            "text": "Have the market and the kitchens share the food and the work.",
            "response": "Beatrice and Agnes will see the wagons divided fairly. Highmere will stand together this winter.",
            "flag": "relief-joint-council"
          }
        ],
        "cinematicId": "royal-audience"
      },
      {
        "id": "return",
        "type": "talk",
        "targetId": "mairin-reed",
        "amount": 1,
        "text": "Tell Mairin how the crown will feed the city.",
        "dialogue": [
          "The ovens can burn again, then. You have given folk more than bread—you have given them a reason to hope.",
          "Tovin is carrying the first flour cart at dawn. He says the road feels less dark already."
        ]
      },
      {
        "id": "closure",
        "type": "talk",
        "targetId": "renna-vale",
        "amount": 1,
        "text": "Return to Renna and learn what the old tally has revealed.",
        "dialogue": [
          "The hidden tally bears a mark I have seen before—in an old tale of the blight. This theft reaches farther than Highmere.",
          "You gave the city its bread. Now take this mark to Edmund. He will know where the trail leads."
        ],
        "cinematicId": "city-resolution"
      }
    ]
  }
];
