// react-syntax-highlighter ships no type declarations for its deep ESM
// entry points (language grammars and style objects). Declare them as untyped
// modules so the imports in the markdown/syntax-highlighter code type-check.
declare module "react-syntax-highlighter/dist/esm/*";
