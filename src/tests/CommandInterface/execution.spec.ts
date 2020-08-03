import tap, { test } from 'tap'
import * as dgram from 'dgram'

import { CommandInterface } from '../../CommandInterface'
import { AddressInfo } from 'net'
import { CommandStatus } from '../../types'

const TEST_PORT: number = 4269
const TEST_ADDRESS: string = 'localhost'
process.env.DEBUG = '1'
const testServer = dgram.createSocket('udp4')
testServer.bind(TEST_PORT)
testServer.unref()

testServer.on('error', (err) => console.log('ERROR', err))

const sendFromServerOnCommand = async (testServer: dgram.Socket, message: string) =>
    new Promise((res) => {
        testServer.once('message', (msg, info: AddressInfo) => {
            testServer.send(message, info.port, info.address, () => res())
        })
    })

tap.beforeEach(async (done, t) => {
    const comInterface = new CommandInterface(TEST_PORT, TEST_ADDRESS)
    const initPromise = comInterface.init()
    await sendFromServerOnCommand(testServer, 'ok')
    t.context.commands = comInterface
    await initPromise
    done()
})

tap.afterEach(async (done, t) => {
    t.context.commands.close()
    done()
})

tap.test('test action command executed successfully', async (t) => {
    const serverAnswer = 'ok'
    const commandPromise = t.context.commands.executeCommand('test')
    await sendFromServerOnCommand(testServer, serverAnswer)
    const result = await commandPromise
    t.deepEqual(result, {
        status: CommandStatus.ok,
        message: serverAnswer,
    })
    t.done()
})

tap.test('test info command executed successfully', async (t) => {
    const serverAnswer = 'normaalno'
    const commandPromise = t.context.commands.executeCommand('test?')
    await sendFromServerOnCommand(testServer, serverAnswer)
    const result = await commandPromise
    t.deepEqual(result, {
        status: CommandStatus.ok,
        message: serverAnswer,
    })
    t.done()
})

tap.test('test action command returns error', async (t) => {
    const commandPromise = t.context.commands.executeCommand('test')
    await sendFromServerOnCommand(testServer, 'error')
    const result = await commandPromise
    t.equal(result.status, CommandStatus.error)
    t.matchSnapshot(result)
    t.done()
})

tap.test('test action command returns not ok/error', async (t) => {
    const commandPromise = t.context.commands.executeCommand('test')
    await sendFromServerOnCommand(testServer, 'not expected')
    const result = await commandPromise
    t.equal(result.status, CommandStatus.error)
    t.matchSnapshot(result)
    t.done()
})

tap.test('test action command throws error', async (t) => {
    const commandPromise = t.context.commands.executeCommand('test')
    await sendFromServerOnCommand(testServer, 'something')
    const [current] = t.context.commands.commands
    current.deferredPromise.reject(new Error('OOPS'))
    clearTimeout(current.deferredPromise.timeout)
    const result = await commandPromise
    t.equal(result.status, CommandStatus.error)
    t.matchSnapshot(result)
    t.done()
})

tap.test('test one before another ends should fail', async (t) => {
    const serverAnswer = 'ok'
    const commandOnePromise = t.context.commands.executeCommand('test1')
    await sendFromServerOnCommand(testServer, serverAnswer)
    const commandSecondPromise = t.context.commands.executeCommand('test2')

    const [resultOne, resultTwo] = await Promise.all([commandOnePromise, commandSecondPromise])

    t.deepEqual(resultOne, {
        status: CommandStatus.ok,
        message: serverAnswer,
    })
    t.equal(resultTwo.status, CommandStatus.error)
    t.matchSnapshot(resultTwo)
    t.done()
})
