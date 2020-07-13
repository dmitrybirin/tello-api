import * as dgram from 'dgram';
import { throws } from 'assert';
import { connect } from 'http2';
// import {promisify} from 'util';

interface DroneState {
    [key: string]: number;
}

enum droneStatus {
    error = 'ERROR',
    connected = 'CONNECTED',
    disconnected = 'DISCONNECTED',
}

class Drone {
    public commandSocket: dgram.Socket = dgram.createSocket('udp4');
    public stateSocket: dgram.Socket = dgram.createSocket('udp4');
    public state: DroneState = {};
    public status: droneStatus = droneStatus.disconnected;
    private host: string = '192.168.10.1';
    private commandPort: number = 8889;
    private statePort: number = 8890;

    constructor(host?: string, commandPort?: number, statePort?: number) {
        if (host) this.host = host;
        if (commandPort) this.commandPort = commandPort;
        if (statePort) this.statePort = statePort;
    }

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

    private handleError = (err: Error | null) => {
        if (err) {
            console.error(err);
        }
    };

    public destroy() {
        this.commandSocket.removeAllListeners();
        this.stateSocket.removeAllListeners();
        this.status = droneStatus.disconnected;
    }

    public emergency() {
        this.command('emergency');
    }

    public command(command: string, resHandler?: (err: Error | null) => void) {
        this.commandSocket.send(
            command,
            this.commandPort,
            this.host,
            resHandler ? resHandler : (err) => this.handleError(err)
        );
    }

    async connectToDrone(): Promise<void> {
        try {
            this.commandSocket.bind(this.commandPort);
            this.commandSocket.on('error', (err) => {
                console.error(`Command error 😢:\n${err.stack}`);
            });

            this.commandSocket.on('message', (msg, rinfo) => {
                console.log(`🚁✅: ${msg}`);
            });
            await new Promise((res, rej) => {
                this.command('command', (err) => {
                    if (err) {
                        return rej(err);
                    }
                    this.commandSocket.once('message', (msg) => {
                        if (msg.toString() === 'ok') {
                            return res();
                        }
                        if (msg.toString() === 'error') {
                            return rej();
                        }
                    });
                });
            });

            this.stateSocket.bind(this.statePort);
            this.stateSocket.on('message', (msg) => {
                this.state = {
                    ...this.state,
                    ...this.parseString(msg.toString()),
                };
            });

            this.stateSocket.on('error', (err) => {
                console.error(`State error 😢:\n${err.stack}`);
            });

            this.status = droneStatus.connected;
        } catch (error) {
            console.error(error);
            this.status = droneStatus.error;
        }
    }
}

const main = async () => {
    const drone = new Drone();
    await drone.connectToDrone();
    drone.command('streamon');
    drone.command('battery?');
    setInterval(() => {
        drone.command('battery?');
        console.log('state:', drone.state);
    }, 5000);

    console.log('status:', drone.status);
};

main();
