interface Timestamp {
    // the timestamp is a string in the format "YYYY-MM-DD-HH-mm-ss"
    [key: string]: string;
}

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
    timestamp: Timestamp;
    trajectory: TrajectoryItem[];
}

export type { Trajectory, TrajectoryItem };
