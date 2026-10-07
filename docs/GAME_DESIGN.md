# Mernodna Game Design Foundation

## Core promise

The player should feel that Mernodna is a place rather than a level list.

Leigneron can leave a town gate, follow a road for a long distance, cross wilderness and settlements, enter another realm, and eventually reach distant coasts without selecting a destination from a stage menu.

Mainland travel is primarily walking/riding. Island travel should become controllable sea travel.

## Player character

**Leigneron** is always the default protagonist.

The base deliberately centralizes editable backstory in `src/data/player.ts`. Future story design may deepen family history, origin, destiny, romance, rivalries and faction ties, but should not replace Leigneron with a generic unnamed avatar unless the user explicitly changes that direction.

## NPC authoring standard

Every important NPC should have at minimum:

- identity/name/title
- home town and region
- role in society
- role in gameplay
- specific connection to Leigneron
- trust/relationship state
- weapon or combat style if relevant
- schedule
- dialogue voice
- quests or story dependencies
- faction ties
- place(s) they can relocate to
- consequences if injured, killed, recruited, promoted or displaced

Avoid filler NPCs whose only definition is “shopkeeper.” A shopkeeper can also be a veteran, parent, smuggler contact, clan cousin, rival artisan, witness to a historic event, etc.

## Town authoring standard

Every meaningful settlement should have:

- reason it exists geographically
- economy/resources
- architecture matching its region
- local leadership
- shops/services
- laws/customs
- nearby threats
- roads/sea routes
- resident NPC network
- surrounding farms/mines/forests/fisheries/etc.
- at least one local conflict
- at least one way the world can change it

## Regions

### Trandum
Human kingdom; farms, roads, castles, cavalry, trade and political institutions. Good early-game region but not “safe tutorial land” forever.

### Narenthil
Elven forest realm; ancient woodland, archery, living architecture, myths, the White Stag, hidden roads and old magic.

### Nardorous
Mountain realm; snow roads, citadels, bridge-forts, hunters, harsh passes and the Sky Spear tradition.

### Rindass
Orcan drylands; clans, open steppe, boar riders, strongholds, markets and culturally distinct ideas of honor/law.

### Druganwoods
Dwarven forest/river territory; mines, bridges, runesmiths, river halls, deep roots and the Rootfather myth.

### Portquill
Maritime realm; ships, trade, harbors, islands, fishing, smugglers, storms and the Veiled Ferryman myth.

### Frostlands
Frozen islands; sea clans, longhouses, hunters, reindeer, harpoons, blizzards and frost wyrms.

### Darkav
Volcanic realm; obsidian cities, forges, ash wastes, drakes, raiders, cults and the Sleeping Fire.

## Open-world systems to build

### Ecology
Species have habitat, food, predator/prey relations, population capacity, activity hours, migration and seasonal response. Nearby animals use actor AI; distant populations update abstractly.

### Dynamic events
Events should be caused by world state where possible: bandit growth, migration, weather, faction tension, food shortages, boss activity and trade disruption.

### Bosses
Named bosses exist in the world and can affect regions. Some stay in lairs, some patrol territory, some migrate, some are mythic/non-hostile encounters.

### Settlements/economy
Food, wealth, security, trade routes and threats should eventually influence shop stock, prices, construction, refugees and quests.

### Factions
Regional governments, clans, guilds, cults, merchants, hunters, smugglers and outlaw groups need relationships with each other and Leigneron.

### Crime/law
Different realms can have different rules. Theft, violence, trespassing, poaching, smuggling and restricted magic can create local consequences rather than one global wanted meter.

### Weather/seasons
Weather changes visibility, travel, fire, sea danger, tracking and creature behavior. Seasons can change migration, harvests, routes and festivals.

## Combat direction

Realtime action combat. Equipment shapes abilities more than a rigid class selection.

The final system should support at least:

- swords
- sword + shield
- axes
- spears/polearms
- bows
- crossbows
- daggers/dual weapons
- staves/magic foci
- mounted combat where appropriate

Attacks need real hitboxes/hurtboxes, recovery windows, stamina, stagger and readable telegraphs.

## Exploration philosophy

Avoid covering the map with hundreds of omniscient question marks. Locations can be learned through:

- seeing them
- NPC directions
- maps bought/found
- rumors
- landmarks
- road signs
- quests
- surveying high ground

Fast travel, when added, should be earned through in-world infrastructure such as coaches, ships, caravans, waystones or other lore-consistent systems.
