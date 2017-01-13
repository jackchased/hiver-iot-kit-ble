// sample code for BLE power meter relay module
var _ = require('busyman'),
    chalk = require('chalk');

var relayPlugin = require('bshep-plugin-sivann-relay');

function app (central) {
    central.support('relay', relayPlugin); // give a device name to the module you are going to use. This name will be used in further applications.
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
var relay, relay1, relay2;
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

				if (dev.name === 'relay') {
					relay = dev;
                    /***  write your application here   ***/

                    // you can call the private function to enable all the indication/notification of each Characteristic automatically.
                    configNotifyAll(relay);
                    // you can also manually enable or disable the indication/notification of each Characteristic.
                    // relay.configNotify('0xbb40', '0xcc0e', true); // Relay
                    // relay.configNotify('0xbb30', '0xcc1e', true); // Power
                    // relay.configNotify('0xbb30', '0xcc13', true); // Current
                    // relay.configNotify('0xbb90', '0xcc06', true); // PIR
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
                    relay.onNotified('0xbb00', '0xcc00', callbackDIn);      // DIn
                    relay.onNotified('0xbb10', '0xcc02', callbackAIn);      // AIn
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
                    //relay.write('0xbb30', '0xbb31', {config : false});    // uncomment to turn off power & current measurements.

                    /*** you will have to switch case between device addresses only if you have multiple relay modules. ***/
/*                    switch (dev.addr) {
                        case '0x20c38ff19428':
                            //  write your application for the 1st relay  //
                            relay1 = dev;
                            configNotifyAll(relay1);
                            relay1.onNotified('0xbb40', '0xcc0e', function (data) {
                                callbackRelay(data, relay1);  // Relay
                            });     
                            relay1.onNotified('0xbb30', '0xcc1e', function (data) {
                                callbackPower(data, relay1);  // Power
                            });     
                            relay1.onNotified('0xbb90', '0xcc06', function (data) {
                                callbackPir(data, relay1);  // PIR
                            });     
                            relay1.write('0xbb30', '0xbb32', {period: 255}, function (err) {
                                if (err)
                                    console.log(chalk.red('[         error ]') + ' failed to change the period. ' + err);
                                else {
                                    relay1.read('0xbb30', '0xbb32', function (err, value) {
                                        if (err)
                                            console.log(chalk.red('[         error ]') + ' failed to read period. ' + err);
                                        else
                                            console.log('[ debug message ] changed the reporting period to ' + value.period / 100 + 's.'); // (recommend range: 100-255)
                                    });
                                }
                            });
                            break;
                        case '0x689e192a8e2d':
                            //  write your application for the 2nd relay  //
							relay2 = dev;
                            configNotifyAll(relay2);
                            relay2.onNotified('0xbb40', '0xcc0e', function (data) {
                                callbackRelay(data, relay2);  // Relay
                            });     
                            relay2.onNotified('0xbb30', '0xcc1e', function (data) {
                                callbackPower(data, relay2);  // Power
                            }); 
                            relay2.onNotified('0xbb90', '0xcc06', function (data) {
                                callbackPir(data, relay2);  // PIR
                            });     
                            relay2.write('0xbb30', '0xbb32', {period: 255}, function (err) {
                                if (err) 
                                    console.log(chalk.red('[         error ]') + ' failed to change the period. ' + err);
                                else {
                                    relay2.read('0xbb30', '0xbb32', function (err, value) {
                                        if (err)
                                            console.log(chalk.red('[         error ]') + ' failed to read period. ' + err);
                                        else
                                            console.log('[ debug message ] changed the reporting period to ' + value.period / 100 + 's.'); // (recommend range: 100-255)
                                    });
                                }
                            }); 
							break;
                    }
 */
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
