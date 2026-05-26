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
    <main className="mx-auto flex w-full max-w-[960px] flex-col items-stretch gap-10 break-words px-6 py-10 sm:px-10 lg:px-20">
      <Markdown
        children={rdp}
        components={{
          h1: ({ children }) => <h1 className="heading max-w-full break-words">{children}</h1>,
          h2: ({ children }) => <Bold underline>{children}</Bold>,
          p: ({ children }) => <p className="max-w-full break-words">{children}</p>,
          code: ({ children }) => <code className="break-all">{children}</code>,
          a: ({ children }) => <ExternalLink>{children}</ExternalLink>,
          ul: ({ children }) => <ul className="w-full list-disc pl-5">{children}</ul>,
          li: (props) => (
            <li className="max-w-full break-words" {...props}>
              {props.children}
            </li>
          ),
        }}
      />
    </main>
  );
}

export default Rdp;
