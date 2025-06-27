import type { Route } from './+types/contact';

export const meta: Route.MetaFunction = ({ location }) => {
  return [
    { title: 'All Hands AI - Contact Us' },
    { name: 'description', content: 'Get in touch with the All Hands AI team. We\'d love to hear from you!' },
    { property: 'og:title', content: 'All Hands AI - Contact Us' },
    { property: 'og:description', content: 'Get in touch with the All Hands AI team. We\'d love to hear from you!' },
    { property: 'og:image', content: 'https://www.all-hands.dev/assets/all-hands-logo.png' },
    { property: 'og:url', content: 'https://www.all-hands.dev' + location.pathname },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'All Hands AI' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'All Hands AI - Contact Us' },
    { name: 'twitter:description', content: 'Get in touch with the All Hands AI team. We\'d love to hear from you!' },
    { name: 'twitter:image', content: 'https://www.all-hands.dev/assets/all-hands-logo.png' },
    { rel: 'canonical', href: 'https://www.all-hands.dev' + location.pathname },
  ];
};

const Contact = () => {
  return (
    <main className='flex flex-col items-center justify-center min-h-screen px-[42px] py-[86px]'>
      <div className='max-w-2xl text-center'>
        <h1 className='font-quincy heading-large mb-8'>
          Contact Us
        </h1>
        <p className='paragraph text-description mb-8'>
          In order to contact us, please fill out this{' '}
          <a 
            href="https://docs.google.com/forms/d/e/1FAIpQLScygK76gSmjRfqkC1XzogU89X4vNVaiITdDVkmdEP_Qh2b4gg/viewform"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Google Form
          </a>
        </p>
      </div>
    </main>
  );
};

export default Contact;