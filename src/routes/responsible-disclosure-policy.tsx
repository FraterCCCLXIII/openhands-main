import type { Route } from "./+types/responsible-disclosure-policy";
import Markdown from "react-markdown";
import { Bold, ExternalLink } from "../components/custom-elements";
import rdp from "../legal/responsible-disclosure-policy.md?raw";

export const meta: Route.MetaFunction = ({ location }) => {
  return [
    { title: "OpenHands - Responsible Disclosure Policy" },
    {
      name: "description",
      content: "Guidelines for reporting security vulnerabilites",
    },
    {
      property: "og:title",
      content: "OpenHands - Responsible Disclosure Policy",
    },
    {
      property: "og:description",
      content: "Guidelines for reporting security vulnerabilites",
    },
    {
      property: "og:image",
      content: "https://www.all-hands.dev/assets/all-hands-logo.png",
    },
    {
      property: "og:url",
      content: "https://www.all-hands.dev" + location.pathname,
    },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "All Hands AI" },
    { rel: "canonical", href: "https://www.all-hands.dev" + location.pathname },
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
