import tap from 'tap';
import * as dgram from 'dgram';

import { CommandInterface } from '../CommandInterface';
import { CommandStatus } from '../types';
import { sendFromServerOnCommand } from './test-utils';

const TEST_PORT = 4269;
const TEST_ADDRESS = 'localhost';
process.env.DEBUG = '1';
const testServer = dgram.createSocket('udp4');
testServer.bind(TEST_PORT);
testServer.unref();

tap.beforeEach(async (done, t) => {
    const comInterface = new CommandInterface();
    const initPromise = comInterface.init(TEST_PORT, TEST_ADDRESS, 0, 1000);
    await sendFromServerOnCommand(testServer, 'ok');
    await initPromise;
    t.context.commands = comInterface;
    done();
});

tap.afterEach(async (done, t) => {
    t.context.commands.close();
    done();
});

tap.test('test action command executed successfully', async (t) => {
    const serverAnswer = 'ok';
    const commandPromise = t.context.commands.executeCommand('test');
    await sendFromServerOnCommand(testServer, serverAnswer);
    const result = await commandPromise;
    t.deepEqual(result, {
        status: CommandStatus.ok,
        message: serverAnswer,
    });
    t.done();
});

tap.test('test info command executed successfully', async (t) => {
    const serverAnswer = 'normaalno';
    const commandPromise = t.context.commands.executeCommand('test?');
    await sendFromServerOnCommand(testServer, serverAnswer);
    const result = await commandPromise;
    t.deepEqual(result, {
        status: CommandStatus.ok,
        message: serverAnswer,
    });
    t.done();
});

tap.test('test action command returns error', async (t) => {
    const commandPromise = t.context.commands.executeCommand('test');
    await sendFromServerOnCommand(testServer, 'error');
    try {
        await commandPromise;
    } catch (err) {
        t.matchSnapshot(err?.message);
    }
    t.done();
});

tap.test('test action command returns not ok/error', async (t) => {
    const commandPromise = t.context.commands.executeCommand('test');
    await sendFromServerOnCommand(testServer, 'not expected');
    try {
        await commandPromise;
    } catch (err) {
        t.matchSnapshot(err?.message);
    }
    t.done();
});

tap.test('test action command throws error', async (t) => {
    const commandPromise = t.context.commands.executeCommand('test');
    await sendFromServerOnCommand(testServer, 'something');
    const [current] = t.context.commands.commands;
    current.deferredPromise.reject(new Error('OOPS'));
    clearTimeout(current.deferredPromise.timeout);
    try {
        await commandPromise;
    } catch (err) {
        t.matchSnapshot(err?.message);
    }
    t.done();
});

tap.test('test one before another ends should fail', async (t) => {
    const serverAnswer = 'ok';
    const commandOnePromise = t.context.commands.executeCommand('test1');
    await sendFromServerOnCommand(testServer, serverAnswer);
    const commandSecondPromise = t.context.commands.executeCommand('test2');

    try {
        const [resultOne] = await Promise.all([commandOnePromise, commandSecondPromise]);
        t.deepEqual(resultOne, {
            status: CommandStatus.ok,
            message: serverAnswer,
        });
    } catch (err) {
        t.matchSnapshot(err?.message);
    }
    t.done();
});

tap.test('test action command timeouted', async (t) => {
    const commandPromise = t.context.commands.executeCommand('test');
    try {
        await commandPromise;
    } catch (err) {
        t.matchSnapshot(err?.message);
    }
    t.done();
});

tap.test('try to run command without init', async (t) => {
    const comInterface = new CommandInterface();

    try {
        await comInterface.executeCommand('test');
    } catch (err) {
        t.matchSnapshot(err?.message);
    }
    comInterface.close();
    t.done();
});

tap.test('try to run command after interface failed by timeout', async (t) => {
    const comInterface = new CommandInterface();

    try {
        await comInterface.init(TEST_PORT, TEST_ADDRESS, 0, 1000);
        await comInterface.executeCommand('test');
    } catch (err) {
        t.matchSnapshot(err?.message);
    }
    comInterface.close();
    t.done();
});

tap.test('try to run command after emmiting error to socket', async (t) => {
    t.context.commands.commandSocket.emit('error', new Error('Socket Oops'));
    try {
        await t.context.commands.executeCommand('test');
    } catch (err) {
        t.matchSnapshot(err?.message);
    }
    t.done();
});
