import { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, useLoaderData } from "@remix-run/react";
import { SectionHeading } from "~/components/section-heading";
import { PriceCard } from "./price-card";
import { Switch } from "./switch";

export const meta: MetaFunction = () => ([
  { title: "All Hands Pricing" },
  { name: "description", content: "All Hands product pricing plans for developers." },
]);

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  let type = url.searchParams.get("type") || "monthly";

  if (type !== "monthly" && type !== "yearly") type = "monthly";
  return json({ type: type as "monthly" | "yearly" });
};

const Pricing = () => {
  const { type } = useLoaderData<typeof loader>();

  return (
    <main>
      <section className="py-[45px]">
        <SectionHeading
          isHero
          heading="Automate your development"
          subheading="PRICING"
          description="Made with the collaborative help of over 40 engineers in the opensource community. OpenDev changes the way you can create software."
        />
      </section>

      <section className="flex flex-col items-center gap-[42px] py-[45px]">
        <Switch selected={type} />

        <div className="flex gap-[31px] bg-white/50 pt-[40px] pb-[49px] px-[68px] rounded-[10px]">
          <PriceCard
            price={0}
            type={type}
            plan="Starter"
            description="Experience the next generation of AI software development"
            items={[
              "Unlimited projects",
              "Unlimited collaborators",
              "Unlimited storage",
              "Unlimited data",
            ]}
          />
          <PriceCard
            price={54}
            type={type}
            plan="Pro"
            description="Advanced tools to take your work to the next level"
            items={[
              "Unlimited projects",
              "Unlimited collaborators",
              "Unlimited storage",
              "Unlimited data",
            ]}
          />
          <PriceCard
            isMostPopular
            price={89}
            type={type}
            plan="Enterprise"
            description="Automation plus enterprise-grade features"
            items={[
              "Unlimited projects",
              "Unlimited collaborators",
              "Unlimited storage",
              "Unlimited data",
            ]}
          />
        </div>
      </section>
    </main>
  );
};

export default Pricing;
