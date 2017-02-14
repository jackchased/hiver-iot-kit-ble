# hiver-iot-kit-ble
===
This is a quick start guide for developers using Hiver IoT BLE Kit and taking a quick look at sample codes based on ble-shepehrd.js

## Get Started 

Just 4 steps for you to start running the examples of each IoT modules. 

For Linux Ubuntu environment,

1. git clone https://github.com/sivann-tw/hiver-iot-kit-ble.git
2. cd hiver-iot-kit-ble
3. npm install
4. npm start

In Raspberry Pi - RASPBIAN JESSIE environment,

1. sudo git clone --recursive git://github.com/sivann-tw/hiver-iot-kit-ble.git
2. cd hiver-iot-kit-ble
3. sudo npm install --unsafe-perm --verbose
4. sudo npm start

PS: To avoid using sudo, please enter: sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)

And then follow the CLI instruction on the console to enter the BLE world.
