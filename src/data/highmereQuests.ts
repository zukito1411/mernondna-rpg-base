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
          "Tovin's been missing for three days. They're calling him a thief. He wouldn't steal from the kitchens. He just wouldn't.",
          "Pell says he found part of the wagon papers near the well. I can't leave the kitchen to look. Could you ask him?"
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
          "That's a real crown stamp, all right. But look at the date. Somebody changed it. That wagon never came to the stores.",
          "Pell was here that night. You could try asking him. I can't leave my post, and frankly I'm frightened."
        ]
      },
      {
        "id": "runner",
        "type": "choice",
        "targetId": "pell-rusk",
        "amount": 1,
        "text": "Win Pell's trust and learn where Tovin is hiding.",
        "dialogue": [
          "Are you with the guards? Because Tovin isn't going anywhere with them. Not after what happened."
        ],
        "choices": [
          {
            "id": "protect",
            "text": "I will keep Tovin safe. Show me where he is.",
            "response": "He's at the old weighhouse, down the south lane. Please don't tell the guards I said that.",
            "flag": "witness-protected"
          },
          {
            "id": "warrant",
            "text": "No one will lay a hand on him. Highmere will hear his story.",
            "response": "All right. I'll show you. But you promised he wouldn't get hurt.",
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
          "I saw Sevrin's stamp on the sacks. His men told me to burn the papers. I was scared, so I ran.",
          "I found their book under a loose stone. I'll tell everyone what I saw. Just... please don't make me go back alone."
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
          "We needed that grain here. The city was hungry. What was I supposed to do?",
          "You've got a frightened boy and a bit of paper. If you think that's enough, take it to Renna."
        ]
      },
      {
        "id": "resolution",
        "type": "choice",
        "targetId": "mairin-reed",
        "amount": 1,
        "text": "Decide how Highmere should answer for the stolen grain.",
        "dialogue": [
          "Tovin's home. Thank you. But what happens now? They're still looking for him."
        ],
        "choices": [
          {
            "id": "public",
            "text": "Tell the whole story in the town square.",
            "response": "Then we'll ask Renna to speak in the square. I'll go with Tovin if he wants me there.",
            "flag": "grain-public-inquiry"
          },
          {
            "id": "guard",
            "text": "Have Captain Yselle guard Tovin and seize the stolen grain.",
            "response": "All right. Yselle can take the papers. I just want Tovin safe and food back in the kitchens.",
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
          "Edmund says you can handle a sword. I hope he's right. Caldus can show you how we work in the watch.",
          "He's in the practice yard. Don't swing that thing near anyone walking past, please."
        ]
      },
      {
        "id": "instructor",
        "type": "talk",
        "targetId": "ser-caldus-rowe",
        "amount": 1,
        "text": "Meet Sir Caldus beside the practice yard.",
        "dialogue": [
          "Let's see how you handle yourself. Start with the practice dummy. Then show me how you move.",
          "You can make mistakes here. Better here than when somebody's counting on you."
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
          "I heard a wagon after the gate closed. When I asked about it, everyone said there'd been no wagon. I know what I heard.",
          "We've still got the old guard board in the armory. I wrote down their positions. You can look if you like."
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
          "Look at these three marks. That's where the guards were sent. Can you tell me where they were when the wagon got through?"
        ],
        "choices": [
          {
            "id": "correct",
            "text": "East gate → river bridge → old storehouse.",
            "response": "That's it. No one was watching the storehouse. Iven needs to hear this.",
            "flag": "watch-code-decoded",
            "correct": true
          },
          {
            "id": "wrong",
            "text": "Old storehouse → east gate → river bridge.",
            "response": "No, that doesn't fit. Have another look at the times.",
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
          "So they sent the guards away on purpose. That's why nobody saw the wagon. Can you stay until I've checked the stores?"
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
          "Good work. You stayed calm, even when we thought another wagon was coming.",
          "We've got the flour back. Edmund will be pleased to hear that. I certainly am."
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
          "We caught one man, but the kitchens are still short of food.",
          "Beatrice at the market and Agnes at the kitchens have been trying to work something out. Could you hear them both before we go to Adria?"
        ]
      },
      {
        "id": "merchant",
        "type": "talk",
        "targetId": "maela-quill",
        "amount": 1,
        "text": "Hear Beatrice's fears for the market.",
        "dialogue": [
          "If the wagons stop, I can't sell anything. But I don't want families going hungry either.",
          "I'll help with the deliveries. I just can't pay for all of it myself."
        ]
      },
      {
        "id": "worker",
        "type": "talk",
        "targetId": "nella-harrow",
        "amount": 1,
        "text": "Ask Agnes what the missing grain has meant to the workers.",
        "dialogue": [
          "My little one asked why there's no bread this morning. What was I supposed to tell her?",
          "We're not asking for much. Just enough to get through the week."
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
          "You've talked to both sides? Good. I've been trying to get them in the same room all week.",
          "Tell me what they said. We need to decide how we're going to get everyone fed."
        ]
      },
      {
        "id": "decision",
        "type": "choice",
        "targetId": "lady-adria-vale",
        "amount": 1,
        "text": "Choose how the crown will feed Highmere through winter.",
        "dialogue": [
          "We can't wait much longer. The first snow's coming."
        ],
        "choices": [
          {
            "id": "charter",
            "text": "Open the crown granaries and feed every household.",
            "response": "Then I'll have the stores opened in the morning. We'll make sure every family gets something.",
            "flag": "relief-household-charter"
          },
          {
            "id": "joint",
            "text": "Have the market and the kitchens share the food and the work.",
            "response": "All right. Beatrice and Agnes can oversee the deliveries together. I hope we can make this work.",
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
          "Really? They're sending flour? Oh, thank goodness. I've been worrying about tomorrow's breakfast all day.",
          "Tovin says he'll help unload the first cart. I told him he doesn't have to, but he wants to."
        ]
      },
      {
        "id": "closure",
        "type": "talk",
        "targetId": "renna-vale",
        "amount": 1,
        "text": "Return to Renna and learn what the old tally has revealed.",
        "dialogue": [
          "There's a mark in that book I recognize. I've seen it on an old map. I didn't expect to see it here.",
          "Could you show Edmund this? He might know what it means. I'd go myself, but I can't leave the archive right now."
        ],
        "cinematicId": "city-resolution"
      }
    ]
  }
];
