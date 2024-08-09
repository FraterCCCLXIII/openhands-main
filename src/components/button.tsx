interface ButtonProps {
  text: string;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({ text, onClick }) => (
  <button
    onClick={onClick}
    className="bg-black rounded-lg px-4 py-2 text-sm text-white font-poppins font-bold z-10"
  >
    {text}
  </button>
);
