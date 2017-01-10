// sample code for BLE weather station module
var _ = require('busyman'),
    chalk = require('chalk');

var weatherPlugin = require('bshep-plugin-sivann-weatherstation');

function app (central) {
    central.support('weatherStation', weatherPlugin); // give a device name to the module you are going to use. This name will be used in further applications.
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
                    // you can also manually enable or disable the indication/notification of each Characteristic.
					// weatherStation.configNotify('0xbb80', '0xcc07', true);  // temperature
					// weatherStation.configNotify('0xbb80', '0xcc08', true);  // humidity
					// weatherStation.configNotify('0xbb80', 65, true);        // UV Index
					// weatherStation.configNotify('0xbb80', 69, true);        // illuminance
					// weatherStation.configNotify('0xbb80', '0xcc11', true);  // barometer
					// weatherStation.configNotify('0xbb80', '0xcc1a', true);  // Loudness
					// weatherStation.configNotify('0xbb80', '0xcc1b', true);  // PM (Particle Matter)
					weatherStation.configNotify('0xbb00', '0xcc00', false); // DIn
                    weatherStation.configNotify('0xbb10', '0xcc02', false); // AIn
					
					// Register your handler to handle notification or indication of each Characteristic.
                    weatherStation.onNotified('0xbb80', '0xcc07', tempHdlr);		// temperature
                    weatherStation.onNotified('0xbb80', '0xcc08', humidHdlr);		// humidity
                    weatherStation.onNotified('0xbb80', 65, uvIndexHdlr);			// UV Index
                    weatherStation.onNotified('0xbb80', 69, ambientLightHdlr);		// illuminance
                    weatherStation.onNotified('0xbb80', '0xcc11', barometerHdlr);	// barometer
                    weatherStation.onNotified('0xbb80', '0xcc1a', loudnessHdlr);	// Loudness
                    weatherStation.onNotified('0xbb80', '0xcc1b', pmHdlr);			// PM (Particulate matter)
                    weatherStation.onNotified('0xbb00', '0xcc00', callbackDIn);		// DIn
                    weatherStation.onNotified('0xbb10', '0xcc02', callbackAIn);		// AIn
					
					weatherStation.write('0xbb80', '0xbb82', {period: 250}, function (err) {
                        if (err) 
                            console.log(chalk.red('[         error ]') + ' failed to change period. ' + err);
                        else {
                            gasSensor.read('0xbb80', '0xbb82', function (err, value) {
                                if (err)
                                    console.log(chalk.red('[         error ]') + ' failed to read period. ' + err);
                                else
                                    console.log('[ debug message ] changed the reporting period to ' + value.period / 100 + 's.'); // (recommend range: 100-255)
                            });
                        }
                    });

					// weatherStation.write('0xbb80', '0xbb81', {config : false});    // uncomment to turn off weatherStation functions measurements.

                    /*** you will have to switch case between device addresses only if you have multiple weather station modules. ***/
/*                    switch (dev.addr) {
                        case '0x20c38ff1a0ea':
                            //  write your application for the 1st weather station  //
                            weatherStation1 = dev;
                            configNotifyAll(weatherStation1);
							weatherStation1.onNotified('0xbb80', '0xcc07', tempHdlr);		// temperature
							weatherStation1.onNotified('0xbb80', '0xcc08', humidHdlr);		// humidity
							weatherStation1.onNotified('0xbb80', 65, uvIndexHdlr);			// UV Index
							weatherStation1.onNotified('0xbb80', 69, ambientLightHdlr);		// illuminance
							weatherStation1.onNotified('0xbb80', '0xcc11', barometerHdlr);	// barometer
							weatherStation1.onNotified('0xbb80', '0xcc1a', loudnessHdlr);	// Loudness
							weatherStation1.onNotified('0xbb80', '0xcc1b', pmHdlr);			// PM (Particulate matter)
                            weatherStation1.write('0xbb80', '0xbb82', {period: 255}, function (err) {
                                if (err) 
                                    console.log(chalk.red('[         error ]') + ' failed to change period. ' + err);
                                else {
                                    gasSensor.read('0xbb80', '0xbb82', function (err, value) {
                                        if (err)
                                            console.log(chalk.red('[         error ]') + ' failed to read period. ' + err);
                                        else
                                            console.log('[ debug message ] changed the reporting period to ' + value.period / 100 + 's.'); // (recommend range: 100-255)
                                    });
                                }
                            });
                            break;
                        case '0x20c38ff1b8b1':
                            //  write your application for the 2nd weather station  //
							weatherStation2 = dev;
                            configNotifyAll(weatherStation2);
                            weatherStation2.onNotified('0xbb80', '0xcc07', tempHdlr);		// temperature
							weatherStation2.onNotified('0xbb80', '0xcc08', humidHdlr);		// humidity
							weatherStation2.onNotified('0xbb80', 65, uvIndexHdlr);			// UV Index
							weatherStation2.onNotified('0xbb80', 69, ambientLightHdlr);		// illuminance
							weatherStation2.onNotified('0xbb80', '0xcc11', barometerHdlr);	// barometer
							weatherStation2.onNotified('0xbb80', '0xcc1a', loudnessHdlr);	// Loudness
							weatherStation2.onNotified('0xbb80', '0xcc1b', pmHdlr);			// PM (Particulate matter)
                            weatherStation2.write('0xbb80', '0xbb82', {period: 255}, function (err) {
                                if (err) 
                                    console.log(chalk.red('[         error ]') + ' failed to change period. ' + err);
                                else {
                                    gasSensor.read('0xbb80', '0xbb82', function (err, value) {
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
