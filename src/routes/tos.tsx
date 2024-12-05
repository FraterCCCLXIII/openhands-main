import { Bold, OrderedList, ExternalLink } from "../components/custom-elements";
import Markdown from "react-markdown";
import tos from "../legal/tos.md?raw";

function TOS() {
  return (
    <main className="flex flex-col items-start px-80 py-10 gap-10">
      <Markdown
        children={tos}
        components={{
          h1: ({ children }) => <h1 className="heading">{children}</h1>,
          h2: ({ children }) => <Bold underline>{children}</Bold>,
          a: ({ children }) => <ExternalLink>{children}</ExternalLink>,
          ol: ({ children }) => <OrderedList>{children}</OrderedList>,
        }}
      />
    </main>
  );
}

export default TOS;
