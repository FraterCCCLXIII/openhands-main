interface SectionHeadingProps {
  isHero?: boolean;
  heading: string;
  subheading: string;
  description?: string;
  children?: React.ReactNode;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({ isHero = false, heading, subheading, description, children }) => {
  return (
    <div className="flex flex-col items-center gap-4 py-[45px] px-[42px] text-center">
      <p className="paragraph font-bold text-description">{subheading}</p>
      {isHero ? <h1 className="heading">{heading}</h1> : <span className="heading">{heading}</span>}
      {description && <p className="paragraph text-center lg:w-[466px] text-description">{description}</p>}
      {children}
    </div>
  )
};
