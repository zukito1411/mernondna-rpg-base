/** Short exponential response, independent of render frame rate. */
export function approachVelocity(current:number,target:number,delta:number,responseMs=65) {
  const next=current+(target-current)*(1-Math.exp(-Math.max(0,Math.min(delta,100))/responseMs));
  return Math.abs(next-target)<2?target:next;
}
export function strideRate(speed:number,reference:number) {
  return Math.max(.35,Math.min(2,speed/Math.max(1,reference)));
}
