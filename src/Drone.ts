import * as dgram from 'dgram';
import { logger } from './utils';
import { CommandInterface } from './CommandInterface';
import { StateInterface } from './StateInterface';
import { DroneState, CommandResult, DroneConstructorInput, DroneConnectInput } from './types';

enum droneStatus {
    error = 'ERROR',
    connected = 'CONNECTED',
    disconnected = 'DISCONNECTED',
}

enum Rotation {
    cw = 'cw',
    ccw = 'ccw',
}

interface FlipInterface {
    left: () => Promise<CommandResult>;
    right: () => Promise<CommandResult>;
    forward: () => Promise<CommandResult>;
    back: () => Promise<CommandResult>;
}

enum Flip {
    left = 'l',
    right = 'r',
    forward = 'f',
    back = 'b',
}

export class Drone {
    public stateSocket: dgram.Socket = dgram.createSocket('udp4');
    public status: droneStatus = droneStatus.disconnected;
    private commandHost = '192.168.10.1';
    private commandPort = 8889;
    private statePort = 8890;

    private commandsInterface: CommandInterface = new CommandInterface();
    private stateInterface: StateInterface = new StateInterface();

    private lowerDistanceLimit = 20;
    private upperDistanceLimit = 500;

    private lowerRotationLimit = 1;
    private upperRotationLimit = 3600;

    constructor(input?: DroneConstructorInput) {
        if (input?.commandHost) this.commandHost = input?.commandHost;
        if (input?.commandPort) this.commandPort = input?.commandPort;
        if (input?.statePort) this.statePort = input?.statePort;
    }

    private checkForDistanceLimit = (value: number) => {
        if (value < this.lowerDistanceLimit || value > this.upperDistanceLimit) {
            throw new Error(
                `Out of range, should be between ${this.lowerDistanceLimit} and ${this.upperDistanceLimit}`,
            );
        }
    };

    private checkForRotationInput = (degrees: number, direction?: Rotation) => {
        if (degrees < this.lowerRotationLimit || degrees > this.upperRotationLimit) {
            throw new Error(
                `Degrees out of range, should be between ${this.lowerRotationLimit} and ${this.upperRotationLimit}`,
            );
        }
        if (direction && !(direction in Rotation)) {
            throw new Error(`Direction out of range, should be either '${Rotation.cw}' or '${Rotation.cw}'`);
        }
    };

    public async command(command: string, timeout?: number): Promise<CommandResult> {
        return this.commandsInterface.executeCommand(command, timeout);
    }

    public emergency(): Promise<CommandResult> {
        return this.command('emergency', 2000);
    }

    public takeoff(): Promise<CommandResult> {
        return this.command('takeoff', 20000);
    }

    public land(): Promise<CommandResult> {
        return this.command('land', 20000);
    }

    public up(x: number): Promise<CommandResult> {
        this.checkForDistanceLimit(x);
        return this.command(`up ${x}`);
    }

    public down(x: number): Promise<CommandResult> {
        this.checkForDistanceLimit(x);
        return this.command(`down ${x}`);
    }

    public left(x: number): Promise<CommandResult> {
        this.checkForDistanceLimit(x);
        return this.command(`left ${x}`);
    }

    public right(x: number): Promise<CommandResult> {
        this.checkForDistanceLimit(x);
        return this.command(`right ${x}`);
    }

    public forward(x: number): Promise<CommandResult> {
        this.checkForDistanceLimit(x);
        return this.command(`forward ${x}`);
    }

    public back(x: number): Promise<CommandResult> {
        this.checkForDistanceLimit(x);
        return this.command(`back ${x}`);
    }

    private async doTheFlip(direction: Flip): Promise<CommandResult> {
        const batteryLevel = this.getState().battery;
        if (this.getState().battery <= 50) {
            throw new Error(`Battery level is ${batteryLevel}%, less then 50%. Can't do the flips`);
        }
        return this.command(`flip ${direction}`);
    }

    public flip: FlipInterface = {
        left: () => this.doTheFlip(Flip.left),
        right: () => this.doTheFlip(Flip.right),
        back: () => this.doTheFlip(Flip.back),
        forward: () => this.doTheFlip(Flip.forward),
    };

    public rotate(degrees: number, direction?: Rotation): Promise<CommandResult> {
        this.checkForRotationInput(degrees, direction);
        if (direction) {
            return this.command(`${direction} ${degrees}`);
        } else {
            return this.command(`${Rotation.cw} ${degrees}`);
        }
    }

    async connect(input?: DroneConnectInput): Promise<void> {
        try {
            const result = await this.commandsInterface.init(
                this.commandPort,
                this.commandHost,
                input?.clientPort,
                input?.defaultCommandTimeout,
            );
            if (result.status !== 'ok') {
                throw new Error(result.errorMessage);
            } else {
                logger.info(`${result.message}`);
            }
            this.stateInterface.init(this.statePort);

            this.status = droneStatus.connected;
        } catch (error) {
            logger.error(error);
            this.status = droneStatus.error;
        }
    }

    public getState(): DroneState {
        return this.stateInterface.getState();
    }

    async disconnect(): Promise<void> {
        try {
            this.commandsInterface.close();
            this.stateInterface.close();
            this.status = droneStatus.disconnected;
        } catch (error) {
            logger.error(error);
            this.status = droneStatus.error;
        }
    }
}
