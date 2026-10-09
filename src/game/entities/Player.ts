import Phaser from 'phaser';
import { mobileInput, type MobileAction } from '../input';
import { useGameStore } from '../../store/gameStore';
import type { WorldScene } from '../scenes/WorldScene';
import { artScale, ART_BY_KEY, actorArtLayout, actorScaleForHeight, HERO_VISIBLE_HEIGHT, type PlayerPresentationTexture } from '../../data/art';
import { directionFrame } from '../../data/animationPacks';
import { PLAYER_ATTACK_ANIMATIONS } from '../../data/spriteBoards';
import { animationDuration } from '../../data/animationPacks';
import { progressionStats } from '../../data/progression';
import { ACTIVE_SKILLS } from '../../data/activeSkills';
import { PlayerSkillSystem } from '../systems/PlayerSkillSystem';
import { RecoverySystem } from '../systems/RecoverySystem';
import { approachVelocity, strideRate } from '../systems/locomotion';

export class Player extends Phaser.Physics.Arcade.Sprite {
  readonly moveSpeed = 165;
  readonly skills:PlayerSkillSystem;
  readonly recovery=new RecoverySystem();
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  lastDirection = new Phaser.Math.Vector2(0, 1);
  private readonly keys: Record<'up' | 'down' | 'left' | 'right' | 'sprint' | MobileAction, Phaser.Input.Keyboard.Key>;
  private nextAttackAt = 0;
  private nextDashAt = 0;
  private dashUntil = 0;
  private dashDirection = new Phaser.Math.Vector2(0, 1);
  private nextDashTrailAt = 0;
  private sprintExhausted = false;
  private readonly pressed = new Set<MobileAction>();
  private attackVisual:Phaser.GameObjects.Sprite | null = null;

  constructor(scene: WorldScene, x: number, y: number) {
    super(scene, x, y, 'leigneron', 0);
    scene.add.existing(this);
    const layout = actorArtLayout('leigneron');
    this.setScale(artScale('leigneron')).setOrigin(.5, layout.originY);
    scene.physics.add.existing(this);
    this.setDepth(y);
    this.once('destroy',() => { this.clearAttackVisual(); this.skills?.destroy(); });

    const body = this.body as Phaser.Physics.Arcade.Body;
    const density = ART_BY_KEY.leigneron.density;
    body.setSize(18 * density, 22 * density);
    body.setOffset(layout.bodyX * density, layout.bodyY * density);
    body.setCollideWorldBounds(true);

    const state = useGameStore.getState();
    this.hp = state.hp;
    this.maxHp = state.maxHp;
    this.stamina = state.stamina;
    this.maxStamina = state.maxStamina;
    this.skills = new PlayerSkillSystem(scene,this);

    if (!scene.input.keyboard) throw new Error('Keyboard input is unavailable.');
    this.keys = scene.input.keyboard.addKeys({
      up: 'W', down: 'S', left: 'A', right: 'D', sprint: 'SHIFT', dash: 'Q', attack: 'SPACE', interact: 'E',
      skill1:'ONE',skill2:'TWO',skill3:'THREE',skill4:'FOUR',
    }) as typeof this.keys;
    for (const action of ['dash', 'attack', 'interact','skill1','skill2','skill3','skill4'] as const) {
      this.keys[action].setEmitOnRepeat(false).on('down', () => this.pressed.add(action));
    }
  }

  updatePlayer(time: number, delta: number) {
    const scene = this.scene as WorldScene;
    const body = this.body as Phaser.Physics.Arcade.Body;
    const state = useGameStore.getState();
    const progression = progressionStats(state.attributes, state.learnedSkills);
    this.maxHp = progression.maxHp;
    this.maxStamina = progression.maxStamina;
    this.skills.update(delta);

    let x = (this.keys.right.isDown ? 1 : 0) - (this.keys.left.isDown ? 1 : 0) + mobileInput.moveX;
    let y = (this.keys.down.isDown ? 1 : 0) - (this.keys.up.isDown ? 1 : 0) + mobileInput.moveY;
    const movement = new Phaser.Math.Vector2(x, y);
    if (this.skills.isCasting) movement.set(0,0);
    if (movement.lengthSq() > 1) movement.normalize();
    x = movement.x;
    y = movement.y;

    if (movement.lengthSq() > 0.01) {
      this.lastDirection.copy(movement).normalize();
    }

    const mobileDash = mobileInput.consume('dash');
    const dashPressed = this.consumeAction('dash') || mobileDash;
    if (dashPressed && !this.skills.isCasting && time >= this.nextDashAt && this.stamina >= 16) {
      this.nextDashAt = time + 850;
      this.dashUntil = time + 165;
      this.stamina -= 16;
      this.dashDirection.copy(this.lastDirection);
      this.nextDashTrailAt = time;
      scene.recordTraining('drill-dash');
      scene.cameras.main.shake(75, 0.0015);
      scene.playEffect('fortification', this.x, this.y, this.dashDirection);
    }

    const dashing = time < this.dashUntil;
    const sprintHeld = this.keys.sprint.isDown || mobileInput.sprint;
    // Exhaustion survives tiny refills and brief input changes. Recover a
    // useful reserve with sprint released before a new hold can start running.
    const sprintRecoveryStamina = this.maxStamina * .2;
    if (this.stamina <= 0) this.sprintExhausted = true;
    if (this.sprintExhausted && !sprintHeld && this.stamina >= sprintRecoveryStamina) {
      this.sprintExhausted = false;
    }

    let sprinting = sprintHeld && !this.sprintExhausted && !this.skills.isCasting &&
      !dashing && movement.lengthSq() > .01 && this.stamina > 0;
    if (sprinting) {
      this.stamina = Math.max(0, this.stamina - delta * 0.022);
      if (this.stamina === 0) {
        this.sprintExhausted = true;
        sprinting = false;
      }
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + delta * 0.014);
    }

    const dashMultiplier = dashing ? 2.65 : 1;
    if (dashing) { x = this.dashDirection.x; y = this.dashDirection.y; }
    const walkSpeed = this.moveSpeed * progression.speedMultiplier;
    const speed = walkSpeed * (sprinting ? 1.42 : 1) * dashMultiplier;
    // The exhausted state uses walking speed immediately, including cadence;
    // don't carry the previous sprint velocity into the walking animation.
    if (this.sprintExhausted && !dashing && body.velocity.length() > walkSpeed) {
      body.velocity.setLength(walkSpeed);
    }
    const lockedMotion=this.skills.isCasting||dashing;
    body.setVelocity(lockedMotion?x*speed:approachVelocity(body.velocity.x,x*speed,delta,45),
      lockedMotion?y*speed:approachVelocity(body.velocity.y,y*speed,delta,45));
    const runningAnimation = dashing || (sprinting && !this.sprintExhausted);
    this.updateAnimation(body.velocity.x, body.velocity.y, runningAnimation, x, y);
    if (dashing && time >= this.nextDashTrailAt) this.createDashTrail(time);
    this.setDepth(this.y);
    if (this.attackVisual?.active) this.attackVisual.setPosition(this.x,this.y).setDepth(this.depth);

    for (const skill of ACTIVE_SKILLS) {
      const touchPressed = mobileInput.consume(skill.action);
      const pressed = this.consumeAction(skill.action) || touchPressed;
      if (pressed && !this.skills.isCasting && time >= this.nextAttackAt && time >= this.dashUntil) {
        this.clearAttackVisual();
        if (this.skills.tryCast(skill.id)) this.nextAttackAt = time + skill.durationMs;
      }
    }

    const mobileAttack = mobileInput.consume('attack');
    const attackPressed = this.consumeAction('attack') || mobileAttack;
    if (attackPressed && !this.skills.isCasting && time >= this.nextAttackAt) {
      const weapon = scene.getEquippedWeapon();
      const cooldown = weapon.cooldownMs * progression.cooldownMultiplier;
      if (this.stamina >= weapon.staminaCost) {
        this.nextAttackAt = time + cooldown;
        this.stamina = Math.max(0, this.stamina - weapon.staminaCost);
        scene.performPlayerAttack(this, this.lastDirection, weapon);
        if (weapon.kind === 'sword' || weapon.kind === 'greatsword') this.playSwordVisual(cooldown);
      }
    }

    const mobileInteract = mobileInput.consume('interact');
    const interactPressed = this.consumeAction('interact') || mobileInteract;
    if (interactPressed && !this.skills.isCasting) scene.tryInteract(this.x, this.y);
  }

  takeDamage(amount: number) {
    const scene = this.scene as WorldScene;
    this.recovery.interrupt();
    this.hp = Math.max(0, this.hp - Math.ceil(amount * this.skills.incomingDamageMultiplier));
    this.setTintFill(0xffd0d0);
    scene.playEffect('hit', this.x, this.y);
    scene.time.delayedCall(100, () => { if (this.active) this.clearTint(); });
    if (this.hp <= 0) scene.respawnPlayer();
  }

  restoreAt(x: number, y: number) {
    this.recovery.interrupt();
    this.skills.cancelCast(); this.skills.clearRally();
    this.clearAttackVisual();
    (this.body as Phaser.Physics.Arcade.Body).reset(x, y);
    this.dashUntil = 0;
    this.sprintExhausted = false;
    this.hp = this.maxHp;
    this.stamina = this.maxStamina;
    (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
  }

  resetInput() {
    this.skills.cancelCast();
    this.clearAttackVisual();
    mobileInput.reset();
    for (const key of Object.values(this.keys)) key.reset();
    this.dashUntil = 0;
    this.sprintExhausted = false;
    (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    this.anims.stop();
    this.pressed.clear();
  }

  discardActions() {
    this.pressed.clear();
    for (const action of ['attack', 'dash', 'interact','skill1','skill2','skill3','skill4'] as const) mobileInput.consume(action);
  }
  private consumeAction(action: MobileAction) {
    const value = this.pressed.has(action);
    this.pressed.delete(action);
    return value;
  }

  private clearAttackVisual() {
    const effect = this.attackVisual; this.attackVisual = null;
    if (effect?.active) effect.destroy();
    if (this.active) this.setAlpha(1);
  }

  private setPresentationTexture(texture: PlayerPresentationTexture, scale: number) {
    this.anims.stop();
    // Select a cell immediately, not the entire prepared atlas (__BASE).
    // Every pose keeps its feet at the same world anchor and an 18x22 body.
    const layout = actorArtLayout(texture);
    this.setTexture(texture, 0).setScale(scale).setOrigin(.5, layout.originY);
    const sheet = ART_BY_KEY[texture];
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(18 / scale, 22 / scale)
      .setOffset(sheet.frameWidth * sheet.density / 2 - 9 / scale,
        layout.originY * sheet.frameHeight * sheet.density - 22 / scale);
  }

  private playSwordVisual(cooldown:number) {
    this.clearAttackVisual();
    const direction = directionFrame(this.lastDirection.x,this.lastDirection.y) / 6;
    const slashX = this.x + this.lastDirection.x * 16;
    const slashY = this.y + this.lastDirection.y * 16;
    (this.scene as WorldScene).playEffect('slash', slashX, slashY, this.lastDirection);
    const animation = PLAYER_ATTACK_ANIMATIONS[direction], layout = actorArtLayout('leigneron_attack');
    const effect = this.scene.add.sprite(this.x,this.y,'leigneron_attack',animation.frames[0]).setOrigin(.5,layout.originY)
      .setScale(artScale('leigneron_attack')).setDepth(this.depth).setName('player-sword-visual');
    this.attackVisual = effect; this.setAlpha(0);
    effect.play(animation.key); effect.anims.timeScale = animationDuration(animation) / cooldown;
    effect.once(Phaser.Animations.Events.ANIMATION_COMPLETE,() => { if (this.attackVisual === effect) this.clearAttackVisual(); });
  }

  private createDashTrail(time: number) {
    this.nextDashTrailAt = time + 55;
    const trail = this.scene.add.sprite(this.x, this.y, this.texture.key, this.frame.name)
      .setOrigin(this.originX, this.originY).setScale(this.scaleX, this.scaleY)
      .setFlipX(this.flipX).setTint(0x9debdc).setAlpha(0.38).setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(this.y - 1).setName('player-dash-afterimage');
    this.scene.tweens.add({ targets: trail, alpha: 0, x: trail.x - this.dashDirection.x * 18,
      y: trail.y - this.dashDirection.y * 18, duration: 180, onComplete: () => trail.destroy() });
  }

  private playMovementAnimation(key: string, texture: PlayerPresentationTexture) {
    const previousKey = this.anims.currentAnim?.key;
    const isSideStride = (animationKey: string | undefined) =>
      animationKey === 'leigneron-right' || animationKey === 'leigneron-run-side';
    const preserveStride = this.anims.isPlaying && previousKey !== key &&
      isSideStride(previousKey) && isSideStride(key);
    const progress = preserveStride ? this.anims.getProgress() : 0;
    if (this.texture.key !== texture) {
      this.setPresentationTexture(texture, artScale(texture));
    }
    this.anims.play(key, true);
    if (preserveStride) this.anims.setProgress(progress);
  }

  private updateAnimation(x: number, y: number, running: boolean, directionX: number, directionY: number) {
    if (Math.hypot(x,y) < 3) {
      this.anims.timeScale=1;
      const standingFrame=directionFrame(this.lastDirection.x,this.lastDirection.y);
      if (standingFrame === 6 || standingFrame === 12) {
        if (this.texture.key !== 'leigneron_idle_sides') {
          this.setPresentationTexture('leigneron_idle_sides', artScale('leigneron_idle_sides'));
        }
        this.setFlipX(standingFrame === 6);
        this.anims.play('leigneron-idle-side', true);
        return;
      }
      this.setFlipX(false);
      if(standingFrame!==0){
        if(this.texture.key!=='leigneron')this.setPresentationTexture('leigneron',artScale('leigneron'));
        this.anims.stop();this.setFrame(standingFrame);return;
      }
      if (this.texture.key !== 'leigneron_idle') {
        this.setPresentationTexture('leigneron_idle', actorScaleForHeight('leigneron_idle', 0, HERO_VISIBLE_HEIGHT));
      }
      this.anims.play('leigneron-idle', true);
      return;
    }
    // Input (or the locked dash vector) determines facing. Residual velocity
    // during a turn only controls cadence, so pressing down cannot show a
    // sideways run while the previous horizontal motion slows down.
    const hasDirection = Math.hypot(directionX,directionY) > .1;
    const facingX = hasDirection ? directionX : this.lastDirection.x;
    const facingY = hasDirection ? directionY : this.lastDirection.y;
    const sideways = Math.abs(facingX) > Math.abs(facingY);
    // These strips depict the right side only. Mirror horizontal travel to
    // the left; retain real front/back art for north/south movement rather
    // than depicting upward/downward travel as a right-facing sprint.
    if (running && sideways) {
      this.setFlipX(facingX < 0);
      this.playMovementAnimation('leigneron-run-side', 'leigneron_running');
      this.anims.timeScale=strideRate(Math.hypot(x,y),this.moveSpeed * 1.42);
      return;
    }
    let key = 'leigneron-down';
    // Both sides share the same poses; mirroring preserves the stride phase
    // when turning instead of restarting a separate left/right animation.
    if (sideways) key = 'leigneron-right';
    else key = facingY < 0 ? 'leigneron-up' : 'leigneron-down';
    this.setFlipX(sideways && facingX < 0);
    this.playMovementAnimation(key, 'leigneron');
    this.anims.timeScale=strideRate(Math.hypot(x,y),this.moveSpeed);
  }
}
