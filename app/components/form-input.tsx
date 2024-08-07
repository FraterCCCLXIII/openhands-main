interface FormInputProps {
  id: string;
  type: "email" | "password";
  placeholder?: string;
}

export const FormInput: React.FC<FormInputProps> = ({ id, type, placeholder }) => (
  <input
    id={id}
    className="font-normal py-[9px] px-[13px] rounded-[6px] border border-[#D1D5DB]"
    type={type}
    placeholder={placeholder}
  />
);
