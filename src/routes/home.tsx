import statistics from "~/data/statistics.json";
import contributors from "~/data/contributors.json";
import GitHubLogo from "~/svgs/github-logo.svg?react";
import TripleWow from "~/svgs/triple-wow.svg?react";
import Star from "~/svgs/star.svg?react";
import Users from "~/svgs/users.svg?react";
import Hierarchy from "~/svgs/hierarchy.svg?react";
import Anthropic from "~/svgs/engines/anthropic-logo.svg?react";
import HuggingFace from "~/svgs/engines/hf-logo.svg?react";
import OpenAI from "~/svgs/engines/openai-logo.svg?react";
import TogetherAI from "~/svgs/engines/together-ai-logo.svg?react";
import { ContributorGrid } from "~/components/contributor-grid";
import { YellowWaveSection } from "~/components/yellow-wave-section";
import { Button } from "~/components/button";
import { formatLastCommit } from "~/utils/format-last-commit";
import { formatThousands } from "~/utils/format-thousands";
import BreakFree from "~/svgs/break-free.svg?react";
import HeartHands from "~/svgs/heart-hands.svg?react";
import { Helmet } from "react-helmet-async";
import { ImageCarousel } from "~/components/image-carousel";
import { formatContributorCount } from "~/utils/format-contributor-count";

const Home = () => {
  return (
    <main data-testid="home-content">
      <Helmet>
        <title>All Hands AI</title>
        <meta
          name="description"
          content="Welcome to the All Hands AI website!"
        />
      </Helmet>

      <section
        className="flex flex-col items-center gap-4 pb-[45px] lg:h-auto pt-[50px] lg:py-[86px] px-[42px]"
      >
        <h1 className="font-quincy text-[58px] leading-[58px] lg:text-[52px] lg:leading-[52px] text-center h-[188px] lg:h-auto lg:w-[764px]">Open Source Agents for Developers</h1>
        <p className="paragraph text-description lg:w-[466px] text-center">Use AI to tackle the toil in your backlog, so you can focus on what matters: hard problems, creative challenges, and over-engineering your dotfiles</p>
        <Button
          variant="small"
          icon={<GitHubLogo width={23} height={23} />}
          text="Get it on GitHub"
          to="https://github.com/OpenDevin/OpenDevin"
          external
        />
      </section>

      <section
        className="flex flex-col items-center gap-8 pt-[25px] pb-[60px] lg:pt-0 overflow-hidden"
      >
        <TripleWow width={36} height={22} />
        <ImageCarousel
          images={Array.from({ length: 3 }).map((_, index) => `/assets/product/product-slide-${index + 1}.webp`)}
        />
      </section>

      <section
        className="px-[42px] lg:px-[184px] flex flex-col lg:flex-row gap-16 lg:gap-[81px] pt-16 pb-16 lg:p-0 lg:h-[489px] items-center lg:justify-center"
      >
        <BreakFree className="w-[318px] lg:w-[329px]" />
        <div className="flex flex-col gap-4 lg:w-[500px]">
          <span className="heading">Free as in Freedom</span>
          <p className="paragraph text-description lg:w-[466px]">We believe agentic technology is too important to be controlled by a few corporations. So we&apos;re building all our agents in the open on GitHub, under the MIT license.</p>
          <div data-testid="repo-statistics" className="flex flex-col gap-4 paragraph font-bold">
            <div className="flex gap-[6px]">
              <Star width={24} height={24} />
              <span>{formatThousands(statistics.stargazers)} Stars</span>
            </div>
            <div className="flex gap-[6px]">
              <Users width={24} height={24} />
              <span>{formatContributorCount(statistics.contributors_count)} Contributors</span>
            </div>
            <div className="flex gap-[6px]">
              <Hierarchy width={24} height={24} />
              <span>Last commit made {formatLastCommit(statistics.latest_commit)}</span>
            </div>
          </div>
        </div>
      </section>

      <section
        className="flex flex-col lg:flex-row-reverse py-16 gap-16 lg:gap-8 px-[42px] lg:p-0 lg:h-[502px] items-center lg:justify-center"
      >
        <HeartHands className="w-[326px] lg:w-[312px]" />
        <div className="flex flex-col gap-4 lg:w-[500px]">
          <span className="heading">Power and Responsibility</span>
          <p className="paragraph text-description lg:w-[466px]">Our agents can do anything a human developer can: they write code, run commands, and use the web. We&apos;re partnering with AI safety experts like Invariant Labs to balance innovation with security.</p>
        </div>
      </section>

      <section
        className="flex flex-col lg:flex-row items-center lg:justify-center px-[42px] gap-16 lg:gap-[100px] py-24 lg:py-16"
      >
        <div className="h-[calc(58px*3+40px)] lg:h-auto overflow-hidden relative">
          <ContributorGrid
            variant="small"
            contributors={contributors}
          />
          <div className="lg:hidden absolute bottom-0 bg-gradient-to-t from-[#F1EAE0] to-transparent h-[40px] w-full" />
        </div>

        <div className="flex flex-col gap-4 lg:w-[500px]">
          <span className="heading">Join the Community</span>
          <p className="paragraph text-description lg:w-[466px]">Thousands of developers are working together to build the AI-powered future they want to see. You can connect with us on GitHub, Slack, Twitter, or our blog.</p>
          <Button
            variant="medium"
            text="Get it on GitHub"
            className="self-start"
            to="https://github.com/OpenDevin"
            external
          />
        </div>
      </section>

      <section
        className="px-[42px] flex flex-col gap-8 lg:gap-16 py-24 lg:py-16 lg:items-center"
      >
        <div className="flex flex-col gap-4 text-center h-[206px] lg:h-[126px]">
          <span className="heading">Choose your Engine</span>
          <p className="paragraph text-description lg:w-[466px]">Our agents are compatible with any large language model provider.</p>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-8 lg:w-screen lg:max-w-[1358px] lg:px-[143px] lg:justify-between">
          <Anthropic width={120} height={48} />
          <HuggingFace width={140} height={48} />
          <img
            src="/assets/llama-logo.png"
            width={48}
            height={48}
            alt=""
          />
          <OpenAI width={100} height={48} />
          <TogetherAI width={120} height={48} />
        </div>
      </section>

      <section className="mb-[104px]">
        <YellowWaveSection
          heading="Ready to roll?"
          text={`Software development is changing. Let's work together to make sure it's better for everyone. \u2764`}
        />
      </section>
    </main>
  )
};

export default Home;
