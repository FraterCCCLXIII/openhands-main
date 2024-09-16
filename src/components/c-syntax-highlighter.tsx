import { Prism } from "react-syntax-highlighter";
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CSyntaxHighlighterProps {
  children: string;
  language?: string;
  className?: React.CSSProperties;
}

export const CSyntaxHighlighter: React.FC<CSyntaxHighlighterProps> = ({ children, language, className }) => {
  return (
    <Prism
      customStyle={{ borderRadius: '6px', ...className }}
      style={tomorrow}
      language={language}
      PreTag={"div"}
    >
      {children}
    </Prism>
  );
};
