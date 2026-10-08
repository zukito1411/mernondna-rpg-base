import type {QuestDefinition} from '../game/types';
export const CIBAR_QUEST:QuestDefinition={
  "id": "water-stops",
  "name": "When the Water Stops",
  "giverNpcId": "celia-brook",
  "summary": "A failed irrigation pump threatens the southern seed allotment. Trace the failure, recover stored fittings, and decide how the repaired system should serve the families who rely on it.",
  "rewardGold": 75,
  "rewardXp": 180,
  "objectives": [
    {
      "id": "grain-keeper",
      "type": "talk",
      "targetId": "celia-brook",
      "amount": 1,
      "text": "Hear Celia’s account of the dry irrigation turns.",
      "dialogue": [
        "The pump stopped before the eastern plots were watered. If the seed stock is used as wages, we will repair the channel and still go hungry.",
        "Inspect the pump. Iren marked the storage caches; Asha needs the fittings, not a new battle."
      ]
    },
    {
      "id": "inspect-pump",
      "type": "investigate",
      "targetId": "cibar-pump",
      "contentId": "clue:cibar-pump",
      "amount": 1,
      "text": "Inspect the irrigation pump beside the shared well."
    },
    {
      "id": "field-report",
      "type": "talk",
      "targetId": "iren-copperwake",
      "amount": 1,
      "text": "Compare Iren’s field report with the pump damage.",
      "dialogue": [
        "The intake was blocked, not broken by an animal. Someone held back the copper fittings to raise the price of water.",
        "The three marked stores still contain the pieces we need. Take one fitting from each and deliver them to Asha."
      ]
    },
    {
      "id": "fittings",
      "type": "collect",
      "targetId": "cibar-fitting",
      "amount": 3,
      "text": "Recover fittings from the grain, west-field and east-field stores."
    },
    {
      "id": "delivery",
      "type": "deliver",
      "targetId": "asha-stonevein",
      "amount": 1,
      "text": "Deliver the three fittings to Asha.",
      "dialogue": [
        "Every seal is intact. They were stockpiled while the families waited. I can repair this without taking a single seed sack.",
        "Should the water turns be managed as a public allotment or by the growers’ cooperative?"
      ]
    },
    {
      "id": "decision",
      "type": "choice",
      "targetId": "celia-brook",
      "amount": 1,
      "text": "Choose who will keep the shared water-turn records.",
      "dialogue": [
        "Both groups can maintain the pump. The question is who can be held to account when the fields are dry."
      ],
      "choices": [
        {
          "id": "public",
          "text": "Post a public household water-turn schedule.",
          "response": "The turns will be posted beside the well for every family to inspect.",
          "flag": "cibar-public-water"
        },
        {
          "id": "cooperative",
          "text": "Let the growers’ cooperative keep open records.",
          "response": "Iren and the growers will rotate the keeper. The tally remains open to everyone.",
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
      "text": "Return to the pump and install Asha’s repaired fittings."
    },
    {
      "id": "return",
      "type": "talk",
      "targetId": "celia-brook",
      "amount": 1,
      "text": "Report the restored irrigation to Celia.",
      "dialogue": [
        "The turns are running again, and the seed reserve is still seed. That is a repair worth remembering.",
        "Tell Nella the southern plots will send their promised grain. We will not forget who kept the road honest."
      ]
    }
  ]
};
