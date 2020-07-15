import { Drone } from "./src/Drone";


const main = async () => {
    const drone = new Drone();
    await drone.connect();
    drone.command('battery?');

    await drone.takeoff()

    drone.land()


    // setInterval(() => {
    //     drone.command('battery?');
    //     console.log('state:', drone.state);
    // }, 5000);

    console.log('status:', drone.status);
};

main();
