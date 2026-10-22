/** Authored turning points, not a movie after every mundane collection click. */
export const QUEST_SCENE_BINDINGS:Record<string,Record<string,string>>={
 'first-road':{'talk-aldren':'road-briefing','kill-varr':'road-cleared','return-aldren':'road-resolution'},
 'water-stops':{'grain-keeper':'cibar-dry-fields','repair-pump':'cibar-water-restored','return':'cibar-harvest'},
 'returning-ember':{'vexa-warning':'ember-warning','repel-varkhul':'ember-retreat','vexa-resolution':'ember-resolution'},
 'royal-guard-trial':{'orders':'watch-briefing','report':'guard-muster'},
 'kingdom-divided':{'archive':'relief-briefing','decision':'city-resolution'},
};
for(const town of ['elarion','starhold','redmesa','deepford','tidewatch','skallheim','blackspire']){
 (QUEST_SCENE_BINDINGS['eight-regions']??={})['brief:'+town]='regional-'+town+'-warning';
 QUEST_SCENE_BINDINGS['eight-regions']['report:'+town]='regional-'+town+'-resolution';
}
Object.assign(QUEST_SCENE_BINDINGS['first-road'],{'roads:polish-bell-rule':'roads-silent-alarm'});
QUEST_SCENE_BINDINGS['crown-summons']={'roads:polish-messenger-name':'roads-messenger-known'};
Object.assign(QUEST_SCENE_BINDINGS['eight-regions'],{
 'roads:song-explained':'roads-borrowed-song',
 'roads:polish-mountain-scope':'roads-pass-awaits',
 'roads:polish-clan-cause':'roads-common-road',
 'roads:polish-grief-rest':'roads-river-breathing',
 'roads:polish-shore-next':'roads-white-sail',
 'roads:polish-cold-next':'roads-cold-to-ash',
});
QUEST_SCENE_BINDINGS['the-last-ward']={'covenant-forge':'roads-many-hands'};
