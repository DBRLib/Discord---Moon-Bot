const {prefix, token, debug} = require('../config.json');

module.exports.debug = (message) => {

    if (debug == "true") {

        console.log(message);
    }
}

module.exports.monitor = async (dispatcher, time) => {

    const startTime = Date.now();

    if (debug) {

        if (time <= 0) {

            return console.log('Monitor finished!');
        }else{

            console.log('----------DISPATCHER MONITOR----------')
            console.log(`Is paused: ${dispatcher.paused}`);
            console.log(`Paused for: ${dispatcher.pausedTime}`);
            console.log(`Stream time: ${dispatcher.streamTime}`);
            console.log(`Stream time total: ${dispatcher.totalStreamTime}`);
            console.log(`Stream time left: ${time}`);
            console.log(`Volume: ${dispatcher.volume}`);

            await this.sleep(15000);
            const endTime = Date.now();
            this.monitor(dispatcher, time - (endTime - startTime))
        }
    }
}

module.exports.sleep = (ms) => {

    return new Promise(resolve => setTimeout(resolve, ms));
}