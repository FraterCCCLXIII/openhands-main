import type { Route } from "./+types/responsible-disclosure-policy";
import Markdown from "react-markdown";
import { Bold, ExternalLink } from "../components/custom-elements";
import rdp from "../legal/responsible-disclosure-policy.md?raw";

export const meta: Route.MetaFunction = ({ location }) => {
  return [
    { title: "Responsible Disclosure Policy" },
    {
      name: "description",
      content: "OpenHands Responsible Disclosure Policy",
    },
    {
      property: "og:title",
      content: "Responsible Disclosure Policy",
    },
    {
      property: "og:description",
      content: "OpenHands Responsible Disclosure Policy",
    },
    {
      property: "og:image",
      content: "https://openhands.dev/assets/webflow/og/69161b32abf448a2df921a73_openhands_opengraph_01.png",
    },
    {
      property: "og:url",
      content: "https://openhands.dev" + location.pathname,
    },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "OpenHands" },
    { tagName: "link", rel: "canonical", href: "https://openhands.dev" + location.pathname },
  ];
};

function Rdp() {
  return (
    <main className="flex flex-col items-start px-80 py-10 gap-10">
      <Markdown
        children={rdp}
        components={{
          h1: ({ children }) => <h1 className="heading">{children}</h1>,
          h2: ({ children }) => <Bold underline>{children}</Bold>,
          a: ({ children }) => <ExternalLink>{children}</ExternalLink>,
          li: (props) => (
            <li className="list-disc ml-5" {...props}>
              {props.children}
            </li>
          ),
        }}
      />
    </main>
  );
}

export default Rdp;
