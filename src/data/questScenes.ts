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
