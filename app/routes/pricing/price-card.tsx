import clsx from "clsx";
import { Button } from "~/components/button";
import CheckCircle from "~/svgs/check-circle-1.svg?react";
import { MostPopularBadge } from "./most-popular-badge";

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
    <div className={clsx(
      "font-poppins flex flex-col w-[235px] gap-[54px] relative",
      /* You must pay attention to adjust the marging depending on the position of the popular card (e.g., ml-[30px] of its rightmost, mx-[30px] for center, etc...) */
      isMostPopular && "ml-[30px]"
    )}>
      {isMostPopular && <MostPopularBadge />}

      <div className="flex flex-col gap-[20px] z-10">
        <span className="text-4xl leading-[46px] font-bold flex gap-[6px] items-end">
          {price === 0 ? "FREE" : `$${price}`}
          {price !== 0 && (
            <span
              className={clsx("text-[17px] leading-[26px] font-semibold mb-[3px]", isMostPopular ? "text-[#231F20]" : "text-[#848199]")}
            >
              /{priceLabel}
            </span>
          )}
        </span>

        <div className="flex flex-col gap-[6px] h-[88px]">
          <h2 className="text-[28px] leading-[42px] font-semibold">{plan}</h2>
          <p className="text-[15px] leading-[23px] text-[#292A36]">{description}</p>
        </div>

        <ul className="text-[15px] leading-[23px] text-[#292A36] flex flex-col gap-2">
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
