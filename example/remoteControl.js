// sample code for BLE remote controller module
var _ = require('busyman'),
    chalk = require('chalk');

var remoteCtrlPlugin = require('bshep-plugin-sivann-remotecontrol'); 

function app (central) {
    central.support('remoteCtrl', remoteCtrlPlugin); // give a device name to the module you are going to use. This name will be used in further applications.
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

                if(dev.name === 'remoteCtrl') {
                    remoteCtrl = dev;
                    /***  write your application here   ***/

                    // you can call the private function to enable all the indication/notification of each Characteristic automatically.
                    configNotifyAll(remoteCtrl);
                    // you can also manually enable or disable the indication/notification of each Characteristic.
                    // remoteCtrl.configNotify('0xbb70', '0xcc32', true); // multiState key

                    // Register your handler to handle notification or indication of each Characteristic.
                    remoteCtrl.onNotified('0xbb70', '0xcc32', remoteCtrlHdlr);    // multiState key

                    /*** you will have to switch case between device addresses only if you have multiple remote control modules. ***/
/*                    switch (dev.addr) {
                        case '0x689e192a8e33':
                            //  write your application for the 1st remote control  //
                            remoteCtrl1 = dev;
                            configNotifyAll(remoteCtrl1);
                            remoteCtrl1.onNotified('0xbb70', '0xcc32', remoteCtrlHdlr);    // multiState key
                            break;
                        case '0x20c38ff1c486':
                            //  write your application for the 2nd remote control  //
                            remoteCtrl2 = dev;
                            configNotifyAll(remoteCtrl2);
                            remoteCtrl2.onNotified('0xbb70', '0xcc32', remoteCtrlHdlr);    // multiState key
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


/**********************************/
/* BLE Application                */
/**********************************/
var remoteCtrl, remoteCtrl1, remoteCtrl2;
function bleApp (central) {
    var blocker = central.blocker;

    /*** add your devices to blacklist ***/
    //blocker.enable('black');         // enable blacklist service. Use blacklist to ban a known devices.
    //blocker.block('0x5c313e2bfb34'); // ban a specified device by its MAC address

    /*** add your devices to whitelist ***/
    //blocker.enable('white');         // enable whitelist service. Use whitelist to block other unknown/unwanted BLE devices, and only specified devices can join your network.
    //blocker.unblock('0x689e192a8e33');  // specify a device to join the network by using its MAC address
    //blocker.unblock('0x20c38ff1c486');

    central.permitJoin(60);             // 60s the default value to allow devices joining the network.
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
