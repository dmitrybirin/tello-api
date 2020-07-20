import tap from 'tap';
import * as dgram from 'dgram';

import { CommandInterface } from '../CommandInterface';

const TEST_PORT: number = 4269;
const TEST_ADDRESS: string = 'localhost';

const testclient = dgram.createSocket('udp4');
testclient.unref()

// tap.test('Init interface successfully', async (t) => {})

// tap.test('Init interface with timeout successfully', async (t) => {})

// tap.test('Try to run command without init', async (t) => {})

const commands = new CommandInterface(TEST_PORT, TEST_ADDRESS);

tap.test('init executed successfully', async (t) => {
    commands.commandSocket.unref()
    const initPromise = commands.init()
	testclient.send('ok', TEST_PORT, TEST_ADDRESS)

    const initResult = await initPromise
    t.equal(initResult.status, 'ok')
    t.equal(initResult.message, 'Drone is ready to recieve commands')
})

tap.test('command executed successfully', async (t) => {

    const commandPromise = commands.executeCommand('test')
    testclient.send('ok', TEST_PORT, TEST_ADDRESS)
    const commandResult = await commandPromise
    t.pass()
})

