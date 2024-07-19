
interface ActionArgs {
    content?: string;
    code?: string;
    command?: string;
    thought?: string;

    // initialize args
    AGENT?: string;
    CONFIRMATION_MODE?: boolean;
    LANGUAGE?: string;
    LLM_MODEL?: string;

    // allow for any other arbitrary key-value pairs
    [key: string]: string | boolean | undefined;
}


interface TrajectoryItem {
    action?: string;
    args?: ActionArgs;
    content?: string;
    id?: number;
    message?: string;
    observation?: string;
    source?: string;
    extras?: {
        [key: string]: string;
    };
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
