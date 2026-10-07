import Phaser from 'phaser';
import { mobileInput } from '../input';
import { useGameStore } from '../../store/gameStore';
import type { WorldScene } from '../scenes/WorldScene';
import { artScale, ART_BY_KEY, actorArtLayout, actorScaleForHeight } from '../../data/art';
import { directionFrame } from '../../data/animationPacks';
import { PLAYER_ATTACK_ANIMATIONS } from '../../data/spriteBoards';
import { animationDuration } from '../../data/animationPacks';
import { progressionStats } from '../../data/progression';

export class Player extends Phaser.Physics.Arcade.Sprite {
  readonly moveSpeed = 165;
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  lastDirection = new Phaser.Math.Vector2(0, 1);
  private readonly keys: Record<'up' | 'down' | 'left' | 'right' | 'sprint' | 'dash' | 'attack' | 'interact', Phaser.Input.Keyboard.Key>;
  private nextAttackAt = 0;
  private nextDashAt = 0;
  private dashUntil = 0;
  private dashDirection = new Phaser.Math.Vector2(0, 1);
  private nextDashTrailAt = 0;
  private readonly pressed = new Set<'dash' | 'attack' | 'interact'>();
  private attackVisual:Phaser.GameObjects.Sprite | null = null;

  constructor(scene: WorldScene, x: number, y: number) {
    super(scene, x, y, 'leigneron', 0);
    scene.add.existing(this);
    const layout = actorArtLayout('leigneron');
    this.setScale(artScale('leigneron')).setOrigin(.5, layout.originY);
    scene.physics.add.existing(this);
    this.setDepth(y);
    this.once('destroy',() => this.clearAttackVisual());

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

    if (!scene.input.keyboard) throw new Error('Keyboard input is unavailable.');
    this.keys = scene.input.keyboard.addKeys({
      up: 'W', down: 'S', left: 'A', right: 'D', sprint: 'SHIFT', dash: 'Q', attack: 'SPACE', interact: 'E',
    }) as typeof this.keys;
    for (const action of ['dash', 'attack', 'interact'] as const) {
      this.keys[action].on('down', () => this.pressed.add(action));
    }
  }

  updatePlayer(time: number, delta: number) {
    const scene = this.scene as WorldScene;
    const body = this.body as Phaser.Physics.Arcade.Body;
    const state = useGameStore.getState();
    const progression = progressionStats(state.attributes, state.learnedSkills);
    this.maxHp = progression.maxHp;
    this.maxStamina = progression.maxStamina;

    let x = (this.keys.right.isDown ? 1 : 0) - (this.keys.left.isDown ? 1 : 0) + mobileInput.moveX;
    let y = (this.keys.down.isDown ? 1 : 0) - (this.keys.up.isDown ? 1 : 0) + mobileInput.moveY;
    const movement = new Phaser.Math.Vector2(x, y);
    if (movement.lengthSq() > 1) movement.normalize();
    x = movement.x;
    y = movement.y;

    if (movement.lengthSq() > 0.01) {
      this.lastDirection.copy(movement).normalize();
    }

    const sprinting = (this.keys.sprint.isDown || mobileInput.sprint) && this.stamina > 0 && time >= this.dashUntil;
    if (sprinting && movement.lengthSq() > 0) {
      this.stamina = Math.max(0, this.stamina - delta * 0.022);
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + delta * 0.014);
    }

    const mobileDash = mobileInput.consume('dash');
    const dashPressed = this.consumeAction('dash') || mobileDash;
    if (dashPressed && time >= this.nextDashAt && this.stamina >= 16) {
      this.nextDashAt = time + 850;
      this.dashUntil = time + 165;
      this.stamina -= 16;
      this.dashDirection.copy(this.lastDirection);
      this.nextDashTrailAt = time;
      scene.cameras.main.shake(75, 0.0015);
      scene.playEffect('fortification', this.x, this.y, this.dashDirection);
    }

    const dashMultiplier = time < this.dashUntil ? 2.65 : 1;
    if (time < this.dashUntil) { x = this.dashDirection.x; y = this.dashDirection.y; }
    const speed = this.moveSpeed * progression.speedMultiplier * (sprinting ? 1.42 : 1) * dashMultiplier;
    body.setVelocity(x * speed, y * speed);
    if (time < this.dashUntil && time >= this.nextDashTrailAt) this.createDashTrail(time);

    this.updateAnimation(x, y);
    this.setDepth(this.y);
    if (this.attackVisual?.active) this.attackVisual.setPosition(this.x,this.y).setDepth(this.depth);

    const mobileAttack = mobileInput.consume('attack');
    const attackPressed = this.consumeAction('attack') || mobileAttack;
    if (attackPressed && time >= this.nextAttackAt) {
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
    if (interactPressed) scene.tryInteract(this.x, this.y);
  }

  takeDamage(amount: number) {
    const scene = this.scene as WorldScene;
    this.hp = Math.max(0, this.hp - amount);
    this.setTintFill(0xffd0d0);
    scene.playEffect('hit', this.x, this.y);
    scene.time.delayedCall(100, () => { if (this.active) this.clearTint(); });
    if (this.hp <= 0) scene.respawnPlayer();
  }

  restoreAt(x: number, y: number) {
    this.clearAttackVisual();
    (this.body as Phaser.Physics.Arcade.Body).reset(x, y);
    this.dashUntil = 0;
    this.hp = this.maxHp;
    this.stamina = this.maxStamina;
    (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
  }

  resetInput() {
    this.clearAttackVisual();
    mobileInput.reset();
    for (const key of Object.values(this.keys)) key.reset();
    this.dashUntil = 0;
    (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    this.anims.stop();
    this.pressed.clear();
  }

  discardActions() {
    this.pressed.clear();
    for (const action of ['attack', 'dash', 'interact'] as const) mobileInput.consume(action);
  }
  private consumeAction(action: 'dash' | 'attack' | 'interact') {
    const value = this.pressed.has(action);
    this.pressed.delete(action);
    return value;
  }

  private clearAttackVisual() {
    const effect = this.attackVisual; this.attackVisual = null;
    if (effect?.active) effect.destroy();
    if (this.active) this.setAlpha(1);
  }

  private setPresentationTexture(texture: 'leigneron' | 'leigneron_idle', scale: number) {
    this.setTexture(texture).setScale(scale);
    const layout = actorArtLayout('leigneron');
    const density = ART_BY_KEY.leigneron.density;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(18 / scale, 22 / scale)
      .setOffset(layout.bodyX * density * artScale('leigneron') / scale,
        layout.bodyY * density * artScale('leigneron') / scale);
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

  private updateAnimation(x: number, y: number) {
    if (Math.abs(x) < 0.05 && Math.abs(y) < 0.05) {
      if (this.texture.key !== 'leigneron_idle') {
        this.setPresentationTexture('leigneron_idle', actorScaleForHeight('leigneron_idle', 0, 76));
      }
      this.anims.play('leigneron-idle', true);
      return;
    }
    if (this.texture.key !== 'leigneron') {
      this.setPresentationTexture('leigneron', artScale('leigneron'));
      this.anims.stop();
    }
    let key = 'leigneron-down';
    if (Math.abs(x) > Math.abs(y)) key = x < 0 ? 'leigneron-left' : 'leigneron-right';
    else key = y < 0 ? 'leigneron-up' : 'leigneron-down';
    this.setFlipX(false);
    this.anims.play(key, true);
  }
}
