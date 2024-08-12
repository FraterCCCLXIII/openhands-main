import clsx from "clsx";
import { Link, useLoaderData } from "react-router-dom";
import { GitHubLogo } from "~/svgs/github-logo";
import { TripleWow } from "~/svgs/triple-wow";
import { Star } from "~/svgs/star";
import { Users } from "~/svgs/users";
import { Hierarchy } from "~/svgs/hierarchy";
import { ContributorGridPlaceholder } from "~/components/contributor-grid-placeholder";
import { YellowWaveSection } from "~/components/yellow-wave-section";
import { GitHubButton } from "~/components/github-button";
import { AnimatedSection } from "~/components/animated-section";
import { formatLastCommit } from "~/utils/format-last-commit";
import { formatThousands } from "~/utils/format-thousands";
import BreakFree from "~/svgs/break-free.svg?react";
import HeartHands from "~/svgs/heart-hands.svg?react";
import { Helmet } from "react-helmet-async";
import { animate, motion, useMotionValue, Variants } from "framer-motion";
import React from "react";

const variants: Variants = {
  animate: (index) => {
    if (index === 1) return { x: 0 };
    if (index === 2) return { x: 60 };

    return { x: -60 };
  }
};

const ImageCarousel = () => {
  const zIndexes = [useMotionValue(0), useMotionValue(1), useMotionValue(0)];
  const [currentCycle, setCurrentCycle] = React.useState(0);

  const next = () => {
    setCurrentCycle((prev) => (prev + 1) % 3);
  };

  React.useEffect(() => {
    zIndexes.forEach((zIndex, index) => {
      let targetZIndex = index === Math.abs(currentCycle - 1) ? 1 : 0;
      if (currentCycle === 2) targetZIndex = index === currentCycle ? 1 : 0;

      animate(zIndex, targetZIndex, { type: 'tween', duration: 1, onUpdate: (value) => zIndex.set(value) });
    });
  }, [currentCycle]);

  return (
    <motion.div
      onClick={next}
      className="relative w-[1134px] h-[727px]"
    >
      {['bg-red-500', 'bg-blue-500', 'bg-green-500'].map((color, index) => (
        <motion.div
          key={index}
          className={clsx(
            "absolute w-[500px] h-[300px]",
            color,
          )}
          style={{ zIndex: zIndexes[index] }}
          animate="animate"
          variants={variants}
          custom={(index + currentCycle) % 3}
        />
      ))}
    </motion.div>
  );
};

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

        <Link
          to="https://github.com/OpenDevin/OpenDevin"
          rel="noreferrer"
          target="_blank"
          className={
            clsx(
              "bg-black px-[30px] h-[58px] rounded-lg flex items-center gap-[15px]",
              "text-white text-[19px] leading-[27px] font-bold",
            )
          }
        >
          <GitHubLogo width={23} height={23} />
          Get it on GitHub
        </Link>
      </section>

      <AnimatedSection
        className="flex flex-col items-center gap-8 h-[510px] lg:h-[968px] pt-[25px]"
      >
        <TripleWow width={53} height={33} />
        <ImageCarousel />
        <p className="paragraph text-center w-[352px] lg:w-[466px] text-description">Development agents use AI to tackle the toil in your backlog, so you can focus on what matters: hard problems, creative challenges, and over-engineering your dotfiles</p>
      </AnimatedSection>

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
          <GitHubButton position="start" />
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
