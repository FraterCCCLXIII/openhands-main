# ASCII Tamagotchi Canvas Extension

A dependency-free Canvas Extension that raises an ASCII pet named Tater. It
implements manifest schema 1 and host API 1, and `extension.js` is one
self-contained browser ES module, so it can be installed without a build step.

## Pages

- `/home` (**Tamagotchi**): the pet den, needs and growth bars, and a care guide.
- `/journal` (**Journal**): a log of notable events such as meals, naps,
  sickness, hatching, and growth.

## Care

| Action   | Effect                                                    |
| -------- | --------------------------------------------------------- |
| Feed     | Raises hunger and gives a small joy and health bump.      |
| Play     | Raises joy, costs energy and a little hunger.             |
| Nap      | Sleeps for three minutes: restores energy, pauses boredom. |
| Clean    | Clears waste and restores hygiene.                        |
| Medicine | Restores health. Only useful when health is below 80.     |
| New egg  | Starts over with a fresh egg.                             |

Needs decay in real time. Waste piles up while Tater is awake, which hurts
hygiene. Health drops when any core need stays under 20 and recovers when all
of them stay above 50. Growth accrues while care is at least 50% and moves the
pet through baby, child, and adult. If health reaches zero, Tater passes away.

State lives in `localStorage` for this browser only. It is a per-viewer
convenience, not shared between users or backends.

## Install locally

Follow the flow in [`docs/CANVAS_EXTENSIONS_TESTING.md`](../../../../docs/CANVAS_EXTENSIONS_TESTING.md),
using this source path instead of the demo page:

```text
src/fixtures/canvas-extensions/tamagotchi
```
