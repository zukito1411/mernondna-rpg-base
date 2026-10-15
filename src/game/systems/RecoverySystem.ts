export interface RecoveryContext {
  hp:number; maxHp:number; inSettlement:boolean; moving:boolean; busy:boolean; threatened:boolean;
}

/** Active-play recovery is faster in settlements and slower during wilderness rest. */
export class RecoverySystem {
  private idleMs = 0;
  private peacefulMs = 0;
  interrupt() { this.idleMs=0; this.peacefulMs=0; }
  update(delta:number,context:RecoveryContext) {
    const step=Math.max(0,Math.min(delta,250));
    if(context.busy||context.threatened||!context.inSettlement&&context.moving){this.interrupt();return context.hp;}
    if(context.inSettlement){this.peacefulMs+=step;this.idleMs=0;}
    else {this.idleMs+=step;this.peacefulMs=0;}
    const recoveryMs=context.inSettlement?this.peacefulMs:this.idleMs;
    if(recoveryMs<6000 || context.hp<=0) return context.hp;
    const perSecond=context.maxHp*(context.inSettlement?.02:.01);
    return Math.min(context.maxHp,context.hp+perSecond*step/1000);
  }
}
