const { Client, GatewayIntentBits} = require('discord.js');
const https = require('https');
const fs = require('fs');



require('dotenv').config();
const Schave = process.env.SCHAVE;
const prefix = '.';



const client = new Client({
    intents: Object.keys(GatewayIntentBits).map(a => {
        return GatewayIntentBits[a];
    }),
});


client.once('ready', () => {
    console.log('Bot ON!');
});

function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomString = '';
    for (let i = 0; i < length; i++) {
        randomString += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return randomString;
}


const cu = async (text, channelId, messageId, guildId) => {
    const params = new URLSearchParams();
    const randomString = generateRandomString(15);
    params.append('msg', text);
    params.append('lang', 'Joey');
    params.append('source', 'ttsmp3');
    fetch('https://ttsmp3.com/makemp3_new.php', {
        method: 'POST',
        headers: {
            'authority': 'ttsmp3.com',
            'method': 'POST',
            'path': '/makemp3_new.php',
            'scheme': 'https',
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Origin': 'https://ttsmp3.com',
            'Priority': 'u=1, i',
            'Referer': 'https://ttsmp3.com/',
            'Sec-Ch-Ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
        },
        body: params
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro API');
        }
        return response.json();
    })
    .then(data => {
        const file = fs.createWriteStream(`${randomString}.mp3`);;
        
        https.get(data.URL, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(async () => {
                    await main(channelId, Schave, `${randomString}.mp3`, messageId, guildId)
                    await fs.unlink(`${randomString}.mp3`, (err) => {
                        if (err) {
                            console.error('Erro:', err);
                        }
                    });
                })
            })
        })
     })
    .catch(error => {
        console.error('Erro:', error);
    });
}



function main(channelId, token, filename, messageid, guildid) {
    let file = fs.readFileSync(filename)
    let fileLength = file.length
    fetch(`https://discord.com/api/v9/channels/${channelId}/attachments`, {
        headers: {
            "Authorization": `Bot ${token}`,
            "Content-Type": "application/json",
            "User-Agent": "Discord-Android/227012;RNA",
        },
        body: JSON.stringify({
            "files": [
                {
                    "filename": "audio.ogg",
                    "file_size": fileLength,
                    "id": "25"
                }
            ]
        }),
        method: "POST"
    }).then(async resp => {
        let jsonData = await resp.json()
        //console.log(jsonData)
        let url = jsonData.attachments[0].upload_url
        let name = jsonData.attachments[0].upload_filename
        fetch(url, {
            headers: {
                "Authorization": `Bot ${token}`,
                "Content-Type": "audio/ogg",
                "User-Agent": "Discord-Android/227012;RNA",
            },
            body: file,
            method: "PUT"
        }).then(async resp => {
            fetch(`https://discord.com/api/v9/channels/${channelId}/messages`, {
                headers: {
                    "Authorization": `Bot ${token}`,
                    "Content-Type": "application/json",
                    "User-Agent": "Discord-Android/227012;RNA",
                },
                body: JSON.stringify(
                    {
                        "content": '',
                        "channel_id": channelId,
                        "type": 0,
                        "flags": 8192,
                        'message_reference': {
                                'channel_id': channelId,
                                'message_id': messageid,
                                'guild_id': guildid,
                        },
                        "attachments": [
                            {
                                "id": "0",
                                "filename": "audio.ogg",
                                "uploaded_filename": name,
                                "duration_secs":  2147483647,
                                "waveform": btoa("                           |      ")
                            }
                        ],
                    }),
                method: "POST"
            })
        })
    })
}

client.on('messageCreate', async message => {
    if (message.author.bot) return; 
    if (!message.content.startsWith(prefix)) return; 

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const messageId = message.id;
    const guildId = message.guild.id;
    const channelId = message.channel.id;

    if (command === 'ad') {
        // Verifique se o texto contém menções a usuários
        let text = args.join(' ');
        if (message.mentions.users.size > 0) {
            // Se o texto contém menções, remova-as
            text = text.replace(/<@!?\d+>/g, '').trim();
        }

        if (!text) {
            return message.reply('Please type a text for the bot to speak.');
        }

        await cu(text, channelId, messageId, guildId)
    }
});

client.on('error', (err) => {
    console.error('Error:', err);
});



client.login(Schave);
