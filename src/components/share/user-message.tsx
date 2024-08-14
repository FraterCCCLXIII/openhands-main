interface UserMessageProps {
  message: UserMessage;
}

export const UserMessage: React.FC<UserMessageProps> = ({ message }) => {
  return (
    <section className="w-[1000px] bg-gray-200 rounded-md">
      <div className="bg-gray-400 rounded-t-md">
        <span>User</span>
      </div>
      <p>{message.args.content}</p>
      {message.args.image_urls?.map((url, index) => (
        <img key={index} src={url} alt="user uploaded" />
      ))}
    </section>
  );
};
