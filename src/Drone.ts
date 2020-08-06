import * as dgram from 'dgram';
import { wait, logger } from './utils';
import { CommandInterface } from './CommandInterface';

interface DroneState {
    [key: string]: number;
}

enum droneStatus {
    error = 'ERROR',
    connected = 'CONNECTED',
    disconnected = 'DISCONNECTED',
}

export class Drone {
    public stateSocket: dgram.Socket = dgram.createSocket('udp4');
    public state: DroneState = {};
    public status: droneStatus = droneStatus.disconnected;
    private host: string = '192.168.10.1';
    private commandPort: number = 8889;
    private statePort: number = 8890;

    private commands: CommandInterface  = new CommandInterface(this.commandPort, this.host);

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
                `Out of range, need to be between ${this.lowerDistanceLimit} and ${this.lowerDistanceLimit}`
            );
    };

    private parseString = (str: string): DroneState => {
        return Object.fromEntries(
            str
                .trim()
                .split(';')
                .map((keyValue) => {
                    const [k, v] = keyValue.split(':');
                    return [k, parseInt(v, 10)];
                })
        );
    };

	public async command(command: string, timeout?:number) {
		return this.commands.executeCommand(command, timeout)
	}

    public destroy() {
        this.stateSocket.removeAllListeners();
        this.status = droneStatus.disconnected;
    }

    public emergency() {
        return this.command('emergency');
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
        return this.command(`up ${x}`);
    }

    async connect(): Promise<void> {
        try {
			await this.commands.init()
            this.stateSocket.bind(this.statePort);
            this.stateSocket.on('message', (msg) => {
                this.state = {
                    ...this.state,
                    ...this.parseString(msg.toString()),
                };
            });

            this.stateSocket.on('error', (err) => {
                logger.error(`State error 😢:\n${err.stack}`);
            });

            this.status = droneStatus.connected;
        } catch (error) {
            logger.error(error);
            this.status = droneStatus.error;
        }
    }

    async disconnect(): Promise<void> {
        try {
			await this.commands.close()
        } catch (error) {
            logger.error(error);
            this.status = droneStatus.error;
        }
    }
}
