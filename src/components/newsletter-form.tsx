import { RegularButton } from "./regular-button";

interface NewsletterFormProps { }

export const NewsletterForm: React.FC<NewsletterFormProps> = () => {
  return (
    <RegularButton>Subscribe to our newsletter</RegularButton>
  );
};
