import type { MetaFunction } from "@remix-run/node";
import GitHubLogo from "../../../assets/github.svg?react";
import TripleWow from "../../../assets/triple-wow.svg?react";
import Hierarchy from "../../../assets/hierarchy.svg?react";
import Star from "../../../assets/star.svg?react";
import Users from "../../../assets/users.svg?react";
import TupleLogo from "../../../assets/tuple-logo.svg?react";
import MirageLogo from "../../../assets/mirage-logo.svg?react";
import StaticKitLogo from "../../../assets/statickit-logo.svg?react";
import TransistorLogo from "../../../assets/transistor-logo.svg?react";
import WorkcationLogo from "../../../assets/workcation-logo.svg?react";
import clsx from "clsx";
import { Header } from "./header";
import { Footer } from "./footer";

export const meta: MetaFunction = () => {
  return [
    { title: "All Hands" },
    { name: "description", content: "Welcome to the All Hands website!" },
  ];
};

interface GitHubButtonProps {
  position?: "start";
}

const GitHubButton: React.FC<GitHubButtonProps> = ({ position }) => (
  <button className={clsx("bg-black px-4 py-[11px] rounded-lg", position && "self-start")}>
    <span className="text-white text-[19px] leading-[27px] font-bold">Join our GitHub</span>
  </button>
);

export default function Index() {
  return (
    <div className="bg-[#F1EAE0]">
      <Header />

      <main>
        <section className="flex flex-col items-center gap-4 pt-[50px] pb-[79px]">
          <h1 className="heading-large text-center">Open Source Agents for Developers</h1>

          <button className="bg-black px-[30px] h-[58px] rounded-lg flex items-center gap-[15px]">
            <GitHubLogo width={23} height={23} />
            <span className="text-white text-[19px] leading-[27px] font-bold">Get it on GitHub</span>
          </button>
        </section>

        <section className="flex flex-col items-center gap-8 pt-[25px] pb-[51px]">
          <TripleWow width={53} height={33} />
          <img alt="product" width={378} height={212} className="bg-[#D4CABD] rounded-[10px]" />
          <p className="paragraph text-center w-[352px] text-[#292A36]">Development agents use AI to tackle the toil in your backlog, so you can focus on what matters: hard problems, creative challenges, and over-engineering your dotfiles</p>
        </section>

        <section className="px-[42px] flex flex-col gap-16 pt-16 pb-16 items-center">
          <img
            src="../../assets/unchained.png"
            alt="hand gripping a broken chain"
            width={318}
            height={200}
            className="mix-blend-multiply"
          />
          <div className="flex flex-col gap-4">
            <span className="heading">Free as in Freedom</span>
            <p className="paragraph text-[#292A36]">We believe agentic technology is too important to be controlled by a few corporations. So we&apos;re building all our agents in the open on GitHub, under the MIT license.</p>
            <div className="flex flex-col gap-4">
              <div className="flex gap-[6px]">
                <Star width={24} height={24} />
                <span className="paragraph-bold">3k Stars</span>
              </div>
              <div className="flex gap-[6px]">
                <Users width={24} height={24} />
                <span className="paragraph-bold">3k Contributors</span>
              </div>
              <div className="flex gap-[6px]">
                <Hierarchy width={24} height={24} />
                <span className="paragraph-bold">Last Commit 2 Days ago</span>
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col py-16 gap-16 px-[42px] items-center">
          <img
            src="../../assets/person-robot-heart.png"
            alt="a persons and robots hands forming a heart"
            width={326}
            height={204}
            className="mix-blend-multiply"
          />
          <div className="flex flex-col gap-4">
            <span className="heading">Power and Responsibility</span>
            <p className="paragraph text-[#292A36]">Our agents can do anything a human developer can: they write code, run commands, and use the web. We&apos;re partnering with AI safety experts like Invariant Labs to balance innovation with security.</p>
          </div>
        </section>

        <section className="flex flex-col items-center px-[42px] gap-16 py-24">
          <div className="grid grid-cols-4 w-fit gap-[11px]">
            <img src="" alt="contributor" width={75} height={75} className="bg-[#D4CABD] rounded-[7px]" />
            <img src="" alt="contributor" width={75} height={75} className="bg-[#D4CABD] rounded-[7px]" />
            <img src="" alt="contributor" width={75} height={75} className="bg-[#D4CABD] rounded-[7px]" />
            <img src="" alt="contributor" width={75} height={75} className="bg-[#D4CABD] rounded-[7px]" />
            <img src="" alt="contributor" width={75} height={75} className="bg-[#D4CABD] rounded-[7px]" />
            <img src="" alt="contributor" width={75} height={75} className="bg-[#D4CABD] rounded-[7px]" />
            <img src="" alt="contributor" width={75} height={75} className="bg-[#D4CABD] rounded-[7px]" />
            <img src="" alt="contributor" width={75} height={75} className="bg-[#D4CABD] rounded-[7px]" />
            <img src="" alt="contributor" width={75} height={75} className="bg-[#D4CABD] rounded-[7px]" />
            <img src="" alt="contributor" width={75} height={75} className="bg-[#D4CABD] rounded-[7px]" />
            <img src="" alt="contributor" width={75} height={75} className="bg-[#D4CABD] rounded-[7px]" />
            <img src="" alt="contributor" width={75} height={75} className="bg-[#D4CABD] rounded-[7px]" />
          </div>

          <div className="flex flex-col gap-4">
            <span className="heading">Join the Community</span>
            <p className="paragraph text-[#292A36]">Thousands of developers are working together to build the AI-powered future they want to see. You can connect with us on GitHub, Slack, Twitter, or our blog.</p>
            <GitHubButton position="start" />
          </div>
        </section>

        <section className="px-[42px] flex flex-col gap-8 py-24">
          <div className="flex flex-col gap-4 text-center h-[206px]">
            <span className="heading">Choose your Engine</span>
            <p className="paragraph text-[#292A36]">Our agents are compatible with any large language model provider.</p>
          </div>

          <div className="flex flex-col items-center gap-8">
            <TupleLogo width={105} height={48} />
            <MirageLogo width={138} height={48} />
            <StaticKitLogo width={127} height={48} />
            <TransistorLogo width={158} height={48} />
            <WorkcationLogo width={189} height={48} />
          </div>
        </section>

        <section className="mb-[104px]">
          <img height={194} src="../../assets/yellow-bouncy.png" alt="" />
          <div className="flex flex-col gap-8 text-center items-center px-[42px] bg-[#FFE165]">
            <span className="heading">Ready to roll?</span>
            <p className="paragraph text-[#292A36]">Software development is changing. Let&apos;s work together to make sure it&apos;s better for everyone. {"\u2764"}</p>
            <GitHubButton />
          </div>
          <img
            height={194}
            src="../../assets/yellow-bouncy.png"
            alt=""
            className="transform rotate-180"
          />
        </section>

        <Footer />
      </main>
    </div>
  );
}
