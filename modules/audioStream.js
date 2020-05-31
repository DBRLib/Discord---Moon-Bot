/**
 * @author Deven Ronquillo
 * @version 28/5/2020
*/

//DEPS
const { Util } = require("discord.js");
const ytdl = require('ytdl-core');

//GLOBS
const queue = new Map();


module.exports.version = 'v1.0';
module.exports.description = 'An audio streaming module for discord bots.';
    
module.exports.add = async (message) => {

    //CHECK PRE-RECS TO BEGIN PLAYBACK
    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel) {

        return message.channel.send("You need to be in a voice channel to play music!");
    }

    const permissions = voiceChannel.permissionsFor(message.client.user);

    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {

        return message.channel.send("I need the permissions to join and speak in your voice channel!");
    }

    const args = message.content.split(" ");

    if (!ytdl.validateURL(args[1])) {

        return message.channel.send("Invalid video URL!");
    }

    //FETCH SONG
    const songInfo = await ytdl.getInfo(args[1]);
    const song = {author: songInfo.author, title: songInfo.title, url: songInfo.video_url};

    //CHECK/CREATE QUEUE
    var guildQueue = queue.get(message.guild.id);

    if (!guildQueue) {

        const queueContruct = {textChannel: message.channel, voiceChannel: voiceChannel, connection: null, songs: [], volume: 2, playing: true};
        queueContruct.songs.push(song);

        queue.set(message.guild.id, queueContruct);

        guildQueue = queue.get(message.guild.id);

        try {

            var connection = await voiceChannel.join();
            guildQueue.connection = connection;
            this.play(message.guild.id);
        } catch (err) {

            console.log(err);
            queue.delete(message.guild.id);
            return message.channel.send(err);
        }
    } else {

        guildQueue.songs.push(song);
        return message.channel.send(`${song.title} has been added to the queue!`);
    }
}

module.exports.play = (guildID) => {

    const guildQueue = queue.get(guildID);

    //CHECK FOR EMPTY QUEUE
    if (guildQueue.songs === undefined || guildQueue.songs.length == 0) {

        guildQueue.voiceChannel.leave();
        queue.delete(guildID);
        return;
    }

    //START PLAYBACK
    const dispatcher = guildQueue.connection.play(ytdl(guildQueue.songs[0].url)).on("finish", () => {
        
        guildQueue.songs.shift();
        this.play(guildID);
    }).on("error", error => console.error(error));

    dispatcher.setVolumeLogarithmic(guildQueue.volume / 10);
    guildQueue.textChannel.send(`Start playing: **${guildQueue.songs[0].title}** by ${guildQueue.songs[0].author}`);
}

module.exports.skip = (message) => {

    const guildQueue = queue.get(message.guild.id);

    if (!message.member.voice.channel) {

        return message.channel.send("You have to be in a voice channel to stop the music!");
    }

    if (!guildQueue) {

        return message.channel.send("There is no song that I could skip!");
    }

    guildQueue.connection.dispatcher.end();
}
  
module.exports.stop = (message) => {

    const guildQueue = queue.get(message.guild.id);

    if (!message.member.voice.channel) {

        return message.channel.send("You have to be in a voice channel to stop the music!");
    }

    //in the future make stop pause playback instead of end playback?
    guildQueue.songs = [];
    guildQueue.connection.dispatcher.end();
}

module.exports.volume = (message) => {

    const guildQueue = queue.get(message.guild.id);

    const args = message.content.split(" ");

    if (args[1] >= 0 && args[1] <= 10) {

        //maybe make dispatcher a guildQueue attribute so that volume is changed realtime?
        guildQueue.volume = args[1];
        return message.channel.send(`Volume updated to ${args[1]}(active next queue)`);
    }
}

