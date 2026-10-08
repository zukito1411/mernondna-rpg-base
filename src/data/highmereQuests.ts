import type { QuestDefinition } from '../game/types';

export const HIGHMERE_QUESTS:QuestDefinition[] = [
  {
    "id": "shadows-highmere",
    "name": "Shadows Beneath Highmere",
    "giverNpcId": "mairin-reed",
    "summary": "Missing dockworkers and stolen relief grain expose a false requisition trail linking the Lower Ward to the crown stores. Mairin asks for evidence, not revenge.",
    "rewardGold": 140,
    "rewardXp": 360,
    "objectives": [
      {
        "id": "kitchen",
        "type": "talk",
        "targetId": "mairin-reed",
        "amount": 1,
        "text": "Hear Mairin’s account at the Lower Ward kitchen.",
        "dialogue": [
          "Tovin has not come home in three nights. The guard calls him a thief, but he was carrying grain to my kitchen.",
          "Find the torn delivery receipt at the shared well. Bring facts before you bring soldiers."
        ]
      },
      {
        "id": "receipt",
        "type": "investigate",
        "targetId": "clue:grain-receipt",
        "contentId": "clue:grain-receipt",
        "amount": 1,
        "text": "Examine the torn grain receipt near the Lower Ward well."
      },
      {
        "id": "customs",
        "type": "talk",
        "targetId": "davin-bridge",
        "amount": 1,
        "text": "Ask Davin to compare the torn receipt with his bridge ledger.",
        "dialogue": [
          "That seal is real. The cargo date is not. Sevrin’s office requisitioned grain after the wagon had already crossed.",
          "Pell Rusk knows the yard where those wagons vanished. I cannot leave my desk without warning the office."
        ]
      },
      {
        "id": "runner",
        "type": "choice",
        "targetId": "pell-rusk",
        "amount": 1,
        "text": "Gain Pell’s cooperation without frightening the witness.",
        "dialogue": [
          "You brought a guard’s sword into our lane. Tell me why I should lead you to Tovin."
        ],
        "choices": [
          {
            "id": "protect",
            "text": "I will protect Tovin and follow the evidence.",
            "response": "Then follow the lane to the abandoned weighhouse. Keep your sword sheathed.",
            "flag": "witness-protected"
          },
          {
            "id": "warrant",
            "text": "The truth deserves a public hearing, not a beating.",
            "response": "A hearing, then. I will hold you to those words.",
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
        "text": "Discover the hidden requisition ledger at the abandoned weighhouse.",
        "cinematicId": "lower-meeting"
      },
      {
        "id": "missing-worker",
        "type": "talk",
        "targetId": "tovin-reed",
        "amount": 1,
        "text": "Find Tovin hiding beside the weighhouse.",
        "dialogue": [
          "I saw the deputy’s seal on grain marked for Oakmere. They told me to burn the kitchen receipts.",
          "I kept the ledger. I will testify, but I cannot cross the ward alone."
        ]
      },
      {
        "id": "escort",
        "type": "escort",
        "targetId": "tovin-reed",
        "contentId": "npc:tovin-reed",
        "amount": 1,
        "text": "Escort Tovin along the Lower Ward lanes to Mairin’s kitchen."
      },
      {
        "id": "confront",
        "type": "talk",
        "targetId": "sevrin-hale",
        "amount": 1,
        "text": "Confront Sevrin with the witness and matching ledgers.",
        "dialogue": [
          "The relief stock was diverted under emergency authority. A city must protect its own interests.",
          "You have two ledgers and a living witness. Take them to the archivist, if you insist on making this public."
        ]
      },
      {
        "id": "resolution",
        "type": "choice",
        "targetId": "mairin-reed",
        "amount": 1,
        "text": "Decide how the recovered evidence should be handled.",
        "dialogue": [
          "Tovin is home. Now tell me whether the city will hear him."
        ],
        "choices": [
          {
            "id": "public",
            "text": "Publish the ledgers and protect every witness.",
            "response": "Renna will open the records. No kitchen should have to beg in secret.",
            "flag": "grain-public-inquiry"
          },
          {
            "id": "guard",
            "text": "Give Yselle the evidence for a guarded prosecution.",
            "response": "I will trust her watch if it keeps Tovin safe. Let the kitchens see the stock tallies.",
            "flag": "grain-guarded-inquiry"
          }
        ],
        "cinematicId": "grain-resolution"
      }
    ]
  },
  {
    "id": "royal-guard-trial",
    "name": "The Royal Guard’s Trial",
    "giverNpcId": "captain-yselle-ward",
    "summary": "Yselle tests Aldren’s pupil through disciplined drills, an interrupted supply inspection and a relief-store watch. Skill without judgment is not enough.",
    "rewardGold": 120,
    "rewardXp": 320,
    "objectives": [
      {
        "id": "orders",
        "type": "talk",
        "targetId": "captain-yselle-ward",
        "amount": 1,
        "text": "Accept Yselle’s instructions at the western watch.",
        "dialogue": [
          "Aldren taught you to survive. Caldus will see whether you can keep others alive.",
          "Report to the drill ground. No live steel aimed at citizens, and no glory at their expense."
        ]
      },
      {
        "id": "instructor",
        "type": "talk",
        "targetId": "ser-caldus-rowe",
        "amount": 1,
        "text": "Meet Caldus beside the military drill ground.",
        "dialogue": [
          "Control first. Show me a sword stroke, a measured dash, and Azure Cleave within this yard.",
          "The practice targets do not need to die to teach you something."
        ]
      },
      {
        "id": "sword",
        "type": "train",
        "targetId": "drill-sword",
        "contentId": "training:highmere-target",
        "amount": 3,
        "text": "Land three practice sword strokes in the drill yard."
      },
      {
        "id": "dash",
        "type": "train",
        "targetId": "drill-dash",
        "contentId": "training:highmere-target",
        "amount": 2,
        "text": "Perform two controlled dashes within the drill yard."
      },
      {
        "id": "art",
        "type": "train",
        "targetId": "azure-cleave",
        "contentId": "training:highmere-target",
        "amount": 1,
        "text": "Demonstrate Azure Cleave inside the drill yard."
      },
      {
        "id": "stores",
        "type": "talk",
        "targetId": "barric-thorne",
        "amount": 1,
        "text": "Inspect the suspicious quartermaster seal with Barric.",
        "dialogue": [
          "The relief seal has been used twice, but only one wagon left. Someone is using training hours to move the other load.",
          "Read the three marks at the armory board. Their order tells the watch which store to inspect."
        ]
      },
      {
        "id": "signal",
        "type": "investigate",
        "targetId": "clue:watch-signals",
        "contentId": "clue:watch-signals",
        "amount": 1,
        "text": "Read the armory’s watch-signal board."
      },
      {
        "id": "decode",
        "type": "puzzle",
        "targetId": "ser-caldus-rowe",
        "amount": 1,
        "text": "Tell Caldus the correct watch-signal order.",
        "dialogue": [
          "What is the order on the altered watch board? Read the oldest mark first: dawn grain tally, noon bridge inspection, evening relief muster."
        ],
        "choices": [
          {
            "id": "correct",
            "text": "Grain tally → bridge inspection → relief muster.",
            "response": "Correct. Take this warning to Iven before the evening load leaves.",
            "flag": "watch-code-decoded",
            "correct": true
          },
          {
            "id": "wrong",
            "text": "Relief muster → grain tally → bridge inspection.",
            "response": "That would leave the stores unwatched at dawn. Read the dated marks again.",
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
        "text": "Deliver the sealed warning to Iven at the relief warehouse.",
        "dialogue": [
          "Barric’s seal? I will lock the second load and count it in front of witnesses. Stand by the yard while I check the stores."
        ]
      },
      {
        "id": "watch",
        "type": "train",
        "targetId": "relief-watch",
        "contentId": "watch:relief-yard",
        "amount": 1,
        "text": "Hold the marked relief watch for twelve seconds without leaving."
      },
      {
        "id": "report",
        "type": "talk",
        "targetId": "captain-yselle-ward",
        "amount": 1,
        "text": "Report the secured supplies to Yselle.",
        "dialogue": [
          "You kept a kitchen supplied without starting a riot. That is service.",
          "The guard will keep the public tally open. Aldren should hear what his pupil accomplished."
        ],
        "cinematicId": "guard-muster"
      }
    ]
  },
  {
    "id": "kingdom-divided",
    "name": "A Kingdom Divided",
    "giverNpcId": "renna-vale",
    "prerequisiteQuestId": "shadows-highmere",
    "summary": "The grain inquiry pits merchant privilege against hungry households. Renna asks Leigneron to gather both sides, carry a joint petition and choose an enforceable reform.",
    "rewardGold": 180,
    "rewardXp": 450,
    "objectives": [
      {
        "id": "archive",
        "type": "talk",
        "targetId": "renna-vale",
        "amount": 1,
        "text": "Discuss the grain inquiry with Renna.",
        "dialogue": [
          "Evidence can expose one official. A fair rule can outlive him.",
          "Speak to Maela and Nella before drafting a petition. A reform nobody can obey is another kind of cruelty."
        ]
      },
      {
        "id": "merchant",
        "type": "talk",
        "targetId": "maela-quill",
        "amount": 1,
        "text": "Hear Maela’s merchant case.",
        "dialogue": [
          "Without reserves, a ruined bridge empties every stall. Without public accounts, reserves become a hiding place.",
          "I can support published tallies and guaranteed bread if the crown shares transport costs."
        ]
      },
      {
        "id": "worker",
        "type": "talk",
        "targetId": "nella-harrow",
        "amount": 1,
        "text": "Hear Nella’s account of worker prices.",
        "dialogue": [
          "A cart delayed is an inconvenience for the hall. It is a missed meal here.",
          "Put the household ration in writing. Not a favor, not a season’s promise."
        ]
      },
      {
        "id": "tally",
        "type": "investigate",
        "targetId": "clue:relief-tally",
        "contentId": "clue:relief-tally",
        "amount": 1,
        "text": "Compare the physical relief stock with the published tally."
      },
      {
        "id": "petition",
        "type": "deliver",
        "targetId": "lady-adria-vale",
        "amount": 1,
        "text": "Carry the signed petition to Adria at the castle audience steps.",
        "dialogue": [
          "The signatures cross the river and the wards. That matters more than the number of seals.",
          "Tell me which obligation the crown should enforce first."
        ]
      },
      {
        "id": "decision",
        "type": "choice",
        "targetId": "lady-adria-vale",
        "amount": 1,
        "text": "Choose a binding relief reform at the royal audience.",
        "dialogue": [
          "This decision will change the city’s public accounts and who supervises the kitchens."
        ],
        "choices": [
          {
            "id": "charter",
            "text": "Guarantee household rations under a public relief charter.",
            "response": "The household charter will be posted in the Lower Ward. Kitchens receive a guaranteed allotment.",
            "flag": "relief-household-charter"
          },
          {
            "id": "joint",
            "text": "Create a joint merchant-worker council with open accounts.",
            "response": "Maela and Nella will sit together. Every reserve entry will be open to inspection.",
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
        "text": "Return to Mairin and explain the enacted reform.",
        "dialogue": [
          "No more erased entries? Then we can plan meals instead of pleading for them.",
          "Tovin is taking honest loads again. The people will remember whether the promise holds."
        ]
      },
      {
        "id": "closure",
        "type": "talk",
        "targetId": "renna-vale",
        "amount": 1,
        "text": "Close the petition with Renna and record the city’s decision.",
        "dialogue": [
          "Aldren records roads that stay open. I record promises that survive their makers.",
          "Your decision is entered into the charter, Leigneron. Now we have to live by it."
        ],
        "cinematicId": "city-resolution"
      }
    ]
  }
];
