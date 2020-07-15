import { Drone } from "./src/Drone";


const main = async () => {
    const drone = new Drone();
    await drone.connectToDrone();
    drone.command('streamon');
    drone.command('battery?');
    setInterval(() => {
        drone.command('battery?');
        console.log('state:', drone.state);
    }, 5000);

    console.log('status:', drone.status);
};

main();
