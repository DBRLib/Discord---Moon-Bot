/**
 * @author Deven Ronquillo
 * @version 28/5/2020
*/

//DEPS
const { Util } = require("discord.js");
const ytdl = require('ytdl-core');

const utils = require('./utils.js');

//GLOBS
const queue = new Map();


module.exports.version = 'v1.0';
module.exports.description = 'An audio streaming module for discord bots.';
    
module.exports.add = async (message) => {

    utils.debug('Begining add pre-rec check...');//debug

    //CHECK PRE-RECS TO BEGIN PLAYBACK
    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel) {

        return message.channel.send("You need to be in a voice channel to play music!");
    }

    utils.debug('User voip connection passed!');//debug

    const permissions = voiceChannel.permissionsFor(message.client.user);

    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {

        return message.channel.send("I need the permissions to join and speak in your voice channel!");
    }

    utils.debug('Bot permissions passed!');//debug

    const args = message.content.split(" ");

    if (!ytdl.validateURL(args[1])) {

        return message.channel.send("Invalid video URL!");
    }

    utils.debug('Link validation passed!');//debug
    utils.debug('Fetching song...');//debug

    //FETCH SONG
    const songInfo = await ytdl.getInfo(args[1]);
    const song = {author: songInfo.author.name, title: songInfo.title, url: songInfo.video_url, length: songInfo.length_seconds};
    utils.debug('----------SONG DATA----------');//debug
    //utils.debug(songInfo);//debug
    utils.debug('----------SONG FUCUSED DATA----------');//debug
    utils.debug(song);//debug

    //CHECK/CREATE QUEUE
    var guildQueue = queue.get(message.guild.id);

    if (!guildQueue) {

        utils.debug(`Building new queue for guild: ${message.guild.name}...`);//debug

        const queueContruct = {textChannel: message.channel, voiceChannel: voiceChannel, connection: null, songs: [], volume: 1, playing: true};
        queueContruct.songs.push(song);

        utils.debug(`${song.title} added to queue!`);//debug

        queue.set(message.guild.id, queueContruct);

        guildQueue = queue.get(message.guild.id);

        try {

            utils.debug('Attempting connection...');//debug
            var connection = await voiceChannel.join();
            guildQueue.connection = connection;
            utils.debug('Connected!');//debug

            utils.debug('Attempting playback...');//debug
            this.play(message.guild.id);
        } catch (err) {

            console.log(err);
            queue.delete(message.guild.id);
            return message.channel.send(err);
        }
    } else {

        utils.debug(`Guild queue found...`);//debug
        utils.debug(`${song.title} added to queue!`);//debug
        guildQueue.songs.push(song);
        return message.channel.send(`${song.title} has been added to the queue!`);
    }
}

module.exports.play = (guildID) => {

    const guildQueue = queue.get(guildID);

    utils.debug('Begining playback pre-rec check..');//debug

    //CHECK FOR EMPTY QUEUE
    if (guildQueue.songs === undefined || guildQueue.songs.length == 0) {

        utils.debug('no songs found, ending playback!');//debug
        guildQueue.voiceChannel.leave();
        queue.delete(guildID);
        return;
    }

    utils.debug(`${guildQueue.songs.length} queued songs found!`);//debug
    utils.debug('Creating dispatcher...');//debug

    //START PLAYBACK
    const dispatcher = guildQueue.connection.play(ytdl(guildQueue.songs[0].url, {quality: 'lowestaudio'})).on("finish", () => {

        utils.debug('Song finished!');//debug
        utils.debug('Recursively playing next queued song...');//debug
        
        guildQueue.songs.shift();
        this.play(guildID);
    }).on("error", error => {
        
        utils.debug('Error in dispatcher! stopping playback...');//debug
        utils.debug(error);

        guildQueue.songs = [];
        guildQueue.connection.dispatcher.end();
        utils.debug('Queue Cleared! Dispatcher killed!');//debug
        
    });

    utils.debug('Setting dispatcher volume...');//debug
    dispatcher.setVolumeLogarithmic(guildQueue.volume / 10);

    utils.debug(`${guildQueue.songs[0].title} playback started expected run time is: ${guildQueue.songs[0].length}s`);//debug
    guildQueue.textChannel.send(`Start playing: **${guildQueue.songs[0].title}** by ${guildQueue.songs[0].author}`);

    utils.debug('Creating monitor...');
    utils.monitor(dispatcher, guildQueue.songs[0].length*1000);
}

module.exports.skip = (message) => {

    const guildQueue = queue.get(message.guild.id);

    utils.debug('Begining skip pre-rec check...');//debug

    if (!message.member.voice.channel) {

        return message.channel.send("You have to be in a voice channel to stop the music!");
    }

    utils.debug('User voip connection passed!');//debug

    if (!guildQueue) {

        return message.channel.send("There is no song that I could skip!");
    }

    utils.debug('Dispatcher check passed!');//debug

    guildQueue.connection.dispatcher.end();

    utils.debug('Dispatcher killed! Song skipped.');//debug
}
  
module.exports.stop = (message) => {

    const guildQueue = queue.get(message.guild.id);

    utils.debug('Begining stop pre-rec check...');//debug

    if (!message.member.voice.channel) {

        return message.channel.send("You have to be in a voice channel to stop the music!");
    }

    utils.debug('User voip connection passed!');//debug
    utils.debug(`Ending playback and clearing ${message.guild.name} queue...`);//debug

    //in the future make stop pause playback instead of end playback?
    guildQueue.songs = [];
    guildQueue.connection.dispatcher.end();

    utils.debug('Queue cleared and dispatcher killed!');//debug
}

module.exports.volume = (message) => {

    const guildQueue = queue.get(message.guild.id);

    utils.debug('Begining stop pre-rec check...');//debug

    if (!message.member.voice.channel) {

        return message.channel.send("You have to be in a voice channel to stop the music!");
    }

    utils.debug('User voip connection passed!');//debug

    const args = message.content.split(" ");

    utils.debug('Checking volume argument...');//debug

    if (args[1] >= 0 && args[1] <= 10) {

        utils.debug('Argument in acceptable range, updating...');//debug

        //maybe make dispatcher a guildQueue attribute so that volume is changed realtime?
        guildQueue.volume = args[1];

        utils.debug(`Volume updated to ${args[1]}!`);//debug
        return message.channel.send(`Volume updated to ${args[1]}(active next queue)`);
    }
}

