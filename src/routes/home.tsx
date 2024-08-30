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
import { WaitlistForm } from "~/components/waitlist-form";
import { ActionFunctionArgs, json, useActionData, useNavigation } from "react-router-dom";
import { subscribeToWaitlist } from "~/api/mailchimp";
import React from "react";

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email");
  const user = formData.get("user");
  const org = formData.get("org");
  const first = formData.get("first");
  const last = formData.get("last");

  if (!email || typeof email !== "string") {
    return json({ result: "error", msg: "Email is required" });
  } else if (!user || typeof user !== "string") {
    return json({ result: "error", msg: "Username is required" });
  } else if (!org || typeof org !== "string") {
    return json({ result: "error", msg: "Company is required" });
  } else if (!first || typeof first !== "string") {
    return json({ result: "error", msg: "First name is required" });
  } else if (!last || typeof last !== "string") {
    return json({ result: "error", msg: "Last name is required" });
  }

  try {
    const data = await subscribeToWaitlist(email, user, org, first, last);
    return json(data);
  } catch (error) {
    return json({ result: "error", msg: "Failed to subscribe. Please try again later." });
  }
};

const Home = () => {
  const navigation = useNavigation();
  const data = useActionData() as { result: "success" | "error", msg: string } | undefined | null;

  const [formIsVisible, setFormIsVisible] = React.useState(false);

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
        <h1 className="font-quincy text-[58px] leading-[58px] lg:text-[52px] lg:leading-[52px] text-center lg:h-auto lg:w-[764px]">Open Source Agents for Developers</h1>
        {data?.result !== "success" && (
          <p className="paragraph text-description lg:w-[466px] text-center">We're building a hosted version of OpenHands! If you'd like to be one of the first people to try it, you can reserve your spot in line by filling out the form below.</p>
        )}
        {!formIsVisible && (
          <button
            className="font-[700] text-[19px] leading-[27px] text-white bg-black rounded-lg py-4 w-[250px]"
            onClick={() => setFormIsVisible(true)}
          >
            Save your spot
          </button>
        )}
        {formIsVisible && (
          <WaitlistForm
            success={data?.result === "success" ? data.msg : undefined}
            error={data?.result === "error" ? data.msg : undefined}
            disabled={navigation.state === "submitting" || !!data}
          />
        )}
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
            icon={<GitHubLogo width={23} height={23} />}
            text="Join us on GitHub"
            className="self-start"
            to="https://github.com/All-Hands-AI/OpenHands"
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
          cta={{
            icon: <GitHubLogo width={23} height={23} />,
            text: "Get it on GitHub",
            to: "https://github.com/All-Hands-AI/OpenHands"
          }}
        />
      </section>
    </main>
  )
};

export default Home;
