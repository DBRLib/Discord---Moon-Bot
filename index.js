/**
 * @author Deven Ronquillo
 * @version 30/5/2020
*/

//DEPENDENCIES
const djs = require('discord.js');
const {prefix, token} = require('./config.json');

//MODULES
const audioStream = require('./modules/audioStream.js');
const utils = require('./modules/utils.js');

console.log('----------STARTING BOT----------');
const client = new djs.Client();
client.login(token);

//EVENTS
client.on('ready', () => {

    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('reconnecting', () => {

    console.log(`${client.user.tag} reconnecting!`);
});

client.on('disconnect', () => {

    console.log(`${client.user.tag} disconnected!`);
});

//MESSAGE EVENTS
client.on('message', async message => {

    if (message.author.bot || !message.content.startsWith(prefix)) {
    
        return;
    }

    utils.debug('Message recieved, parsing...');

    if (message.content.startsWith(`${prefix}play`)) {

        audioStream.add(message);
        return;
    } else if (message.content.startsWith(`${prefix}skip`)) {

        audioStream.skip(message);
        return;
    } else if (message.content.startsWith(`${prefix}stop`)) {

        audioStream.stop(message);
        return;
    } else if (message.content.startsWith(`${prefix}volume`)) {

        audioStream.volume(message);
        return;
    }else if (message.content.startsWith(`${prefix}reload`)) {

        const args = message.content.split(" ");
        delete require.cache[require.resolve(`./modules/${args[1]}.js`)]; 

        message.channel.send(`Module ${args[1]} reloaded.`);
        console.log(`Module ${args[1]} reloaded.`);
        return;
    }else {

        message.channel.send("Invalid command!");
        console.log('Invalid command!');
    }
});