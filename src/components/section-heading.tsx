import { useNavigate } from "react-router-dom";
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
      <p className="paragraph font-bold text-description">{subheading}</p>
      {isHero ? <h1 className="heading">{heading}</h1> : <span className="heading">{heading}</span>}
      {description && <p className="paragraph text-center lg:w-[466px] text-description">{description}</p>}
      {cta && <Button text={cta.text} onClick={() => navigate(cta.href)} />}
    </div>
  )
};
