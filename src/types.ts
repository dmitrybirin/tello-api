export interface DroneState {
    pitch: number,
    roll: number,
    yaw: number,
    speedX: number,
    speedY: number,
    speedZ: number,
    lowestTemp: number,
    highestTemp: number,
    TOFdistance: number,
    height: number,
    battery: number,
    barometer: number,
    motorsTime: number,
    accelarationX: number,
    accelarationY: number,
    accelarationZ: number,
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
