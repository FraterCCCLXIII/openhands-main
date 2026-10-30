/** Keys into the feed icons store, one per kind of thing that can have an icon. */
export const projectIconKey = (project: string): string => project;
export const factoryIconKey = (factoryId: string): string =>
  `factory:${factoryId}`;
export const personIconKey = (personId: string): string => `person:${personId}`;
export const agentIconKey = (agentId: string): string => `agent:${agentId}`;
export const canvasExtensionIconKey = (name: string): string =>
  `canvas-extension:${name}`;
