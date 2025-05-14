import React from "react";
import { Helmet } from "react-helmet-async";
import { SectionHeading } from "~/components/section-heading";

const PricingCard = ({ 
  title, 
  subtitle, 
  description, 
  features, 
  buttonText, 
  buttonLink 
}: { 
  title: string; 
  subtitle: string; 
  description: React.ReactNode; 
  features: string[]; 
  buttonText: string; 
  buttonLink: string; 
}) => {
  return (
    <div className="flex flex-col bg-white rounded-lg shadow-md p-6 w-full md:w-[320px] lg:w-[320px]">
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="mb-1">{subtitle}</p>
      <p className="text-gray-600 italic mb-4">{description}</p>
      <ul className="mb-6 flex-grow">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start mb-2">
            <span className="mr-2 text-yellow-500">•</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <a 
        href={buttonLink} 
        className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-2 px-4 rounded text-center transition-colors"
      >
        {buttonText}
      </a>
    </div>
  );
};

const Pricing = () => {
  const openSourceFeatures = [
    "Run OpenHands locally",
    "Bring your own LLM or API key",
    "Active open source community"
  ];

  const payAsYouGoFeatures = [
    "Immediate access from any device",
    "Access to the highest-performing LLMs",
    "High token rate limits",
    "GitHub and GitLab support",
    "API support",
    "Refill as low as $10"
  ];

  const businessFeatures = [
    "Everything in pay-as-you-go, plus:",
    "Additional integrations",
    "Higher token rate limits",
    "More concurrent conversations",
    "Self-hosted option",
    "Bring your own LLM (self-hosted only)",
    "Support and enablement package"
  ];

  return (
    <main>
      <Helmet>
        <title>All Hands AI - Pricing</title>
        <meta
          name="description"
          content="Flexible pricing options for All-Hands.dev - from open source to enterprise solutions."
        />
      </Helmet>

      <section className="flex flex-col items-center gap-4 text-center py-[86px] px-[53px]">
        <h1 className="heading-large max-w-[763px]">Flexible Pricing</h1>
      </section>

      <section className="flex flex-col items-center mb-[104px]">
        <SectionHeading />
        
        <div className="flex flex-col md:flex-row justify-center flex-wrap max-w-[1228px] gap-6">
          <PricingCard
            title="Open Source"
            subtitle=""
            description={<em>The world's leading open source AI coding agent</em>}
            features={openSourceFeatures}
            buttonText="Get it on GitHub"
            buttonLink="https://github.com/All-Hands-AI/OpenHands"
          />
          
          <div className="flex flex-col md:w-[660px] lg:w-[660px]">
            {/* Yellow box hidden on mobile (screen width < 768px) */}
            <div className="w-full text-center mb-4 hidden md:block">
              <div className="w-full bg-yellow-400 px-6 py-3 rounded-lg font-semibold text-lg">
                OpenHands Cloud
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-6">
              <PricingCard
                title="Pay-as-you-go"
                subtitle="Start with $50 free credits"
                description="Great for individuals"
                features={payAsYouGoFeatures}
                buttonText="Sign Up"
                buttonLink="https://app.all-hands.dev"
              />
              
              <PricingCard
                title="Business"
                subtitle="Flexible, custom pricing"
                description="Great for teams with multiple users"
                features={businessFeatures}
                buttonText="Contact Us"
                buttonLink="https://forms.gle/pdYjBk59Fwy6rshF8"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Pricing;
