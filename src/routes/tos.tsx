import { Bold, OrderedList, ExternalLink } from "../components/custom-elements";
import Markdown from "react-markdown";
import tos from "../legal/tos.md?raw";
import type { Route } from './+types/tos';

export const meta: Route.MetaFunction = ({ location }) => {
  return [
    { title: 'Terms of Service' },
    { name: 'description', content: 'OpenHands Terms of Service' },
    { property: 'og:title', content: 'Terms of Service' },
    { property: 'og:description', content: 'OpenHands Terms of Service' },
    { property: 'og:image', content: 'https://openhands.dev/assets/webflow/og/69161b32abf448a2df921a73_openhands_opengraph_01.png' },
    { property: 'og:url', content: 'https://openhands.dev' + location.pathname },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'OpenHands' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Terms of Service' },
    { name: 'twitter:description', content: 'OpenHands Terms of Service' },
    { name: 'twitter:image', content: 'https://openhands.dev/assets/webflow/og/69161b32abf448a2df921a73_openhands_opengraph_01.png' },
    { rel: 'canonical', href: 'https://openhands.dev' + location.pathname },
    { name: 'robots', content: 'noindex, nofollow' },
  ];
};

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
