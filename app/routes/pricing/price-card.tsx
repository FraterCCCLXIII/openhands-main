import clsx from "clsx";
import { Button } from "~/components/button";
import CheckCircle from "~/svgs/check-circle-1.svg?react";
import { MostPopularHighlight } from "./most-popular-highlight";

interface PriceLabelProps {
  price: number;
  label: "month" | "year";
  variant: "default" | "dark";
}

const PriceLabel: React.FC<PriceLabelProps> = ({ price, label, variant }) => {
  const isFree = price === 0;

  return (
    <div className="text-4xl leading-[46px] font-bold flex gap-[6px] items-end">
      <span>
        {isFree ? "FREE" : `$${price}`}
      </span>
      {!isFree && (
        <span
          className={clsx(
            "text-[17px] leading-[26px] font-semibold mb-[3px]",
            variant === "dark" ? "text-[#231F20]" : "text-[#848199]"
          )}
        >
          /{label}
        </span>
      )}
    </div>
  );
};

interface PriceCardProps {
  price: number;
  type: "monthly" | "yearly";
  plan: string;
  description: string;
  items: string[];
  isMostPopular?: boolean;
}

export const PriceCard: React.FC<PriceCardProps> = ({ price, type, plan, description, items, isMostPopular = false }) => {
  const priceLabel = type === "monthly" ? "month" : "year";

  return (
    <div
      className={clsx(
        "flex flex-col w-[235px] gap-[54px] relative",
        /* You must pay attention to adjust the marging depending on the position of the popular card (e.g., ml-[30px] of its rightmost, mx-[30px] for center, etc...) */
        isMostPopular && "ml-[30px]"
      )}
    >
      {isMostPopular && <MostPopularHighlight />}

      <div className="flex flex-col gap-[20px] z-10">
        <PriceLabel
          price={price}
          label={priceLabel}
          variant={isMostPopular ? "dark" : "default"}
        />

        <div className="flex flex-col gap-[6px] h-[88px]">
          <h2 className="text-[28px] leading-[42px] font-semibold">{plan}</h2>
          <p className="text-[15px] leading-[23px] text-description">{description}</p>
        </div>

        <ul className="text-[15px] leading-[23px] text-description flex flex-col gap-2">
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
