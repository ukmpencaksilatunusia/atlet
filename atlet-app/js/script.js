// URL BACKEND (Paste URL Script Google kamu di bawah ini)
const ENDPOINT_URL = "https://script.google.com/macros/s/AKfycbzhnJI4xolJJi7x9cWHCqKZhIyrrqK7Uf64VvdNBVMwWFx-gmayna2rUAcsSKDpORAPqw/exec";

document.addEventListener("DOMContentLoaded", function() {
    
    // --- LOGIKA LOGIN ---
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", function(e) {
            e.preventDefault();
            
            // Ubah tombol jadi "Loading..."
            const btn = document.querySelector(".btn");
            const originalText = btn.innerText;
            btn.innerText = "Memproses...";
            btn.disabled = true;

            const user = document.getElementById("username").value;
            const pass = document.getElementById("password").value;

            // Kirim data ke Google Sheets
            fetch(ENDPOINT_URL, {
                method: "POST",
                body: JSON.stringify({
                    action: "login",
                    username: user,
                    password: pass
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === "sukses") {
                    alert("Selamat datang, " + data.nama);
                    
                    // Simpan data user di memori browser (Local Storage)
                    localStorage.setItem("user_nama", data.nama);
                    localStorage.setItem("user_role", data.role);

                    // Redirect sesuai Role
                    if (data.role === "admin") {
                        window.location.href = "admin.html";
                    } else {
                        window.location.href = "atlet.html";
                    }
                } else {
                    alert("Username atau Password salah!");
                    btn.innerText = originalText;
                    btn.disabled = false;
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert("Gagal terhubung ke server.");
                btn.innerText = originalText;
                btn.disabled = false;
            });
        });
    }

    // --- LOGIKA HALAMAN ADMIN/ATLET (Cek Session) ---
    // Kode ini mencegah orang masuk admin.html tanpa login
    const path = window.location.pathname;
    if (path.includes("admin.html") || path.includes("atlet.html")) {
        const role = localStorage.getItem("user_role");
        if (!role) {
            alert("Anda harus login dulu!");
            window.location.href = "login.html";
        }
    }
});

// ==========================================
// LOGIKA KHUSUS HALAMAN ADMIN
// ==========================================

// Cek apakah kita sedang di halaman admin.html
if (window.location.pathname.includes("admin.html")) {
    
    // 1. Tampilkan Nama Admin dari LocalStorage
    const adminName = localStorage.getItem("user_nama");
    if (adminName) {
        document.getElementById("adminNameDisplay").innerText = "Halo, " + adminName;
    }

    // 2. Setup Grafik (Dummy Data Dulu)
    const ctx = document.getElementById('performanceChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
            datasets: [{
                label: 'Rata-rata VO2 Max Tim',
                data: [45, 46, 48, 47, 50, 52],
                borderColor: '#0056b3',
                tension: 0.3,
                fill: false
            }, {
                label: 'Target',
                data: [50, 50, 50, 50, 50, 50],
                borderColor: '#ff4d4d',
                borderDash: [5, 5],
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // 3. Set Default Tanggal di Input QR
    const today = new Date();
    const dateStr = today.getDate() + "/" + (today.getMonth()+1) + "/" + today.getFullYear();
    document.getElementById("sessionName").value = "Latihan " + dateStr;
}

// Fungsi Generate QR Code
function generateQR() {
    const text = document.getElementById("sessionName").value;
    const qrContainer = document.getElementById("qrcode");
    
    if (text.trim() === "") {
        alert("Nama sesi tidak boleh kosong!");
        return;
    }

    // Bersihkan QR lama jika ada
    qrContainer.innerHTML = "";
    
    // Buat QR Baru
    new QRCode(qrContainer, {
        text: text, // Inilah text yang nanti discan oleh HP Atlet
        width: 150,
        height: 150
    });
}

// Fungsi Logout Global
function logout() {
    if(confirm("Yakin ingin keluar?")) {
        localStorage.clear();
        window.location.href = "login.html";
    }
}

// ==========================================
// LOGIKA KHUSUS HALAMAN ATLET
// ==========================================

if (window.location.pathname.includes("atlet.html")) {
    
    // 1. Tampilkan Nama
    const atletName = localStorage.getItem("user_nama");
    if (atletName) {
        document.getElementById("atletNameDisplay").innerText = "Halo, " + atletName;
    }

    // 2. Inisialisasi Scanner
    // Kita gunakan onScanSuccess sebagai fungsi callback saat QR terbaca
    function onScanSuccess(decodedText, decodedResult) {
        // Hentikan suara/scan agar tidak double input
        html5QrcodeScanner.clear();
        
        const resultDiv = document.getElementById("scanResult");
        const statusText = document.getElementById("scanStatus");
        
        statusText.innerText = "Memproses data...";
        
        // KIRIM KE GOOGLE SHEETS
        fetch(ENDPOINT_URL, {
            method: "POST",
            body: JSON.stringify({
                action: "absen",
                nama: atletName, // Ambil nama dari login
                sesi: decodedText // Isi QR Code (Misal: 'Latihan Pagi')
            })
        })
        .then(response => response.json())
        .then(data => {
            if(data.status === "sukses") {
                resultDiv.innerHTML = `✅ <strong>Berhasil!</strong><br>Absensi sesi: "${decodedText}" telah tercatat.`;
                resultDiv.className = "success-anim";
                statusText.innerText = "Selesai.";
                
                // Refresh halaman otomatis setelah 3 detik agar bisa scan lagi nanti jika perlu
                setTimeout(() => {
                    window.location.reload();
                }, 3000);
            }
        })
        .catch(err => {
            alert("Gagal koneksi ke server.");
            window.location.reload();
        });
    }

    function onScanFailure(error) {
        // Biarkan kosong agar tidak spam console log saat kamera mencari QR
    }

    // Jalankan Scanner
    let html5QrcodeScanner = new Html5QrcodeScanner(
        "reader", 
        { fps: 10, qrbox: {width: 250, height: 250} },
        /* verbose= */ false
    );
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
}

// ==========================================
// LOGIKA KHUSUS HALAMAN INDEX (PENGUMUMAN)
// ==========================================
if (window.location.pathname.endsWith("index.html") || window.location.pathname === "/" || window.location.pathname.endsWith("/")) {
    
    const listDiv = document.getElementById("pengumuman-list");
    if(listDiv) {
        listDiv.innerHTML = "<p>Memuat pengumuman...</p>";
        
        fetch(ENDPOINT_URL, {
            method: "POST",
            body: JSON.stringify({ action: "getPengumuman" })
        })
        .then(res => res.json())
        .then(response => {
            if (response.status === "sukses" && response.data.length > 0) {
                listDiv.innerHTML = ""; // Bersihkan loading
                response.data.forEach(item => {
                    // Konversi format tanggal jika perlu, atau tampilkan mentah
                    let tgl = new Date(item.tanggal).toLocaleDateString("id-ID");
                    
                    let html = `
                        <div class="announcement">
                            <h3>${item.judul}</h3>
                            <p>${item.isi}</p>
                            <small>📅 ${tgl}</small>
                        </div>
                    `;
                    listDiv.innerHTML += html;
                });
            } else {
                listDiv.innerHTML = "<p>Belum ada pengumuman.</p>";
            }
        });
    }
}