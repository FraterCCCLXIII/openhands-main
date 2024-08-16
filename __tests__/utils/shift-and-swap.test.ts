import { expect, test } from "vitest";
import { shiftOrder, swapOneAndZero } from "../../src/utils/shift-and-swap";

test("shift and swap", () => {
  expect(shiftOrder([2, 1, 0])).toEqual([0, 2, 1]);
  expect(swapOneAndZero([0, 2, 1])).toEqual([1, 2, 0]);
});
