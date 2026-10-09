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
        "The pump stopped before the eastern fields were watered. If we trade away our seed to buy water, we will have nothing to plant.",
        "Look at the pump, then find Iren. Asha can mend it if we bring her the missing pieces."
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
        "The pump was stopped by a hand, not a beast. Someone hid the copper pieces so we would pay dearly for every drop.",
        "I hid spares in three old stores. Find them, and Asha can set the water running again."
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
        "These are the right pieces. I can mend the pump without taking a single seed sack.",
        "When the water flows again, who should see that every field gets its turn?"
      ]
    },
    {
      "id": "decision",
      "type": "choice",
      "targetId": "celia-brook",
      "amount": 1,
      "text": "Choose how the growers will share the water.",
      "dialogue": [
        "Every family needs water, and every family must have a say."
      ],
      "choices": [
        {
          "id": "public",
          "text": "Set the turns together at the village well.",
          "response": "We will meet at the well each week and make sure no field is forgotten.",
          "flag": "cibar-public-water"
        },
        {
          "id": "cooperative",
          "text": "Let the growers take turns tending the pump.",
          "response": "Iren and the growers will share the work. The water belongs to all of us.",
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
        "Listen—the water is running again. We can plant before the sun dries the earth.",
        "Tell Agnes we will share our harvest with Oakmere. Folk who stand by us in hard times deserve our thanks."
      ]
    }
  ]
};
