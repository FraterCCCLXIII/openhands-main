export const MenuIcon: React.FC<SVGProps> = ({ width, height }) => (
  <svg
    width={width}
    height={height}
    viewBox={`0 0 ${width} ${height}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M5 7.5H19" stroke="black" stroke-width="2" stroke-linecap="round" />
    <path d="M5 12.5H19" stroke="black" stroke-width="2" stroke-linecap="round" />
    <path d="M5 17.5H19" stroke="black" stroke-width="2" stroke-linecap="round" />
  </svg>
);
