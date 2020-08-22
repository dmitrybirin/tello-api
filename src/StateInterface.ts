import dgram from 'dgram';
import { InterfaceStatus, DroneState } from './types';
import { logger } from './utils';

enum StateMap {
    pitch = 'pitch',
    roll = 'roll',
    yaw = 'yaw',
    speedX = 'vgx',
    speedY = 'vgy',
    speedZ = 'vgz',
    lowestTemp = 'templ',
    highestTemp = 'temph',
    TOFdistance = 'tof',
    height = 'h',
    battery = 'bat',
    barometer = 'baro',
    motorsTime = 'time',
    accelarationX = 'agx',
    accelarationY = 'agy',
    accelarationZ = 'agz',
}

export class StateInterface {
    public status: InterfaceStatus = InterfaceStatus.initial;
    public bindingPort = 0;
    public socket: dgram.Socket = dgram.createSocket('udp4');
    public state = '';

    private mapState = (droneRawState: Record<string, number>): DroneState => ({
        pitch: droneRawState[StateMap.pitch],
        roll: droneRawState[StateMap.roll],
        yaw: droneRawState[StateMap.yaw],
        speedX: droneRawState[StateMap.speedX],
        speedY: droneRawState[StateMap.speedY],
        speedZ: droneRawState[StateMap.speedZ],
        lowestTemp: droneRawState[StateMap.lowestTemp],
        highestTemp: droneRawState[StateMap.highestTemp],
        TOFdistance: droneRawState[StateMap.TOFdistance],
        height: droneRawState[StateMap.height],
        battery: droneRawState[StateMap.battery],
        barometer: droneRawState[StateMap.barometer],
        motorsTime: droneRawState[StateMap.motorsTime],
        accelarationX: droneRawState[StateMap.accelarationX],
        accelarationY: droneRawState[StateMap.accelarationY],
        accelarationZ: droneRawState[StateMap.accelarationZ],
    });

    private parseString = (str: string): DroneState => {
        const rawState = Object.fromEntries(
            str
                .trim()
                .split(';')
                .map((keyValue) => {
                    const [k, v] = keyValue.split(':');
                    return [k, parseInt(v, 10)];
                })
                .filter(([k]) => k),
        );
        return this.mapState(rawState);
    };

    public getState(): DroneState {
        return this.parseString(this.state);
    }

    public init(bindingPort: number): void {
        if (bindingPort !== 0) {
            this.bindingPort = bindingPort;
            this.socket = dgram.createSocket('udp4');
        }

        this.socket.bind(this.bindingPort);

        this.socket.on('message', (msg) => {
            this.state = msg.toString();
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
