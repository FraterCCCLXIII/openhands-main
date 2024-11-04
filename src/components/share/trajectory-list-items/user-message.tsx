import { TrajectoryCard } from "../trajectory-card";

interface UserMessageProps {
  message: UserMessage;
}

export const UserMessage: React.FC<UserMessageProps> = ({ message }) => {
  return (
    <TrajectoryCard className="bg-gray-200">
      <TrajectoryCard.Header className="bg-gray-400">User</TrajectoryCard.Header>
      <TrajectoryCard.Body>
        {message.args?.content || message.content || ""}
        {message.args?.images_urls?.map((url, index) => (
          <img key={index} src={url} alt="user uploaded" />
        ))}
      </TrajectoryCard.Body>
    </TrajectoryCard>
  );
};
