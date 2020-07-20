import tap from 'tap';
import { CommandInterface } from '../CommandInterface';

const TEST_PORT: number = 30000;
const TEST_ADDRESS: string = '0.0.0.0';

// tap.test('Init interface successfully', async (t) => {})

// tap.test('Init interface with timeout successfully', async (t) => {})

// tap.test('Try to run command without init', async (t) => {})
import * as dgram from 'dgram';
import { serialize } from 'v8';

process.env.DEBUG = '1';

// testServer.bind({
//     address: TEST_ADDRESS,
//     port: TEST_PORT,
//     exclusive: true
// })

// testServer.on('message', (m) =>console.log('SERVER GOT:', m))
const server = dgram.createSocket('udp4');
const testclient = dgram.createSocket('udp4');
server.unref()
testclient.unref()
tap.test('command executed successfully', async (t) => {
    // const commands = new CommandInterface(TEST_PORT, TEST_ADDRESS);
    // console.log(new Date().toLocaleTimeString())
    // const p = commands.init()
	let la: Boolean = false;

    server.on('error', (err) => {
        console.log(`server error:\n${err.stack}`);
        server.close();
    });

    server.on('message', (msg, rinfo) => {
		console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
		if (msg.toString() === 'ok') {
			la = true
		}
			
    });

    server.on('listening', () => {
        const address = server.address();
        console.log(`server listening ${address.address}:${address.port}`);
    });

    server.bind({
        address: TEST_ADDRESS,
        port: TEST_PORT,
        exclusive: true,
	});
	

    testclient.send('ok', TEST_PORT, TEST_ADDRESS, (err) =>
        console.log(err || 'sended')
	);
	
	

    // await commands.executeCommand('test').then(() => commands.commandSocket.send('ok', TEST_PORT, TEST_ADDRESS))

    // console.log(commands.commands);
	// commands.close();
    
})