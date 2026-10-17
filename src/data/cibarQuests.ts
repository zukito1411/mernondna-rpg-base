import type {QuestDefinition} from '../game/types';
export const CIBAR_QUEST:QuestDefinition={
  "id": "water-stops",
  "name": "When the Water Stops",
  "giverNpcId": "celia-brook",
  "summary": "The shared well has run dry, and the fields are turning brown. Find the missing pieces, mend the old pump, and help the growers share the water.",
  "rewardGold": 75,
  "rewardXp": 180,
  "objectives": [
    {
      "id": "grain-keeper",
      "type": "talk",
      "targetId": "celia-brook",
      "amount": 1,
      "text": "Speak with Celia beside the dry fields.",
      "dialogue": [
        "The pump broke before we finished watering the fields. People are already talking about selling seed just to buy water. I'm scared we won't have anything left to plant.",
        "Iren was there when it stopped. She might know what happened. Asha's trying to fix it, but some of the parts are missing."
      ]
    },
    {
      "id": "inspect-pump",
      "type": "investigate",
      "targetId": "cibar-pump",
      "contentId": "clue:cibar-pump",
      "amount": 1,
      "text": "Examine the old pump beside the shared well."
    },
    {
      "id": "field-report",
      "type": "talk",
      "targetId": "iren-copperwake",
      "amount": 1,
      "text": "Ask Iren what she saw near the pump.",
      "dialogue": [
        "It wasn't an accident. I saw someone messing with the pump, and then the copper parts were gone.",
        "I kept spare fittings in three of the old sheds. I'd go get them, but I can't leave the fields today."
      ]
    },
    {
      "id": "fittings",
      "type": "collect",
      "targetId": "cibar-fitting",
      "amount": 3,
      "text": "Search the three old stores for the pump fittings."
    },
    {
      "id": "delivery",
      "type": "deliver",
      "targetId": "asha-stonevein",
      "amount": 1,
      "text": "Bring the fittings to Asha at the well.",
      "dialogue": [
        "Oh, good. These will work. Give me a little time and I can get the pump running.",
        "Celia's worried we'll fight over the water again. Has anyone talked about who gets to use the pump first?"
      ]
    },
    {
      "id": "decision",
      "type": "choice",
      "targetId": "celia-brook",
      "amount": 1,
      "text": "Choose how the growers will share the water.",
      "dialogue": [
        "I don't want another argument at the well. How do we make sure nobody gets left out?"
      ],
      "choices": [
        {
          "id": "public",
          "text": "Set the turns together at the village well.",
          "response": "All right. We'll meet by the well and agree on the turns together.",
          "flag": "cibar-public-water"
        },
        {
          "id": "cooperative",
          "text": "Let the growers take turns tending the pump.",
          "response": "Iren can organize the repairs, and we'll take turns with the pump. That sounds fair.",
          "flag": "cibar-growers-cooperative"
        }
      ]
    },
    {
      "id": "repair-pump",
      "type": "investigate",
      "targetId": "cibar-pump",
      "contentId": "clue:cibar-pump",
      "amount": 1,
      "text": "Fit the new pieces and start the pump."
    },
    {
      "id": "return",
      "type": "talk",
      "targetId": "celia-brook",
      "amount": 1,
      "text": "Tell Celia the water is flowing again.",
      "dialogue": [
        "Can you hear that? It's running! Oh, thank goodness. I thought we'd lost this year's planting.",
        "I'll send some of the harvest to Oakmere when it's ready. They helped us when we needed it."
      ]
    }
  ]
};
