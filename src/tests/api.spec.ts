import tap from 'tap';
import * as sinon from 'sinon';
import * as dgram from 'dgram';
import { Drone } from '../Drone';
import { AddressInfo } from 'net';

const TEST_COMMAND_PORT = 4269;
const TEST_STATE_PORT = 4270;
const TEST_ADDRESS = 'localhost';

class TestDrone {
    host = 'localhost';
    commandServer: dgram.Socket = dgram.createSocket('udp4');
    stateClient: dgram.Socket = dgram.createSocket('udp4');
    stateClientPort = 0;
    lastCommand = '';
    constructor(commandPort: number, stateClientPort: number) {
        this.stateClientPort = stateClientPort;
        this.commandServer.bind(commandPort);
        this.commandServer.unref();
        this.stateClient.unref();

        this.commandServer.on('message', console.log);
        this.commandServer.on('listening', console.log);
        this.commandServer.on('error', console.log);
    }

    sendState(message: string) {
        this.stateClient.send(Buffer.from(message), this.stateClientPort, this.host);
    }

    async answerOnCommand(answer: string) {
        return new Promise((res) => {
            this.commandServer.once('message', (msg, info: AddressInfo) => {
                console.log(info);
                this.lastCommand = msg.toString();
                this.commandServer.send(answer, info.port, info.address, () => res());
            });
        });
    }
}

tap.beforeEach((done) => {
    sinon.restore();
    done();
});

tap.test('setup', async () => {
    const testDrone = new TestDrone(TEST_COMMAND_PORT, TEST_STATE_PORT);
    const droneClient = new Drone({
        commandHost: TEST_ADDRESS,
        commandPort: TEST_COMMAND_PORT,
        statePort: TEST_STATE_PORT,
    });
    const initPromise = droneClient.connect();
    await testDrone.answerOnCommand('ok');
    await initPromise;
    tap.context.client = droneClient;
});

// Direct Commands with timeout

const directCommandsWithTimeout = [
    {
        command: 'takeoff',
        timeout: 20000,
    },
    {
        command: 'land',
        timeout: 20000,
    },
    {
        command: 'emergency',
        timeout: 2000,
    },
];

directCommandsWithTimeout.map((testData) => {
    tap.test(`'${testData.command}' command`, async (t) => {
        const commandFake = sinon.fake();
        sinon.replace(tap.context.client, 'command', commandFake);
        await tap.context.client[testData.command]();
        t.isEqual(commandFake.called, true);
        t.deepEqual(commandFake.args[0], [testData.command, testData.timeout]);
        t.done();
    });
});

// Move commands

const moveCommands = ['up', 'down', 'left', 'right', 'forward', 'back'];

const flipCommands = {
    left: 'l',
    right: 'r',
    forward: 'f',
    back: 'b',
};

moveCommands.map((command) => {
    tap.test(`'${command}' command success`, async (t) => {
        const distance = 42;
        const commandFake = sinon.fake();
        sinon.replace(tap.context.client, 'command', commandFake);
        await tap.context.client[command](distance);
        t.isEqual(commandFake.called, true);
        t.deepEqual(commandFake.args[0], [`${command} ${distance}`]);
        t.done();
    });

    tap.test(`'${command}' command failed: hit low limit`, async (t) => {
        const distance = 19;
        const commandFake = sinon.fake();
        sinon.replace(tap.context.client, 'command', commandFake);
        try {
            await tap.context.client[command](distance);
        } catch (err) {
            t.matchSnapshot(err?.message);
        }
        t.isEqual(commandFake.called, false);
        t.done();
    });

    tap.test(`'${command}' command failed: hit high limit`, async (t) => {
        const distance = 501;
        const commandFake = sinon.fake();
        sinon.replace(tap.context.client, 'command', commandFake);
        try {
            await tap.context.client[command](distance);
        } catch (err) {
            t.matchSnapshot(err?.message);
        }
        t.isEqual(commandFake.called, false);
        t.done();
    });
});

tap.test(`'rotate' command success with default`, async (t) => {
    const degrees = 180;
    const commandFake = sinon.fake();
    sinon.replace(tap.context.client, 'command', commandFake);
    await tap.context.client.rotate(degrees);
    t.isEqual(commandFake.called, true);
    t.deepEqual(commandFake.args[0], [`cw ${degrees}`]);
    t.done();
});

tap.test(`'rotate' command success with ccw`, async (t) => {
    const degrees = 180;
    const commandFake = sinon.fake();
    sinon.replace(tap.context.client, 'command', commandFake);
    await tap.context.client.rotate(degrees, 'ccw');
    t.isEqual(commandFake.called, true);
    t.deepEqual(commandFake.args[0], [`ccw ${degrees}`]);
    t.done();
});

tap.test(`'rotate' command failed: hit low limit`, async (t) => {
    const degrees = 0;
    const commandFake = sinon.fake();
    sinon.replace(tap.context.client, 'command', commandFake);
    try {
        await tap.context.client.rotate(degrees);
    } catch (err) {
        t.matchSnapshot(err?.message);
    }
    t.isEqual(commandFake.called, false);
    t.done();
});

tap.test(`'rotate' command failed: hit high limit`, async (t) => {
    const degrees = 3601;
    const commandFake = sinon.fake();
    sinon.replace(tap.context.client, 'command', commandFake);
    try {
        await tap.context.client.rotate(degrees);
    } catch (err) {
        t.matchSnapshot(err?.message);
    }
    t.isEqual(commandFake.called, false);
    t.done();
});

tap.test(`'rotate' command failed: rotate type wrong`, async (t) => {
    const degrees = 180;
    const commandFake = sinon.fake();
    sinon.replace(tap.context.client, 'command', commandFake);
    try {
        await tap.context.client.rotate(degrees, 'flip-not-rotate');
    } catch (err) {
        t.matchSnapshot(err?.message);
    }
    t.isEqual(commandFake.called, false);
    t.done();
});

Object.entries(flipCommands).map(([key, value]: [string, string]) => {
    tap.test(`'flip ${key}' command success`, async (t) => {
        const commandFake = sinon.fake();
        const getStateFake = sinon.fake.returns({ battery: 77 });
        sinon.replace(tap.context.client, 'getState', getStateFake);
        sinon.replace(tap.context.client, 'command', commandFake);
        tap.context.client.flip[key]();
        t.isEqual(commandFake.called, true);
        t.deepEqual(commandFake.args[0], [`flip ${value}`]);
        t.done();
    });
});

Object.entries(flipCommands).map(([key]: [string, string]) => {
    tap.test(`'flip ${key}' command failed cause of battery level`, async (t) => {
        const commandFake = sinon.fake();
        const getStateFake = sinon.fake.returns({ battery: 42 });
        sinon.replace(tap.context.client, 'command', commandFake);
        sinon.replace(tap.context.client, 'getState', getStateFake);
        try {
            await tap.context.client.flip[key]();
        } catch (err) {
            t.matchSnapshot(err?.message);
        }
        t.isEqual(commandFake.called, false);
        t.done();
    });
});

tap.tearDown(() => {
    tap.context.client.disconnect();
});
