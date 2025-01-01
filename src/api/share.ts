import { TrajectoryItem } from '../types';

export interface TrajectoryData {
  version: string;
  feedback: "positive" | "negative";
  permissions: "public" | "private";
  timestamp: string;
  trajectory: TrajectoryItem[];
}

export const fetchTrajectoryData = async (id: string): Promise<TrajectoryData> => {
  const response = await fetch('https://show-od-trajectory-3u9bw9tx.uc.gateway.dev/show-od-trajectory', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ feedback_id: id })
  });

  return response.json();
}
