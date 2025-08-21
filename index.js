const { Client, LocalAuth } = require("whatsapp-web.js");

// ================= CONFIG =================
const ADMIN = "6287756266682@c.us"; // ganti dengan nomor adminmu
const EXCLUDED_NUMBERS = [
  ADMIN,
  "6285179911407@c.us", // contoh
  "6289876543210@c.us"  // contoh
];

let IZIN_TELEPON = []; // daftar nomor yang diizinkan telepon
let userState = {};   // simpan state menu per user

// ================= MENU =================
const menuUtama = `
📌 MENU UTAMA
1️⃣ TOP UP
2️⃣ PESAN PRIBADI
0️⃣ MENU
`;

const menuTopUp = `
💰 TOP UP
1. 150
2. 200
3. 300
4. 500
5. 1/2
6. 1
0. Kembali
`;

const menuPesanPribadi = `
✉ PESAN PRIBADI
1. Bon
2. Gadai
3. HP
4. Barang Lain
5. Telepon Admin
0. Kembali
`;

// ================= CLIENT =================
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

// QR Code muncul di Railway log sebagai link
client.on("qr", (qr) => {
  const qrLink = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`;
  console.log("🔑 Scan QR lewat link ini (buka di browser):");
  console.log(qrLink);
});

client.on("ready", () => console.log("✅ Bot WhatsApp aktif!"));

// ================= HANDLER CHAT =================
client.on("message", async (msg) => {
  const chat = msg.body.trim();
  const from = msg.from;

  // 🚫 Skip jika nomor ada di excluded
  if (EXCLUDED_NUMBERS.includes(from)) {
    console.log("Chat dilewati dari:", from);
    return;
  }

  // --- MENU UTAMA ---
  if (chat === "menu" || chat === "0") {
    userState[from] = "menu";
    return msg.reply(menuUtama);
  }

  // --- PILIH MENU UTAMA ---
  if (chat === "1" && userState[from] === "menu") {
    userState[from] = "topup";
    return msg.reply(menuTopUp);
  }
  if (chat === "2" && userState[from] === "menu") {
    userState[from] = "pesan";
    return msg.reply(menuPesanPribadi);
  }

  // --- SUB MENU TOP UP ---
  if (userState[from] === "topup") {
    if (["1","2","3","4","5","6"].includes(chat)) {
      const nominal = ["150","200","300","500","1/2","1"][parseInt(chat)-1];
      userState[from] = "menu";
      return msg.reply(`✅ TOP UP ${nominal} diproses. Terima kasih!`);
    }
    if (chat === "0") {
      userState[from] = "menu";
      return msg.reply(menuUtama);
    }
  }

  // --- SUB MENU PESAN PRIBADI ---
  if (userState[from] === "pesan") {
    if (chat === "1") return msg.reply("📌 Bon dicatat.");
    if (chat === "2") return msg.reply("📌 Gadai dicatat.");
    if (chat === "3") return msg.reply("📌 HP dicatat.");
    if (chat === "4") return msg.reply("📌 Barang lain dicatat.");
    if (chat === "5") return msg.reply("📞 Permintaan telepon admin dikirim.");
    if (chat === "0") {
      userState[from] = "menu";
      return msg.reply(menuUtama);
    }
  }

  // --- ADMIN IZIN / TOLAK TELEPON ---
  if (from === ADMIN) {
    if (chat.startsWith("IZIN ")) {
      const nomor = chat.replace("IZIN ", "").trim() + "@c.us";
      if (!IZIN_TELEPON.includes(nomor)) IZIN_TELEPON.push(nomor);
      client.sendMessage(nomor, "✅ Kamu diizinkan telepon admin.");
      return msg.reply(`Nomor ${nomor} diizinkan telepon.`);
    }
    if (chat.startsWith("TOLAK ")) {
      const nomor = chat.replace("TOLAK ", "").trim() + "@c.us";
      IZIN_TELEPON = IZIN_TELEPON.filter((n) => n !== nomor);
      client.sendMessage(nomor, "❌ Izin telepon admin dicabut.");
      return msg.reply(`Nomor ${nomor} ditolak telepon.`);
    }
  }
});

// ================= HANDLER PANGGILAN =================
client.on("call", async (call) => {
  if (EXCLUDED_NUMBERS.includes(call.from)) {
    console.log("Panggilan dilewati (dikecualikan):", call.from);
    return;
  }

  if (!IZIN_TELEPON.includes(call.from)) {
    await call.reject();
    client.sendMessage(
      call.from,
      "❌ Maaf, panggilan ke admin tidak diizinkan.\nKetik 2 > 5 untuk minta izin telepon."
    );
    console.log("Panggilan ditolak dari:", call.from);
  } else {
    console.log("Panggilan diizinkan dari:", call.from);
  }
});

// Jalankan bot
client.initialize();
