import { useNavigate } from "@remix-run/react";
import { Button } from "./button";

interface SectionHeadingProps {
  isHero?: boolean;
  heading: string;
  subheading: string;
  description?: string;
  cta?: {
    text: string;
    href: string;
  };
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({ isHero = false, heading, subheading, description, cta }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center gap-4 py-[45px]">
      <p className="paragraph-bold text-[#292A36]">{subheading}</p>
      {isHero ? <h1 className="heading">{heading}</h1> : <span className="heading">{heading}</span>}
      {description && <p className="paragraph text-center lg:w-[466px] text-[#292A36]">{description}</p>}
      {cta && <Button text={cta.text} onClick={() => navigate(cta.href)} />}
    </div>
  )
};
