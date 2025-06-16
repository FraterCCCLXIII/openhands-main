import { Bold, OrderedList, ExternalLink } from "../components/custom-elements";
import Markdown from "react-markdown";
import tos from "../legal/tos.md?raw";
import type { Route } from './+types/tos';

export const meta: Route.MetaFunction = ({ location }) => {
  return [
    { title: 'All Hands AI - Terms of Service' },
    { name: 'description', content: 'Read the terms of service for All Hands AI products and services.' },
    { property: 'og:title', content: 'All Hands AI - Terms of Service' },
    { property: 'og:description', content: 'Read the terms of service for All Hands AI products and services.' },
    { property: 'og:image', content: '/assets/all-hands-text-logo.png' },
    { property: 'og:url', content: 'https://www.all-hands.dev' + location.pathname },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'All Hands AI' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'All Hands AI - Terms of Service' },
    { name: 'twitter:description', content: 'Read the terms of service for All Hands AI products and services.' },
    { name: 'twitter:image', content: '/assets/all-hands-text-logo.png' },
    { rel: 'canonical', href: 'https://www.all-hands.dev' + location.pathname },
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
