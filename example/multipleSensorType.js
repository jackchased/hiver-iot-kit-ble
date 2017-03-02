// sample code for BLE weather station module
var _ = require('busyman'),
    chalk = require('chalk');

var weatherPlugin = require('bshep-plugin-sivann-weatherstation'), 
    remoteCtrlPlugin = require('bshep-plugin-sivann-remotecontrol'), 
    relayPlugin = require('bshep-plugin-sivann-relay'),
    gasSensorPlugin = require('bshep-plugin-sivann-gassensor');

function app (central) {
    central.support('weatherStation', weatherPlugin); 
    central.support('remoteCtrl', remoteCtrlPlugin); 
    central.support('relay', relayPlugin); 
    central.support('gasSensor', gasSensorPlugin); 
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

    /*** ind              ***/
    central.on('ind', function(msg) {
        var dev = msg.periph;

        switch (msg.type) {
            /*** devIncoming      ***/
            case 'devIncoming':
                if (dev.name)  
                    console.log(chalk.yellow('[   devIncoming ] ') + '@' + dev.addr + ', ' + dev.name + ', firmware ' + dev.findChar('0x180a', '0x2a26').value.firmwareRev); // display the device MAC and name. Use this MAC address for blacklist or whitelist.
                else
                    console.log(chalk.yellow('[   devIncoming ] ') + '@' + dev.addr + ', failed to recognize this incoming device.');

                if (dev.name === 'weatherStation') {
                    weatherStation = dev;
                    /***  write your application here   ***/

                    // you can call the private function to enable all the indication/notification of each Characteristic automatically.
                    configNotifyAll(weatherStation); 
                    weatherStation.configNotify('0xbb00', '0xcc00', false); // DIn  Set to false to disable the notification
                    weatherStation.configNotify('0xbb10', '0xcc02', false); // AIn  Set to false to disable the notification
                    
                    // Register your handler to handle notification or indication of each Characteristic.
                    weatherStation.onNotified('0xbb80', '0xcc07', tempHdlr);        // temperature
                    weatherStation.onNotified('0xbb80', '0xcc08', humidHdlr);       // humidity
                    weatherStation.onNotified('0xbb80', 65, uvIndexHdlr);           // UV Index
                    weatherStation.onNotified('0xbb80', 69, ambientLightHdlr);      // illuminance
                    weatherStation.onNotified('0xbb80', '0xcc11', barometerHdlr);   // barometer
                    weatherStation.onNotified('0xbb80', '0xcc1a', loudnessHdlr);    // Loudness
                    weatherStation.onNotified('0xbb80', '0xcc1b', pmHdlr);          // PM (Particulate matter)
                    
                    weatherStation.write('0xbb80', '0xbb82', {period: 250}, function (err) {
                        if (err) 
                            console.log(chalk.red('[         error ]') + ' failed to change period. ' + err);
                        else {
                            weatherStation.read('0xbb80', '0xbb82', function (err, value) {
                                if (err)
                                    console.log(chalk.red('[         error ]') + ' failed to read period. ' + err);
                                else
                                    console.log('[ debug message ] changed the reporting period to ' + value.period / 100 + 's.'); // (recommend range: 100-255). Minimum period is 1s.
                            });
                        }
                    });    
                }
                
                if (dev.name === 'remoteCtrl') {
                    remoteCtrl = dev;
                    /***  write your application here   ***/

                    // you can call the private function to enable all the indication/notification of each Characteristic automatically.
                    configNotifyAll(remoteCtrl);
                    // you can also manually enable or disable the indication/notification of each Characteristic.
                    // remoteCtrl.configNotify('0xbb70', '0xcc32', true); // multiState key

                    // Register your handler to handle notification or indication of each Characteristic.
                    remoteCtrl.onNotified('0xbb70', '0xcc32', remoteCtrlHdlr);    // multiState key
                }
                
                if (dev.name === 'relay') {
                    relay = dev;
                    /***  write your application here   ***/

                    // you can call the private function to enable all the indication/notification of each Characteristic automatically.
                    configNotifyAll(relay);
                    // you can also manually enable or disable the indication/notification of each Characteristic.
                    relay.configNotify('0xbb00', '0xcc00', false); // DIn  Set to false to disable the notification
                    relay.configNotify('0xbb10', '0xcc02', false); // AIn  Set to false to disable the notification

                    // Register your handler to handle notification or indication of each Characteristic.
                    relay.onNotified('0xbb40', '0xcc0e', function (data) {
                        callbackRelay(data, relay);  // Relay
                    });     
                    relay.onNotified('0xbb30', '0xcc1e', function (data) {
                        callbackPower(data, relay);  // Power
                    });  
                    relay.onNotified('0xbb30', '0xcc13', function (data) {
                        callbackCurrent(data, relay);  // Current
                    });
                    relay.onNotified('0xbb90', '0xcc06', function (data) {
                        callbackPir(data, relay);  // PIR
                    });     

                    relay.write('0xbb30', '0xbb32', {period: 250}, function (err) {
                        if (err) 
                            console.log(chalk.red('[         error ]') + ' failed to change the period. ' + err);
                        else {
                            relay.read('0xbb30', '0xbb32', function (err, value) {
                                if (err)
                                    console.log(chalk.red('[         error ]') + ' failed to read period. ' + err);
                                else
                                    console.log('[ debug message ] changed the reporting period to ' + value.period / 100 + 's.'); // (recommend range: 100-255)
                            });
                        }
                    });
                }    
                
                if (dev.name === 'gasSensor') {
                    gasSensor = dev;
                    /***  write your application here   ***/

                    // you can call the private function to enable all the indication/notification of each Characteristic automatically.                    
                    configNotifyAll(gasSensor); 
                    // you can also manually enable or disable the indication/notification of each Characteristic.
                    gasSensor.configNotify('0xbb00', '0xcc00', false);  // DIn  Set to false to disable the notification
                    gasSensor.configNotify('0xbb10', '0xcc02', false);  // AIn  Set to false to disable the notification

                    // Register your handler to handle notification or indication of each Characteristic.
                    gasSensor.onNotified('0xbb60', '0xcc28', buzzerHdlr);   // buzzer
                    gasSensor.onNotified('0xbb50', '0xcc04', gasHdlr);      // gas
                    gasSensor.write('0xbb50', '0xbb52', {period: 250}, function (err) {
                        if (err)
                            console.log(chalk.red('[         error ]') + ' failed to change the period. ' + err);
                        else {
                            gasSensor.read('0xbb50', '0xbb52', function (err, value) {
                                if (err)
                                  console.log(chalk.red('[         error ]') + ' failed to read period. ' + err);
                                else
                                  console.log('[ debug message ] changed the reporting period to ' + value.period / 100 + 's.'); // (recommend range: 100-255)
                            });
                        }
                    });
                    gasSensor.write('0xbb50', '0xbb53', {option: 1}, function (err) { // option 0:Propane, 1:Smoke(default), 2:Methane, 3:Ethanol
                        if (err)
                            console.log(chalk.red('[         error ]') + ' failed to change the option. ' + err);
                        else 
                            console.log('[ debug message ] changed the measuring gas option to Smoke.');
                    });
                    gasSensor.write('0xbb50', '0xbb54', {threshold: 500}, function (err) { // threshold range: 100-10000
                        if (err)
                            console.log(chalk.red('[         error ]') + ' failed to change the threshold. ' + err);
                        else 
                            console.log('[ debug message ] changed the gas threshold value to 500 ppm.');
                    });
                }
                    
                break;

            /***   devStatus     ***/
            case 'devStatus':
                console.log('[     devStatus ] ' + '@' + dev.addr + ', ' + msg.data);
                break;

            /***   devLeaving    ***/
            case 'devLeaving':
                console.log('[    devLeaving ]' + '@' + dev.addr);
                break;

            /***   attrsChange   ***/
            case 'attChange':
                //console.log('[   attrsChange ] ' + '@' + dev.addr + ', ' + dev.name + ', ' + msg.data.sid.uuid + ', ' + msg.data.cid.uuid + ', ' + JSON.stringify(msg.data.value));  // print all attribute changes once received.
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


/**********************************/
/* BLE Application                */
/**********************************/
var weatherStation, weatherStation1, weatherStation2;
function bleApp (central) {
    var blocker = central.blocker;

    /*** add your devices to blacklist ***/
    //blocker.enable('black');         // enable blacklist service. Use blacklist to ban a known devices.
    //blocker.block('0x5c313e2bfb34'); // ban a specified device by its MAC address

    /*** add your devices to whitelist ***/
    //blocker.enable('white');         // enable whitelist service. Use whitelist to block other unknown/unwanted BLE devices, and only specified devices can join your network.
    //blocker.unblock('0x20c38ff1a0ea');  // specify a device to join the network by using its MAC address
    //blocker.unblock('0x20c38ff1b8b1');

    central.permitJoin(60);             // 60s the default value to allow devices joining the network.
}

/*****************************************************/
/*    Weather Station Callback Handler               */
/*****************************************************/
function tempHdlr(data) {
    // show temp
    console.log('[ debug message ] Temperature : ' + data.sensorValue.toFixed(1) + ' ' + data.units);
    /***  write your application here   ***/
}

function humidHdlr(data) {
    // show humid
    console.log('[ debug message ] Humidity : ' + data.sensorValue.toFixed(1) + ' ' + data.units);
    /***  write your application here   ***/
}

function ambientLightHdlr(data) {
    // show Ambient Light
    console.log('[ debug message ] Ambient Light : ' + data.sensorValue + ' ' + data.units);
    /***  write your application here   ***/
}

function uvIndexHdlr(data) {
    // show uvIndex
    console.log('[ debug message ] UV Index : ' + data.sensorValue + ' ' + data.units);
    /***  write your application here   ***/
}

function barometerHdlr(data) {
    // show barometer
    console.log('[ debug message ] Atmospheric Pressure : ' + data.sensorValue + ' ' + data.units);
    /***  write your application here   ***/
}

function loudnessHdlr(data) {
    // show loudness
    console.log('[ debug message ] Sound Level : ' + data.sensorValue.toFixed(1) + ' ' + data.units);
    /***  write your application here   ***/
}

function pmHdlr(data) {
    // show pm
    console.log('[ debug message ] Particulate Matter : ' + data.sensorValue.toFixed(1) + ' ' + data.units);
    /***  write your application here   ***/
}

/*****************************************************/
/*    Remote Control Callback Handler                */
/*****************************************************/
function remoteCtrlHdlr(data) {
    // judge which button be pressed
    if (data.mStateIn === 1) {          // up
        console.log('[ debug message ] Remote Control State: Up');
        /***  write your application here   ***/
    } else if (data.mStateIn === 2) {   // down
        console.log('[ debug message ] Remote Control State: Down');
        /***  write your application here   ***/
    } else if (data.mStateIn === 4) {   // center
        console.log('[ debug message ] Remote Control State: Center');
        /***  write your application here   ***/
    } else if (data.mStateIn === 8) {   // left
        console.log('[ debug message ] Remote Control State: Left');
        /***  write your application here   ***/
    } else if (data.mStateIn === 16) {  // right
        console.log('[ debug message ] Remote Control State: Right');
        /***  write your application here   ***/
    }
}

/*****************************************************/
/*    Power Meter Relay Callback Handler             */
/*****************************************************/
function callbackRelay(data, dev) {
    // show relay state
    console.log('[ debug message ] Relay@' + dev.addr + ' State: ' + data.onOff);
    /***  write your application here   ***/
}

function callbackPower(data, dev) {
    // show power
    console.log('[ debug message ] Power@' + dev.addr + ' : ' + data.sensorValue.toFixed(2) + ' ' + data.units);
    /***  write your application here   ***/
}

function callbackCurrent(data, dev) {
    // show current
    console.log('[ debug message ] Current@' + dev.addr + ' : ' + data.sensorValue.toFixed(2) + ' ' + data.units);
    /***  write your application here   ***/
}

function callbackPir(data, dev) {
    var pwrCtrlChar;

    // show pir state
    console.log('[ debug message ] PIR@' + dev.addr + ' State: ' + data.dInState);

    /*** Example: interaction between PIR state and Relay switch   ***/
    if (data.dInState && dev) {
        // if PIR is triggered and relay is present, then switch relay to NO
        // relay service : 0xbb40, char: 0xcc0e
        dev.write('0xbb40', '0xcc0e', {onOff: 1}, function (err) {
            if (err)
                console.log(chalk.red('[         error ]') + ' failed to switch onOff. ' + err);
            else
                console.log('[ debug message ] switch relay@' + dev.addr + ' to NO');
        });
    } else if (!data.dInState && dev) {
        // if PIR is not triggered and relay is present, then switch relay to NC
        // relay service : 0xbb40, char: 0xcc0e
        dev.write('0xbb40', '0xcc0e', {onOff: 0}, function (err) {
            if (err) 
                console.log(chalk.red('[         error ]') + ' failed to switch onOff. ' + err);
            else 
                console.log('[ debug message ] switch relay@' + dev.addr + ' to NC');
        });
    }
}

/*****************************************************/
/*    Gas Alarm Sensor Callback Handler              */
/*****************************************************/
function buzzerHdlr(data) {
    // show buzzer state
    console.log('[ debug message ] Buzzer State: ' + data.onOff);
    /***  write your application here   ***/
}

function gasHdlr(data) {
    // show gas
    console.log('[ debug message ] Gas Concentration: ' + data.sensorValue.toFixed(1) + ' ' + data.units);
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
