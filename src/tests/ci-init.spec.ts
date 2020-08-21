import tap from 'tap';
import * as dgram from 'dgram';
import { CommandInterface } from '../CommandInterface';

import { InterfaceStatus } from '../types';
import { sendFromServerOnCommand } from './test-utils';

const TEST_PORT = 4269;
const TEST_ADDRESS = 'localhost';
process.env.DEBUG = '1';
const testServer = dgram.createSocket('udp4');
testServer.bind(TEST_PORT);
testServer.unref();

tap.beforeEach((done, t) => {
    t.context.commands = new CommandInterface();
    done();
});

tap.afterEach((done, t) => {
    (t.context.commands as CommandInterface).close();
    done();
});

tap.test('init executed successfully', async (t) => {
    t.equal(t.context.commands.status, InterfaceStatus.initial);
    const initPromise = t.context.commands.init(TEST_PORT, TEST_ADDRESS, 0, 1000);

    await sendFromServerOnCommand(testServer, 'ok');

    const result = await initPromise;
    t.equal(result.status, 'ok');
    t.equal(t.context.commands.status, InterfaceStatus.ready);
    t.equal(result.message, 'Drone is ready to recieve commands');
    t.done();
});

tap.test('initial command returned not ok', async (t) => {
    const initPromise = t.context.commands.init(TEST_PORT, TEST_ADDRESS, 0, 1000);
    await sendFromServerOnCommand(testServer, 'error');
    try {
        await initPromise;
    } catch (err) {
        t.matchSnapshot(err?.message);
    }

    t.equal(t.context.commands.status, InterfaceStatus.failed);
    t.done();
});

tap.test('initial command throws error', async (t) => {
    const initPromise = t.context.commands.init(TEST_PORT, TEST_ADDRESS, 0, 1000);
    await sendFromServerOnCommand(testServer, 'ok');
    const [current] = t.context.commands.commands;
    current.deferredPromise.reject(new Error('OOPS'));
    clearTimeout(current.deferredPromise.timeout);

    try {
        await initPromise;
    } catch (err) {
        t.matchSnapshot(err?.message);
    }

    t.equal(t.context.commands.status, InterfaceStatus.failed);
    t.done();
});

tap.test('initial command timeouted', async (t) => {
    const initPromise = t.context.commands.init(TEST_PORT, TEST_ADDRESS, 0, 1000);
    try {
        await initPromise;
    } catch (err) {
        t.matchSnapshot(err?.message);
    }

    t.equal(t.context.commands.status, InterfaceStatus.failed);
    t.done();
});
