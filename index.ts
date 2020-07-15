import { Drone } from "./src/Drone";


const main = async () => {
    const drone = new Drone();
    await drone.connect();
    drone.command('battery?');
    drone.command('temp?');
    await new Promise(res => setTimeout(res, 7000))

    console.log('result', await drone.command('battery?'));
    console.log('result', await drone.command('temp?'));
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
