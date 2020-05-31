const {prefix, token, debug} = require('../config.json');

module.exports.debug = (message) => {

    if (debug == "true") {

        console.log(message);
    }
}