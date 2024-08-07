import { LoaderFunctionArgs } from "@remix-run/node";
import { Form, json, useLoaderData } from "@remix-run/react";
import clsx from "clsx";
import { Button } from "~/components/button";
import { SectionHeading } from "~/components/section-heading";
import CheckCircle from "~/svgs/check-circle-1.svg?react";

interface SwitchProps {
  selected: "monthly" | "yearly";
}

const Switch: React.FC<SwitchProps> = ({ selected = "monthly" }) => {
  return (
    <Form
      preventScrollReset
      className="flex gap-0.5 text-sm font-poppins font-bold bg-white/50 text-black rounded-[25px]"
    >
      <button
        name="type"
        value="monthly"
        className={clsx("px-[32px] py-[13px] rounded-[25px]", selected === "monthly" && "bg-black text-white")}
      >
        Monthly
      </button>

      <button
        name="type"
        value="yearly"
        className={clsx("px-[32px] py-[13px] rounded-[25px]", selected === "yearly" && "bg-black text-white")}
      >
        Yearly
      </button>
    </Form>
  );
};

interface PriceCardProps {
  price: number;
  type: "monthly" | "yearly";
  plan: string;
  description: string;
  items: string[];
}

const PriceCard: React.FC<PriceCardProps> = ({ price, type, plan, description, items }) => {
  const priceLabel = type === "monthly" ? "month" : "year";

  return (
    <div className="font-poppins flex flex-col w-[232px] gap-[54px]">
      <div className="flex flex-col gap-[20px]">
        <span className="text-4xl leading-[46px] font-bold flex gap-[6px] items-end">
          {price === 0 ? "FREE" : `$${price}`}
          {price !== 0 && <span className="text-[17px] leading-[26px] font-semibold text-[#848199] mb-[3px]">/{priceLabel}</span>}
        </span>

        <div className="flex flex-col gap-[10px]">
          <h2 className="text-[28px] leading-[42px] font-semibold">{plan}</h2>
          <p className="text-[15px] leading-[23px] text-[#292A36]">{description}</p>
        </div>

        <ul className="text-[15px] leading-[23px] text-[#292A36] flex flex-col gap-[10px]">
          {items.map((item, index) => (
            <li
              key={index}
              className="flex gap-[10px] items-center"
            >
              <CheckCircle width={20} height={20} />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <Button text="Select Plan" />
    </div>
  );
};

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

        <div className="flex gap-[34px] bg-white/50 p-10 rounded-[10px]">
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
