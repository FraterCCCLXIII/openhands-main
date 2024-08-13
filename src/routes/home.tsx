import { useLoaderData } from "react-router-dom";
import GitHubLogo from "~/svgs/github-logo.svg?react";
import TripleWow from "~/svgs/triple-wow.svg?react";
import Star from "~/svgs/star.svg?react";
import Users from "~/svgs/users.svg?react";
import Hierarchy from "~/svgs/hierarchy.svg?react";
import { ContributorGridPlaceholder } from "~/components/contributor-grid-placeholder";
import { YellowWaveSection } from "~/components/yellow-wave-section";
import { Button } from "~/components/button";
import { formatLastCommit } from "~/utils/format-last-commit";
import { formatThousands } from "~/utils/format-thousands";
import BreakFree from "~/svgs/break-free.svg?react";
import HeartHands from "~/svgs/heart-hands.svg?react";
import { Helmet } from "react-helmet-async";
import { ImageCarousel } from "~/components/image-carousel";

export const loader = () => {
  return {
    contributors: [],
    stars: formatThousands(0),
    lastCommit: formatLastCommit(new Date().toISOString()),
  };
};

const Home = () => {
  const { contributors, lastCommit, stars } = useLoaderData() as ReturnType<typeof loader>;

  return (
    <main>
      <Helmet>
        <title>All Hands AI</title>
        <meta
          name="description"
          content="Welcome to the All Hands AI website!"
        />
      </Helmet>

      <section
        className="flex flex-col items-center gap-4 h-[391px] lg:h-auto pt-[50px] lg:py-[86px]"
      >
        <h1 className="heading-large text-center h-[188px] lg:h-auto lg:w-[764px]">Open Source Agents for Developers</h1>

        <Button
          variant="large"
          icon={<GitHubLogo width={23} height={23} />}
          text="Get it on GitHub"
          to="https://github.com/OpenDevin/OpenDevin"
          external
        />
      </section>

      <section
        className="flex flex-col items-center gap-8 pt-[25px] overflow-hidden"
      >
        <TripleWow width={53} height={33} />
        <ImageCarousel
          images={Array.from({ length: 3 }).map((_, index) => `/assets/product/product-slide-${index + 1}.png`)}
        />
        <p className="paragraph text-center w-[352px] lg:w-[466px] text-description">Development agents use AI to tackle the toil in your backlog, so you can focus on what matters: hard problems, creative challenges, and over-engineering your dotfiles</p>
      </section>

      <section
        className="px-[42px] flex flex-col lg:flex-row gap-16 lg:gap-[81px] pt-16 pb-16 lg:p-0 lg:h-[489px] items-center lg:justify-center"
      >
        <BreakFree className="w-[318px] lg:w-[329px]" />
        <div className="flex flex-col gap-4 lg:w-[500px]">
          <span className="heading">Free as in Freedom</span>
          <p className="paragraph text-description lg:w-[466px]">We believe agentic technology is too important to be controlled by a few corporations. So we&apos;re building all our agents in the open on GitHub, under the MIT license.</p>
          <div data-testid="repo-statistics" className="flex flex-col gap-4 paragraph font-bold">
            <div className="flex gap-[6px]">
              <Star width={24} height={24} />
              <span>{stars} Stars</span>
            </div>
            <div className="flex gap-[6px]">
              <Users width={24} height={24} />
              <span>{0} Contributors</span>
            </div>
            <div className="flex gap-[6px]">
              <Hierarchy width={24} height={24} />
              <span>Last Commit {lastCommit}</span>
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
        className="flex flex-col lg:flex-row items-center lg:justify-center px-[42px] gap-16 lg:gap-[100px] py-24"
      >
        <ContributorGridPlaceholder variant="small" />

        <div className="flex flex-col gap-4 lg:w-[500px]">
          <span className="heading">Join the Community</span>
          <p className="paragraph text-description lg:w-[466px]">Thousands of developers are working together to build the AI-powered future they want to see. You can connect with us on GitHub, Slack, Twitter, or our blog.</p>
          <Button
            variant="medium"
            text="Join our GitHub"
            className="self-start"
            to="https://github.com/OpenDevin"
            external
          />
        </div>
      </section>

      <section
        className="px-[42px] flex flex-col gap-8 lg:gap-16 py-24 lg:py-[41px] lg:items-center"
      >
        <div className="flex flex-col gap-4 text-center h-[206px] lg:h-[126px]">
          <span className="heading">Choose your Engine</span>
          <p className="paragraph text-description lg:w-[466px]">Our agents are compatible with any large language model provider.</p>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-8 lg:w-screen lg:max-w-[1358px] lg:px-[143px] lg:justify-between">

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
