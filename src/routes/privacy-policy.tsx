import {
  Section,
  Paragraph,
  Bold,
  OrderedList,
  Mailto,
  ExternalLink,
} from "../components/custom-elements";
import type { Route } from './+types/privacy-policy';

export const meta: Route.MetaFunction = ({ location }) => {
  return [
    { title: 'All Hands AI - Privacy Policy' },
    { name: 'description', content: 'Learn about how All Hands AI collects, uses, and protects your personal information.' },
    { property: 'og:title', content: 'All Hands AI - Privacy Policy' },
    { property: 'og:description', content: 'Learn about how All Hands AI collects, uses, and protects your personal information.' },
    { property: 'og:image', content: 'https://www.all-hands.dev/assets/all-hands-text-logo.png' },
    { property: 'og:url', content: 'https://www.all-hands.dev' + location.pathname },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'All Hands AI' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'All Hands AI - Privacy Policy' },
    { name: 'twitter:description', content: 'Learn about how All Hands AI collects, uses, and protects your personal information.' },
    { name: 'twitter:image', content: 'https://www.all-hands.dev/assets/all-hands-text-logo.png' },
    { rel: 'canonical', href: 'https://www.all-hands.dev' + location.pathname },
    { name: 'robots', content: 'noindex, nofollow' },
  ];
};


function PrivacyPolicy() {
  return (
    <main className="flex flex-col items-center px-80 py-10 gap-10">
      <h1 className="heading">Privacy Policy</h1>

      <Paragraph>
        All Hands AI ("All Hands AI" , "we," or "us") offers online services designed to allow software developers to efficiently
        and effectively develop and build their own software by using our proprietary open-source software and third party advanced
        technologies, such as artificial intelligence, machine learning systems and similar technology and features (collectively, the "Services")
        This Privacy Policy explains how we handle personal information that we collect or generate through the Services, and the personal
        information we collect when you visit our website, <ExternalLink>https://app.all-hands.dev/</ExternalLink> (the "Site"), and any other website or service that
        links to this Privacy Policy.
      </Paragraph>

      <Section title="Personal information we collect">
        <Paragraph>
          We collect the following categories of personal information:
        </Paragraph>
        <Paragraph>
          <Bold>Account information.</Bold> This includes:
          <OrderedList>
            <li>
              <Bold>Contact information and credentials</Bold>, such as your name, email address, phone number, address,
              and the username and password you use to access our Services. We may also receive account
              information and login credentials from GitHub and any other third-party services that you use to
              log-in to the Services.
            </li>
            <li>
              <Bold>Transactions and payment information</Bold> including your purchases, transactions, and billing
              information. We may use a third-party payment processor to manage your payments.
            </li>
            <li>
              <Bold>Feedback or correspondence</Bold>, such as information you provide when you contact us with questions,
              feedback, or otherwise correspond with us online.
            </li>
            <li>
              <Bold>Marketing information</Bold>, such as your preferences for receiving communications about our Services,
              and details about how you engage with our communications.
            </li>
          </OrderedList>
        </Paragraph>

        <Paragraph>
          <Bold>Content.</Bold> This includes any information you submit to the Services or permit the Services to access
          (including through GitHub), where such content contains personal information, such as any prompts,
          inputs, text, code or other information you upload or provide to the Services or that you generate using
          the Services.
        </Paragraph>
        <Paragraph>
          <Bold>Automatic data collection.</Bold> We may automatically log information about you, your computer or mobile
          device, and your interaction over time with our Site and Services, our communications and other online
          services, such as:
          <OrderedList>
            <li>
              <Bold>Device data</Bold>, such as your computer's or mobile device's operating system type and version,
              manufacturer and model, browser type, screen resolution, RAM and disk size, CPU usage, device
              type (e.g., phone, tablet), IP address, unique identifiers, language settings, mobile device carrier,
              radio/network information (e.g., WiFi, LTE, 4G), and general location information such as city, state
              or geographic area.
            </li>
            <li>
              <Bold>Usage data</Bold>, such as pages or screens you viewed, how long you spent on a page or screen,
              browsing history, navigation paths between pages or screens, information about your activity on
              a page or screen, access times, duration of access, and whether you have opened our emails or
              clicked links within them.
            </li>
          </OrderedList>
        </Paragraph>

        <Paragraph>
          We may collect this information using cookies and other similar technologies. Cookies, which are text
          files that websites store on a visitor's device or in the browser for the purpose of helping you navigate
          between pages efficiently, remembering your preferences, enabling functionality, and helping us
          understand user activity and patterns.
        </Paragraph>
      </Section>

      <Section title="How we use personal information">
        <Paragraph>
          We use personal information for the following purposes:
        </Paragraph>
        <Paragraph>
          <Bold>To operate our Site and Services</Bold>. We use personal information to provide, operate, maintain, secure and
          improve our Site and Services. This includes using your personal information to:
          <OrderedList>
            <li>
              Create, maintain, and administer your account.
            </li>
            <li>
              Provide the features of the Site and Services you use, including to store your content and create
              AI-generated outputs based on the inputs your provide.
            </li>
            <li>
              Communicate with you about our Services, including by sending you announcements, updates,
              security alerts, and support and administrative messages.
            </li>
            <li>
              Respond to your requests, questions, and feedback.
            </li>
          </OrderedList>
        </Paragraph>


        <Paragraph>
          <Bold>To develop and improve the Site and Services.</Bold> We use personal information to monitor use of our Site
          and Services, analyze the functioning of our Site and Services, improve the Site and Services, and
          develop new products and services, including by studying use of our Site and Services. As part of these
          activities, we may use content and feedback from your use of the Services to train and tune our AI
          models to improve the capabilities of our Services. We may also create aggregated, de-identified or
          other anonymous data from personal information we collect and share it with third parties for our lawful
          business purposes, including to analyze and improve the Services, and promote our business.
        </Paragraph>

        <Paragraph>
          <Bold>For marketing and advertising.</Bold> We may collect and use personal information for the following marketing
          and advertising purposes:
          <OrderedList>
            <li>
              <Bold>Direct marketing.</Bold> We may send you direct marketing communications as permitted by law,
              including by email. You may opt-out of our marketing communications as described below.
            </li>
            <li>
              <Bold>Interest-based advertising.</Bold> We engage advertising partners to display ads about the Services on
              other online platforms and services. For these purposes, we may use cookies and similar
              technologies from third-party advertising partners to help us serve online ads to you and others
              that may be interested in our Services. We do not use any content you submit, as described above,
              for these advertising purposes.
            </li>
          </OrderedList>
        </Paragraph>

        <Paragraph>
          <Bold>Compliance and protection,</Bold> including to comply with applicable laws, lawful requests, and legal process,
          such as to respond to subpoenas or requests from government authorities; to protect our, your or others' rights,
          privacy, safety, or property (including by making and defending legal claims), including by
          monitoring the safety and integrity of content on the Site and Services; to audit our internal processes
          for compliance with legal and contractual requirements and internal policies; and prevent, identify,
          investigate and deter fraudulent, harmful, unauthorized, unethical or illegal activity, including
          cyberattacks, identity theft, and illicit uses of the Site and Services.
        </Paragraph>
      </Section>

      <Section title="How we share your personal information">
        <Paragraph>
          We may share your personal information with the following categories of third parties:
        </Paragraph>

        <Paragraph>
          <Bold>Service providers.</Bold> Companies and individuals that provide services on our behalf or help us operate our
          Services or our business (such as hosting, information technology, customer support, email delivery,
          marketing, and website analytics services). We also rely on third-party AI service providers, which may
          receive your content subject to our agreements with them, to assist us with providing the Site and
          Services.
        </Paragraph>

        <Paragraph>
          <Bold>Professional advisors.</Bold> Professional advisors, such as lawyers, auditors, bankers, and insurers, where
          necessary in the course of the professional services that they render to us.
        </Paragraph>

        <Paragraph>
          <Bold>Authorities and others.</Bold> Law enforcement, government authorities, and private parties, as we believe in
          good faith to be necessary or appropriate for the compliance and protection purposes described above.
        </Paragraph>

        <Paragraph>
          <Bold>Business transferees.</Bold> Acquirers and other relevant participants in business transactions (or negotiations
          for such transactions) involving a corporate divestiture, merger, consolidation, acquisition,
          reorganization, sale, or other disposition of all or any portion of the business or assets of, or equity
          interests in, the All Hands AI (including, in connection with a bankruptcy or similar proceedings).
        </Paragraph>
      </Section>

      <Section title="Your choices">
        <Paragraph>
          <Bold>Update your account and manage your content.</Bold> You may be able to update information within your
          account, including managing and deleting the content you store on the Services.
        </Paragraph>

        <Paragraph>
          <Bold>Unsubscribe from marketing.</Bold> You can opt out of receiving marketing emails at any time by clicking
          “unsubscribe” within the email footer.
        </Paragraph>

        <Paragraph>
          <Bold>Limit online tracking:</Bold> Here are some of the ways you can limit online tracking:
          <OrderedList>
            <li>
              <Bold>Block cookies.</Bold> Most browsers let you remove or reject cookies, including cookies used for
              interest-based advertising. To do this, follow the instructions in your browser settings. Many
              browsers accept cookies by default until you change your settings. Use the following links to learn
              more about how to control cookies and online tracking through your browser:{" "}
              <span className="flex gap-1">
                <ExternalLink label="Firefox">https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop</ExternalLink>;
                <ExternalLink label="Chrome">https://support.google.com/chrome/answer/95647</ExternalLink>;
                <ExternalLink label="Microsoft Edge">https://support.microsoft.com/en-us/microsoft-edge/learn-about-tracking-prevention-in-microsoft-edge-5ac125e8-9b90-8d59-fa2c-7f2e9a44d869</ExternalLink>;
                <ExternalLink label="Safari">https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac</ExternalLink>;
              </span>
            </li>
            <li>
              <Bold>Limit the use of advertising ID.</Bold> You may be able to limit use of your mobile device's advertising ID
              for interest-based advertising purposes through your device's settings.
            </li>
            <li>
              <Bold>Use privacy plug-ins or browsers.</Bold> You can block our Services from setting cookies used for
              interest-based ads by using a browser with privacy features, like <ExternalLink label="Brave">https://brave.com/</ExternalLink>,
              or installing browser plugins like <ExternalLink label="Privacy Badger">https://www.eff.org/privacybadger</ExternalLink>,{" "}
              <ExternalLink label="DuckDuckGo">https://duckduckgo.com/</ExternalLink>, <ExternalLink label="Ghostery">https://www.ghostery.com/</ExternalLink>,{" "}
              or <ExternalLink label="uBlock Origin">https://ublock.org/</ExternalLink>, and configuring them to block
              third-party cookies/trackers. You can also install a browser add-on to opt out of <ExternalLink label="Google Analytics">https://tools.google.com/dlpage/gaoptout</ExternalLink>.
            </li>
            <li>
              <Bold>Advertising industry opt-outs.</Bold> You can also use these opt-out options to limit use of your
              information for interest-based advertising by participating companies: <ExternalLink label="Digital Advertising Alliance">http://optout.aboutads.info/</ExternalLink>,{" "}
              <ExternalLink label="Network Advertising Initiative">http://optout.networkadvertising.org/?c=1</ExternalLink>
            </li>
            <li>
              <Bold>Platform opt-outs.</Bold> The following advertising platforms offer opt-out features that let you opt out of
              use of your information for interest-based advertising: <ExternalLink label="Google opt-out">https://adssettings.google.com/</ExternalLink>,{" "}
              <ExternalLink label="LinkedIn opt-out">https://www.linkedin.com/psettings/guest-controls/retargeting-opt-out</ExternalLink>,{" "}
              <ExternalLink label="Microsoft opt-out">https://about.ads.microsoft.com/en-us/resources/policies/opt-out-of-the-microsoft-advertising-optimization-program</ExternalLink>
            </li>
          </OrderedList>
        </Paragraph>

        <Paragraph>
          Note that the above opt-out mechanisms are specific to the device or browser on which they are
          exercised. You will need to opt out on every browser and device that you use.
        </Paragraph>

        <Paragraph>
          Do Not Track. Some Internet browsers may be configured to send "Do Not Track" signals to the online
          services that you visit. We currently do not respond to "Do Not Track" or similar signals. To find out more
          about "Do Not Track," please visit <ExternalLink>http://www.allaboutdnt.com</ExternalLink>.
        </Paragraph>
      </Section>

      <Section title="Other sites, mobile applications and services">
        <Paragraph>
          Our Site and Services may contain links to other websites, mobile applications, and other online services
          operated by third parties. These links are not an endorsement of, or representation that we are affiliated
          with, any third party. In addition, our content may be included on web pages or in mobile applications or
          online services that are not associated with us. We do not control third-party websites, mobile
          applications or online services, and we are not responsible for their actions. Other websites and services
          follow different rules regarding the collection, use and sharing of your personal information. We
          encourage you to read the privacy policies of the other websites and mobile applications and online
          services you use.
        </Paragraph>
      </Section>

      <Section title="Retention">
        <Paragraph>
          We keep personal information for as long as reasonably necessary for the purposes described in this
          Privacy Policy, while we have a business need to do so, or as required by law (e.g. for tax, legal,
          accounting, or other purposes), whichever is longer.
        </Paragraph>
      </Section>

      <Section title="Children">
        <Paragraph>
          Our Services are not intended for children under 13. If we learn that we have collected personal
          information from a child under 13 without the consent of the child's parent or guardian as required by
          law, we will delete it.
        </Paragraph>
      </Section>

      <Section title="Data security">
        <Paragraph>
          We employ a number of technical, organizational and physical safeguards designed to protect the
          personal information we collect. However, no security measures are failsafe and we cannot guarantee
          the security of your personal information. Email contact@all-hands.dev if you'd like to have your data removed from the platform.
        </Paragraph>
      </Section>

      <Section title="Changes to this Privacy Policy">
        <Paragraph>
          We reserve the right to modify this Privacy Policy at any time. If we make material changes to this Privacy
          Policy, we will notify you by updating the date of this Privacy Policy and posting it on the Site or Services
          or as otherwise required by applicable laws.
        </Paragraph>
      </Section>

      <Section title="Further questions">
        <Paragraph>
          Please direct any questions or comments about this Privacy Policy or Site to <Mailto>contact@all-hands.dev</Mailto> or
          send a letter to All Hands AI, 24 Oak St, Apt 2, Somerville, MA 02139.
        </Paragraph>
      </Section>
    </main>
  );
}

export default PrivacyPolicy;
