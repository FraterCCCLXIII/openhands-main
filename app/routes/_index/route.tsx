import { defer, type LinksFunction, type MetaFunction } from "@remix-run/node";
import GitHubLogo from "../../svgs/github.svg?react";
import TripleWow from "../../svgs/triple-wow.svg?react";
import Hierarchy from "../../svgs/hierarchy.svg?react";
import Star from "../../svgs/star.svg?react";
import Users from "../../svgs/users.svg?react";
import TupleLogo from "../../svgs/tuple-logo.svg?react";
import MirageLogo from "../../svgs/mirage-logo.svg?react";
import StaticKitLogo from "../../svgs/statickit-logo.svg?react";
import TransistorLogo from "../../svgs/transistor-logo.svg?react";
import WorkcationLogo from "../../svgs/workcation-logo.svg?react";
import { Await, Link, useLoaderData } from "@remix-run/react";
import { formatThousands } from "~/utils/format-thousands";
import { formatLastCommit } from "~/utils/format-last-commit";
import { fetchBranch, fetchRepositoryContributors, fetchRepositoryStatistics } from "~/api";
import { YellowWaveSection } from "~/components/yellow-wave-section";
import { GitHubButton } from "~/components/github-button";
import clsx from "clsx";
import { Suspense } from "react";
import { ContributorGrid, ContributorGridPlaceholder } from "~/components/contributor-grid-placeholder";
import { AnimatedSection } from "~/components/animated-section";

export const meta: MetaFunction = () => {
  return [
    { title: "All Hands" },
    { name: "description", content: "Welcome to the All Hands website!" },
  ];
};

export const links: LinksFunction = () => ([
  { rel: "preload", as: "image", href: "/assets/person-robot-heart.png" },
  { rel: "preload", as: "image", href: "/assets/unchained.png" },
  { rel: "preload", as: "image", href: "/assets/white-wave.png" },
  { rel: "preload", as: "image", href: "/assets/yellow-wave.png" },
]);

export const loader = async () => {
  const contributors = fetchRepositoryContributors("opendevin", "opendevin");
  const statistics = await fetchRepositoryStatistics("opendevin", "opendevin");
  const branch = await fetchBranch("opendevin", "opendevin", "main");

  return defer(
    {
      contributors,
      stars: formatThousands(statistics.stargazers_count),
      lastCommit: formatLastCommit(branch.commit.commit.author.date),
    },
    {
      headers: { "Cache-Control": "max-age=1200" }
    }
  );
};

export default function Index() {
  const { contributors, stars, lastCommit } = useLoaderData<typeof loader>();

  return (
    <main>
      <section
        className="flex flex-col items-center gap-4 h-[391px] lg:h-auto pt-[50px] lg:py-[86px]"
      >
        <h1 className="heading-large text-center h-[188px] lg:h-auto lg:w-[764px]">Open Source Agents for Developers</h1>

        <Link
          to="https://github.com/OpenDevin/OpenDevin"
          rel="noreferrer"
          target="_blank"
          className={clsx(
            "bg-black px-[30px] h-[58px] rounded-lg flex items-center gap-[15px]",
            "text-white text-[19px] leading-[27px] font-bold"
          )}
        >
          <GitHubLogo width={23} height={23} />
          Get it on GitHub
        </Link>
      </section>

      <AnimatedSection
        className="flex flex-col items-center gap-8 h-[510px] lg:h-[968px] pt-[25px]"
      >
        <TripleWow width={53} height={33} />
        <img
          alt="product"
          className="bg-[#D4CABD] rounded-[10px] w-[378px] h-[212px] lg:w-[1140px] lg:h-[639px]"
        />
        <p className="paragraph text-center w-[352px] lg:w-[466px] text-description">Development agents use AI to tackle the toil in your backlog, so you can focus on what matters: hard problems, creative challenges, and over-engineering your dotfiles</p>
      </AnimatedSection>

      <AnimatedSection
        className="px-[42px] flex flex-col lg:flex-row gap-16 lg:gap-[81px] pt-16 pb-16 lg:p-0 lg:h-[489px] items-center lg:justify-center mix-blend-multiply"
      >
        <img
          src="/assets/unchained.png"
          alt="hand gripping a broken chain"
          className="mix-blend-multiply w-[318px] lg:w-[525px]"
        />

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
      </AnimatedSection>

      <AnimatedSection
        className="flex flex-col lg:flex-row-reverse py-16 gap-16 lg:gap-8 px-[42px] lg:p-0 lg:h-[502px] items-center lg:justify-center mix-blend-multiply"
      >
        <img
          src="/assets/person-robot-heart.png"
          alt="a persons and robots hands forming a heart"
          className="mix-blend-multiply w-[326px] lg:w-[503px]"
        />
        <div className="flex flex-col gap-4 lg:w-[500px]">
          <span className="heading">Power and Responsibility</span>
          <p className="paragraph text-description lg:w-[466px]">Our agents can do anything a human developer can: they write code, run commands, and use the web. We&apos;re partnering with AI safety experts like Invariant Labs to balance innovation with security.</p>
        </div>
      </AnimatedSection>

      <AnimatedSection
        className="flex flex-col lg:flex-row items-center lg:justify-center px-[42px] gap-16 lg:gap-[100px] py-24"
      >
        <Suspense fallback={<ContributorGridPlaceholder variant="small" />}>
          <Await resolve={contributors}>
            {(contributors) => <ContributorGrid contributors={contributors} variant="small" />}
          </Await>
        </Suspense>

        <div className="flex flex-col gap-4 lg:w-[500px]">
          <span className="heading">Join the Community</span>
          <p className="paragraph text-description lg:w-[466px]">Thousands of developers are working together to build the AI-powered future they want to see. You can connect with us on GitHub, Slack, Twitter, or our blog.</p>
          <GitHubButton position="start" />
        </div>
      </AnimatedSection>

      <AnimatedSection
        className="px-[42px] flex flex-col gap-8 lg:gap-16 py-24 lg:py-[41px] lg:items-center"
      >
        <div className="flex flex-col gap-4 text-center h-[206px] lg:h-[126px]">
          <span className="heading">Choose your Engine</span>
          <p className="paragraph text-description lg:w-[466px]">Our agents are compatible with any large language model provider.</p>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-8 lg:w-screen lg:max-w-[1358px] lg:px-[143px] lg:justify-between">
          <TupleLogo width={105} height={48} />
          <MirageLogo width={138} height={48} />
          <StaticKitLogo width={127} height={48} />
          <TransistorLogo width={158} height={48} />
          <WorkcationLogo width={189} height={48} />
        </div>
      </AnimatedSection>

      <section className="mb-[104px]">
        <YellowWaveSection
          heading="Ready to roll?"
          text={`Software development is changing. Let's work together to make sure it's better for everyone. \u2764`}
        />
      </section>
    </main>
  );
}
