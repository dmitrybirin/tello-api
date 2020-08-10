# TELLO COMMANDS TODO
## Control Commands

- [x] command 
- [x] takeoff
- [x] land
- [ ] streamon 
- [ ] streamoff
- [x] emergency 

- [x] up x | x: 20-500

- [x] down x | x: 20-500

- [x] left x | x: 20-500

- [x] right x | x: 20-500

- [x] forward x | x: 20-500

- [x] back x | x: 20-500

- [x] cw x Tello rotate x degree clockwise | x: 1-3600

- [x] ccw x Tello rotate x degree counterclockwise | x: 1-3600

- [ ] flip x Tello fly flip x
l (left)
r (right)
f (forward)
b (back)

- [ ] go x y z speed Tello fly to x y z in speed (cm/s)
x: 20-500
y: 20-500
z: 20-500
speed: 10-100

- [ ] curve x1 y1 z1 x2 y2 z2 speed Tello fly a curve defined by the
current and two given coordinates
with speed (cm/s)
If the arc radius is not within
the range of 0.5-10 meters, it
responses false
x1, x2: 20-500
y1, y2: 20-500
z1, z2: 20-500
speed: 10-60
x/y/z can’t be between -20 – 20 at
the same time .

## Set Commands

Command Description Possible Response
speed x set speed to x cm/s
- [ ] x: 10-100

- [ ] rc a b c d Send RC control via four channels.
a: left/right (-100~100)
b: forward/backward (-100~100)
c: up/down (-100~100)
d: yaw (-100~100)

- [ ] wifi ssid pass Set Wi-Fi with SSID password

## Read Commands

- [ ] speed? get current speed (cm/s) x: 1-100

- [ ] battery? get current battery percentage x: 0-100

- [ ] time? get current fly time (s) time

- [ ] height? get height (cm) x: 0-3000

- [ ] temp? get temperature (℃) x: 0-90

- [ ] attitude? get IMU attitude data pitch roll yaw

- [ ] baro? get barometer value (m) x

- [ ] acceleration? get IMU angular acceleration data (0.001g) x y z

- [ ] tof? get distance value from TOF（cm）x: 30-1000

- [ ] wifi? get Wi-Fi SNR snr