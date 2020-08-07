import tap from 'tap';
import * as dgram from 'dgram';
import { StateInterface } from '../StateInterface';
import { InterfaceStatus } from '../types';
const TEST_ADDRESS = 'localhost';
process.env.DEBUG = '1';
const stateClient = dgram.createSocket('udp4');
stateClient.unref();

const getPortOnListening = async (socket: dgram.Socket): Promise<number> =>
    new Promise((res) => {
        socket.once('listening', () => {
            res(socket.address().port);
        });
    });

tap.test('interface without init have initial status', async (t) => {
    const stateInterface = new StateInterface(0);
    t.equal(stateInterface.status, InterfaceStatus.initial);
    stateInterface.close();
    t.done();
});

tap.test('init could be in failed status', async (t) => {
    const stateInterface = new StateInterface(0);
    stateInterface.init();
    stateInterface.socket.emit('error', new Error('OOPS'));
    t.equal(stateInterface.status, InterfaceStatus.failed);
    stateInterface.close();
    t.done();
});

tap.test('should have state', async (t) => {
    const stateInterface = new StateInterface(0);
    const port = await getPortOnListening(stateInterface.socket);
    stateInterface.init();
    const testStateString =
        'pitch:0;roll:0;yaw:0;vgx:0;vgy:0;vgz:0;templ:67;temph:70;tof:6553;h:0;bat:89;baro:-61.00;time:0;agx:6.00;agy:-2.00;agz:-997.00;';
    stateClient.send(testStateString, port, TEST_ADDRESS);
    t.equal(stateInterface.status, InterfaceStatus.ready);
    t.matchSnapshot(stateInterface.state);
    stateInterface.close();
    t.done();
});
