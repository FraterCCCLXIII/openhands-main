import { Form } from "@remix-run/react";
import clsx from "clsx";

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

interface SwitchButtonProps {
  type: "monthly" | "yearly";
  isSelected: boolean;
}

const SwitchButton: React.FC<SwitchButtonProps> = ({ type, isSelected }) => (
  <button
    name="type"
    value={type}
    className={clsx(
      "px-[32px] py-[13px] rounded-[25px]",
      isSelected && "bg-black text-white",
    )}
  >
    {capitalize(type)}
  </button>
);

interface SwitchProps {
  selected: "monthly" | "yearly";
}

export const Switch: React.FC<SwitchProps> = ({ selected = "monthly" }) => {
  return (
    <Form
      preventScrollReset
      className="flex gap-0.5 text-sm font-poppins font-bold bg-white/50 text-black rounded-[25px]"
    >
      <SwitchButton type="monthly" isSelected={selected === "monthly"} />
      <SwitchButton type="yearly" isSelected={selected === "yearly"} />
    </Form>
  );
};
