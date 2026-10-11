export interface RecoveryContext {
  hp:number; maxHp:number; inSettlement:boolean; moving:boolean; busy:boolean; threatened:boolean;
}

/** Active-play recovery only. No offline/menu healing and no healing in combat. */
export class RecoverySystem {
  private idleMs = 0;
  private peacefulMs = 0;
  interrupt() { this.idleMs=0; this.peacefulMs=0; }
  update(delta:number,context:RecoveryContext) {
    const step=Math.max(0,Math.min(delta,250));
    if(context.busy||context.threatened||!context.inSettlement){this.interrupt();return context.hp;}
    this.peacefulMs+=step;
    this.idleMs=context.moving?0:this.idleMs+step;
    if(this.peacefulMs<6000 || context.hp<=0) return context.hp;
    const perSecond=context.maxHp*.02;
    return Math.min(context.maxHp,context.hp+perSecond*step/1000);
  }
}
