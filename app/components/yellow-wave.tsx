import { GitHubButton } from "./github-button";

interface YellowWaveProps {
  heading: string;
  text?: string;
}

export const YellowWave: React.FC<YellowWaveProps> = ({ heading, text }) => (
  <div>
    <div className="bg-[url('/assets/yellow-wave.png')] h-[194px]" />
    <div className="flex flex-col gap-8 text-center items-center px-[42px] bg-[#FFE165]">
      <span className="heading max-w-[763px]">{heading}</span>
      {text && <p className="paragraph text-[#292A36] lg:w-[466px]">{text}</p>}
      <GitHubButton />
    </div>
    <div className="bg-[url('/assets/yellow-wave.png')] h-[194px] transform rotate-180" />
  </div>
);
