import { Button } from "./button";

interface YellowWaveProps {
  heading: string;
  text?: string;
}

export const YellowWaveSection: React.FC<YellowWaveProps> = ({ heading, text }) => (
  <div>
    <div className="bg-[url('/assets/yellow-wave.png')] h-[194px]" />
    <div className="flex flex-col gap-8 text-center items-center px-[42px] bg-party">
      <span className="heading max-w-[763px]">{heading}</span>
      {text && <p className="paragraph text-description lg:w-[466px]">{text}</p>}
      <Button
        variant="medium"
        text="View open jobs"
        to="https://allhandsai.applytojob.com/apply/"
        external
      />
    </div>
    <div className="bg-[url('/assets/yellow-wave.png')] h-[194px] transform rotate-180" />
  </div>
);
