import {test,expect} from '@playwright/test';

const phase=process.env.VISUAL_AUDIT_BASELINE?'before':'after';
test.use({viewport:{width:1440,height:900}});

test('focused rendered grove spider and attached diagonal caravan review',async({page})=>{
  test.setTimeout(90000);
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await page.evaluate(async()=>{const path='/tests/browser/visualFixture.ts';const {openSpriteReview}=await import(path);await openSpriteReview();});
  await page.addStyleTag({content:'.hud-layer,.mobile-controls,.pc-hint,.toast{display:none!important}'});
  const spider=await page.evaluate(async()=>{
    const ep='/src/game/entities/Enemy.ts',dp='/src/data/enemies.ts';
    const {Enemy}=await import(ep),{ENEMY_BY_ID}=await import(dp);
    const s=(window as any).__spriteReview;
    s.scene.pause();s.physics.world.pause();s.children.list.forEach((o:any)=>o.setVisible?.(false));
    const cx=s.player.x,cy=s.player.y;s.cameras.main.stopFollow().setZoom(1).centerOn(cx,cy);
    s.add.rectangle(cx,cy,1440,900,0x293a32).setDepth(2000000);
    const texture=s.textures.get('enemy_grove_spider'),columns=['idle','walk 1','walk 2','walk 3','walk 4','windup','strike','recover','hurt','death 1','death 2'];
    const frames:number[]=[];const sizes:any[]=[];
    for(let row=0;row<4;row++){
      const indices=[row*5,...[1,2,3,4].map(i=>row*5+i),...[0,1,2,3,4,5].map(i=>20+row*6+i)];
      indices.forEach((frame,i)=>{
        const x=cx-605+i*112,y=cy-235+row*160;
        const enemy=new Enemy(s,ENEMY_BY_ID['grove-spider'],x,y,'visual-spider:'+row+':'+i);enemy.anims.stop();enemy.setFrame(frame).setDepth(2000002);
        const b=texture.get(frame).customData.visibleBounds;frames.push(frame);sizes.push({row,frame,width:b.width,height:b.height,bodyX:enemy.body.center.x-x,bodyY:enemy.body.center.y-y});
        s.add.ellipse(x,y+2,36,10,0,0).setStrokeStyle(1,0xd4c59e).setDepth(2000001);
        s.add.text(x,y+18,['down','left','right','up'][row]+' / '+columns[i],{fontSize:'9px',color:'#ffffff'}).setOrigin(.5).setDepth(2000003);
      });
    }
    const faults=frames.filter(i=>{const f=texture.get(i);return Math.abs(f.u1-(f.cutX+f.cutWidth)/f.source.width)>1e-7||Math.abs(f.v1-(f.cutY+f.cutHeight)/f.source.height)>1e-7;});
    return {sizes,faults};
  });
  await page.screenshot({path:`test-results/spider-${phase}.png`});
  const caravans=await page.evaluate(async()=>{
    const vp='/src/game/systems/VehicleArt.ts',mp='/src/game/systems/trafficMotion.ts';
    const {CART_ART_POSES}=await import(vp);
    const {trafficDirection}=await import(mp);
    const s=(window as any).__spriteReview;
    s.children.list.forEach((o:any)=>o.setVisible?.(false));
    const cx=s.player.x,cy=s.player.y;s.add.rectangle(cx,cy,1440,900,0x293a32).setDepth(2000000);
    const rows:any[]=[];
    for(const [i,[dx,dy]] of [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]].entries()){
      const slot=i%4,x=cx-350+(slot%2)*700,y=cy-190+Math.floor(slot/2)*390;
      const length=1000,unit=Math.hypot(dx,dy),direction=trafficDirection(dx,dy);
      const route={id:'visual-cart:'+i,kind:'cart',length,speed:48,phase:0,points:[{x:x-dx/unit*500,y:y-dy/unit*500},{x:x+dx/unit*500,y:y+dy/unit*500}]};
      const v=s.traffic.create(route,x,y);s.traffic.presentCart(v,x,y,direction,33,true);
      v.sprite.setDepth(2000002);v.horse.setDepth(2000003);v.wheels.forEach((w:any)=>w.setDepth(2000004));
      for(const actor of [v.sprite,v.horse,...v.wheels])actor.setData('caravanReviewGroup',i<4?'diagonal':'cardinal').setVisible(i<4);
      const pose=CART_ART_POSES[direction];
      const offset={x:v.horse.x-v.sprite.x,y:v.horse.y-v.sprite.y};
      rows.push({dx,dy,direction,offset,expected:pose.horse,error:Math.hypot(offset.x-pose.horse.x,offset.y-pose.horse.y)});
      s.add.text(x,y+130,`${dx},${dy}`,{fontSize:'16px',color:'#ffffff'}).setOrigin(.5).setDepth(2000005).setData('caravanReviewGroup',i<4?'diagonal':'cardinal').setVisible(i<4);
    }
    return rows;
  });
  await page.screenshot({path:`test-results/caravans-${phase}.png`});
  await page.evaluate(()=>{const s=(window as any).__spriteReview;for(const o of s.children.list){const group=o.getData?.('caravanReviewGroup');if(group)o.setVisible(group==='cardinal');}});
  await page.screenshot({path:`test-results/caravans-cardinal-${phase}.png`});
  await test.info().attach('spider-and-caravan-registration.json',{body:JSON.stringify({spider,caravans},null,2),contentType:'application/json'});
  console.log('Rendered',spider.sizes.length,'spider poses; caravan attachment errors:',caravans.map(c=>c.error));
  expect(spider.faults).toEqual([]);expect(errors).toEqual([]);
  for(const pose of spider.sizes){expect(pose.width).toBeGreaterThan(30);expect(pose.width).toBeLessThan(110);expect(pose.bodyX).toBe(0);expect(pose.bodyY).toBe(-17);}
  if(phase==='after')for(const c of caravans)expect(c.error,`caravan ${c.dx},${c.dy}`).toBeLessThan(.001);
});
