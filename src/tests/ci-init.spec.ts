import tap from 'tap'
import * as dgram from 'dgram'
import { CommandInterface } from '../CommandInterface'

import { CommandStatus, InterfaceStatus } from '../types'
import { sendFromServerOnCommand } from './test-utils'

const TEST_PORT: number = 4269
const TEST_ADDRESS: string = 'localhost'
process.env.DEBUG = '1'
const testServer = dgram.createSocket('udp4')
testServer.bind(TEST_PORT)
testServer.unref()

tap.beforeEach((done, t) => {
    t.context.commands = new CommandInterface(TEST_PORT, TEST_ADDRESS, 1000);
    done()
})

tap.afterEach((done, t) => {
    (t.context.commands as CommandInterface).close()
    done()
})

tap.test('init executed successfully', async (t) => {
    t.equal(t.context.commands.status, InterfaceStatus.initial)
    const initPromise = t.context.commands.init()
    
    await sendFromServerOnCommand(testServer, 'ok')

    const result = await initPromise
    t.equal(result.status, 'ok')
    t.equal(t.context.commands.status, InterfaceStatus.ready)
    t.equal(result.message, 'Drone is ready to recieve commands')
    t.done()
})

tap.test('initial command returned not ok', async (t) => {
    
    const initPromise = t.context.commands.init()
	await sendFromServerOnCommand(testServer, 'error')
    const result = await initPromise

    t.equal(result.status, CommandStatus.error)
    t.equal(t.context.commands.status, InterfaceStatus.failed)
    t.matchSnapshot(result)
    t.done()
})

tap.test('initial command throws error', async (t) => {
    const initPromise = t.context.commands.init()
    await sendFromServerOnCommand(testServer, 'ok')
    const [current] = t.context.commands.commands
    current.deferredPromise.reject(new Error('OOPS'))
    clearTimeout(current.deferredPromise.timeout)
    const result = await initPromise

    t.equal(result.status, CommandStatus.error)
    t.equal(t.context.commands.status, InterfaceStatus.failed)
    t.matchSnapshot(result)
    t.done()
})

tap.test('initial command timeouted', async (t) => {
    const initPromise = t.context.commands.init()
    const result = await initPromise

    t.equal(result.status, CommandStatus.error)
    t.equal(t.context.commands.status, InterfaceStatus.failed)
    t.matchSnapshot(result)
    t.done()
})

