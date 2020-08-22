import { Drone } from './src/Drone';

const main = async () => {
    const drone = new Drone();
    try {
        await drone.connect();
        const temp = await drone.command('temp?');
        console.log(temp);
        const b = await drone.command('battery?');
        console.log(b);
        const state = drone.getState();
        console.log(state);

        await drone.takeoff();

        // await drone.rotate(360);
        // await drone.flip.back();
        // await drone.flip.forward();
        // await drone.flip.left();
        // await drone.flip.right();
        await drone.up(100);
        // await drone.down(100);
        // await drone.left(50);
        // await drone.right(50);
        // await drone.forward(50);
        await drone.back(100);

        await drone.land();

        // await drone.emergency()

        // await drone.disconnect();
    } catch (err) {
        console.error(err);
    }

    // drone.takeoff()

    console.log('status:', drone.status);
};

main();
