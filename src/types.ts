export interface DroneState {
    [key: string]: number;
}

export enum CommandStatus {
    error = 'error',
    ok = 'ok',
    inProgress = 'inProgress',
}

export interface CommandResult {
    status: CommandStatus;
    message: string | null;
    errorMessage?: string;
    exception?: Error;
}

export enum InterfaceStatus {
    initial = 'initial',
    ready = 'ready', // ready to new command
    failed = 'failed', // unrecovered failure
}
