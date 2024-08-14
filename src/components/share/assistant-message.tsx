interface AssistantMessageProps {
  message: AssistantMessage;
}

export const AssistantMessage: React.FC<AssistantMessageProps> = ({ message }) => {
  return (
    <section className="w-[1000px] bg-blue-200 rounded-md">
      <div className="bg-blue-400 rounded-t-md">
        <span>Assistant</span>
      </div>
      <p>{message.args.content}</p>
    </section>
  );
};
