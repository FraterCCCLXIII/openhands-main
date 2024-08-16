export const shiftOrder = (order: number[]): number[] => {
  return order.map((i) => (i + 1) % order.length);
};

export const swapOneAndZero = (order: number[]): number[] => {
  const one = order.indexOf(1);
  const zero = order.indexOf(0);
  order[one] = 0;
  order[zero] = 1;
  return order;
}
