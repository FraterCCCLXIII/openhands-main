import React from "react";
import { Helmet } from "react-helmet-async";
import clsx from "clsx";
import { GitHubButton } from "~/components/buttons/github-button";
import { TryItLiveButton } from "~/components/buttons/try-it-live-button";

interface FeatureProps {
  title: string;
  description: React.ReactNode;
  imagePosition: "left" | "right";
  imageUrl: string;
  index: number;
}

const Feature: React.FC<FeatureProps> = ({
  title,
  description,
  imagePosition,
  imageUrl,
  index,
}) => {
  return (
    <div className={clsx(
      "flex flex-col md:flex-row items-center gap-8 py-12 border-b border-gray-200",
      index === 0 && "pt-0",
      index === 5 && "border-b-0"
    )}>
      {imagePosition === "left" && (
        <div className="w-full md:w-1/2 flex justify-center">
          {imageUrl ? (
            <img src={imageUrl} alt={title} className="max-w-full h-auto rounded-lg" />
          ) : (
            <div className="w-full aspect-video bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
              Image coming soon
            </div>
          )}
        </div>
      )}
      
      <div className="w-full md:w-1/2 flex flex-col">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">{title}</h2>
        <div className="text-gray-700">
          {description}
        </div>
      </div>
      
      {imagePosition === "right" && (
        <div className="w-full md:w-1/2 flex justify-center">
          {imageUrl ? (
            <img src={imageUrl} alt={title} className="max-w-full h-auto rounded-lg" />
          ) : (
            <div className="w-full aspect-video bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
              Image coming soon
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Features = () => {
  const features = [
    {
      title: "Supercharge your engineering team",
      description: (
        <ul className="list-disc pl-4 space-y-2">
          <li>Free up engineers so they can focus on interesting problems that delight customers</li>
          <li>Automate repetitive engineering tasks with AI – without full-time supervision</li>
          <li>Accelerate velocity and close the gap between feedback and feature release</li>
        </ul>
      ),
      imagePosition: "right" as const,
      imageUrl: "/assets/feature_page/supercharge-team.png",
    },
    {
      title: "Best-in-class coding accuracy",
      description: (
        <ul className="list-disc pl-4 space-y-2">
          <li>OpenHands is consistently a top-ranked coding agent in SWE-bench and multiple benchmarks</li>
          <li>OpenHands Context Condenser technology drives accurate, efficient token use</li>
          <li>Produce consistent, high-quality, and easily understandable code</li>
        </ul>
      ),
      imagePosition: "left" as const,
      imageUrl: "/assets/feature_page/leaderboard-16-may.png",
      //imageUrl: "/assets/agent_performance/swe-bench.png",
    },
    {
      title: "Secure, sandboxed AI agents",
      description: (
        <ul className="list-disc pl-4 space-y-2">
          <li>Safely run agent commands from within a secure, containerized sandbox</li>
          <li>Bring your own containerized development environment (coming soon!)</li>
        </ul>
      ),
      imagePosition: "right" as const,
      imageUrl: "/assets/feature_page/secure-sandbox.png",
    },
    {
      title: "SaaS and self-hosted options",
      description: (
        <ul className="list-disc pl-4 space-y-2">
          <li>Use OpenHands Cloud to parallelize AI agents without managing infrastructure</li>
          <li>Or, run OpenHands Self-hosted in your own private cloud, with your own LLMs and keys</li>
          <li>Automate your processes with a fully-featured and documented API</li>
        </ul>
      ),
      imagePosition: "left" as const,
      imageUrl: "/assets/feature_page/saas-selfhosted.png",
    },
    {
      title: "Deep integrations with the tools you use",
      description: (
        <ul className="list-disc pl-4 space-y-2">
          <li>Trigger OpenHands to fix issues and implement features directly from GitHub and GitLab</li>
          <li>Customize your AI use cases with custom agents</li>
        </ul>
      ),
      imagePosition: "right" as const,
      imageUrl: "/assets/feature_page/integrations.png",
    },
    {
      title: "Dedicated support",
      description: (
        <ul className="list-disc pl-4 space-y-2">
          <li>Priority support from OpenHands engineers</li>
          <li>Recurring roadmap and product collaboration opportunities</li>
        </ul>
      ),
      imagePosition: "left" as const,
      imageUrl: "/assets/feature_page/support.png",
    },
  ];

  return (
    <div className="bg-[#F1EAE0] min-h-screen">
      <Helmet>
        <title>Features | OpenHands</title>
        <meta name="description" content="Explore the powerful features of OpenHands AI agents that supercharge your engineering team." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-16">
        <h1 className="heading-large text-center">OpenHands Cloud</h1>

        <div className="max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <Feature
              key={index}
              title={feature.title}
              description={feature.description}
              imagePosition={feature.imagePosition}
              imageUrl={feature.imageUrl}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;