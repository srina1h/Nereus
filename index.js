const { Client, Util, MessageEmbed, Message } = require("discord.js");
const YouTube = require("simple-youtube-api");
const ytdl = require("ytdl-core");
const DisTube = require("distube");
const dotenv = require("dotenv").config();
const path = require("path");
const fs = require('fs')
const bcrypt = require('bcrypt');
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy;



var bodyParser = require('body-parser');
var express = require("express");
var http = require("http");
var app = express();

app.use(require('cookie-parser')());
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(require('express-session')({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
    done(null, user);
});
  
passport.deserializeUser(function(user, done) {
    done(null, user);
});

passport.use(new LocalStrategy(
    function(username, password, done) {
        bcrypt.compare(password, process.env.PASS, function(err, res) {
            if(res && username === "admin") {
                return done(null, username);
            } else {
                return done(null, false, { message: 'Incorrect password.' })
            }
        });
    }
));


const storeData = (data, path) => {
  try {
    fs.writeFileSync(path, JSON.stringify(data))
  } catch (err) {
    console.error(err)
  }
}

const loadData = (path) => {
  try {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
  } catch (err) {
    console.error(err)
    return false
  }
}

const getTopSizes = (bot, all) => {
    var other = 0, ind = 0;
    var resSizes = [], res = [], resNames = [];    
    bot.guilds.cache.forEach((g) => {
        res.push([g.memberCount, g.name])
    })
    res.sort(function(a, b) {
        return b[0] - a[0];
    });    
    res.forEach((g) => {
        if(ind < 5) other += g.memberCount;
        ind++;
    })
    if(all) return res;
    res = res.slice(0, 5);
    res.forEach((value) => {
        resSizes.push(value[0]);
        resNames.push(value[1]);
    })
    resSizes.push(other); resNames.push("Other");
    return [resSizes, resNames];
}

function authCheck(req, res, next) {
    if(req.user) next();
    else res.redirect("/login");
}

app.use(express.static(path.join(__dirname, 'public')));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.post('/login', passport.authenticate('local', {  
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: false 
    })
);

app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/login');
});

app.get("/", authCheck, function (request, response, next) {
    var res = getTopSizes(bot, false);
    response.render('dashboard.ejs', {
        stats: stats,
        uptime: getUptime(),
        numServers: bot.guilds.cache.size,
        numUsers: bot.users.cache.size,
        guildList: bot.guilds.cache,
        biggestGuildNames: res[1],
        biggestGuildSizes: res[0]      
    });
});

app.get("/login", function (request, response) {
    response.render('login.ejs')
});

app.get("/servers", authCheck, function (request, response, next) {
    response.render('servers.ejs', {
        guildList: getTopSizes(bot, true) 
    });
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
const ADMIN_ID = process.env.ADMIN_ID;
const ADMIN_ID_LIST = ADMIN_ID.split(';');

const bot = new Client({
    disableMentions: "all"
});

const distube = new DisTube(bot, { searchSongs: false, emitNewSongOnly: true });

const distube1 = new DisTube(bot, )

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

var stats = loadData("./public/stats.json");
const updateStats = (val) => {
    if(stats.pingArr.length < 30) stats.pingArr.push(val);
    else stats.pingArr[stats.arrCounter] = val;
    stats.arrCounter = (stats.arrCounter + 1) % 30;
}
const youtube = new YouTube(GOOGLE_API_KEY);
const queue = new Map();

bot.on("warn", console.warn);
bot.on("error", console.error);
bot.on("ready", () => {console.log(`${bot.user.tag} has been successfully turned on!`);bot.user.setActivity(PREFIX +"help on "+ bot.guilds.cache.size +" servers", {type: 'LISTENING'})});
bot.on("shardDisconnect", (event, id) => console.log(`Shard ${id} disconnected (${event.code}) ${event}, trying to reconnect!`));
bot.on("shardReconnecting", (id) => console.log(`Shard ${id} reconnecting...`));
bot.on("guildCreate", (guild) => {
    bot.user.setActivity(PREFIX +"help on "+ bot.guilds.cache.size +" servers", {type: 'LISTENING'});
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
        .addField(PREFIX+'volume <value>', 'Changes the volume to a value between 1-100%.', true)
        .addField(PREFIX+'nowplaying', 'Shows the song that is currently playing.', true)
        .addField(PREFIX+'support', 'Sends you a link to the official support server.', true)
        .addField(PREFIX+'bruh', 'Try it to find out!', true)
        .addField(PREFIX+'count', 'Check out our user base!', true);
        generalChannel.send('Hey there! Here is a quickstart guide on how to use Nereus!')
        generalChannel.send(helpembed)
    }
});

bot.on("message", async (msg) => { 
    if (msg.author.bot) return;
    if (!msg.content.startsWith(PREFIX)) return;
    var res;
    
    // Handling stats
    if(stats.numRequests)
        stats.averagePing = ((stats.averagePing + (bot.ws.ping / stats.numRequests)) * stats.numRequests) / (stats.numRequests + 1);
    else
        stats.averagePing = bot.ws.ping;
    stats.averagePing = Math.floor(stats.averagePing);
    stats.numRequests += 1;
    if(stats.numRequests % 10 == 0) {
        storeData(stats, "./public/stats.json");
    }

    const args = msg.content.split(" ");
    const searchString = args.slice(1).join(" ");
    const announcement = args.slice(1).join(" ");
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
        .addField(PREFIX+'volume <value>', 'Changes the volume to a value between 1-100%.', true)
        .addField(PREFIX+'nowplaying', 'Shows the song that is currently playing.', true)
        .addField(PREFIX+'support', 'Sends you a link to the official support server.', true)
        .addField(PREFIX+'bruh', 'Try it to find out!', true)
        .addField(PREFIX+'count', 'Check out our user base!', true);
        res = await msg.channel.send(helpembed);
    }

    else if(command === "count"){
        res = await msg.channel.send("Serving the 🍹 to " + bot.users.cache.size + " users on "+ bot.guilds.cache.size + " servers.");
    }

    else if (command === "lofi"){
        const voiceChannel = msg.member.voice.channel;
        if(!voiceChannel){
            res = await msg.channel.send("You need to be in an active voice channel to play Lo-Fi Music!");
            updateStats(res.createdAt - msg.createdAt);
            return res;        
        }
        const permissions = voiceChannel.permissionsFor(msg.client.user);
        if (!permissions.has("CONNECT")) {
            res = await msg.channel.send("Connect permission required !!");
        }
        else if (!permissions.has("SPEAK")) {
            res = await msg.channel.send("Speak permission required !!");
        }
        else{
            try{
                var videos = await youtube.searchVideos("lofi", 10);
                var video = await youtube.getVideoByID(videos[0].id);
                if(!video) res = await msg.channel.send("🆘 | Sorry, cannot play Lo-Fi Music now!");
            } catch (err) {
                console.error(err);
                res = await msg.channel.send("🆘 | Sorry, cannot play Lo-Fi Music now!");
            }
            return distube.play(msg, "lofi");
        }

    }
    else if (command === "play" || command === "p") {
        const voiceChannel = msg.member.voice.channel;
        if (!voiceChannel) {
            res = await msg.channel.send("You need to be in an active voice channel to play music 😴");
            updateStats(res.createdAt - msg.createdAt);
            return res;
        }
        const permissions = voiceChannel.permissionsFor(msg.client.user);
        if (!permissions.has("CONNECT")) {
            res = await msg.channel.send("Connect permission required !!");      
        }
        else if (!permissions.has("SPEAK")) {
            res = await msg.channel.send("Speak permission required !!");
        }
        else if ((url === "" && searchString === "") && serverQueue.playing === true){
            res = await msg.channel.send("Please specify either the URL or the song name 🎶");     
        }
        else if ((url === "" && searchString === "") && serverQueue.playing === false){
            if (serverQueue && !serverQueue.playing){
                serverQueue.playing = true;
                serverQueue.connection.dispatcher.resume();
                res = await msg.channel.send("▶  **|**  Resume.");           
            }
        }
        else if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
            const playlist = await youtube.getPlaylist(url);
            const videos = await playlist.getVideos();
            for (const video of Object.values(videos)) {
                const video2 = await youtube.getVideoByID(video.id); 
                await handleVideo(video2, msg, voiceChannel, true); 
            }
            res = await msg.channel.send(`🎉  **|**  Playlist: **\`${playlist.title}\`** has been added to queue`);}   
        else {
            try {
                var video = await youtube.getVideo(url);
            } catch (error) {
                try {
                    var videos = await youtube.searchVideos(searchString, 10);
                    var video = await youtube.getVideoByID(videos[0].id);
                    if (!video) res = await msg.channel.send("🆘  **|**  No matches found !");
                } catch (err) {
                    console.error(err);
                    res = await msg.channel.send("🆘  **|**  No matches found !");          
                }

            }
            //return handleVideo(video, msg, voiceChannel);
            return distube.play(msg, searchString);
        }
    }
    else if (command === "search" || command === "sc") {
        const voiceChannel = msg.member.voice.channel;
        if (!voiceChannel) {
            res = await msg.channel.send("You need to be in an active voice channel to play music 😴");
            updateStats(stats, res.createdAt - msg.createdAt);
            return res;
        }
        const permissions = voiceChannel.permissionsFor(msg.client.user);
        if (!permissions.has("CONNECT")) {
            res = await msg.channel.send("Connect permission required !!");       
        }
        else if (!permissions.has("SPEAK")) {
            res = await msg.channel.send("Speak permission required !!");      
        }
        else if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
            const playlist = await youtube.getPlaylist(url);
            const videos = await playlist.getVideos();
            distube.play(msg, url)
            for (const video of Object.values(videos)) {
                const video2 = await youtube.getVideoByID(video.id); 
                await handleVideo(video2, msg, voiceChannel, true); 
            }
            res = await msg.channel.send(`🎉  **|**  Playlist: **\`${playlist.title}\`** has been added to queue`);        
        } else {
            try {
                var video = await youtube.getVideo(url);
            } catch (error) {
                try {
                    var videos = await distube.search(searchString);
                    let index = 0;
                    if(!videos.length) {
                        return msg.channel.send("🆘  **|**  No matches found");
                    }
                    res = msg.channel.send(`
__**Song selection**__
${videos.map(video2 => `**\`${++index}\`  |**  ${video2.name}`).join("\n")}
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
                        return msg.channel.send("Invalid Value 🤭 ");
                    }
                    const videoIndex = parseInt(response.first().content);
                    var video = videos[videoIndex - 1];
                } catch (err) {
                    console.error(err);
                    res = await msg.channel.send("🆘  **|**  No matches found");
                    updateStats(stats, res.createdAt - msg.createdAt);
                    return res;
                }
            }
            return distube.play(msg, video);
        }

    } if (command === "skip") {
        // if (!msg.member.voice.channel) res = await msg.channel.send("You need to be in an active voice channel to play music 😴");
        // else if (!serverQueue) res = await msg.channel.send("There is nothing playing 🤭 ");
        // else {
        //     serverQueue.connection.dispatcher.end("Skipped");
        //     res = await await msg.channel.send("⏭️  **|**  Skipped");
        // }
        distube.skip(msg);
        res = await await msg.channel.send("⏭️  **|**  Skipped");
    } else if (command === "stop"){
        // if(!serverQueue) return;
        // if (serverQueue.playing === false) res = await msg.channel.send("Music is currently paused ⏸ | Please un-pause (/play) and then stop 😇");
        // else if (!msg.member.voice.channel) res = await msg.channel.send("You need to be in an active voice channel to play music 😴");
        // else if (!serverQueue) res = await msg.channel.send("There is nothing playing 🤭 ");
        // else {
        //     serverQueue.songs = [];
        //     serverQueue.connection.dispatcher.end("Stopped");
        //     res = await msg.channel.send("⏹️  **|**  Stopped"); 
        // }
        distube.stop(msg);
        res = await msg.channel.send("⏹️  **|**  Stopped"); 
    } else if (command === "volume" || command === "vol") {
        if (!msg.member.voice.channel) res = await msg.channel.send("You need to be in an active voice channel to play music 😴");
        else if (!distube.isPlaying(msg)) res = await msg.channel.send("There is nothing playing 🤭 ");
        else if (!args[1]) res = await msg.channel.send(`The current volume is: **\`${serverQueue.volume}%\`**`);
        else if (isNaN(args[1]) || args[1] > 100) res = await msg.channel.send("Volume in range **1** - **100**.");
        else {
            distube.setVolume(msg, args[1]);
            res = await msg.channel.send(`Volume set to : **\`${args[1]}%\`**`);      
        }
    } else if (command === "nowplaying" || command === "np") { //find a nice way to implement this
        if (!serverQueue) res = await msg.channel.send("There is nothing playing 🤭 ");
        else res = await msg.channel.send(`🎶  **|**  Now Playing: **\`${serverQueue.songs[0].title}\`**`);    
    } else if (command === "queue" || command === "q") { // better formatting required
        if (!distube.isPlaying(msg)) res = await msg.channel.send("There is nothing playing 🤭 ");
        else {
            let info = distube.getQueue(msg);
            res = await msg.channel.send('__**Song Queue**__\n' + info.songs.map((song, id) =>
                `**${id+1}**. [${song.name}](${song.url}) - \`${song.formattedDuration}\``
            ).join("\n"));
        }
    } else if (command === "pause") {
        if (distube.isPaused(msg)){
            res = await msg.channel.send("Already paused 🤭");
        }
        else if (!distube.isPaused(msg)) {
            distube.pause(msg);
            res = await msg.channel.send("⏸  **|**  Paused.");                   
        }
        else res = await msg.channel.send("There is nothing queued 🤭");  
    } else if (command === "resume") {
        if (!distube.isPaused(msg)){
            res = await msg.channel.send("There is nothing paused 🤭");  
        }
        else if (distube.isPaused(msg)) {
            distube.resume(msg);
            res = await msg.channel.send("▶  **|**  Resume.");          
        }
        else res = await msg.channel.send("There is nothing queued 🤭");      
    } else if (command === "loop") {
        if(distube.isPlaying(msg)){
            let mode = distube.setRepeatMode(msg, parseInt(args[0]));
            mode = mode ? mode == 2 ? "Repeat queue" : "Repeat song" : "Off";
            res = await msg.channel.send("Set repeat mode to `" + mode + "`");
        }
        else res = await msg.channel.send("There is nothing playing 🤭");   
    } else if (command === "bruh"){
        res = await msg.channel.send("moment");       
    } else if (command === "invite"){
        const invembed = new MessageEmbed()
        .setColor('0x00AE86')
        .setTitle('Invite Nereus to your server!')
        .setURL('https://discord.com/api/oauth2/authorize?client_id=734801580548685884&permissions=8&scope=bot');
        res = await msg.author.send(invembed);      
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
        .addField(PREFIX+'volume <value>', 'Changes the volume to a value between 1-100%.', true)
        .addField(PREFIX+'nowplaying', 'Shows the song that is currently playing.', true)
        .addField(PREFIX+'bruh', 'Try it to find out!', true)
        .addField(PREFIX+'support', 'Sends you a link to the official support server.', true)
        .addField(PREFIX+'count', 'Check out our user base!', true);
        res = await msg.author.send(helpmeembed);
    } else if(command === "announce"){
        const this_id = msg.author.id
        for(let i = 0; i < ADMIN_ID_LIST.length; i++){
            if(this_id === ADMIN_ID_LIST[i]){
                msg.reply(`Allowed admin`);
                
                bot.guilds.cache.forEach((guild) =>{
                    let announce_channel = "";
                    guild.channels.cache.forEach((channel) =>{
                        if (channel.type == "text" && announce_channel === ""){
                            if(channel.permissionsFor(guild.me).has("SEND_MESSAGES")) {
                                announce_channel = channel;
                            }
                        }
                    });
                    if (announce_channel != ""){
                        announce_channel.send(announcement);
                    }
                });
                break;
            }
        }
    } else if(command === "support"){
        const invembed = new MessageEmbed()
        .setColor('0x00AE86')
        .setTitle('Raise an issue in the Github Repository')
        .setURL('https://github.com/srinathsrinivasan1/Nereus');
        res = await msg.channel.send(invembed);  
        msg.channel.send('Or join the Nereus support server for any queries 💬');
        msg.channel.send('https://discord.gg/X5QXRHK');      
    }
    if(res && msg.createdAt) {
        updateStats(res.createdAt - msg.createdAt);
        return res;   
    }
});

async function handleVideo(video, msg, voiceChannel, playlist = false) {
    const serverQueue = queue.get(msg.guild.id);
    var res;
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
            if(msg.createdAt)
                updateStats(Date.now() - msg.createdAt);
            play(msg.guild, queueConstruct.songs[0]);
        } catch (error) {
            console.error(`Could not join voice channel: ${error}`);
            queue.delete(msg.guild.id);
            res = await msg.channel.send(`Could not join voice channel: **\`${error}\`**`);
            if(res && msg.createdAt) {
                updateStats(res.createdAt - msg.createdAt);        
            }
        }
    } else {
        serverQueue.songs.push(song);
        if (playlist) return;
        else res = await msg.channel.send(`🎉 **|** **\`${song.title}\`** has been added to queue..`);
        if(res && msg.createdAt) {
            updateStats(res.createdAt - msg.createdAt);        
        }        
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

// Queue status template
const status = (queue) => `Volume: \`${queue.volume}%\` | Filter: \`${queue.filter || "Off"}\` | Loop: \`${queue.repeatMode ? queue.repeatMode == 2 ? "All Queue" : "This Song" : "Off"}\` | Autoplay: \`${queue.autoplay ? "On" : "Off"}\``;

// DisTube event listeners, more in the documentation page
distube
    .on("playSong", (message, queue, song) => message.channel.send(
        `Playing \`${song.name}\` - \`${song.formattedDuration}\`\nRequested by: ${song.user}\n${status(queue)}`
    ))
    .on("addSong", (message, queue, song) => message.channel.send(
        `Added ${song.name} - \`${song.formattedDuration}\` to the queue by ${song.user}`
    ))
    .on("playList", (message, queue, playlist, song) => message.channel.send(
        `Play \`${playlist.name}\` playlist (${playlist.songs.length} songs).\nRequested by: ${song.user}\nNow playing \`${song.name}\` - \`${song.formattedDuration}\`\n${status(queue)}`
    ))
    .on("addList", (message, queue, playlist) => message.channel.send(
        `Added \`${playlist.name}\` playlist (${playlist.songs.length} songs) to queue\n${status(queue)}`
    ))
    // DisTubeOptions.searchSongs = true
    .on("searchResult", (message, result) => {
        let i = 0;
        message.channel.send(`**Choose an option from below**\n${result.map(song => `**${++i}**. ${song.name} - \`${song.formattedDuration}\``).join("\n")}\n*Enter anything else or wait 60 seconds to cancel*`);
    })
    // DisTubeOptions.searchSongs = true
    .on("searchCancel", (message) => message.channel.send(`Searching canceled`))
    .on("error", (message, e) => {
        console.error(e)
        message.channel.send("An error encountered: " + e);
    });

bot.login(TOKEN);
