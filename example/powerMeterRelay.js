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
                var fwRev = dev.findChar('0x180a', '0x2a26').value.firmwareRev;
                console.log(chalk.yellow('[   devIncoming ] ') + '@' + dev.addr + ', ' + dev.name + ' ' + fwRev); // display the device MAC and name. Use this MAC address for blacklist or whitelist. 
                
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
                    relay.configNotify('0xbb00', '0xcc00', false); // DIn   
                    relay.configNotify('0xbb10', '0xcc02', false); // AIn
                    
                    // Register your handler to handle notification or indication of each Characteristic.
                    relay.onNotified('0xbb40', '0xcc0e', callbackRelay);    // Relay
                    relay.onNotified('0xbb30', '0xcc1e', callbackPower);    // Power
                    relay.onNotified('0xbb30', '0xcc13', callbackCurrent);  // Current
                    relay.onNotified('0xbb90', '0xcc06', callbackPir);      // PIR
                    relay.onNotified('0xbb00', '0xcc00', callbackDIn);      // DIn
                    relay.onNotified('0xbb10', '0xcc02', callbackAIn);      // AIn                    
                    relay.write('0xbb30', '0xbb32', {period: 250}, function (err) {
                        if (err) 
                            console.log('[         error ] failed to change the period. ' + err);
                        else 
                            console.log('[ debug message ] changed the reporting period to 2.5s.'); // (recommend range: 100-255)
                    });                             
                    //relay.write('0xbb30', '0xbb31', {config : false});    // uncomment to turn off power & current measurements.           
                    
                    /*** you will have to switch case between device addresses only if you have multiple relay modules. ***/       
/*                    switch (dev.addr) {
                        case '0x20c38ff19428':                          
                            //  write your application for the 1st relay  //                        
                            relay1 = dev;
                            configNotifyAll(relay1);
                            relay1.onNotified('0xbb40', '0xcc0e', callbackRelay);    // Relay
                            relay1.onNotified('0xbb30', '0xcc1e', callbackPower);    // Power
                            relay1.onNotified('0xbb90', '0xcc06', callbackPir1);      // PIR 
                            relay1.write('0xbb30', '0xbb32', {period: 255}, function (err) {
                                if (err) 
                                    console.log('[         error ] failed to change the period. ' + err);
                                else 
                                    console.log('[ debug message ] changed the reporting period to 2.55s.'); // (recommend range: 100-255)
                            });                              																		
                            break;
                        case '0x689e192a8e2d':                                                    
                            //  write your application for the 2nd relay  //                        
							relay2 = dev;    	
                            configNotifyAll(relay2);	
                            relay2.onNotified('0xbb40', '0xcc0e', callbackRelay);    // Relay
                            relay2.onNotified('0xbb30', '0xcc1e', callbackPower);    // Power
                            relay2.onNotified('0xbb90', '0xcc06', callbackPir2);      // PIR                            					
                            relay2.write('0xbb30', '0xbb32', {period: 255}, function (err) {
                                if (err) 
                                    console.log('[         error ] failed to change the period. ' + err);
                                else 
                                    console.log('[ debug message ] changed the reporting period to 2.55s.'); // (recommend range: 100-255)
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
function callbackRelay(data) {
    // show relay state
    console.log('[ debug message ] Relay state: ' + data.onOff);
    /***  write your application here   ***/                        
}

function callbackPower(data) {
    // show power
    console.log('[ debug message ] Power sensed value: ' + data.sensorValue + ' ' + data.units);
    /***  write your application here   ***/      
}

function callbackCurrent(data) {
    // show current
    console.log('[ debug message ] Current sensed value: ' + data.sensorValue + ' ' + data.units);
    /***  write your application here   ***/  
}

function callbackMeterConfig(data) {
    // show power
    console.log('[ debug message ] Power sensed value: ' + data.sensorValue + ' ' + data.units);
    /***  write your application here   ***/  
}

function callbackMeterPeriod(data) {
    // show power
    console.log('[ debug message ] Power sensed value: ' + data.sensorValue + ' ' + data.units);
    /***  write your application here   ***/  
}

function callbackPir(data) {
    var pwrCtrlChar;

    // show pir state
    console.log('[ debug message ] PIR State: ' + data.dInState);
    
    /*** Example: interaction between PIR state and Relay switch   ***/
    if (data.dInState && relay) {
        // if PIR is triggered and relay is present, then switch relay to NO
        // relay service : 0xbb40, char: 0xcc0e
        relay.write('0xbb40', '0xcc0e', {onOff: 1}, function (err) {
            if (err) 
                console.log('[         error ] ' + err);
            else 
                console.log('[ debug message ] switch relay to NO');
        });
    } else if (!data.dInState && relay) {
        // if PIR is not triggered and relay is present, then switch relay to NC
        // relay service : 0xbb40, char: 0xcc0e
        relay.write('0xbb40', '0xcc0e', {onOff: 0}, function (err) {
            if (err) 
                console.log('[         error ] ' + err);
            else 
                console.log('[ debug message ] switch relay to NC');
        });

    }
}

function callbackPir1(data) {
    var pwrCtrlChar;

    // show pir1 state
    console.log('[ debug message ] PIR1 State: ' + data.dInState);
    
    /*** Example: interaction between PIR state and Relay switch   ***/
    if (data.dInState && relay1) {
        // if PIR1 is triggered and relay1 is present, then switch relay1 to NO
        // relay service : 0xbb40, char: 0xcc0e
        relay1.write('0xbb40', '0xcc0e', {onOff: 1}, function (err) {
            if (err) 
                console.log('[         error ] ' + err);
            else 
                console.log('[ debug message ] switch relay1 to NO');
        });
    } else if (!data.dInState && relay1) {
        // if PIR1 is not triggered and relay1 is present, then switch relay1 to NC
        // relay service : 0xbb40, char: 0xcc0e
        relay1.write('0xbb40', '0xcc0e', {onOff: 0}, function (err) {
            if (err) 
                console.log('[         error ] ' + err);
            else 
                console.log('[ debug message ] switch relay1 to NC');
        });

    }
}

function callbackPir2(data) {
    var pwrCtrlChar;

    // show pir2 state
    if(data.dInState)
        console.log('[ debug message ] PIR2 State: ' + data.dInState);
    else
        console.log('[ debug message ] PIR2 State: ' + data.dInState);
    
    /*** Example: interaction between PIR state and Relay switch   ***/
    if (data.dInState && relay2) {
        // if PIR2 is triggered and relay2 is present, then switch relay2 to NO
        // relay service : 0xbb40, char: 0xcc0e
        relay2.write('0xbb40', '0xcc0e', {onOff: 1}, function (err) {
            if (err) 
                console.log('[         error ] ' + err);
            else 
                console.log('[ debug message ] switch relay2 to NO');
        });
    } else if (!data.dInState && relay2) {
        // if PIR2 is not triggered and relay2 is present, then switch relay2 to NC
        // relay service : 0xbb40, char: 0xcc0e
        relay2.write('0xbb40', '0xcc0e', {onOff: 0}, function (err) {
            if (err) 
                console.log('[         error ] ' + err);
            else 
                console.log('[ debug message ] switch relay2 to NC');
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
    console.log('[ debug message ] aIn sensed value: ' + data.aInCurrValue + ' ' + data.sensorType);
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