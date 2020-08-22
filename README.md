# tello-api

## Description
Node API for the [tello](https://store.dji.com/shop/tello-series) drone.

Supporting the [1.3 SDK](https://dl-cdn.ryzerobotics.com/downloads/tello/20180910/Tello%20SDK%20Documentation%20EN_1.3.pdf) version

The API if using the [dgram sockets](https://nodejs.org/api/dgram.html) under the hood to connect to drone through UDP.
 
## Installation

```
yarn add tello-api
```

```
npm i -save tello-api
```

## Usage

API is working with async/await syntax
Currently it's supporting only one command at the time

**Typescript example**
```typescript
import { Drone } from 'tello-api'

const drone = new Drone(); // will create new instance with default ports
await drone.connect(); // will init the command and state sockets
const temp = await drone.command('battery?'); // will return battery result

await drone.takeoff() // drone will take off
await drone.up(25) // drone will go up
await drone.land() // drone will land

await drone.disconnect(); // remove all listeners from the sockets

```

To create an instance with different drone host and ports use the [DroneConstructorInput interface](./src/types.ts#L1) as in example with defaults 👇

``` typescript
const drone = new Drone({
    commandHost: 192.168.10.1;
    commandPort: 8889;
    statePort?: 8890;
});
```

When connecting to the drone, client UDP port on your machine assigned by default. To change that use the optional parameters to connect command: [DroneConnectInput interface](./src/types.ts#L7) as in example with defaults 👇


``` typescript
const drone = new Drone();

await drone.connect({
    clientPort: 9888,
    defaultCommandTimeout: 12000 // time in ms 
})
```

## Developing

```
npm install
```

OR

```
yarn
```

### Testing
I'm using the [node-tap](https://node-tap.org/) for testing
To run tests `npm test` should be enough. Config is in `.taprc` file.


### Future Development
- [ ] Cover all SDK commands (`go`, `curve`, `set commands` not supported yet)
- [ ] Generate API docs from the ts files.
