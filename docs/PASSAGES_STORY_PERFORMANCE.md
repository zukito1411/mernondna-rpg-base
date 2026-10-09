# Houses, shadows, passages and quest presentation

The requested house growth is 1.26 rather than 1.12, approximately 12.5% larger.
The settlement fitter retains smaller sizes for constrained parcels. Tests check
the actual house artwork against every authored street; shrine sizing remains
separate. Stable building IDs and existing static-placement save repair remain.

Shadows now use cached soft silhouettes and a reusable feathered contact stamp.
A world-space overscan buffer follows camera movement without repainting on
every camera tick. Actor shadows repaint at a bounded rate. The Chrome check
measured 24 texture refreshes in 120 small camera updates; the previous renderer
invalidated its canvas on every such camera movement. This measures upload work,
not a guaranteed frame rate on every device.

Other performance changes: caravan positions use cached cumulative distances
and binary lookup; fully open sea shares one terrain texture; passages load only
terrain chunks intersecting the viewport; open-ocean foam uses a GPU TileSprite;
and the quest journal subscribes only to state it displays.

## Getting to Darkav

1. Reach Highmere. The first-arrival scene highlights the river quay.
2. On the east river bank, between the southern bridges, find Highmere River
   Quay and interact with the pier using E or the touch Interact button.
3. Choose Sail to Ashen Landing · Darkav.
4. The captain carries Leigneron along the Crown River and validated sea lanes.
   The menu pauses the voyage. Both captain and passenger appear aboard.
5. At Ashen Landing, follow the marked ash road north through Blackspire's
   south gate. Its shrine supports later fast travel.

Tidewatch and Skallheim also have docked crewed boats and return passages. The
network is available without requiring an island shrine that cannot yet be
reached. Water routing is continuous; islands are not disconnected stages.
Voyage time is compressed for playability. These are captain-operated passages,
not a free-steering ship system. During a voyage, saves retain the safe departure
landing; arrival saves the destination landing without healing the player.

Piers are exempt from the scenery-placement repair pass and reserve their berth
so they cannot be silently relocated away from their boats and interaction spot.

## Quests and cutscenes

Every authored quest has a cinematic turning point. New scenes cover Oakmere's
road, the regional communities, Cibar's pump and Darkav's ward/dragon story.
They describe demonstrated evidence and commitments instead of claiming unseen
crowds, deliveries or completed rescues. Dialogue explains each community's
stakes and keeps the Seer's regional objective separate from Varkhul's optional
evacuation quest. Optional quest offers preserve the tracked main story.

Resolving the Broken Road makes its Oakmere approaches safe from ambient patrols.
Regional reports attune the community's shrine. Existing relief/water choices
select appropriate resolution captions; quest consequences persist in saves.

Cutscenes focus on actual NPC positions, use eased camera movement and zoom,
fade between distant views, and allow enough caption-reading time. NPCs rest
instead of walking in place. Skipping retains quest rewards and consequences;
logical player position and health are preserved. A saved ordered scene queue
includes combat and automatically completed objectives, so scenes are neither
overwritten nor replayed as unrelated old intros when loading legacy saves.
The save version and browser storage key remain unchanged.

## Verification and limits

The passage/story unit suite checks house clearance, every dock and island
route, the walking connection to Blackspire, cinematic coverage, quest tracking,
combat scene queues and save compatibility. Browser coverage checks boarding,
actual vessel movement, passenger/crew, pause, safe arrival/save, local Cibar
cutscenes and position/HP preservation, plus desktop/mobile water and traffic.

Some older tests still assume 11 settlements or 34 Highmere lots, use outdated
sprite geometry or require deprecated NPC IDs. Those failures also predate this
work; they are not represented as a passing full-suite run. Selected current
regressions and the production build are the validation scope. Native hardware
frame-rate and memory measurements remain device-dependent.
