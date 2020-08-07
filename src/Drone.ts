import * as dgram from 'dgram';
import { wait, logger } from './utils';
import { CommandInterface } from './CommandInterface';
import { StateInterface } from './StateInterface';
import { DroneState } from './types';

enum droneStatus {
    error = 'ERROR',
    connected = 'CONNECTED',
    disconnected = 'DISCONNECTED',
}

export class Drone {
    public stateSocket: dgram.Socket = dgram.createSocket('udp4');
    public status: droneStatus = droneStatus.disconnected;
    private host: string = '192.168.10.1';
    private commandPort: number = 8889;
    private statePort: number = 8890;

    private commandsInterface: CommandInterface = new CommandInterface(this.commandPort, this.host);
    private stateInterface: StateInterface = new StateInterface(this.statePort);

    private upperDistanceLimit: number = 500;
    private lowerDistanceLimit: number = 20;

    constructor(host?: string, commandPort?: number, statePort?: number) {
        if (host) this.host = host;
        if (commandPort) this.commandPort = commandPort;
        if (statePort) this.statePort = statePort;
    }

    private checkForDistanceLimit = (value: number) => {
        if (value < this.lowerDistanceLimit || value > this.upperDistanceLimit)
            console.error(
                `Out of range, need to be between ${this.lowerDistanceLimit} and ${this.upperDistanceLimit}`
            );
    };

   

	public async command(command: string, timeout?:number) {
		return this.commandsInterface.executeCommand(command, timeout)
	}

    public emergency() {
        return this.command('emergency', 2000);
    }

    public takeoff() {
        return this.command('takeoff', 20000);
    }

    public land() {
        return this.command('land', 20000);
    }

    public up(x: number) {
        this.checkForDistanceLimit(x);
        return this.command(`up ${x}`);
    }

    public down(x: number) {
        this.checkForDistanceLimit(x);
        return this.command(`down ${x}`);
    }

    async connect(): Promise<void> {
        try {
            
            const result = await this.commandsInterface.init()
            if (result.status !== 'ok') {
                throw new Error(result.errorMessage);
            } else {
                logger.info(`${result.message}`)
            }
            this.stateInterface.init()

            this.status = droneStatus.connected;
        } catch (error) {
            logger.error(error);
            this.status = droneStatus.error;
        }
    }

    public getState(): DroneState {
        return this.stateInterface.state
    }

    async disconnect(): Promise<void> {
        try {
            this.commandsInterface.close()
            this.stateInterface.close()
            this.status = droneStatus.disconnected;
        } catch (error) {
            logger.error(error);
            this.status = droneStatus.error;
        }
    }
}
