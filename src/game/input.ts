export type MobileAction = 'attack' | 'dash' | 'interact';

const mobile = {
  moveX: 0,
  moveY: 0,
  attack: false,
  dash: false,
  interact: false,
  sprint: false,
};

export const mobileInput = {
  get moveX() { return mobile.moveX; },
  get moveY() { return mobile.moveY; },
  get sprint() { return mobile.sprint; },
  setSprint(held: boolean) { mobile.sprint = held; },
  setMove(x: number, y: number) {
    const length = Math.hypot(x, y);
    if (length > 1) {
      mobile.moveX = x / length;
      mobile.moveY = y / length;
    } else {
      mobile.moveX = x;
      mobile.moveY = y;
    }
  },
  releaseMove() {
    mobile.moveX = 0;
    mobile.moveY = 0;
  },
  press(action: MobileAction) {
    mobile[action] = true;
  },
  consume(action: MobileAction) {
    const pressed = mobile[action];
    mobile[action] = false;
    return pressed;
  },
  reset() {
    mobile.moveX = 0;
    mobile.moveY = 0;
    mobile.attack = false;
    mobile.dash = false;
    mobile.interact = false;
    mobile.sprint = false;
  },
};
