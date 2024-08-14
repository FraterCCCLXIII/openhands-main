import { Prism } from "react-syntax-highlighter";
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CSyntaxHighlighterProps {
  children: string;
  language?: string;
}

export const CSyntaxHighlighter: React.FC<CSyntaxHighlighterProps> = ({ children, language }) => {
  return (
    <Prism
      customStyle={{ borderRadius: '6px' }}
      style={tomorrow}
      language={language}
    >
      {children}
    </Prism>
  );
};
