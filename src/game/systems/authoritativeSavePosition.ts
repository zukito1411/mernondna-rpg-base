import type {Vec2} from '../types';

/** Persist the real outdoor player position unless gameplay is actively
 * inside a room, a cinematic transition, or a voyage. CinematicContext can
 * temporarily outlive the cutscene and MUST NOT override a later shrine TP.
 */
export function authoritativeSavePosition(
  player:Vec2,
  interior:{active:boolean;safePosition:Vec2|null|undefined}|null,
  cinematicActive:boolean,
  passage:{active:boolean;safePosition:Vec2|null|undefined}|null
):Vec2{
  if((interior?.active||cinematicActive)&&interior?.safePosition)
    return interior.safePosition;
  if(passage?.active&&passage.safePosition)return passage.safePosition;
  return player;
}
