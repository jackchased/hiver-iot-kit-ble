// sample code for BLE gas alarm module
var _ = require('busyman'),
    chalk = require('chalk');

var gasSensorPlugin = require('bshep-plugin-sivann-gassensor');

function app (central) {
    central.support('gasSensor', gasSensorPlugin); // give a device name to the module you are going to use. This name will be used in further applications.
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
var gasSensor, gasSensor1, gasSensor2;
function bleApp (central) {
	var blocker = central.blocker;

	/*** add your devices to blacklist ***/
	//blocker.enable('black');			// enable blacklist service. Use blacklist to ban a known devices.
    //blocker.block('0x5c313e2bfb34');	// ban a specified device by its MAC address

	/*** add your devices to whitelist ***/
    //blocker.enable('white');         		// enable whitelist service. Use whitelist to block other unknown/unwanted BLE devices, and only specified devices can join your network.
	//blocker.unblock('0x689e192a8c5e');	// specify a device to join the network by using its MAC address
	//blocker.unblock('0x20914838225b');

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

				if(dev.name === 'gasSensor') {
					gasSensor = dev;
                    /***  write your application here   ***/

                    // you can call the private function to enable all the indication/notification of each Characteristic automatically.                    
                    configNotifyAll(gasSensor); 
                    // you can also manually enable or disable the indication/notification of each Characteristic.
					// gasSensor.configNotify('0xbb60', '0xcc28', true);	// buzzer
					// gasSensor.configNotify('0xbb50', '0xcc04', true);	// gas
                    gasSensor.configNotify('0xbb00', '0xcc00', false);	// DIn
                    gasSensor.configNotify('0xbb10', '0xcc02', false);	// AIn

                    // Register your handler to handle notification or indication of each Characteristic.
					gasSensor.onNotified('0xbb60', '0xcc28', buzzerHdlr);	// buzzer
					gasSensor.onNotified('0xbb50', '0xcc04', gasHdlr);		// gas
                    gasSensor.onNotified('0xbb00', '0xcc00', callbackDIn);	// DIn
                    gasSensor.onNotified('0xbb10', '0xcc02', callbackAIn);	// AIn
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
					gasSensor.write('0xbb50', '0xbb53', {option: 1}, function (err) { // option 0:Propane(default), 1:Smoke, 2:Methane, 3:Ethanol
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

                    //gasSensor.write('0xbb50', '0xbb51', {config : false});    // uncomment to turn off gas measurements.

                    /*** you will have to switch case between device addresses only if you have multiple gas sensor modules. ***/
/*                    switch (dev.addr) {
                        case '0x689e192a8c5e':
                            //  write your application for the 1st gas sensor  //
                            gasSensor1 = dev;
                            configNotifyAll(gasSensor1);
                            gasSensor1.onNotified('0xbb60', '0xcc28', buzzerHdlr); // buzzer
							gasSensor1.onNotified('0xbb50', '0xcc04', gasHdlr);    // gas
                            gasSensor1.write('0xbb50', '0xbb52', {period: 255}, function (err) {
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
                            break;

                        case '0x20914838225b':
                            //  write your application for the 2nd gas sensor  //
							gasSensor2 = dev;
                            configNotifyAll(gasSensor2);
                            gasSensor2.onNotified('0xbb60', '0xcc28', buzzerHdlr); // buzzer
							gasSensor2.onNotified('0xbb50', '0xcc04', gasHdlr);    // gas
                            gasSensor2.write('0xbb50', '0xbb52', {period: 255}, function (err) {
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
