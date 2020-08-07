# tello-api

## Description
Node API for the [tello](https://store.dji.com/shop/tello-series) drone.

Supporting the [1.3 SDK](https://dl-cdn.ryzerobotics.com/downloads/tello/20180910/Tello%20SDK%20Documentation%20EN_1.3.pdf) version

The API if using the [dgram sockets](https://nodejs.org/api/dgram.html) under the hood to connect to drone through UDP.
 
## Installation

```
[TBD]
```

## Usage

API is working with async/await syntax

**Typescript example**
```typescript
import { Drone } from [TBD]

const drone = new Drone();
await drone.connect(); // will init the command and state sockets
const temp = await drone.command('battery?'); // will return battery result

await drone.takeoff() // drone will take off
await drone.up(25) // drone will go up
await drone.land() // drone will land

await drone.disconnect(); // remove all listeners from the sockets

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

