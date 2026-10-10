import type { NpcDefinition } from '../game/types';

type Culture = 'english' | 'welsh' | 'norse' | 'iberian' | 'german';

const FIRST_NAMES: Record<Culture, { women: string[]; men: string[] }> = {
  english: {
    women: [
      'Alice', 'Avice', 'Agnes', 'Aline', 'Amice', 'Anne', 'Beatrice', 'Cecily', 'Christiana', 'Clarice',
      'Eleanor', 'Elizabeth', 'Emma', 'Etheldreda', 'Felicia', 'Hawise', 'Isabel', 'Joan', 'Juliana', 'Katherine',
      'Lucy', 'Margaret', 'Margery', 'Matilda', 'Maud', 'Millicent', 'Petronilla', 'Philippa', 'Rohese',
      'Rose', 'Sarah', 'Sybil', 'Agatha', 'Audrey', 'Bridget', 'Constance', 'Edith', 'Emeline',
      'Gunnora', 'Idonea', 'Mabel', 'Muriel', 'Osyth', 'Petra', 'Sabina', 'Wymarca',
    ],
    men: [
      'Adam', 'Alan', 'Alexander', 'Andrew', 'Baldwin', 'Bartholomew', 'Benedict', 'Bertram', 'Edmund',
      'Edward', 'Everard', 'Eustace', 'Geoffrey', 'Gilbert', 'Godfrey', 'Guy', 'Hamon', 'Henry', 'Hugh',
      'John', 'Jordan', 'Laurence', 'Martin', 'Matthew', 'Nicholas', 'Osbert', 'Peter', 'Philip', 'Ralph',
      'Ranulf', 'Reginald', 'Richard', 'Robert', 'Roger', 'Simon', 'Stephen', 'Thomas', 'Walter', 'William',
      'Wulfric', 'Anselm', 'Bartholomew', 'Clement', 'Edgar', 'Giles', 'Miles', 'Payn', 'Reynold', 'Warin',
    ],
  },
  welsh: {
    women: [
      'Angharad', 'Branwen', 'Bronwen', 'Catrin', 'Cerys', 'Elin', 'Elen', 'Gwenllian', 'Gwenhwyfar',
      'Lowri', 'Mabli', 'Nesta', 'Nest', 'Nerys', 'Olwen', 'Sioned', 'Siwan', 'Tegwen', 'Dyddgu',
      'Efa', 'Gwen', 'Heledd', 'Lleucu', 'Morfudd', 'Rhiannon', 'Rhian', 'Sioned', 'Tudurwen',
    ],
    men: [
      'Caradoc', 'Dafydd', 'Gruffudd', 'Goronwy', 'Iorwerth', 'Llywelyn', 'Madoc', 'Meilyr', 'Owain',
      'Rhys', 'Rhydderch', 'Sion', 'Tudur', 'Cadell', 'Cynan', 'Einion', 'Geraint', 'Hywel', 'Idnerth',
      'Llywarch', 'Maredudd', 'Morgan', 'Rhodri', 'Seisyll', 'Trahaearn', 'Yorwerth',
    ],
  },
  norse: {
    women: [
      'Aasa', 'Astrid', 'Aslaug', 'Aud', 'Bergljot', 'Eydis', 'Freydis', 'Gudrun', 'Gunnhild', 'Helga',
      'Inga', 'Ingibjorg', 'Ragnhild', 'Sigrid', 'Solveig', 'Thora', 'Thurid', 'Tove', 'Alfhild',
      'Bodil', 'Brynhild', 'Estrid', 'Gyrid', 'Halla', 'Runa', 'Signy', 'Svanhild', 'Tora',
    ],
    men: [
      'Arnfinn', 'Asbjorn', 'Eirik', 'Gunnar', 'Harald', 'Hakon', 'Halfdan', 'Knut', 'Leif', 'Magnus',
      'Olaf', 'Ragnvald', 'Sigurd', 'Sten', 'Thorvald', 'Ulf', 'Ivar', 'Bjorn', 'Eystein', 'Gorm',
      'Ketil', 'Rolf', 'Svein', 'Thorkell', 'Trygve', 'Vigfus',
    ],
  },
  iberian: {
    women: [
      'Aldonza', 'Beatriz', 'Elvira', 'Ines', 'Jimena', 'Leonor', 'Mayor', 'Mencia', 'Sancha', 'Teresa',
      'Urraca', 'Constanza', 'Isabel', 'Maria', 'Toda', 'Velasquita', 'Aurembiaix', 'Blanca', 'Catalina',
      'Eilo', 'Loba', 'Munia', 'Orraca', 'Petronila', 'Sol',
    ],
    men: [
      'Alfonso', 'Alonso', 'Diego', 'Fernan', 'Garcia', 'Gonzalo', 'Lope', 'Martin', 'Nuno', 'Pelayo',
      'Rodrigo', 'Sancho', 'Velasco', 'Alvar', 'Bermudo', 'Gutierre', 'Ordonez', 'Ramiro', 'Suero',
      'Vermudo', 'Arias', 'Beltran', 'Froila', 'Munio', 'Nuño',
    ],
  },
  german: {
    women: [
      'Adelheid', 'Agnes', 'Bertha', 'Gertrud', 'Hedwig', 'Hildegard', 'Irmgard', 'Mathilde', 'Oda',
      'Richenza', 'Uta', 'Adeliza', 'Alheid', 'Gisela', 'Judith', 'Liutgard', 'Mechthild', 'Ottilie',
      'Rixa', 'Sophia', 'Theodora', 'Williburg',
    ],
    men: [
      'Albrecht', 'Arnold', 'Dietrich', 'Eberhard', 'Friedrich', 'Heinrich', 'Konrad', 'Manfred', 'Otto',
      'Ulrich', 'Walther', 'Werner', 'Adalbert', 'Berthold', 'Bruno', 'Ekkehard', 'Gottfried', 'Hartmann',
      'Ludwig', 'Reinhard', 'Rudolf', 'Siegfried', 'Welf',
    ],
  },
};

const CURATED_NAMES: Record<string, string> = {
  'aldren-vale': 'Edmund Atwood',
  'mira-fen': 'Alice Fen',
  'joren-pike': 'William Fletcher',
  'elara-voss': 'Joan Voss',
  'orin-bell': 'Etheldreda Bell',
  'torren-ashfield': 'Hugh Ashfield',
  'silas-crowe': 'Roger Crowe',
  'sena-marrow': 'Hawise Marlow',
  'nella-brook': 'Agnes Brook',
  'mairin-reed': 'Margery Reed',
  'tovin-reed': 'Thomas Reed',
  'pell-rusk': 'Peter Russell',
  'sevrin-hale': 'Walter Hale',
  'lady-adria-vale': 'Matilda Atwood',
  'renna-vale': 'Cecily Atwood',
  'captain-yselle-ward': 'Isabel Ward',
  'ser-caldus-rowe': 'Geoffrey Rowe',
  'barric-thorne': 'Robert Thorne',
  'iven-harrow': 'Simon Harrow',
  'nella-harrow': 'Bridget Harrow',
  'maela-quill': 'Beatrice Piper',
  'davin-bridge': 'John Carter',
  'tamsin-reed': 'Edith Reed',
  'starhold-templar': 'Elspeth MacRae',
};

const SURNAME_REPLACEMENTS: Record<string, string> = {
  Vale: 'Atwood',
  Pike: 'Fletcher',
  Marrow: 'Marlow',
  Merrow: 'Fisher',
  Quill: 'Piper',
  Rusk: 'Russell',
  Thorneleaf: 'Vaughan',
  Virdan: 'Bowen',
  Mosswalk: 'Marsh',
  Skell: 'Sinclair',
  Halla: 'MacRae',
  Flintmane: 'Navarro',
  Ashhand: 'Alonso',
  Copperwake: 'Ferrier',
  Stonevein: 'Mason',
  Gull: 'Seale',
  Icevein: 'Muir',
  Cinder: 'Weber',
  Emberfall: 'Keller',
  Beacon: 'Hayward',
  Brass: 'Cooper',
  Loom: 'Weaver',
  Lorn: 'Lane',
};

const CULTURE_BY_TOWN: Record<string, Culture> = {
  elarion: 'welsh',
  moonfall: 'welsh',
  starhold: 'norse',
  skallheim: 'norse',
  redmesa: 'iberian',
  blackspire: 'german',
};

const TITLE_OVERRIDES: Record<string, string> = {
  'davin-bridge': 'Bridge Warden',
  'renna-vale': 'Keeper of the Royal Library',
  'sevrin-hale': 'Royal Grain Steward',
  'barric-thorne': 'Keeper of the King’s Stores',
  'tovin-reed': 'Grain Carter',
};

const FEMALE_GIVEN_NAMES = new Set([
  'Adria', 'Aeris', 'Anwen', 'Assa', 'Asha', 'Bela', 'Bera', 'Bess', 'Bessa', 'Celia', 'Dessa', 'Eda',
  'Edith', 'Elara', 'Enna', 'Freya', 'Ilyra', 'Iren', 'Jessa', 'Ketra', 'Kora', 'Lethra', 'Lina', 'Lysa',
  'Judit', 'Kelda', 'Maela', 'Mairin', 'Maren', 'Mara', 'Mella', 'Melwen', 'Meral', 'Mira', 'Miren', 'Morga',
  'Nella', 'Neris', 'Nia', 'Pella',
  'Raga', 'Renna', 'Runa', 'Sena', 'Sera', 'Signe', 'Suri', 'Tamsin', 'Tessa', 'Tilda', 'Tova', 'Ugra',
  'Vexa', 'Wenna', 'Yselle', 'Faye', 'Torga', 'Edda', 'Hestia', 'Sella',
]);

const CULTURE_LINES: Record<Culture, string[]> = {
  english: [
    'Crows have been circling the old watchtower again. They know a lonely road before we do.',
    'The east road is quiet, but no one here mistakes silence for peace.',
    'A traveler swore he saw a lantern moving through the trees where no path runs.',
    'The rain brought hoofprints to the lane, then washed away every trace of where they led.',
    'Keep a candle in the window tonight. There are folk still trying to find their way home.',
    'The old stones bear a mark I have never seen. It was not there at sunrise.',
  ],
  welsh: [
    'The old stones hum after moonrise; my gran swore they answer to a name long forgotten.',
    'A pale light wandered beneath the boughs last night. No lantern casts a shadow like that.',
    'The stream runs clear again, yet the fish still flee from the standing stones.',
    'The forest path has moved. I walked it since childhood, and it led me somewhere new.',
    'Someone left a white feather on the shrine. There are no birds that pale in these woods.',
    'The wind fell still at dusk, but something kept walking through the leaves.',
  ],
  norse: [
    'The beacon burned blue before dawn. No hand in this hold lit it.',
    'There is a second set of tracks beside the pass, though no one came down the mountain.',
    'The snow hides many things. It never hides the sound of a hungry beast.',
    'A horn sounded from the ridge last night. No watchman claims to have blown it.',
    'The pines groan in calm weather now. I do not like what answers them.',
    'The old cairn has been opened. Whatever rested there should have been left in peace.',
  ],
  iberian: [
    'The well water turned bitter overnight. No one has found what lies beneath the stones.',
    'Riders crossed the mesa at dusk, but their tracks ended on bare rock.',
    'The shrine bell rang in a windless night. The keeper swears no one touched it.',
    'A stranger left a black feather by the gate and vanished before the dawn watch.',
    'The dry creek carries fresh footprints. Something has found a road beneath the earth.',
    'The old hill glows red after sundown. That is no sunset, and we all know it.',
  ],
  german: [
    'A red light burns in the mountain long after the furnaces go cold.',
    'The forge hammers fell silent at midnight. Every smith heard a voice beneath the floor.',
    'Someone has marked the gate with a sign older than this town. No one will claim it.',
    'Ash fell from a clear sky this morning. The wind came from the mountain.',
    'The dogs will not go near the western road. I would heed them.',
    'There is a warm breath in the mine, though the lower shafts have been sealed for years.',
  ],
};

const PROFESSION_LINES: Array<{ match: RegExp; lines: string[] }> = [
  { match: /guard|captain|sentinel|watch|warden|templar|soldier|patrol|knight/i, lines: [
    'A good watch hears trouble while it is still a whisper. Keep to the lit road after dusk.',
    'I have seen no honest traveler since first light. That is what troubles me.',
    'Steel is for the road’s dangers, not for frightening the folk we swore to protect.',
    'The western gate is barred at sundown. If you are not home by then, find a hearth and wait for dawn.',
  ] },
  { match: /smith|forge|blacksmith|forgewright|chainwright/i, lines: [
    'A sound blade is made slowly. Bring it back chipped, and I will know where you have been.',
    'The forge is hot, the iron is honest, and the road keeps testing both.',
    'I can mend a sword. The hand that swings it must learn the rest.',
    'Hear that ring? Good iron sings true. A cracked blade only waits for the wrong moment.',
  ] },
  { match: /herbal|healer|garden|healing|remed/i, lines: [
    'I keep the bitter herbs near the door. They are the ones folk need in a hurry.',
    'A poultice can close a wound; a quiet night is harder to come by.',
    'The leaves have turned before their season. Something is wrong beyond the fields.',
  ] },
  { match: /innkeeper|host|kitchen|cook|baker|provision/i, lines: [
    'There is broth by the hearth. Sit a while before the road takes your strength.',
    'A warm bed costs less than a cold grave. Stay until the weather breaks.',
    'Tell me what you heard out there. A good rumor has saved more lives than a sharp knife.',
  ] },
  { match: /hunter|ranger|bowyer|fletcher|archer/i, lines: [
    'The deer have left their usual ground. Something is driving them toward the road.',
    'Keep your eyes above the trail. The woods are full of things that watch from cover.',
    'I found a fresh track where no beast should be. It was walking on two legs.',
  ] },
  { match: /farmer|grower|seed|field|orchard|herds|drover|fodder/i, lines: [
    'A good harvest asks for rain and patience. We have had more of the latter this year.',
    'The birds fled the southern fields all at once. I have never seen them do that.',
    'The soil is sound, but the well has begun to taste of iron.',
  ] },
  { match: /merchant|trader|market|broker|factor|caravan|fishmonger|chandler|wainwright/i, lines: [
    'The road is worth more than any purse, if it brings folk home safely.',
    'I have seen wagons return empty from the east. No driver will tell me why.',
    'A stranger offered gold for a map of the old paths. I sent him on his way.',
    'No bargain is worth a life. Remember that when the road grows dark.',
  ] },
  { match: /library|librarian|archive|book|lorekeeper/i, lines: [
    'The oldest books speak of a darkness under the hills. Their pages grow warm when the moon is high.',
    'I found a name scratched from the old tales. The ink around it is still wet.',
    'Some histories are kept in stone, where no fire can take them. Go and see what the ruins remember.',
  ] },
  { match: /bridge|boatwright|ferryman|sailmaker|harbor|quay|ship|port|porter|cargo|fish cur/i, lines: [
    'A bridge can carry an army, or bring a hungry child home. Both deserve tending.',
    'The river is carrying black leaves from upriver. I have never seen the current move that way.',
    'The tide brought a broken oar to shore. Its owner has not come looking for it.',
  ] },
  { match: /runner|courier|delivery|messenger|carter|fletcher|way|path|household|ward/i, lines: [
    'I know every back lane in this town. Lately, one of them has been ending somewhere new.',
    'I carry bread by day and warnings by night. Both have to arrive before it is too late.',
    'A stranger asked me to guide him past the old stones. I did not like the look in his eyes.',
  ] },
  { match: /beastmaster|rider|horse|stable|mount|rope maker|ropemaker|climber/i, lines: [
    'The horses will not drink from the north trough. Animals sense what we try to ignore.',
    'A frayed rope is worse than no rope at all when the mountain gives way.',
    'The mounts grow restless at dusk. Something is moving beyond the pens.',
  ] },
  { match: /weaver|cloth|spinner|netmender|carpenter|woodcutter|toolwright|craft|mason/i, lines: [
    'A good seam holds through any storm. I have patched cloaks for folk who never came back.',
    'I found a splinter of black glass in the workyard. It burned cold against my palm.',
    'Mending a broken thing takes patience. Mending a broken promise takes longer.',
  ] },
  { match: /grain|store|warehouse|steward|supply|stock|granary/i, lines: [
    'A full storehouse can still leave an empty bowl. I will not let that happen here.',
    'The flour sacks came in light this morning. Someone is taking more than their share.',
    'I heard a cart leave after the gate was barred. Its driver did not stop when I called.',
  ] },
  { match: /drill|instructor|training|practice|coach/i, lines: [
    'A blade is quick; a steady hand is quicker. Again, and mind your footing.',
    'Strength without care is just another danger on the road.',
    'You will meet no straw dummy out there. Learn to stop your strike as well as start it.',
  ] },
  { match: /priest|shrine|monk|sister|lorekeeper|temple|acolyte/i, lines: [
    'The candle guttered though the chapel doors were shut. I took it for a warning.',
    'Some prayers are answered with silence. Listen closely; that is not always the same as no.',
    'The oldest stone bears a name the books have forgotten. The ground has not.',
  ] },
];

function hash(value: string): number {
  let result = 2166136261;
  for (const character of value) result = Math.imul(result ^ character.charCodeAt(0), 16777619);
  return result >>> 0;
}

function firstName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts[0] === 'Sister' || parts[0] === 'Lady' || parts[0] === 'Ser' ? parts[1] ?? parts[0] : parts[0];
}

function surname(name: string): string {
  const parts = name.trim().split(/\s+/);
  return SURNAME_REPLACEMENTS[parts.at(-1) ?? ''] ?? parts.at(-1) ?? '';
}

function cultureFor(npc: NpcDefinition): Culture {
  return CULTURE_BY_TOWN[npc.townId] ?? 'english';
}

function makeName(npc: NpcDefinition, used: Set<string>, reserved: Set<string>): string {
  const curated = CURATED_NAMES[npc.id];
  if (curated) {
    const [given, family] = curated.split(' ');
    used.add(given.toLowerCase());
    return `${given} ${family}`;
  }

  const oldGiven = firstName(npc.name);
  const female = FEMALE_GIVEN_NAMES.has(oldGiven) || ['npc_woman', 'npc_huntress'].includes(npc.spriteTexture ?? '');
  const culture = cultureFor(npc);
  const gender = female ? 'women' : 'men';
  const local = FIRST_NAMES[culture][gender];
  const fallbacks = Object.values(FIRST_NAMES).flatMap((names) => names[gender])
    .filter((name, index, all) => all.indexOf(name) === index && !local.includes(name));
  const start = hash(npc.id) % local.length;
  const candidates = [...local.slice(start), ...local.slice(0, start), ...fallbacks];
  let given = '';
  for (let offset = 0; offset < candidates.length; offset += 1) {
    const candidate = candidates[(start + offset) % candidates.length];
    if (!used.has(candidate.toLowerCase()) && !reserved.has(candidate.toLowerCase())) {
      given = candidate;
      break;
    }
  }
  if (!given) throw new Error(`No unused medieval given name is available for NPC ${npc.id}.`);
  used.add(given.toLowerCase());
  return `${given} ${surname(npc.name)}`;
}

function makeDialogue(npc: NpcDefinition): string[] {
  const seed = hash(npc.id);
  const culture = cultureFor(npc);
  const occupation = PROFESSION_LINES.find(({ match }) => match.test(`${npc.title} ${npc.role}`));
  const first = occupation?.lines[seed % occupation.lines.length]
    ?? 'The road is long, and a kind word can be worth more than a full purse.';
  const second = CULTURE_LINES[culture][Math.floor(seed / 17) % CULTURE_LINES[culture].length];
  return [first, second];
}

function makeAliases(npcs: readonly NpcDefinition[], namesById: ReadonlyMap<string, string>): Map<string, string> {
  const aliases = new Map<string, string>();
  const firstNameTargets = new Map<string, Set<string>>();
  for (const npc of npcs) {
    const replacement = namesById.get(npc.id);
    if (!replacement) continue;
    aliases.set(npc.name.toLowerCase(), replacement);
    const oldGiven = firstName(npc.name).toLowerCase();
    const newGiven = replacement.split(' ')[0];
    const targets = firstNameTargets.get(oldGiven) ?? new Set<string>();
    targets.add(newGiven);
    firstNameTargets.set(oldGiven, targets);
    const oldSurname = npc.name.split(/\s+/).at(-1) ?? '';
    const newSurname = surname(npc.name);
    if (oldSurname !== newSurname) aliases.set(oldSurname.toLowerCase(), newSurname);
  }
  for (const [oldGiven, targets] of firstNameTargets) {
    if (targets.size === 1) aliases.set(oldGiven, [...targets][0]);
  }
  aliases.set('sister halla', namesById.get('starhold-templar') ?? 'Elspeth MacRae');
  aliases.set('halla', 'Elspeth');
  return aliases;
}

const STABLE_ID_KEYS = new Set([
  'id', 'giverNpcId', 'targetId', 'contentId', 'questTargetId', 'questEventType', 'discoveryId',
  'npcId', 'questIds', 'townId', 'regionId', 'bossId', 'prerequisiteQuestId', 'nextQuestId',
  'flag', 'kind', 'type', 'cinematicId',
]);

function replaceNames(value: unknown, aliases: ReadonlyMap<string, string>): unknown {
  if (typeof value === 'string') {
    const alternatives = [...aliases.keys()].sort((a, b) => b.length - a.length).map((name) =>
      name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = new RegExp(`\\b(${alternatives.join('|')})\\b`, 'gi');
    return value.replace(pattern, (match) => aliases.get(match.toLowerCase()) ?? match);
  }
  if (Array.isArray(value)) return value.map((entry) => replaceNames(entry, aliases));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [
      key,
      STABLE_ID_KEYS.has(key) ? entry : replaceNames(entry, aliases),
    ]));
  }
  return value;
}

export function prepareNpcPresentation(npcs: NpcDefinition[]): Map<string, string> {
  const reserved = new Set(Object.values(CURATED_NAMES).map((name) => name.split(' ')[0].toLowerCase()));
  const used = new Set<string>();
  const namesById = new Map<string, string>();
  for (const npc of npcs) namesById.set(npc.id, makeName(npc, used, reserved));
  const assignedNames = [...namesById.values()].map((name) => name.toLowerCase());
  if (new Set(assignedNames).size !== assignedNames.length) {
    throw new Error('NPC display names must be unique after applying the medieval naming palette.');
  }
  const aliases = makeAliases(npcs, namesById);

  for (const npc of npcs) {
    const newName = namesById.get(npc.id)!;
    const updated = replaceNames(npc, aliases) as NpcDefinition;
    Object.assign(npc, updated);
    npc.name = newName;
    npc.title = TITLE_OVERRIDES[npc.id] ?? npc.title;
    npc.dialogue = makeDialogue(npc);
  }
  return aliases;
}

export function rewriteNpcMentions<T>(value: T, aliases: ReadonlyMap<string, string>): T {
  return replaceNames(value, aliases) as T;
}
