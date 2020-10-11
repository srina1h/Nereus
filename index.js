const { Client, Util, MessageEmbed } = require("discord.js");
const YouTube = require("simple-youtube-api");
const ytdl = require("ytdl-core");
const dotenv = require("dotenv").config();
const path = require("path");

var express = require("express");
var http = require("http");
var app = express();

const getTopSizes = (bot) => {
    var res = [];
    var other = 0, ind = 0;
    bot.guilds.cache.forEach((g) => {
        if(ind < 5) {
            res.push(g.memberCount);     
        }     
        else {
            other += g.membercount
        }   
        ind++;
    })
    res.push(other);
    return res;
}

const getTopNames = (bot) => {
    var res = [], ind = 0;
    bot.guilds.cache.forEach((g) => {
        if(ind < 5) {
            res.push(g.name);     
        }        
        ind++;
    })
    res.push("Other");
    return res;
}

app.use(express.static(path.join(__dirname, 'public')));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.get("/", function (request, response) {
    response.render('dashboard.ejs', {
        stats: stats,
        uptime: getUptime(),
        numServers: bot.guilds.cache.size,
        numUsers: bot.users.cache.size,
        guildList: bot.guilds.cache,
        biggestGuildNames: getTopNames(bot),
        biggestGuildSizes: getTopSizes(bot)        
    });
    //response.sendStatus(200);
});

var listener = app.listen(9000, function () {
    console.log("Your app is listening on port " + listener.address().port);
});

setInterval(() => {
    http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 270000);

const TOKEN = process.env.BOT_TOKEN;
const PREFIX = process.env.PREFIX;
const GOOGLE_API_KEY = process.env.YTAPI_KEY;

const bot = new Client({
    disableMentions: "all"
});

const getUptime = () => {
    let totalSeconds = (bot.uptime / 1000);
    let days = Math.floor(totalSeconds / 86400);
    totalSeconds %= 86400;
    let hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = Math.floor(totalSeconds % 60);    
    return `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`;
}

var stats = {
    startTime: Date.now(),
    averagePing: 0,
    numRequests: 0
}

const youtube = new YouTube(GOOGLE_API_KEY);
const queue = new Map();

bot.on("warn", console.warn);
bot.on("error", console.error);
bot.on("ready", () => {console.log(`${bot.user.tag} has been successfully turned on!`);bot.user.setActivity(PREFIX +"help on "+ bot.guilds.cache.size +" servers", {type: 'LISTENING'})});
bot.on("shardDisconnect", (event, id) => console.log(`Shard ${id} disconnected (${event.code}) ${event}, trying to reconnect!`));
bot.on("shardReconnecting", (id) => console.log(`Shard ${id} reconnecting...`));
bot.on("guildCreate", (guild) => {
    const generalChannel = guild.channels.cache.find(channel => channel.name === "general");
    if (generalChannel){
        const helpembed = new MessageEmbed()
        .setTitle('Check out the Nereus git repository!')
        .setAuthor('Nereus', 'https://i.imgur.com/1rWjEeO.png', 'https://github.com/srinathsrinivasan1/Nereus')
        .setColor('0x00AE86')
        .setDescription("The prefix for nereus is set as "+ PREFIX +" in your server.")
        .setFooter('Nereus o.O', 'https://i.imgur.com/1rWjEeO.png')
        .setThumbnail('https://i.imgur.com/1rWjEeO.png')
        .setTimestamp()
        .setURL('https://github.com/srinathsrinivasan1/Nereus')
        .addField(PREFIX+'help', 'Opens this help menu.', true)
        .addField(PREFIX+'helpme', 'Sends you the help menu on DM.', true)
        .addField(PREFIX+'invite', 'Invite Nereus to your server !', true)
        .addField(PREFIX+'play <songname/URL>', 'Plays the song searched for (or) plays from the URL directly.', true)
        .addField(PREFIX+'lofi', 'Play Lo-Fi music 24*7', true)
        .addField(PREFIX+'search <song>', 'Searches for top 10 results on youtube, you can then choose what to play.', true)
        .addField(PREFIX+'skip', 'Skips the currently playing song.', true)
        .addField(PREFIX+'pause', 'Pauses the currently playing song.', true)
        .addField(PREFIX+'resume', 'Resumes the currently paused song.', true)
        .addField(PREFIX+'stop', 'Pauses the curently playing song.', true)
        .addField(PREFIX+'queue', 'Displays the song queue.', true)
        .addField(PREFIX+'volume <value>', 'changes the volume to a value between 1-100%.', true)
        .addField(PREFIX+'nowplaying', 'Shows the song that is currently playing.', true)
        .addField(PREFIX+'bruh', 'Try it to find out!', true)
        .addField(PREFIX+'count', 'Check out our user base!', true);
        generalChannel.send('Hey there! Here is a quickstart guide on how to use Nereus!')
        generalChannel.send(helpembed)
    }
});

bot.on("message", async (msg) => { 
    if (msg.author.bot) return;
    if (!msg.content.startsWith(PREFIX)) return;

    if(stats.numRequests)
        stats.averagePing = ((stats.averagePing + (bot.ws.ping / stats.numRequests)) * stats.numRequests) / (stats.numRequests + 1);
    else
        stats.averagePing = bot.ws.ping;
    stats.numRequests += 1;
    
    const args = msg.content.split(" ");
    const searchString = args.slice(1).join(" ");
    const url = args[1] ? args[1].replace(/<(.+)>/g, "$1") : "";
    const serverQueue = queue.get(msg.guild.id);
    
    //console.log("Your Search String:"+searchString+"\nYour URL:"+url+"\n");
    
    msg.react('🦥');

    let command = msg.content.toLowerCase().split(" ")[0];
    command = command.slice(PREFIX.length);

    if (command === "help" || command == "cmd") {
        const helpembed = new MessageEmbed()
        .setTitle('Check out the Nereus git repository!')
        .setAuthor('Nereus', 'https://i.imgur.com/1rWjEeO.png', 'https://github.com/srinathsrinivasan1/Nereus')
        .setColor('0x00AE86')
        .setDescription("The prefix for nereus is set as "+ PREFIX +" in your server.")
        .setFooter('Nereus o.O', 'https://i.imgur.com/1rWjEeO.png')
        .setThumbnail('https://i.imgur.com/1rWjEeO.png')
        .setTimestamp()
        .setURL('https://github.com/srinathsrinivasan1/Nereus')
        .addField(PREFIX+'help', 'Opens this help menu.', true)
        .addField(PREFIX+'helpme', 'Sends you the help menu on DM.', true)
        .addField(PREFIX+'invite', 'Invite Nereus to your server !', true)
        .addField(PREFIX+'play <songname/URL>', 'Plays the song searched for (or) plays from the URL directly.', true)
        .addField(PREFIX+'lofi', 'Play Lo-Fi music 24*7', true)
        .addField(PREFIX+'search <song>', 'Searches for top 10 results on youtube, you can then choose what to play.', true)
        .addField(PREFIX+'skip', 'Skips the currently playing song.', true)
        .addField(PREFIX+'pause', 'Pauses the currently playing song.', true)
        .addField(PREFIX+'resume', 'Resumes the currently paused song.', true)
        .addField(PREFIX+'stop', 'Pauses the curently playing song.', true)
        .addField(PREFIX+'queue', 'Displays the song queue.', true)
        .addField(PREFIX+'volume <value>', 'changes the volume to a value between 1-100%.', true)
        .addField(PREFIX+'nowplaying', 'Shows the song that is currently playing.', true)
        .addField(PREFIX+'bruh', 'Try it to find out!', true)
        .addField(PREFIX+'count', 'Check out our user base!', true);
        msg.channel.send(helpembed);
    }

    if(command === "count"){
        return msg.channel.send("Serving the 🍹 to " + bot.users.cache.size + " users on "+ bot.guilds.cache.size + " servers.");
    }

    if (command === "lofi"){
        const voiceChannel = msg.member.voice.channel;
        if(!voiceChannel){
            return msg.channel.send("You need to be in an active voice channel to play Lo-Fi Music!");
        }
        const permissions = voiceChannel.permissionsFor(msg.client.user);
        if (!permissions.has("CONNECT")) {
            return msg.channel.send("Connect permission required !!");
        }
        if (!permissions.has("SPEAK")) {
            return msg.channel.send("Speak permission required !!");
        }
        else{
            try{
                var videos = await youtube.searchVideos("lofi", 10);
                var video = await youtube.getVideoByID(videos[0].id);
                if(!video) return msg.channel.send("🆘 | Sorry, cannot play Lo-Fi Music now!");
            } catch (err) {
                console.error(err);
                return msg.channel.send("🆘 | Sorry, cannot play Lo-Fi Music now!");
            }
            return handleVideo(video, msg, voiceChannel);
        }

    }

    if (command === "play" || command === "p") {
        const voiceChannel = msg.member.voice.channel;
        if (!voiceChannel) return msg.channel.send("You need to be in an active voice channel to play music 😴");
        const permissions = voiceChannel.permissionsFor(msg.client.user);
        if (!permissions.has("CONNECT")) {
            return msg.channel.send("Connect permission required !!");
        }
        if (!permissions.has("SPEAK")) {
            return msg.channel.send("Speak permission required !!");
        }
        if ((url === "" && searchString === "") && serverQueue.playing === true){
            return msg.channel.send("Please specify either the URL or the song name 🎶");
        }
        if ((url === "" && searchString === "") && serverQueue.playing === false){
            if (serverQueue && !serverQueue.playing){
                serverQueue.playing = true;
                serverQueue.connection.dispatcher.resume();
                return msg.channel.send("▶  **|**  Resume.");
            }
        }
        if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
            const playlist = await youtube.getPlaylist(url);
            const videos = await playlist.getVideos();
            for (const video of Object.values(videos)) {
                const video2 = await youtube.getVideoByID(video.id); 
                await handleVideo(video2, msg, voiceChannel, true); 
            }
            return msg.channel.send(`🎉  **|**  Playlist: **\`${playlist.title}\`** has been added to queue`);
        } else {
            try {
                var video = await youtube.getVideo(url);
            } catch (error) {
                try {
                    var videos = await youtube.searchVideos(searchString, 10);
                    var video = await youtube.getVideoByID(videos[0].id);
                    if (!video) return msg.channel.send("🆘  **|**  No matches found !");
                } catch (err) {
                    console.error(err);
                    return msg.channel.send("🆘  **|**  No matches found !");
                }
            }
            return handleVideo(video, msg, voiceChannel);
        }
    }
    if (command === "search" || command === "sc") {
        const voiceChannel = msg.member.voice.channel;
        if (!voiceChannel) return msg.channel.send("You need to be in an active voice channel to play music 😴");
        const permissions = voiceChannel.permissionsFor(msg.client.user);
        if (!permissions.has("CONNECT")) {
            return msg.channel.send("Connect permission required !!");
        }
        if (!permissions.has("SPEAK")) {
            return msg.channel.send("Speak permission required !!");
        }
        if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
            const playlist = await youtube.getPlaylist(url);
            const videos = await playlist.getVideos();
            for (const video of Object.values(videos)) {
                const video2 = await youtube.getVideoByID(video.id); 
                await handleVideo(video2, msg, voiceChannel, true); 
            }
            return msg.channel.send(`🎉  **|**  Playlist: **\`${playlist.title}\`** has been added to queue`);
        } else {
            try {
                var video = await youtube.getVideo(url);
            } catch (error) {
                try {
                    var videos = await youtube.searchVideos(searchString, 10);
                    let index = 0;
                    msg.channel.send(`
__**Song selection**__
${videos.map(video2 => `**\`${++index}\`  |**  ${video2.title}`).join("\n")}
Please provide a value to select one of the search results ranging from 1-10.
					`);
                    try {
                        var response = await msg.channel.awaitMessages(msg2 => msg2.content > 0 && msg2.content < 11, {
                            max: 1,
                            time: 10000,
                            errors: ["time"]
                        });
                    } catch (err) {
                        console.error(err);
                        return msg.channel.send("invalid Value 🤭 ");
                    }
                    const videoIndex = parseInt(response.first().content);
                    var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
                } catch (err) {
                    console.error(err);
                    return msg.channel.send("🆘  **|**  No matches found");
                }
            }
            return handleVideo(video, msg, voiceChannel);
        }

    } else if (command === "skip") {
        if (!msg.member.voice.channel) return msg.channel.send("You need to be in an active voice channel to play music 😴");
        if (!serverQueue) return msg.channel.send("There is nothing playing 🤭 ");
        serverQueue.connection.dispatcher.end("Skipped");
        return msg.channel.send("⏭️  **|**  Skipped");

    } else if (command === "stop"){
        if (serverQueue.playing === false) return msg.channel.send("Music is currently paused ⏸ | Please un-pause (/play) and then stop 😇");
        if (!msg.member.voice.channel) return msg.channel.send("You need to be in an active voice channel to play music 😴");
        if (!serverQueue) return msg.channel.send("There is nothing playing 🤭 ");
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end("Stopped");
        return msg.channel.send("⏹️  **|**  Stopped");

    } else if (command === "volume" || command === "vol") {
        if (!msg.member.voice.channel) return msg.channel.send("You need to be in an active voice channel to play music 😴");
        if (!serverQueue) return msg.channel.send("There is nothing playing 🤭 ");
        if (!args[1]) return msg.channel.send(`The current volume is: **\`${serverQueue.volume}%\`**`);
        if (isNaN(args[1]) || args[1] > 100) return msg.channel.send("Volume in range **1** - **100**.");
        serverQueue.volume = args[1];
        serverQueue.connection.dispatcher.setVolume(args[1] / 100);
        return msg.channel.send(`Volume set to : **\`${args[1]}%\`**`);

    } else if (command === "nowplaying" || command === "np") {
        if (!serverQueue) return msg.channel.send("There is nothing playing 🤭 ");
        return msg.channel.send(`🎶  **|**  Now Playing: **\`${serverQueue.songs[0].title}\`**`);

    } else if (command === "queue" || command === "q") {
        if (!serverQueue) return msg.channel.send("There is nothing playing 🤭 ");
        return msg.channel.send(`
__**Song Queue**__
${serverQueue.songs.map(song => `**-** ${song.title}`).join("\n")}
**Now Playing: \`${serverQueue.songs[0].title}\`**
        `);

    } else if (command === "pause") {
        if (serverQueue && serverQueue.playing) {
            serverQueue.playing = false;
            serverQueue.connection.dispatcher.pause();
            return msg.channel.send("⏸  **|**  Paused.");
        }
        return msg.channel.send("There is nothing playing 🤭");

    } else if (command === "resume") {
        if (serverQueue && !serverQueue.playing) {
            serverQueue.playing = true;
            serverQueue.connection.dispatcher.resume();
            return msg.channel.send("▶  **|**  Resume.");
        }
        return msg.channel.send("There is nothing playing 🤭");
    } else if (command === "loop") {
        if (serverQueue) {
            serverQueue.loop = !serverQueue.loop;
            return msg.channel.send(`🔁 **|** Loop ${serverQueue.loop === true ? "enabled" : "disabled"}!`);
        };
        return msg.channel.send("There is nothing playing 🤭");
    } else if (command === "bruh"){
        return msg.channel.send("moment");
    } else if (command === "invite"){
        const invembed = new MessageEmbed()
        .setColor('0x00AE86')
        .setTitle('Invite Nereus to your server!')
        .setURL('https://discord.com/api/oauth2/authorize?client_id=734801580548685884&permissions=8&scope=bot');
        return msg.author.send(invembed);
    } else if (command === "helpme") {
        const helpmeembed = new MessageEmbed()
        .setTitle('Check out the Nereus git repository!')
        .setAuthor('Nereus', 'https://i.imgur.com/1rWjEeO.png', 'https://github.com/srinathsrinivasan1/Nereus')
        .setColor('0x00AE86')
        .setDescription("The prefix for nereus is set as "+ PREFIX +" in your server.")
        .setFooter('© Nereus o.O', 'https://i.imgur.com/1rWjEeO.png')
        .setThumbnail('https://i.imgur.com/1rWjEeO.png')
        .setTimestamp()
        .setURL('https://github.com/srinathsrinivasan1/Nereus')
        .addField(PREFIX+'help', 'Opens this help menu.', true)
        .addField(PREFIX+'invite', 'Invite Nereus to your server !', true)
        .addField(PREFIX+'play <songname/URL>', 'Plays the song searched for (or) plays from the URL directly.', true)
        .addField(PREFIX+'lofi', 'Play Lo-Fi music 24*7', true)
        .addField(PREFIX+'search <song>', 'Searches for top 10 results on youtube, you can then choose what to play.', true)
        .addField(PREFIX+'skip', 'Skips the currently playing song.', true)
        .addField(PREFIX+'pause', 'Pauses the currently playing song.', true)
        .addField(PREFIX+'resume', 'Resumes the currently paused song.', true)
        .addField(PREFIX+'stop', 'Pauses the curently playing song.', true)
        .addField(PREFIX+'queue', 'Displays the song queue.', true)
        .addField(PREFIX+'volume <value>', 'changes the volume to a value between 1-100%.', true)
        .addField(PREFIX+'nowplaying', 'Shows the song that is currently playing.', true)
        .addField(PREFIX+'bruh', 'Try it to find out!', true)
        .addField(PREFIX+'count', 'Check out our user base!', true);
        msg.author.send(helpmeembed);
    }
});

async function handleVideo(video, msg, voiceChannel, playlist = false) {
    const serverQueue = queue.get(msg.guild.id);
    const song = {
        id: video.id,
        title: Util.escapeMarkdown(video.title),
        url: `https://www.youtube.com/watch?v=${video.id}`
    };
    if (!serverQueue) {
        const queueConstruct = {
            textChannel: msg.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 100,
            playing: true,
            loop: false
        };
        queue.set(msg.guild.id, queueConstruct);

        queueConstruct.songs.push(song);

        try {
            var connection = await voiceChannel.join();
            connection.voice.setSelfDeaf(true);
            queueConstruct.connection = connection;
            play(msg.guild, queueConstruct.songs[0]);
        } catch (error) {
            console.error(`Could not join voice channel: ${error}`);
            queue.delete(msg.guild.id);
            return msg.channel.send(`Could not join voice channel: **\`${error}\`**`);
        }
    } else {
        serverQueue.songs.push(song);
        if (playlist) return;
        else return msg.channel.send(`🎉 **|** **\`${song.title}\`** has been added to queue..`);
    }
    return;
}

function play(guild, song) {
    const serverQueue = queue.get(guild.id);

    if (!song) {
        serverQueue.voiceChannel.leave();
        return queue.delete(guild.id);
    }
    serverQueue.connection.on('disconnect', ()=>{
        return queue.delete(guild.id);
    });

    const dispatcher = serverQueue.connection.play(ytdl(song.url))
        .on("finish", () => {
            const shiffed = serverQueue.songs.shift();
            if (serverQueue.loop === true) {
                serverQueue.songs.push(shiffed);
            };
            play(guild, serverQueue.songs[0]);
        })
        .on("error", error => console.error(error));
    dispatcher.setVolume(serverQueue.volume / 100);

    serverQueue.textChannel.send({
        embed: {
            color: "RANDOM",
            description: `🎶  **|**  Start Playing: **\`${song.title}\`**`
        }
    });
}

bot.login(TOKEN);
