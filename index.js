const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// โหลดสถานะ Adobe
let adobeData = JSON.parse(fs.readFileSync('./adobe.json', 'utf8'));

function saveAdobe() {
    fs.writeFileSync('./adobe.json', JSON.stringify(adobeData, null, 2));
}

// โหลดข้อมูลลงทะเบียนเครื่องคอม
let users = {};
try {
    users = JSON.parse(fs.readFileSync('./users.json', 'utf8'));
} catch (err) {
    users = {};
}

function saveUsers() {
    fs.writeFileSync('./users.json', JSON.stringify(users, null, 2));
}

client.on("messageCreate", async (msg) => {
    if (msg.author.bot) return;

    // ลบข้อความแบบ Ghost
    msg.delete().catch(() => {});

    const args = msg.content.trim().split(" ");
    const command = args.shift().toLowerCase();

    // ─────────── ลงทะเบียนคอม ───────────
    if (command === "!register") {
        const computer = args[0];
        if (!computer) {
            return msg.channel.send("❌ กรุณาระบุชื่อคอม เช่น `!register PC01`")
                .then(m => setTimeout(() => m.delete(), 5000));
        }

        users[msg.author.id] = {
            name: msg.member.displayName,
            computer: computer
        };

        saveUsers();

        return msg.channel.send(
            `✅ **ลงทะเบียนสำเร็จ!**\n${msg.member.displayName} → ${computer}`
        ).then(m => setTimeout(() => m.delete(), 5000));
    }

    // ─────────── เช็กอิน ───────────
    if (command === "!in") {
        const id = args[0];
        if (!adobeData[id]) return;

        // ถ้าลงทะเบียน → ใช้ชื่อคอมอัตโนมัติ
        const computer = users[msg.author.id]?.computer || args[1] || "Unknown";

        if (adobeData[id].users.length >= 2) {
            return msg.channel.send(`❌ Adobe-${id} เต็มแล้ว (2/2)`)
                .then(m => setTimeout(() => m.delete(), 5000));
        }

        adobeData[id].users.push({
            name: msg.member.displayName,
            computer: computer
        });

        saveAdobe();

        return msg.channel.send(
            `✅ **${msg.member.displayName} เช็กอินเข้า Adobe-${id}**\n💻 คอมพิวเตอร์: ${computer}`
        ).then(m => setTimeout(() => m.delete(), 5000));
    }

    // ─────────── เช็กเอาต์ ───────────
    if (command === "!out") {
        const id = args[0];
        if (!adobeData[id]) return;

        adobeData[id].users = adobeData[id].users.filter(
            u => u.name !== msg.member.displayName
        );

        saveAdobe();

        return msg.channel.send(
            `📤 ${msg.member.displayName} ออกจาก Adobe-${id} แล้ว`
        ).then(m => setTimeout(() => m.delete(), 5000));
    }

    // ─────────── สถานะ ───────────
    if (command === "!status") {
        let output = "📊 **สถานะรหัส Adobe ตอนนี้**\n\n";

        for (let key in adobeData) {
            let acc = adobeData[key];
            output += `**Adobe-${key}** (${acc.users.length}/2)\n`;

            if (acc.users.length === 0) {
                output += `• ว่าง\n\n`;
            } else {
                acc.users.forEach(u => {
                    output += `• ${u.name} — ${u.computer}\n`;
                });
                output += "\n";
            }
        }

        return msg.channel.send(output)
            .then(m => setTimeout(() => m.delete(), 8000));
    }
});

// ใส่ TOKEN ของบอทตรงนี้
client.login(process.env.DISCORD_TOKEN);



