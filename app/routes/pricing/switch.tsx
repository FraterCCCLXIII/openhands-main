import { Form } from "@remix-run/react";
import clsx from "clsx";

interface SwitchProps {
  selected: "monthly" | "yearly";
}

export const Switch: React.FC<SwitchProps> = ({ selected = "monthly" }) => {
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
