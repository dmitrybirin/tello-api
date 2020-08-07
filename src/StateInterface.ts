import dgram from 'dgram'
import { InterfaceStatus, DroneState } from "./types"
import { logger } from './utils'

export class StateInterface {
    public status: InterfaceStatus = InterfaceStatus.initial
    public bindingPort: number
    public socket: dgram.Socket = dgram.createSocket('udp4')
    public state: DroneState = {};

    constructor(bindingPort: number) {
        this.bindingPort = bindingPort
        this.socket.bind(this.bindingPort)
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

    public init () {
        this.socket.on('message', (msg) => {
            this.state = {
                ...this.state,
                ...this.parseString(msg.toString()),
            };
        });

        this.socket.on('error', (err) => {
            logger.error(`State error 😢:\n${err.stack}`);
            this.status = InterfaceStatus.failed
        });
        this.status = InterfaceStatus.ready;
    }

    public close () {
        this.socket.unref()
        this.socket.removeAllListeners()
    }
}