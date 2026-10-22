# TALES OF LEIGNERON
## The Roads We Leave Behind
### Complete Base-Game Storyline — Version 2.1: The Broken Wards

**Genre:** Medieval Fantasy / Action RPG / Mystery / Adventure

**Main-story pacing target:** 9–10 hours for a first playthrough.

**Side-story pacing target:** 5–7 hours, separate from the main story, repeatable
contracts, the Tower of Might, housing and endgame grinding.

These are design targets, not measured playtimes. The playable expansion is
defined in `src/data/roadStories.ts` and applied by `src/data/storyExpansion.ts`.
The chapter additions below take precedence over the shorter original outlines.
See [the implementation and pacing notes](docs/ROAD_STORIES_EXPANSION.md) for
the exact scope, existing-save behavior and remaining verification.

**Structure:** 8 chapters across 5 narrative acts

**Core themes:** Family, belonging, betrayal, responsibility, grief, and the difference between power and protection.

---

# THE WORLD OF MERNODNA

Long before the present kingdoms existed, travelers built a network of ancient protective structures known as the Eightfold Wards.

These wards were created to keep dangerous forces from spreading along the roads, rivers, mountain passages, forests, and coastal routes connecting Mernodna's eight regions.

Over generations, people forgot their original purpose.

Some believed they were religious monuments. Others considered them abandoned relics. A few powerful officials saw something else: valuable ancient metal that could be extracted and sold.

When the wards began disappearing, strange things followed.

Forest guardians grew violent. Creatures descended from mountains. The dead stirred beneath forgotten mines. Monsters attacked settlements that had known peace for generations.

The kingdoms blamed one another, unaware that their suffering shared a single cause.

And somewhere in the middle of it all was a young swordsman named Leigneron.

He had no royal blood, no ancient prophecy, and no great destiny waiting for him.

He simply wanted to know what happened to his parents.

---

# PROLOGUE — THE CHILD WHO WAITED

**Location:** Oakmere, Trandum

**Opening cinematic:** A rainstorm, many years before the game's present.

A small boy sits near the window of Marrow Inn. An untouched bowl of soup rests on the table beside him.

Outside, a wagon approaches through the rain.

The boy jumps from his chair.

But the travelers who enter are strangers.

His parents have not returned.

Days become weeks. Weeks become years.

Edmund Atwood, a retired roadwarden and trusted friend of the family, takes Leigneron into his care.

Edmund teaches him swordsmanship, survival, and how to read the dangers of the road. Hawise Marlow, the innkeeper, gives him a place to belong. Alice Fen, his childhood friend, ensures he never spends too much time feeling sorry for himself.

Though surrounded by people who care for him, Leigneron never entirely stops wondering where his parents went.

The only possession they left him is an old compass that no longer points north.

**Transition to the present:**

Sunlight falls over Oakmere.

Leigneron is now a young swordsman.

Edmund calls out from the practice yard.

**Edmund:** "Oi! Still sleeping? Come on, lad. The sun's been up longer than you!"

**Leigneron:** "You could've just knocked."

**Edmund:** "I did. Three times. Nearly broke the door."

**Alice, nearby:** "He was probably dreaming about becoming a famous hero again."

**Leigneron:** "I don't dream about that."

**Alice:** "Sure you don't."

The player takes control.

# ACT I — THE ROAD THAT RAISED YOU

## Chapter 1: The Broken Road

**Pacing target: 55–60 minutes, not yet playthrough-verified.**

**Locations:** Oakmere, eastern farms, ruined watchtower

**Chapter boss:** Captain Varr

### Expanded adventure — The bell beneath the ground

Open with Edmund hearing a bell under an orchard where no bell exists. A dying
rider asked for the boy whose compass would not settle. Rescue Lena promptly;
do not delay her behind shopping or optional errands. Her rescue is the first
answer, not the end of the chapter.

After the raid, a missing child’s basket leads to the Silent Orchard. Fight the
wolves around the hollow tree, follow the search home and learn that the child
heard the same buried bell. Etheldreda explains that injured ward-stones can
repeat sounds. The compass reacts to iron; it does not prove a special destiny.

Along Varr’s road, find a warning crossed out beside an opened stone. Fight the
men and frightened beasts holding that clearing, then cover the exposed hollow.
Hugh remembers that Varr knew what digging would wake. The boss confrontation
now answers a question the player has seen and heard, not merely a bandit quota.

Lena also remembers the rider asking whether the village bell had rung. Recover
his unfinished warning and explain to Etheldreda why runners are safer until
the exposed iron is covered. The alarm is an actionable rule, not just an omen.

### Story

Life in Oakmere has been peaceful, but trouble has begun spreading along the eastern road.

Caravans have stopped arriving. Travelers speak of bandits occupying an abandoned watchtower. Several villagers fear that something more organized is happening.

One morning, Lena, a local carter and mother of two, fails to return with supplies.

Edmund asks Leigneron to investigate.

Alice volunteers to help track the wagon.

### Main Quest: The Missing Carter

The player follows damaged wagon tracks through the eastern farms.

Along the way, Alice notices something strange.

The bandits left several valuable goods untouched but searched the wagon's hidden compartments.

**Alice:** "That's odd. They took her papers, but left the silver."

**Leigneron:** "Maybe they didn't see it."

**Alice:** "Three men searching a wagon? Come on. Someone was looking for something."

The player fights the bandits guarding Lena and rescues her.

Lena explains that one of the attackers repeatedly demanded an old road survey.

She doesn't know why.

Before Leigneron can return safely, the village warning bell rings.

### Story Event: Oakmere Under Attack

Captain Varr sends a group of raiders into Oakmere to destroy the remaining survey records and prevent anyone from following his trail.

For the first time, the normally peaceful village becomes a temporary battlefield.

The player must defend the village alongside the guards.

- Protect the inn's entrance from attackers.
- Defeat raiders attempting to burn the old records.
- Keep the attackers away from fleeing civilians.

During the attack, Alice helps evacuate residents while Edmund fights alongside Leigneron.

Afterward, Edmund finds a message dropped by one of the raiders.

It bears an official royal seal.

The instructions direct Captain Varr to recover an old survey written by Leigneron's mother.

### Main Quest: The Ruined Watchtower

Leigneron travels to the watchtower to confront Varr.

A short cinematic introduces the former caravan guard standing among stolen cargo.

**Varr:** "So the old roadwarden sent his little pupil."

**Leigneron:** "You attacked my village."

**Varr:** "Your village? Boy, your village was never the prize."

**Leigneron:** "Then what was?"

**Varr:** "Ask the people wearing crowns."

Varr draws his sword.

**BOSS BATTLE: CAPTAIN VARR**

After defeating Varr, Leigneron searches the tower.

He discovers:
- A stolen royal seal.
- A portion of his mother's original survey.
- Records identifying shipments of ancient ward iron.
- An order carrying a Highmere official's authorization.

Back in Oakmere, Edmund recognizes the handwriting on the survey.

For a moment, he can barely speak.

**Edmund:** "I'd know those letters anywhere."

**Leigneron:** "It's hers, isn't it?"

**Edmund:** "Aye. Your mother's."

**Leigneron:** "Then why would anyone want it?"

**Edmund:** "I don't know. But someone in Highmere does."

Edmund tells Leigneron that his mother's last journey involved delivering aid to settlements beyond Trandum.

The surviving records were believed lost.

He asks Leigneron to seek the truth in the royal archives.

**Chapter ending:** Leigneron leaves Oakmere with his family's old sword, the compass, and the recovered survey.

Alice watches him depart.

**Alice:** "Hey! Don't go becoming a legend without me!"

For the first time in years, the compass needle moves.

---

# ACT II — THE CITY OF SECRETS

## Chapter 2: A Body at the Bridge

**Pacing target: 50–55 minutes, not yet playthrough-verified.**

**Locations:** Highmere, Royal Archive, Lower Ward, old weighhouse

**Central conflict:** A river that calls with dead voices, a hunted witness,
and a night shelter surrounded by spirits.

### Expanded adventure — Something under Highmere

Before the archive visit, the bridge warden describes a child’s voice coming
from the water. Search the claw marks and lantern, then fight the spirits at
the crossing. The stolen ward iron explains why the threat reached the city.

The murder investigation and Thomas’s escape remain. They lead to No One Left
Inside: hear survivors, find the shelter door broken from within, fight the men
and spirits closing its escape route, and physically unbar it after the battle.
Check the rescued families at the kitchen. The crown’s short decision is about
where these people sleep tonight, not a long dispute over trade or money.

Resolve the first mystery here: the messenger was Giles, Cecily's rider. Edmund
wrote to her about the compass last winter, and she told Giles whom to ask for
in Oakmere. Oswin was the separate inspector murdered at the bridge; Giles
carried a copy of his warning. Neither death is a supernatural summons to a
chosen hero. Cecily promises to tell Giles's sister what he accomplished.

### Story

Leigneron arrives in Highmere, the prosperous capital of Trandum.

The city initially appears peaceful.

Merchants trade in busy markets. Guards patrol the bridges. Noble carriages travel toward the castle.

But the Lower Ward tells a different story.

Several families are struggling while royal storehouses remain heavily guarded.

At the Royal Archive, Leigneron meets Cecily Atwood, a relative of Edmund and longtime friend of his family.

She confirms that the stolen royal seal belonged to an office responsible for transporting supplies and maintaining old infrastructure.

Before she can investigate further, a guard interrupts them.

A royal records inspector has been found murdered near the river.

His documents are missing.

### Main Quest: The Dead Inspector

Cecily reveals that the murdered inspector was investigating discrepancies in the movement of ancient ward iron.

Leigneron agrees to help Captain Isabel Ward investigate.

The player must examine the crime scene and speak with witnesses.

Three clues emerge:

1. The inspector was supposed to meet a royal official that evening.
2. His final records concerned missing shipments, not stolen food.
3. A young carter named Thomas Reed saw armed men entering an abandoned weighhouse.

Thomas subsequently disappeared.

### Main Quest: The House of Lies

Leigneron finds Thomas hiding in an old house in the Lower Ward.

Thomas reveals that he witnessed the inspector arguing with a man employed by Walter Hale, the crown's grain steward.

Before he can explain further, footsteps approach.

Someone knocks.

**Unknown voice:** "Open up. We're with the city watch."

Thomas looks terrified.

**Thomas:** "That's his voice."

**Leigneron:** "Whose?"

**Thomas:** "The man from the bridge."

The door breaks open.

### Story Event: The Witness Ambush

Two hired killers attack inside the house.

If the interior is too small for fair combat, the encounter continues into the adjoining courtyard.

The player must defeat the attackers while protecting Thomas.

One assassin carries a document ordering the confiscation of old ward iron under the authority of Walter Hale's office.

The evidence establishes a direct connection between the thefts and the murdered inspector.

### Main Quest: A Crown Divided

Leigneron brings the evidence to Lady Matilda Atwood.

Walter Hale attends the meeting.

He is calm, educated, and outwardly helpful.

**Walter:** "I understand the boy's concern. But an old seal and a dead inspector hardly prove a conspiracy."

**Leigneron:** "Your men tried to kill a witness."

**Walter:** "My men? That's quite an accusation."

**Isabel:** "Then you won't object to us searching your records."

Walter smiles faintly.

**Walter:** "Of course not, Captain."

He has already arranged for the most important documents to disappear.

Matilda orders Isabel to protect Thomas and authorizes Leigneron to investigate the ward sites outside Trandum.

Cecily uncovers an older account explaining that the wards were linked.

Removing one binding weakened the others.

The stolen survey was valuable because it identified where those bindings could be found.

### Chapter Revelation

Someone has been systematically dismantling the Eightfold Wards.

But why?

Leigneron believes the answer lies in the other regions.

Before leaving, he chooses whether Thomas's testimony should be protected privately or presented publicly.

This affects later dialogue, but both choices preserve the main story.

**Chapter ending:** From the castle balcony, Leigneron watches the city below.

**Cecily:** "Your mother came here once, you know."

**Leigneron:** "To the archives?"

**Cecily:** "To ask why the roads were failing. Nobody listened."

**Leigneron:** "Then I suppose I'll have to make them."

---

# ACT III — THE WOUNDS OF MERNODNA

## Chapter 3: The Forest and the Mountain

**Pacing target: 110–115 minutes, not yet playthrough-verified.**

**Regions:** Narenthil and Nardorous

**Chapter bosses:** Moonlit Warden and Stonejaw

### Expanded adventure — Borrowed songs and warning knocks

Narenthil’s ribbons move against the wind. A warning says not to follow a voice
that sounds like your mother. Fight through the singing roots, then learn that
the grove remembers voices without understanding the grief it causes. The dead
have not returned. The Warden is trying to contain the forest’s injury.

At Moonfall, a webbed lantern and a child’s badly carved bird explain how the
pilgrims separated to protect their children. Clear the lantern shelter, cut its
silk and return the bird before facing the Warden. The herbalist’s ordinary
affection makes the missing pilgrims people rather than names on a list.

In Nardorous, a buried bell-rope records knocks from beneath the ridge. Clear
the Silent Ridge, follow cairn candles, open the porters’ last escape route and
learn why the warning stopped. Only then recover the signal kit, relight the
beacon and confront Stonejaw. The existing full warnings and boss phases remain.

Before the Warden, interpret the keeper's shelter mark: its dry path was left
open while the guardian held the wounded root. Before Stonejaw, open the Ridge
Refuge for the next convoy. The first rescue does not pretend that the whole
pass is already safe. The tools left by the iron-cutters carry Dorga's forge
mark, and a warning is sent to Ugra before the journey to Rindass.

### Part I — Narenthil: The Mourning Grove

Leigneron travels to the elven forests of Narenthil.

The region's guardians report that pilgrims have disappeared near the ancient Greenward Stones.

The Moonlit Warden, once a peaceful protector of the forest, has begun attacking anyone approaching the grove.

The player helps the elven scouts search for the missing pilgrims.

They discover abandoned belongings, damaged roots, and an empty socket where sacred iron was once embedded.

A surviving pilgrim explains that the Warden became violent only after strangers removed the metal.

**Pilgrim:** "It wasn't angry before. It just stood there, watching over us."

**Leigneron:** "What changed?"

**Pilgrim:** "Men came with tools. They took something from beneath the roots. Then the trees started screaming."

The player clears the corrupted creatures blocking the grove and reaches the Moonlit Warden.

**BOSS BATTLE: MOONLIT WARDEN**

After its defeat, the corruption begins to subside.

The Warden's anger was a response to the forest's injury.

Leigneron discovers the same royal shipment mark seen in Highmere.

The elves agree to help restore the ward once its stolen binding can be recovered.

### Part II — Nardorous: The Last Beacon

Following the iron shipment trail, Leigneron reaches the mountains of Nardorous.

Starhold's mountain pass is blocked.

Stonejaw, a massive troll, has driven travelers away from the old beacon.

A small group of porters remains stranded beyond the pass.

Rather than immediately fighting the troll, Leigneron must recover the lost beacon signal and guide the surviving porters toward safety.

The player navigates a dangerous mountain path, recovers a signal kit, and helps relight the beacon.

The light attracts Stonejaw.

**BOSS BATTLE: STONEJAW**

Following the battle, the porters reach shelter.

The damaged beacon contains evidence that its protective iron was removed by the same network of smugglers operating in Narenthil.

A surviving porter mentions seeing heavily armed caravans traveling south toward Rindass.

### Chapter Ending

Leigneron studies the recovered records.

The thefts are too coordinated to be random.

Someone is moving ancient ward iron through multiple kingdoms.

For the first time, he begins to suspect that the disturbances are consequences of deliberate human actions.

**Leigneron:** "People keep calling these creatures monsters."

**Starhold Porter:** "Aren't they?"

**Leigneron:** "Maybe. But someone made their homes dangerous first."

---

## Chapter 4: Blood and Roots

**Pacing target: 95–105 minutes, not yet playthrough-verified.**

**Regions:** Rindass and Druganwoods

**Chapter bosses:** Krag the Iron-Tusk and the Rootfather

### Expanded adventure — Teeth behind the banners

Ugra finds her clan’s marks cut from harnesses used in attacks. Search the
broken tusk, stop Krag’s men destroying the harnesses and expose his attempt to
turn the clans on one another. Friendly orcs remain allies. A banner bearing
two brothers’ names leads to a wounded dissenter’s escape route. Fight to open
it and let the brothers’ needs, not a council speech, shape the pre-boss choice.

In Druganwoods, hammers laid in a circle explain the knocks beneath the mine.
Clear the answering spirits and unfasten a rescue line before reaching Bruni.
The old crossing rope, with a spoon tied on for children’s numb hands, gives
the parents’ revelation something personal to hold. Read the existing flood
letter with Bruni nearby. No villain secretly killed the parents; no false voice
or later spell brings them back. The Rootfather battle protects a real repair.

Raise a plain distress flag after clearing Krag's rear guard. It welcomes the
families his clan colours excluded. In Druganwoods, let Leigneron sit with Bruni
after the flood letter instead of immediately asking him to solve another
problem. The old rescue and the recent iron shipments are explicitly years
apart. A Portquill dock mark, not a new accusation about his parents' deaths,
provides the next lead.

### Part I — Rindass: The Broken Clan

Leigneron reaches Rindass, where competing orcan clans have fallen into conflict.

Krag the Iron-Tusk has seized control of a shared well and surrounding settlements.

He claims that only a powerful ruler can protect the clans from the growing corruption.

Some support him out of fear.

Others believe he created the crisis himself.

Leigneron discovers that Krag's warriors have been stealing ward components from caravan routes.

A frightened young orcan reveals that the chieftain deliberately restricted access to the well to force other clans into submission.

**Young Orcan:** "He says we're safer together."

**Leigneron:** "Are you?"

**Young Orcan:** "My father won't come home because he refused to bow."

### Story Event: The Red Mesa Attack

Before the clan leaders can negotiate, Krag's loyal warriors attack the settlement.

This triggers a temporary, story-controlled battle within Red Mesa.

Leigneron helps defend civilians while friendly orcan warriors fight beside him.

After the attack, the opposing clans agree to confront Krag together.

Leigneron challenges the chieftain at his stronghold.

**Krag:** "The weak beg for protection. The strong take what they need."

**Leigneron:** "Then why are your own people afraid of you?"

**Krag:** "Because they know what happens when they stand against me!"

**BOSS BATTLE: KRAG THE IRON-TUSK**

Krag falls, ending his control over the well.

The clans agree to share responsibility for its protection.

Among Krag's belongings is another shipment record pointing toward the dwarven region of Druganwoods.

### Part II — Druganwoods: The Wounded Guardian

Leigneron enters Druganwoods, where miners have disappeared near the Rootwater spring.

The ancient Rootfather, once believed to protect the surrounding forest and underground waterways, has become violent.

The dwarven runesmith reveals that mining operations damaged the spring after its protective binding was removed.

Several workers tried to conceal the mistake.

Leigneron investigates the lower paths and rescues a trapped surveyor named Bruni.

Bruni recognizes the family compass.

**Bruni:** "I remember that thing."

**Leigneron:** "You knew my parents?"

**Bruni:** "Your mother brought food when our crossing flooded. Your father helped us get people out."

She leads him to a surviving river-guild account.

### Major Revelation — What Happened to His Parents

The records explain the final days of Leigneron's parents.

Years earlier, a terrible flood trapped travelers near a river crossing.

His parents helped evacuate the stranded families.

They repeatedly returned across the dangerous water, refusing to leave anyone behind.

On the final crossing, the structure collapsed.

They never returned.

There was no hidden royal inheritance. No secret prophecy. No villain who personally murdered them.

They died saving people.

Leigneron stands silently beside the old river.

For years, he imagined finding someone to blame.

Instead, he has found the truth.

**Leigneron:** "So they could've left?"

**Bruni:** "Aye."

**Leigneron:** "But they stayed."

**Bruni:** "They were stubborn people, your parents."

She pauses.

**Bruni:** "Good people, too."

Leigneron folds the recovered account and places it beside the compass.

### Main Quest: The Rootfather

The wounded Rootfather blocks the only safe passage needed to repair the damaged spring.

Leigneron confronts it while the dwarven workers prepare the repair.

**BOSS BATTLE: THE ROOTFATHER**

Following the battle, the runesmith begins restoring the damaged spring.

The guardian's roots settle, no longer violently spreading through the passage.

The dwarves provide the final shipping records identifying where the stolen ward iron was transported.

The trail leads across the sea.

### Chapter Ending

Before leaving, Leigneron speaks quietly to Alice, who has arrived with messages from Oakmere and helps him prepare for the sea passage.

**Alice:** "You found them."

**Leigneron:** "I found what happened."

**Alice:** "Was it what you expected?"

**Leigneron:** "No."

**Alice:** "Are you all right?"

**Leigneron:** "Not really."

Alice sits beside him.

**Alice:** "Then I'll sit here a while."

The screen fades as they watch the river.

---

# ACT IV — THE PRICE OF POWER

## Chapter 5: The Stolen Sea

**Pacing target: 90–100 minutes, not yet playthrough-verified.**

**Regions:** Portquill and Frostlands

**Chapter bosses:** Salt King and Frost Wyrm

### Expanded adventure — The shore that lied

At Portquill, a lantern blackened on its landward side reveals a wreckers’ trap.
Fight the shore crew and cover the false light. Orren recognises an escape sign
cut into a stolen ward chain. Secure that shore approach before boarding the
existing flagship. Decide how Jessa’s boats should reach the captives, then face
the Salt King. The harbour danger is experienced before its cause is explained.

In Frostlands, a boot frozen from within and a broken sled show that a family
refused to abandon an injured father. Open the hunters’ route and check on him
at the longhouse. Cracked eggshells and wounded scales reveal what happened to
the Wyrm’s hollow. Runa understands its anger but cannot leave it among the
fishing huts. The signal rescue and Wyrm battle follow, not another cargo dispute.

### Part I — Portquill: The False Lights

Leigneron arrives at Tidewatch, where pirate attacks have disrupted maritime trade.

The Salt King has seized vessels transporting metal, provisions, and navigation equipment.

Unlike ordinary pirates, his crew specifically targets shipments bearing royal authorization.

Leigneron investigates the harbor records and discovers that the Salt King has been transporting stolen ward iron to Darkav.

The player boards the pirate flagship, defeats its defending crew, and rescues a captured sailor who knows where the valuable cargo was sent.

A confrontation with the Salt King follows.

**Salt King:** "You think the crown's any better than a pirate?"

**Leigneron:** "You attack innocent sailors."

**Salt King:** "And the crown sends its stolen goods across my sea. At least I don't pretend to be noble."

**BOSS BATTLE: THE SALT KING**

After the battle, the player recovers the ship's freight ledger.

It identifies a buyer in Blackspire and confirms repeated deliveries of ancient iron.

The ship also carried a damaged signaling lens intended for Skallheim.

### Part II — Frostlands: The Light That Went Out

Leigneron travels to the frozen islands of the Frostlands.

Several fishing families are stranded because an important coastal beacon has gone dark.

Worse, a Frost Wyrm has descended from the cliffs and begun attacking anything that approaches its territory.

The player must recover the damaged beacon lens and help the coastal hunters restore the signal.

The Wyrm attacks during the attempt.

**BOSS BATTLE: FROST WYRM**

After the fight, the hunters discover a fragment of dark metal embedded in the creature's body.

It matches the material stolen from the other wards.

The Wyrm was injured when the ancient protection failed.

### Chapter Revelation

The recovered fragment carries a distinctive forging mark.

It belongs to the furnaces of Darkav.

Leigneron now knows where the stolen ward iron has been taken.

But the shipment ledger contains another disturbing detail.

The orders originated in Highmere.

**Leigneron:** "The same people asking me to save the roads were the ones tearing them apart."

---

## Chapter 6: The Ashen Truth

**Pacing target: 55–65 minutes, not yet playthrough-verified.**

**Region:** Darkav

**Locations:** Blackspire, burned chainworks, volcanic outskirts

**Chapter boss:** Ashen Seer

### Expanded adventure — No one comes back through fire

Follow workers’ handprints through Ashwood Watch and uncover its buried bell
after clearing the spirits. Vexa explains how the Seer first gained followers:
she promised that grieving people could hear their dead, then asked for iron.

A cold pilgrim lamp records a father realising that the voice asking him to
hurt others could not be his daughter. Fight the spirits around it and close
the lamp without carrying its flame. Dain asks how to tell the waiting father.
Then free the chainworks survivors and confront the Seer. Walter paid for the
thefts, but the Seer knowingly turned human grief into a growing monster threat.

### Story

Leigneron reaches Darkav, a volcanic region where smoke rises constantly from the mountains.

Blackspire's inhabitants speak of a mysterious figure known as the Ashen Seer.

The Seer once promised that the ancient ward iron could be reforged into something powerful enough to control the region's dangerous volcanic energies.

The forging process failed.

Workers died. Spirits began appearing near the abandoned furnaces. The protective chains around Varkhul's territory weakened.

The Seer continued her experiments, believing that the power she discovered could make the old wards unnecessary.

### Main Quest: The Burned Chainworks

Leigneron enters the ruined chainworks to recover the original forging records.

The area is haunted by spirits of workers killed during the failed experiments.

The player battles through these threats, locates the records, and helps surviving workers escape.

The recovered account reveals the truth.

Walter Hale, the crown's grain steward, authorized the removal and sale of ward iron.

At first, he justified the trade as a way to raise money for Highmere's struggling food supply.

But he continued even after receiving reports that removing the wards was endangering entire regions.

He began concealing the damage, silencing investigators, and using the growing regional disorder to strengthen his control over the kingdom's supply routes.

The Seer, meanwhile, pursued her own ambition.

She believed the stolen iron could give her command over Darkav's volcanic power.

### Main Quest: The Ashen Seer

Leigneron confronts the Seer in the ruined forge.

**Ashen Seer:** "They buried wonders beneath roads and shrines. All that power, wasted."

**Leigneron:** "People are dying because you tore those things apart."

**Ashen Seer:** "People always die when the world changes."

**Leigneron:** "Easy to say when it's someone else."

**BOSS BATTLE: THE ASHEN SEER**

Following the battle, the Seer's control over the spirits breaks.

The surviving workers reveal that the stolen iron has weakened the ancient chains protecting the volcanic passages.

A tremendous roar echoes from the mountains.

Varkhul, the Returning Ember, has become increasingly dangerous.

Blackspire's forgemaster explains that the wards can still be restored, but only if the surviving regions cooperate.

### Chapter Ending

Leigneron looks toward the distant volcanic ridge.

A massive dragon circles above it.

The forgemaster warns him that attacking the dragon now would achieve nothing.

The region needs time to prepare the replacement bindings.

Before confronting Varkhul, Leigneron must return to Highmere and expose Walter Hale.

---

# ACT V — THE ROADS WE KEEP

## Chapter 7: The Crown's Betrayal

**Pacing target: 35–40 minutes, not yet playthrough-verified.**

**Location:** Highmere

**Central conflict:** The broken iron draws the dead toward Highmere while
Walter’s remaining men try to silence the survivors.

### Expanded adventure — What followed you home

A rider’s abandoned lantern warns that the stolen iron calls the creatures.
Fight the Homeward Hunt on the king’s road before entering Highmere. Isabel
moves the iron away from occupied houses. Cecily offers Leigneron a chair before
confirming the flood letter. She does not repeat the whole mystery as a speech.

Keep the existing archive defence, courtyard recovery and Walter arrest. His
admission is brief: he paid Varr, saw the danger and kept finding reasons not to
stop. Responsibility matters, but it is not another chapter of political debate.
The quiet return to Edmund remains essential before the final journey.

### Story

Leigneron returns to Highmere with the accumulated evidence.

Cecily and Captain Isabel assemble the surviving witnesses, shipment records, and reports from the eight regions.

Lady Matilda summons Walter Hale to answer the accusations.

Walter admits that he originally ordered the removal of ward iron to raise funds and secure the kingdom's food supply.

But as the crisis spread, he began using the resulting fear to justify placing more of Mernodna's roads and resources under his control.

His goal had changed from providing relief to controlling who received it.

He knew the wards were failing.

He continued anyway.

### Main Quest: The Burning Archive

Before the evidence can be presented publicly, Walter orders his loyal guards to seize the records.

One of his agents attempts to burn the archive.

The royal guards refuse the unlawful order, but Walter's private men attack.

A scripted battle begins inside the archive hall and adjoining courtyard.

Leigneron fights to prevent the records from being destroyed while Isabel helps evacuate the witnesses.

The player must defeat the attackers and secure the surviving documents.

Walter attempts to escape but is stopped by Isabel and her guards.

### The Confrontation

**Walter:** "Do you know what it's like deciding which village receives food and which one goes hungry?"

**Leigneron:** "No."

**Walter:** "Then you have no right to judge me."

**Leigneron:** "I know what happened to the people you abandoned."

**Walter:** "I did what was necessary!"

**Leigneron:** "You kept doing it after you knew what it cost."

Walter falls silent.

Thomas identifies the official responsible for the murdered inspector, and the recovered documents establish that Walter authorized the operation to silence him.

Walter is arrested and placed before the crown's court.

His actions have been exposed, but arresting one corrupt official cannot immediately repair the damage across Mernodna.

### Main Quest: The Eightfold Covenant

Lady Matilda proposes placing the restored wards under direct royal protection.

Leigneron objects to allowing one authority to control them again.

Cecily suggests an agreement involving the communities that depend on the roads.

The player chooses between:

**Choice A — Independent Keepers**

Each region maintains its own ward while sharing reports and assistance with neighboring communities.

**Choice B — The Shared Watch**

A joint organization protects the roads, with representatives from all eight regions overseeing its decisions.

Both outcomes establish accountability and allow the final repair.

The choice changes the epilogue and certain NPC reactions, without creating separate final chapters.

### Chapter Ending

Before leaving, Leigneron speaks with Edmund.

**Edmund:** "You could come home now, lad. You've found your answers."

**Leigneron:** "The roads are still broken."

**Edmund:** "They aren't yours to fix alone."

**Leigneron:** "I know."

Leigneron smiles slightly.

**Leigneron:** "That's why I'm going back."

---

## Chapter 8: The Returning Ember

**Pacing target: 50–60 minutes, not yet playthrough-verified.**

**Region:** Darkav, followed by Oakmere

**Final boss:** Varkhul, the Returning Ember

### Expanded adventure — A way back for everyone

Before the final approach, follow Dain’s scorched shelter markers. Fight to
clear the retreat path and raise its fallen marker. Speak to Dain about the
workers who chose to stay. At the old pilgrims’ hearth, protect the unfinished
binding until the smiths can carry it. The eight equal marks recall the parents’
drawings without granting Leigneron a hidden inheritance or divine power.

Vexa’s last request is to return after the dragon lifts off. All new preparation
happens before Varkhul: do not insert hunts or errands into the brief repair
opening after his retreat. Preserve the existing ward repair, homecoming, free
exploration and repeatable dragon encounter.

The playable final approach now explicitly waits for the **covenant-forge**
stage of The Roads We Keep. It does not wait for that whole quest to finish,
because its later repair requires the dragon's retreat. This keeps the order
real without creating a circular dependency. Vexa's binding scene shows how
the regions' different discoveries made the final repair possible.

The Seer's boss scene offers the false return Leigneron once wanted. He refuses
because he now understands the difference between a remembered voice and the
parents whose actions he has learned to honour. Varkhul is the physical climax
after that emotional choice, not another mastermind invented at the last moment.

### Main Quest: The Last Ward

With the regional agreements secured, the forgemasters of Blackspire prepare replacement ward bindings.

The iron recovered from the stolen shipments is reforged.

Workers from the different regions contribute knowledge of their own wards.

The repairs are almost ready.

But Varkhul has made the volcanic passage too dangerous for anyone to approach.

The dragon is not the architect of the conspiracy.

It is an ancient creature whose territory has been destabilized by the collapse of the volcanic protections.

Leigneron must drive it away long enough for the forge crews to complete their work.

### Final Preparation

The player helps secure the workers' escape route and activates the remaining protections along the western approach to Varkhul's lair.

Before entering the arena, Leigneron speaks to the Blackspire forgemaster.

**Forgemaster:** "You understand that the dragon will return?"

**Leigneron:** "Then we'd better finish before he does."

**Forgemaster:** "And if you cannot?"

**Leigneron:** "Get everyone out. Don't wait for me."

### Final Cinematic — The Returning Ember

The camera rises above Darkav's volcanic landscape.

Molten rock glows beneath the darkened sky.

Varkhul emerges from the smoke, landing upon the basalt shelf.

The dragon roars.

Leigneron draws his sword.

His family's compass begins to glow.

For a moment, he remembers the people he has met.

Lena and her children.

Thomas, the frightened witness.

The pilgrims of Narenthil.

The stranded mountain travelers.

The orcan clans.

Bruni and the dwarven miners.

The sailors of Portquill.

The families waiting beside the frozen coast.

People whose names would never appear in the kingdom's grand histories.

But people who mattered.

Leigneron tightens his grip on the sword.

**Leigneron:** "All right, then."

**FINAL BOSS BATTLE: VARKHUL, THE RETURNING EMBER**

The battle is fought across the established volcanic arena.

As the fight progresses, the forge crews work behind the surviving protections.

Leigneron withstands Varkhul's attacks until the dragon can no longer hold the shelf.

With a furious roar, Varkhul takes flight and retreats into the mountains.

**The dragon survives.**

The path to the damaged binding is briefly clear.

### Final Story Event — The Ward Reborn

Leigneron reaches Cinderwatch and activates the reforged binding.

The workers secure the repaired chains.

A wave of light travels through the ancient ward network.

Across Mernodna:

- The corrupted roots of Narenthil begin to recover.
- The mountain beacon of Nardorous shines again.
- Rindass's shared well flows without the damaged binding.
- Druganwoods's spring settles beneath the Rootfather's roots.
- The coastal signals of Portquill and Frostlands glow against the night.
- Darkav's surviving volcanic protections become stable.

The world is not magically free of every danger.

Monsters still exist. Bandits still threaten roads. People still disagree and make mistakes.

But the spreading collapse has been stopped.

The communities now understand what must be maintained, and have agreed to help one another.

### Epilogue — A Place at the Table

**Location:** Oakmere, several days later.

The evening sky glows orange over the village.

The camera follows Leigneron returning along the familiar road.

The villagers greet him as he enters.

William Fletcher, the blacksmith, notices his battered sword.

**William:** "Good heavens. What have you done to that thing?"

**Leigneron:** "Fought a dragon."

**William:** "A dragon?"

He examines the blade.

**William:** "Well, the dragon clearly won against the edge."

Leigneron laughs.

At Marrow Inn, Hawise is preparing supper.

Edmund sits near the window.

Alice is beside him.

Hawise notices Leigneron standing in the doorway.

**Hawise:** "Well, don't just stand there. Your supper's getting cold."

**Leigneron:** "You knew I'd come back?"

**Hawise:** "Someone has to eat all this food."

Leigneron sits with the people who raised him.

For the first time, he notices that the old bowl once kept in memory of his mother has been placed on a shelf.

Not forgotten.

Simply allowed to rest.

Edmund looks toward him.

**Edmund:** "So, lad. Did you find what you were looking for?"

Leigneron thinks for a moment.

**Leigneron:** "I found out what happened to them."

**Edmund:** "And?"

**Leigneron:** "I used to think they left me behind."

He glances toward the families gathered around the inn.

**Leigneron:** "Now I think they were trying to make sure someone else got home."

Edmund rests a hand on his shoulder.

**Edmund:** "They would've been proud of you."

Alice leans forward.

**Alice:** "So what happens now? Are you finally going to settle down?"

Leigneron looks toward the window.

Beyond Oakmere lie distant roads, mountains, forests, and kingdoms he has only begun to understand.

**Leigneron:** "Not yet."

**Alice:** "Of course not."

She smiles.

**Alice:** "Just don't forget where home is."

Leigneron smiles back.

**Leigneron:** "I won't."

### Closing Cinematic

The camera slowly rises above Oakmere.

Warm lights shine from the houses.

The roads stretch toward the distant mountains.

A final narration appears:

*"A great tale is not measured by the enemies defeated, the crowns claimed, or the names remembered."*

*"Sometimes, it begins with a single person choosing to help another find their way home."*

**TALES OF LEIGNERON**

**THE END**

The player returns to free exploration.

Unfinished side quests, remaining discoveries, and repeatable boss encounters stay accessible.

Varkhul continues to exist as a dangerous, repeatable encounter.

---

# OPTIONAL SIDE STORIES

These four foundation stories remain separate from the main campaign. Sixteen
additional regional adventures are now authored in `src/data/roadStories.ts`.
Together with the existing watch and Cibar investigations, they target 5–7 hours
of first-time side-story play. This has not been measured. No side adventure is
a new dependency for the main ending; the Tower and repeatable contracts are
not counted toward this target.

Eight optional **World quests** now follow the regional victories. They explain
what those victories made possible and what still needs work: Oakmere's warning
posts, Narenthil's blocked spring, Starhold's falling rock, Red Mesa's frightened
herds, Deepford's waste channel, Portquill's false lights, Skallheim's snowbound
shelters and Darkav's remaining cold lamps. They unlock at the relevant report,
not at an arbitrary late level, and remain available after the main ending.
Their local aftermath is not a claim that the world has become free of monsters.

## Side Quest 1 — A Home for Two

**Location:** Willowcross / Trandum

**Estimated duration:** 15–20 minutes

Two orphaned siblings are found hiding near an abandoned roadside house.

Their parents disappeared during recent bandit attacks.

A widow in Willowcross wishes to take them in, but the children's estranged uncle claims responsibility for them.

The player investigates the family's history and discovers that the uncle is attempting to claim their inheritance.

After confronting the uncle and his hired accomplices, Leigneron helps resolve the children's future.

The story explores adoption, family, belonging, and trust.

**Emotional connection:** Leigneron recognizes something of his younger self in the children.

## Side Quest 2 — The Hunter's Promise

**Location:** Oakmere / surrounding wilderness

**Estimated duration:** 15–20 minutes

Alice Fen asks Leigneron to investigate several unusual animal attacks.

A frightened hunter claims that wolves have become unnaturally aggressive.

The investigation reveals that a group of poachers has been deliberately driving wildlife toward the village.

The player confronts the poachers and deals with the resulting animal threat.

The quest develops Alice's personality, her relationship with Leigneron, and her concern for the natural world.

## Side Quest 3 — The Soldier Who Never Returned

**Location:** Nardorous / Starhold

**Estimated duration:** 15–20 minutes

An elderly woman continues waiting for her son, a mountain soldier missing for years.

Leigneron investigates the abandoned outpost where he was last seen.

He discovers that the soldier died protecting refugees during a winter storm.

The player recovers his personal belongings and final letter.

The quest ends with Leigneron returning the truth to his mother.

There is no grand treasure.

Only the chance to give someone an answer.

## Side Quest 4 — The Last Debt of Tidewatch

**Location:** Portquill / Tidewatch

**Estimated duration:** 15–20 minutes

A former pirate asks Leigneron to find the daughter of a sailor he betrayed years earlier.

The girl has become involved with smugglers operating near the harbor.

Leigneron investigates the criminal group, confronts its leader, and discovers that the former pirate has been concealing his own part in her father's death.

The quest explores guilt, forgiveness, and whether someone can change after doing terrible things.

The ending depends on how Leigneron handles the truth.

---

# PROGRESSION AND PACING

| Chapter | Location | Approx. duration |
|---|---|---:|
| 1. The Broken Road | Oakmere, Trandum | 55–60 min |
| 2. A Body at the Bridge | Highmere, Trandum | 50–55 min |
| 3. The Forest and the Mountain | Narenthil, Nardorous | 110–115 min |
| 4. Blood and Roots | Rindass, Druganwoods | 95–105 min |
| 5. The Stolen Sea | Portquill, Frostlands | 90–100 min |
| 6. The Ashen Truth | Darkav | 55–65 min |
| 7. The Crown's Betrayal | Highmere | 35–40 min |
| 8. The Returning Ember | Darkav, Oakmere | 50–60 min |
| **Target budget, not measured runtime** | | **540–600 min (9–10h)** |

The chapter durations are pacing budgets, not evidence that the current content
already takes that long. Actual playtime must be measured with normal gear,
without local unlimited gold/vitals, skipped dialogue or memorised routes. If
the expanded build remains short, add new authored situations and playable
spaces; do not force waits, disable travel, repeat bosses or simply inflate HP.

For this duration to be achievable, the campaign should provide convenient routes through already-visited areas, unlock shrine travel appropriately, and use direct sea passages without excessive backtracking.

# NARRATIVE RULES FOR IMPLEMENTATION

1. **Leigneron is not a chosen one.** His importance comes from the choices he makes, not hidden royal ancestry or supernatural destiny.

2. **His parents' fate is definitive.** They died rescuing stranded people during a flood. Their deaths should remain meaningful rather than being reversed by a surprise resurrection.

3. **Walter Hale is the central human antagonist.** His initial intentions do not excuse his decisions to endanger communities, conceal evidence, and silence witnesses.

4. **The regional bosses are connected to the damaged wards.** Not every creature is inherently evil, and not every boss needs to die narratively after being defeated.

5. **Varkhul survives.** The objective of the final battle is to secure enough time to restore the volcanic protection, not kill the dragon.

6. **Important NPCs have distinct personalities.** Conversations should be natural, concise, and emotionally appropriate, with humor and ordinary human moments between major story events.

7. **Quests must offer varied gameplay.** Investigations, rescues, settlement defense, interior ambushes, exploration, puzzles, boss battles, and quiet character scenes should be distributed naturally.

8. **Major story events have consequences.** NPCs react to attacks, disappearances, discoveries, political revelations, and the player's decisions.

9. **The ending provides closure without ending the world.** Players can continue exploring after the campaign, and the restored wards require ongoing care.

10. **Existing game systems should be reused where practical.** New scripted encounters, cinematic actions, and interior combat must be implemented as real gameplay rather than merely described in dialogue.

# THE HEART OF THE STORY

Tales of Leigneron is not about becoming the strongest swordsman in Mernodna.

It is about someone who spent his childhood waiting for people who would never return.

When he finally learns the truth, he discovers that their greatest legacy was not a weapon, title, or hidden power.

It was the lives they chose to protect.

By the end of his journey, Leigneron understands that protecting others will not bring his parents back.

But it can ensure that other children do not have to spend their lives waiting beside an empty chair.

**That is what it means to become a roadwarden.**

**That is the story of Tales of Leigneron.**
