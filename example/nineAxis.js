// sample code for BLE nine axis module
var _ = require('busyman'),
    chalk = require('chalk');

var relayPlugin = require('bshep-plugin-sivann-nineaxis');

function app (central) {
    central.support('nineAxis', relayPlugin); // give a device name to the module you are going to use. This name will be used in further applications.
    central.start();

/************************/
/* Event handle         */
/************************/
    /*** central is ready ***/
    central.on('ready', function () {
        console.log(chalk.green('[         ready ] '));
        bleApp(central);
    });

    /*** permitJoining    ***/
    central.on('permitJoining', function (timeLeft) {
        console.log(chalk.green('[ permitJoining ] ') + timeLeft + ' sec');
    });

    /*** error            ***/
    central.on('error', function (err) {
        console.log(chalk.red('[         error ] ') + err.message);
    });
}

/**********************************/
/* BLE Application                */
/**********************************/
var nineAxis;
function bleApp (central) {
    var blocker = central.blocker;

    /*** add your devices to blacklist ***/
    //blocker.enable('black');         // enable blacklist service. Use blacklist to ban a known devices.
    //blocker.block('0x5c313e2bfb34'); // ban a specified device by its MAC address

    /*** add your devices to whitelist ***/
    //blocker.enable('white');         // enable whitelist service. Use whitelist to block other unknown/unwanted BLE devices, and only specified devices can join your network.
    //blocker.unblock('0x20c38ff19428');  // specify a device to join the network by using its MAC address
    //blocker.unblock('0x689e192a8e2d');

    central.permitJoin(60);             // 60s the default value to allow devices joining the network.
    central.on('ind', function(msg) {
        var dev = msg.periph;

        switch (msg.type) {
            /*** devIncoming      ***/
            case 'devIncoming':
                if (dev.name)
                    console.log(chalk.yellow('[   devIncoming ] ') + '@' + dev.addr + ', ' + dev.name + ', firmware ' + dev.findChar('0x180a', '0x2a26').value.firmwareRev); // display the device MAC and name. Use this MAC address for blacklist or whitelist.
                else
                    console.log(chalk.yellow('[   devIncoming ] ') + '@' + dev.addr + ', failed to recognize this incoming device.');

                if (dev.name === 'nineAxis') {
                    nineAxis = dev;
                    /***  write your application here   ***/

                    // you can call the private function to enable all the indication/notification of each Characteristic automatically.
                    configNotifyAll(nineAxis);
                    // you can also manually enable or disable the indication/notification of each Characteristic.
                    nineAxis.configNotify('0xbb00', '0xcc00', false); // DIn
                    nineAxis.configNotify('0xbb10', '0xcc02', false); // AIn

                    // Register your handler to handle notification or indication of each Characteristic.
                    nineAxis.onNotified('0xbb20', '0xcc24', gyroHdlr);    // Gyroscope
                    nineAxis.onNotified('0xbb20', '0xcc0f', accelHdlr);    // Accelerometer
                    nineAxis.onNotified('0xbb20', '0xcc10', magHdlr);  // Magnetometer
                    nineAxis.onNotified('0xbb00', '0xcc00', callbackDIn);      // DIn
                    nineAxis.onNotified('0xbb10', '0xcc02', callbackAIn);      // AIn
                    nineAxis.write('0xbb20', '0xbb22', {period: 250}, function (err) {
                        if (err) 
                            console.log(chalk.red('[         error ]') + ' failed to change the period. ' + err);
                        else {
                            nineAxis.read('0xbb20', '0xbb22', function (err, value) {
                                if (err)
                                    console.log(chalk.red('[         error ]') + ' failed to read period. ' + err);
                                else
                                    console.log('[ debug message ] changed the reporting period to ' + value.period / 100 + 's.'); // (recommend range: 100-255)
                            });
                        }
                    });
                }
                break;

            /***   devStatus     ***/
            case 'devStatus':
                var status
                if (msg.data === 'online')
                    status = chalk.green(msg.data);
                else 
                    status = chalk.red(msg.data);
                console.log(chalk.magenta('[     devStatus ] ') + '@' + dev.addr + ', ' + status);
                break;

            /***   devLeaving    ***/
            case 'devLeaving':
                console.log(chalk.yellow('[    devLeaving ]') + '@' + dev.addr);
                break;

            /***   attrsChange   ***/
            case 'attChange':
                //console.log(chalk.blue('[   attrsChange ] ') + '@' + dev.addr + ', ' + dev.name + ', ' + msg.data.sid.uuid + ', ' + msg.data.cid.uuid + ', ' + JSON.stringify(msg.data.value));  // print all attribute changes once received.
                break;
            /***   attNotify     ***/
            case 'attNotify':
                break;

            /***   devNeedPasskey   ***/  
            case 'devNeedPasskey':
                // cc-bnp only
                console.log('[devNeedPasskey ]');
                break;
        }
    });
}

/*****************************************************/
/*    Power Meter nineAxis Callback Handler             */
/*****************************************************/
function accelHdlr(data) {
    // show accelerometer
    console.log('[ debug message ] Accelerometer : ' + 'X Axis: ' + data.xValue.toFixed(1) + ', Y Axis: ' + data.yValue.toFixed(1) + ', Z Axis: ' + data.zValue.toFixed(1) + ' ' + data.units);
    /***  write your application here   ***/
}

function magHdlr(data) {
    // show magnetometer
    console.log('[ debug message ] Magnetometer : ' + 'X Axis: ' + data.xValue.toFixed(1) + ', Y Axis: ' + data.yValue.toFixed(1) + ', Z Axis: ' + data.zValue.toFixed(1) + ' ' + data.units);
    /***  write your application here   ***/
}

function gyroHdlr(data) {
    // show groscope
    console.log('[ debug message ] Gyroscope : ' + 'X Axis: ' + data.xValue.toFixed(1) + ', Y Axis: ' + data.yValue.toFixed(1) + ', Z Axis: ' + data.zValue.toFixed(1) + ' ' + data.units);
    /***  write your application here   ***/
}

function callbackDIn(data) {
    // show dIn
    console.log('[ debug message ] dIn State : ' + data.dInState);
    /***  write your application here   ***/
}

function callbackAIn(data) {
    // show aIn
    console.log('[ debug message ] aIn : ' + data.aInCurrValue + ' ' + data.sensorType);
    /***  write your application here   ***/
}

/**********************************/
/* Private Utility Function       */
/**********************************/
function configNotifyAll(dev) {
    var devData = {
        permAddr: dev.addr,
        status: dev.status,
        gads: {}
    };

    _.forEach(dev.dump().servList, function (serv) {
        _.forEach(serv.charList, function (char) {

            if (!_.isNil(devData)) {
                devData.gads[devData.auxId] = devData;
                if (dev._controller)
                    dev.configNotify(serv.uuid, char.handle, true);
            }
        });
    });

    return devData;
}

module.exports = app;
