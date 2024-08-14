import Markdown from "react-markdown";

interface CMarkdownProps {
  children: string;
}

export const CMarkdown: React.FC<CMarkdownProps> = ({ children }) => (
  <Markdown
    children={children}
    components={{
      a: (props) => <a rel="noreferrer" target="_blank" className="text-blue-600" {...props}>{props.children}</a>,
      h2: (props) => <h2 className="font-quincy text-5xl" {...props}>{props.children}</h2>,
      li: (props) => <li className="list-disc ml-5" {...props}>{props.children}</li>,
      img: (props) => <img className="rounded-lg" {...props} alt={props.alt} />,
      p: (props) => <p className="text-description" {...props}>{props.children}</p>,
    }}
  />
);
