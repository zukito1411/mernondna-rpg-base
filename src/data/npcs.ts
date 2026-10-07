import type { NpcDefinition } from '../game/types';

export const NPCS: NpcDefinition[] = [
  {
    id: 'aldren-vale', name: 'Aldren Vale', title: 'Retired Roadwarden', townId: 'oakmere', role: 'Leigneron’s mentor and first combat teacher', spriteFrame: 0, spriteTexture:'npc_general',
    worldOffset: { x: -120, y: 80 }, weaponId: 'oak-shield-blade', combatant: true,
    schedule: [{ startHour: 6, activity: 'Trains beside the west fence' }, { startHour: 10, activity: 'Patrols Oakmere roads' }, { startHour: 18, activity: 'Eats at the inn' }, { startHour: 21, activity: 'Returns home' }],
    relationshipToLeigneron: { kind: 'mentor', trust: 85, summary: 'Aldren taught Leigneron swordwork, roadcraft, and how to read danger before drawing steel.' },
    dialogue: [
      'You are old enough to choose your own road now, Leigneron. That does not mean you should choose it carelessly.',
      'The eastern watchtower has gone quiet. Caravans are turning back, and that means trouble will reach Oakmere soon.',
      'Take your sword. Find out who holds the tower, and come back alive. I would rather scold you than bury you.'
    ],
    questIds: ['first-road'],
  },
  {
    id: 'mira-fen', name: 'Mira Fen', title: 'Herbalist Scout', townId: 'oakmere', role: 'Childhood friend, field scout, and early exploration companion', spriteFrame: 0, spriteTexture:'npc_huntress',
    worldOffset: { x: 150, y: 120 }, weaponId: 'narenthil-longbow', combatant: true,
    schedule: [{ startHour: 5, activity: 'Collects herbs north of Oakmere' }, { startHour: 11, activity: 'Works at the herb stall' }, { startHour: 17, activity: 'Practices archery' }, { startHour: 20, activity: 'Visits the inn' }],
    relationshipToLeigneron: { kind: 'friend', trust: 78, summary: 'Mira and Leigneron grew up taking the same roads, daring each other to travel farther every season.' },
    dialogue: ['You always look at the horizon like it owes you an answer.', 'If you head east, watch the tree line. Wolves have been ranging closer to the farms than usual.'],
    questIds: [],
  },
  {
    id: 'joren-pike', name: 'Joren Pike', title: 'Village Blacksmith', townId: 'oakmere', role: 'Blacksmith, weapon repairer, and family friend', spriteFrame: 0, spriteTexture:'npc_blacksmith',
    worldOffset: { x: 210, y: -120 }, weaponId: 'roadwarden-sword', combatant: true,
    schedule: [{ startHour: 6, activity: 'Opens the forge' }, { startHour: 12, activity: 'Trades and repairs equipment' }, { startHour: 19, activity: 'Closes the forge' }],
    relationshipToLeigneron: { kind: 'family-friend', trust: 72, summary: 'Joren repaired Leigneron’s first practice blade and has known the family for years.' },
    dialogue: ['A blade remembers bad maintenance longer than a swordsman does.', 'Bring me good ore from the east and I can make that old roadwarden sword bite harder.'],
    questIds: [],
  },
  {
    id: 'elara-voss', name: 'Elara Voss', title: 'Oakmere Guard Captain', townId: 'oakmere', role: 'Local authority, tactical ally, and gatekeeper to official Trandum contracts', spriteFrame: 0, spriteTexture: 'npc_guard',
    worldOffset: { x: -220, y: -130 }, weaponId: 'oak-shield-blade', combatant: true,
    schedule: [{ startHour: 5, activity: 'Inspects the village gate' }, { startHour: 9, activity: 'Runs the guard post' }, { startHour: 17, activity: 'Patrols farms' }, { startHour: 22, activity: 'Night watch rotation' }],
    relationshipToLeigneron: { kind: 'authority', trust: 45, summary: 'Elara respects Leigneron’s instincts but distrusts reckless heroics and expects results.' },
    dialogue: ['Aldren may indulge you. I will not.', 'If you want the guard to treat you like a roadwarden, bring me roadwarden results.'],
    questIds: [],
  },
  {
    id: 'orin-bell', name: 'Orin Bell', title: 'Shrine Keeper', townId: 'oakmere', role: 'Lorekeeper who introduces myths, omens, and the deeper history of Mernodna', spriteFrame: 0, spriteTexture: 'npc_woman',
    worldOffset: { x: 20, y: -200 }, weaponId: 'darkav-emberstaff',
    schedule: [{ startHour: 6, activity: 'Lights the road shrine' }, { startHour: 9, activity: 'Records travelers and omens' }, { startHour: 18, activity: 'Evening rites' }],
    relationshipToLeigneron: { kind: 'mystery', trust: 62, summary: 'Orin knows more about Leigneron’s inherited compass than he is willing to explain at the start.' },
    dialogue: ['Your compass is pointing again, is it not?', 'Do not assume a compass always points north. Some point toward unfinished stories.'],
    questIds: [],
  },
  {
    id: 'torren-ashfield', name: 'Torren Ashfield', title: 'Caravan Master', townId: 'oakmere', role: 'Merchant contact who connects Oakmere to distant towns and trade routes', spriteFrame: 0, spriteTexture:'npc_adventurer',
    worldOffset: { x: -280, y: 30 }, weaponId: 'roadwarden-sword', combatant: true,
    schedule: [{ startHour: 7, activity: 'Checks wagons' }, { startHour: 10, activity: 'Trades in the square' }, { startHour: 15, activity: 'Leaves on short caravan runs' }, { startHour: 20, activity: 'Returns to the inn when in town' }],
    relationshipToLeigneron: { kind: 'family-friend', trust: 65, summary: 'Torren knew Leigneron’s family through years of road trade and carries stories from across Mernodna.' },
    dialogue: ['Roads are honest, lad. It is people who lie about where they lead.', 'Clear the eastern route and I can start sending wagons toward Willowcross again.'],
    questIds: [],
  },
  {
    id: 'silas-crowe', name: 'Silas Crowe', title: 'Hunter', townId: 'oakmere', role: 'Friendly rival whose choices can push hunting and ecology systems in different directions', spriteFrame: 0, spriteTexture:'npc_adventurer',
    worldOffset: { x: 285, y: 15 }, weaponId: 'narenthil-longbow', combatant: true,
    schedule: [{ startHour: 4, activity: 'Leaves to hunt' }, { startHour: 14, activity: 'Returns with game' }, { startHour: 18, activity: 'Trades hides' }],
    relationshipToLeigneron: { kind: 'rival', trust: 50, summary: 'Silas and Leigneron compete constantly, but neither would leave the other bleeding on a road.' },
    dialogue: ['You took the easy trail again, did you?', 'The wolves are hungry because somebody scared the deer south. Kill every wolf you see and you will make a different problem.'],
    questIds: [],
  },
  {
    id: 'sena-marrow', name: 'Sena Marrow', title: 'Innkeeper', townId: 'oakmere', role: 'Rumor hub, local social anchor, and source of event leads', spriteFrame: 0, spriteTexture:'npc_attendant',
    worldOffset: { x: 85, y: 220 },
    schedule: [{ startHour: 6, activity: 'Prepares breakfast' }, { startHour: 9, activity: 'Runs the inn' }, { startHour: 19, activity: 'Serves travelers and gathers rumors' }, { startHour: 1, activity: 'Closes the common room' }],
    relationshipToLeigneron: { kind: 'ally', trust: 70, summary: 'Sena has watched Leigneron grow up and hears half the realm pass through her common room.' },
    dialogue: ['If you want news, sit where travelers loosen their belts and their tongues.', 'Someone from Willowcross arrived before dawn. No wagon. No horse. That usually means the road took the rest.'],
    questIds: [],
  },
];

export const NPC_BY_ID = Object.fromEntries(NPCS.map((npc) => [npc.id, npc])) as Record<string, NpcDefinition>;
