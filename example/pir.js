// sample code for BLE PIR module
var _ = require('busyman'),
    chalk = require('chalk');

var pirPlugin = require('bshep-plugin-sivann-pir');

function app (central) {
    central.support('pir', pirPlugin); // give a device name to the module you are going to use. This name will be used in further applications.
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

                if (dev.name === 'pir') {
                    pir = dev;
                    /***  write your application here   ***/

                    // you can call the private function to enable all the indication/notification of each Characteristic automatically.
                    configNotifyAll(pir);
                    // you can also manually enable or disable the indication/notification of each Characteristic.
                    pir.configNotify('0xbb10', '0xcc02', false); // AIn  Set to false to disable the notification

                    // Register your handler to handle notification or indication of each Characteristic.
                    pir.onNotified('0xbb90', '0xcc06', function (data) {
                        callbackPir(data, pir);  // PIR
                    });
                    pir.onNotified('0xbb10', '0xcc02', callbackAIn);      // AIn
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

/**********************************/
/* BLE Application                */
/**********************************/
var pir;
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
}

/*****************************************************/
/*    Power Meter Relay Callback Handler             */
/*****************************************************/
function callbackPir(data, dev) {
    // show pir state
    console.log('[ debug message ] PIR@' + dev.addr + ' State: ' + data.dInState);
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
