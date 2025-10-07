// Allow for importing markdown files
declare module "*.md" {
  const content: string;
  export default content;
}

// Reo analytics global type
interface Window {
  Reo?: {
    init: (config: { clientID: string }) => void;
  };
}
