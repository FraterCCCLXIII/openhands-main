interface SectionHeadingProps {
  heading: string;
  subheading: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({ heading, subheading }) => (
  <div className="flex flex-col items-center gap-4">
    <p className="paragraph-bold text-[#292A36]">{subheading}</p>
    <span className="heading">{heading}</span>
  </div>
);
