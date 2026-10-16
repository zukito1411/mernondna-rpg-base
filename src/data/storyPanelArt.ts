/** Shared by the canvas curtain and HTML overlay; keep both fades in step. */
export const CINEMATIC_FADE_MS=360;

// These pages share the approved 1672 × 941 three-column layout. Insets stay
// inside the ink borders; SVG clipping keeps adjacent panels out of view even
// when a narrow phone letterboxes the art. The prologue retains its own crops.
const storyRegions=[[10,10,520,921],[552,10,571,921],[1146,10,516,921]] as const;
const page=(id:string,title:string,descriptions:readonly [string,string,string])=>({
  title,path:`assets/cinematics/story/${id}-v1.png`,width:1672,height:941,
  panels:descriptions.map((description,index)=>({description,region:storyRegions[index]})),
});

/** Scene-local raster pages. Nothing here is loaded by BootScene or ordinary
 * dialogue, and no artwork path is serialized into player saves. */
export const STORY_PANEL_ART={
  'prologue-waiting':{
    title:'The Child Who Waited',path:'assets/cinematics/roadborn-opening/prologue-waiting-v1.png',width:1672,height:941,
    panels:[
      {region:[10,10,520,921],description:'Young Leigneron waits by a rain-streaked window at Marrow Inn, beside an untouched bowl of soup.'},
      {region:[552,10,571,921],description:'A covered wagon approaches through the rain. Leigneron rises from his chair, hopeful.'},
      {region:[1146,10,516,921],description:'The travelers are strangers. Leigneron lowers his eyes as the innkeeper welcomes them.'},
    ],
  },
  'varr-survey':page('varr-survey','A Survey Worth Stealing',[
    'Leigneron examines the sealed dispatch beside a rescued carter’s wagon.',
    'Captain Varr holds the ruined watchtower among confiscated cargo.',
    'A wax-sealed packet and the recovered road survey lie inside Varr’s cargo chest.',
  ]),
  'highmere-arrival':page('highmere-arrival','A Seal Bought in Blood',[
    'Leigneron enters Highmere beside its river quay as the curfew approaches.',
    'Cecily compares the blood-marked letter with the household rolls in the Royal Archive.',
    'Thomas’s worried mother waits beside the hearth in the Lower Ward.',
  ]),
  'witness-protected':page('witness-protected','A Witness Protected',[
    'Leigneron listens to the frightened Thomas in his weighhouse hiding place.',
    'Thomas and his mother are reunited beneath their kitchen lamp.',
    'The watch safeguards the witness records while Thomas remains sheltered.',
  ]),
  'crown-audience':page('crown-audience','A Household Is Not a Debt',[
    'Lady Matilda receives the recovered evidence in Highmere’s petitions hall.',
    'Cecily studies the ancient roads and ward sketches in the library.',
    'Household representatives sit at the hearing table with the crown’s listeners.',
  ]),
  'mourning-grove':page('mourning-grove','The Mourning Grove',[
    'An empty binding socket wounds the root-bound ward stone in Narenthil.',
    'The turquoise, hooded Moonlit Warden confronts Leigneron beneath the ancient trees.',
    'Leigneron examines the recovered iron beside the calmer roots.',
  ]),
  'last-beacon':page('last-beacon','The Last Beacon',[
    'Stranded porters shelter near the mountain beacon on Nardorous’s snowy pass.',
    'The massive, fur-maned troll Stonejaw blocks Leigneron’s way.',
    'Porters reach the lit shelter while Leigneron examines the damaged beacon binding.',
  ]),
  'broken-clan':page('broken-clan','The Broken Clan',[
    'Friendly orcan families wait with water jugs at Red Mesa’s guarded well.',
    'Krag, the tusked and armored orc chieftain, confronts Leigneron with his axe.',
    'The clans share water without a chief’s banner deciding whose children drink.',
  ]),
  'wounded-root':page('wounded-root','The Wounded Guardian',[
    'Leigneron inspects the missing binding and polluted mine-spring channel.',
    'The Rootfather, a living mass of roots and stone, blocks the forest passage.',
    'Dwarven workers repair the water channel beside the guardian’s settled roots.',
  ]),
  'river-account':page('river-account','The Names Beside the Crossing',[
    'A dwarf river worker shows Leigneron the account of his parents’ last journey.',
    'The river-guild account and old compass rest together beside memories of the flooded crossing.',
    'Leigneron sits quietly beside the river, holding the folded account and compass.',
  ]),
  'stolen-sea':page('stolen-sea','The Stolen Sea',[
    'Leigneron investigates marked cargo at Tidewatch’s harbor beside the pirate flagship.',
    'The red-scarfed Salt King faces Leigneron on the flagship’s wooden deck.',
    'The recovered freight ledger, signaling lens and stolen bindings reveal the cargo’s trail.',
  ]),
  'frozen-light':page('frozen-light','The Light That Went Out',[
    'Fishing boats wait off Skallheim while Leigneron examines the dark coastal signal.',
    'The wingless, ice-scaled Frost Wyrm confronts him on the frozen shore.',
    'A dark ward-metal shard is recovered and the coastal light guides a boat home.',
  ]),
  'ashen-truth':page('ashen-truth','The Ashen Truth',[
    'Leigneron finds the salvaged account among Darkav’s melted iron and burned chainworks.',
    'The charcoal-robed, ember-eyed Ashen Seer confronts him in the ruined forge.',
    'Surviving furnace workers emerge from shelter beyond the ruined chains.',
  ]),
  'crown-betrayal':page('crown-betrayal','The Crown’s Betrayal',[
    'Leigneron protects the archive records while guards evacuate witnesses from the attack.',
    'Walter faces Leigneron after the attack, unable to justify what his orders cost.',
    'The watch takes custody of Walter’s orders and holds him under guard.',
  ]),
  'returning-ember':page('returning-ember','The Returning Ember',[
    'The furnace crews remain sheltered as Leigneron approaches Darkav’s molten rim.',
    'The enormous black-and-ember dragon Varkhul confronts him on the basalt shelf.',
    'Varkhul retreats alive above the volcanic ridge, giving the crews time to repair the binding.',
  ]),
  'wards-rewoven':page('wards-rewoven','A Promise Tempered in Iron',[
    'Smiths fasten the reforged chain to the cinder ward while Leigneron holds his compass.',
    'Community representatives exchange matching covenant records across an archive table.',
    'Friendly orcan keepers share the well with their neighbors and a visiting dwarf.',
  ]),
  'place-at-table':page('place-at-table','A Place at the Table',[
    'Hawise welcomes the grown Leigneron home to Marrow Inn with a warm bowl of soup.',
    'Edmund rests a reassuring hand on Leigneron’s shoulder at the inn table.',
    'Leigneron and Alice smile by the familiar window, with a road still waiting beyond it.',
  ]),
} as const;
export interface StoryPanelRef {page:keyof typeof STORY_PANEL_ART;panel:0|1|2}
