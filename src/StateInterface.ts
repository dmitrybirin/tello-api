import dgram from 'dgram';
import { InterfaceStatus, DroneState } from './types';
import { logger } from './utils';

export class StateInterface {
    public status: InterfaceStatus = InterfaceStatus.initial;
    public bindingPort = 0;
    public socket: dgram.Socket = dgram.createSocket('udp4');
    public state: DroneState = {};

    private parseString = (str: string): DroneState => {
        return Object.fromEntries(
            str
                .trim()
                .split(';')
                .map((keyValue) => {
                    const [k, v] = keyValue.split(':');
                    return [k, parseInt(v, 10)];
                }),
        );
    };

    public init(bindingPort: number): void {
        if (bindingPort !== 0) {
            this.bindingPort = bindingPort;
            this.socket = dgram.createSocket('udp4');
        }

        this.socket.bind(this.bindingPort);

        this.socket.on('message', (msg) => {
            this.state = {
                ...this.state,
                ...this.parseString(msg.toString()),
            };
        });

        this.socket.on('error', (err) => {
            logger.error(`State error 😢:\n${err.stack}`);
            this.status = InterfaceStatus.failed;
        });
        this.status = InterfaceStatus.ready;
    }

    public close(): void {
        this.socket?.unref();
        this.socket?.removeAllListeners();
    }
}
