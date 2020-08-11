import { Drone } from './src/Drone';

const main = async () => {
    const drone = new Drone();
    try {
        // await drone.disconnect();
        await drone.connect();
        const temp = await drone.command('temp?');
        console.log(temp);
        const b = await drone.command('battery?');
        console.log(b);
        const state = drone.getState();
        console.log(state);

        await drone.takeoff();

        await drone.rotate(3600);
        // await drone.up(100);
        // await drone.down(100);
        // await drone.left(50);
        // await drone.right(50);
        // await drone.forward(50);
        // await drone.back(50);

        await drone.land();

        // await drone.emergency()

        // await drone.disconnect();
    } catch (err) {
        console.error(err);
    }

    // await new Promise(res => setTimeout(res, 7000))

    // drone.takeoff()

    // drone.land()

    // drone.land()

    // setInterval(() => {
    //     drone.command('battery?');
    //     console.log('state:', drone.state);
    // }, 5000);

    console.log('status:', drone.status);
};

main();
