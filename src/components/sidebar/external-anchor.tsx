interface ExternalAnchorProps {
  to: string;
  children: React.ReactNode;
}

export const ExternalAnchor: React.FC<ExternalAnchorProps> = ({ to, children }) => (
  <a
    href={to}
    target="_blank"
    rel="noopener noreferrer"
    className="text-white font-quincy text-[41px] leading-[42px]"
  >
    {children}
  </a>
);
