# Kamiji

A Canvas App for building Kamiji creatures: a 2D, dependency-free version of the Studio
creature builder in [FraterCCCLXIII/kamiji](https://github.com/FraterCCCLXIII/kamiji)
(`site/studio`).

- **Body plans**: slime, cat, fox, bunny, bear, dragon, each with its own starting parts and colours.
- **Parts**: ears, tail, horns and wings, each swappable or removable.
- **Shape and face**: width, height, eye size and eye gap sliders, five expressions, four colour regions.
- **Roster**: save creatures in this browser, reopen or delete them, download the roster.
- **Export**: copy or download character JSON (`kamiji.studio.character/1`, the schema Studio uses) or download the SVG.

Part ids here are the simple 2D ones; the 3D Studio's own part ids are not produced. Tests: `npm install && npm test`.
