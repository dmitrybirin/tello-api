import { Drone } from "./src/Drone";


const main = async () => {
    const drone = new Drone();
    try {
        // await drone.disconnect();
        const t = await drone.connect();
        console.log(t)
        const temp = await drone.command('temp?');
        console.log(temp)
        const b = await drone.command('battery?');
        console.log(b)
        // await drone.takeoff()
        // await drone.emergency()

        // await drone.up(20)
        // await drone.down(30)

        // await drone.land()

        // await drone.disconnect();

    } catch (err){
        console.error(err)
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
