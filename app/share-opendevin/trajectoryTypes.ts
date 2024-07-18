
interface ActionArgs {
    content?: string;
    code?: string;
    command?: string;
    thought?: string;
    // allow for any other arbitrary key-value pairs
    [key: string]: string | undefined;
}


interface TrajectoryItem {
    action?: string;
    args?: ActionArgs;
    content?: string;
    id?: number;
    message?: string;
    observation?: string;
    source?: string;
    // allow for any other arbitrary key-value pairs
    [key: string]: string | number | ActionArgs | undefined;
}

interface Trajectory {
    feedback: string;
    permissions: string;
    timestamp: string;
    confirmationMode: boolean;
    trajectory: TrajectoryItem[];
}

export type { Trajectory, TrajectoryItem };
