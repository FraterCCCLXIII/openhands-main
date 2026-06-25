export const isAuthDisabled = (env: NodeJS.ProcessEnv = process.env) =>
  env.INTHUB_DISABLE_AUTH === "true";
