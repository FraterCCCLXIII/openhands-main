import { useNavigate } from "@remix-run/react";
import { Button } from "./button";

interface SectionHeadingProps {
  heading: string;
  subheading: string;
  description?: string;
  cta?: {
    text: string;
    href: string;
  };
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({ heading, subheading, description, cta }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center gap-4 py-[45px]">
      <p className="paragraph-bold text-[#292A36]">{subheading}</p>
      <span className="heading">{heading}</span>
      {description && <p className="paragraph text-center lg:w-[466px] text-[#292A36]">{description}</p>}
      {cta && <Button text={cta.text} onClick={() => navigate(cta.href)} />}
    </div>
  )
};
