/********************************************************************************************************************************************
Copyright 2016 sivann inc. 

The source code contained or described herein and all documents related to the source code are owned by sivann inc. or its suppliers or licensors. 
No part of the source code may be published, uploaded, posted, transmitted, distributed, or disclosed in any way without sivann's prior express written permission.
**********************************************************************************************************************************************/
var chalk = require('chalk'),
    pjson = require('./package.json'),
    gasAlarm = require('./example/gasAlarm'),
    powerMeterRelay = require('./example/powerMeterRelay'),
    weatherStation = require('./example/weatherStation'),
    remoteControl = require('./example/remoteControl');

/**********************************/
/* Start Demo App                 */
/**********************************/                                                                                                                   
sampleCodeDemo();

/**********************************/
/* Module Menu List               */
/**********************************/
function sampleCodeDemo () {
    console.log('---------------------------------------------------------------');   
    console.log("   Hiver IoT starter Kit for BLE Application. ");
    console.log(" ");    
    console.log("   >>> hiver-iot-kit-ble     v:" + pjson.version);    
    console.log('   >>> plugin-meter-relay    v:' + pjson.dependencies['bshep-plugin-sivann-relay'] );
    console.log('   >>> plugin-gassensor      v:' + pjson.dependencies['bshep-plugin-sivann-gassensor'] ); 
    console.log('   >>> plugin-weatherstation v:' + pjson.dependencies['bshep-plugin-sivann-weatherstation'] );
    console.log('   >>> plugin-remotecontrol  v:' + pjson.dependencies['bshep-plugin-sivann-remotecontrol'] );
    console.log('---------------------------------------------------------------');   
    console.log("   >>> BLE Module Demo Option Menu.");
    console.log(" "); 
    console.log("       1.  Power Meter Relay       ");
    console.log("       2.  Weather Station         ");
    console.log("       3.  Gas Alarm               ");
    console.log("       4.  Remote Controller       ");
    console.log(" ");         
    console.log("   Please key in your option [1-4] and hit enter:");
    
	readConsoleInput (function(data) {
        console.log(data);
        showWelcomeMsg();
        console.log("Please power on your modules. ");
		switch(data) 
		{
			case "1":
				powerMeterRelay();	
			break;
			case "2":
                weatherStation();
			break;
			case "3":
                gasAlarm();
			break;
			case "4":
                remoteControl();
			break;            
			default :
				console.log("Choose a valid option :  ");
				sampleCodeDemo();
		}
	});
}

/**********************************/
/* Welcome Msg Function           */
/**********************************/
function showWelcomeMsg() {
    var blePart1 = chalk.blue('       ___   __    ____      ____ __ __ ____ ___   __ __ ____ ___   ___ '),
        blePart2 = chalk.blue('      / _ ) / /   / __/____ / __// // // __// _ \\ / // // __// _ \\ / _ \\'),
        blePart3 = chalk.blue('     / _  |/ /__ / _/ /___/_\\ \\ / _  // _/ / ___// _  // _/ / , _// // /'),
        blePart4 = chalk.blue('    /____//____//___/     /___//_//_//___//_/   /_//_//___//_/|_|/____/ ');

    console.log('');
    console.log('');
    console.log('Welcome to ble-shepherd World... ');
    console.log('');
    console.log(blePart1);
    console.log(blePart2);
    console.log(blePart3);
    console.log(blePart4);
    console.log(chalk.gray('         A network server and manager for the BLE machine network'));
    console.log('');
    console.log('   >>> Author:     Hedy Wang (hedywings@gmail.com)');
    console.log('   >>> Version:    ble-shepherd v:' + pjson.dependencies['ble-shepherd'] );              
    console.log('   >>> Document:   https://github.com/bluetoother/ble-shepherd');
    console.log('   >>> Copyright (c) 2016 Hedy Wang, The MIT License (MIT)');
    console.log('');
    console.log('The server is up and running, press Ctrl+C to stop server.');
    console.log('');
    console.log('---------------------------------------------------------------');
}

/**********************************/
/* Private Input Function         */
/**********************************/
function readConsoleInput (callBack) {
    var stdin = process.openStdin(),
        input = stdin.listeners('data');
    
	if ( input[0] && input ) {
        stdin.removeListener("data", input[0] );
	}
    
	stdin.addListener ("data", function (data) {
    	callBack(data.toString().trim());
	});
}