import type { Route } from "./+types/responsible-disclosure-policy";
import Markdown from "react-markdown";
import { Bold, ExternalLink } from "../components/custom-elements";
import rdp from "../legal/responsible-disclosure-policy.md?raw";
import { createSocialPreviewMeta } from '~/utils/seo';

export const meta: Route.MetaFunction = ({ location }) =>
  createSocialPreviewMeta({
    title: "Responsible Disclosure Policy",
    description: "OpenHands Responsible Disclosure Policy",
    pathname: location.pathname,
  });

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
