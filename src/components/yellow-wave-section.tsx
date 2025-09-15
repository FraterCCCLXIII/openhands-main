import { Button } from "./button";

interface YellowWaveProps {
  heading: string;
  text?: string;
  cta: {
    icon?: React.ReactNode;
    text: string;
    to?: string;
    onClick?: () => void;
    style?: "primary" | "secondary";
  };
  secondaryCta?: {
    icon?: React.ReactNode;
    text: string;
    to?: string;
    onClick?: () => void;
    style?: "primary" | "secondary";
  };
}

export const YellowWaveSection: React.FC<YellowWaveProps> = ({ heading, text, cta, secondaryCta }) => (
  <div>
    <div className="bg-[url('/assets/yellow-wave.png')] h-[194px]" />
    <div className="flex flex-col gap-8 text-center items-center px-[42px] bg-party">
      <span className="heading max-w-[763px]">{heading}</span>
      {text && <p className="paragraph text-description lg:w-[466px]">{text}</p>}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          variant="medium"
          icon={cta.icon}
          text={cta.text}
          to={cta.to}
          onClick={cta.onClick}
          style={cta.style || "primary"}
          external={!cta.onClick}
        />
        {secondaryCta && (
          <Button
            variant="medium"
            icon={secondaryCta.icon}
            text={secondaryCta.text}
            to={secondaryCta.to}
            onClick={secondaryCta.onClick}
            style={secondaryCta.style || "primary"}
            external={!secondaryCta.onClick}
          />
        )}
      </div>
    </div>
    <div className="bg-[url('/assets/yellow-wave.png')] h-[194px] transform rotate-180" />
  </div>
);
