// ============================================================
// KONFIGURASI UTAMA
// ============================================================
const ENDPOINT_URL = "https://script.google.com/macros/s/AKfycbzhnJI4xolJJi7x9cWHCqKZhIyrrqK7Uf64VvdNBVMwWFx-gmayna2rUAcsSKDpORAPqw/exec";

// ============================================================
// FUNGSI GLOBAL (Bisa dipanggil dari tombol HTML manapun)
// ============================================================

// 1. Fungsi Logout
function logout() {
    if(confirm("Yakin ingin keluar?")) {
        localStorage.clear();
        window.location.href = "login.html";
    }
}

// 2. Fungsi Generate QR (Khusus Admin)
function generateQR() {
    const inputSesi = document.getElementById("sessionName");
    const qrContainer = document.getElementById("qrcode");
    
    if (!inputSesi || !qrContainer) return; // Cegah error jika elemen tidak ada

    const text = inputSesi.value;
    if (text.trim() === "") {
        alert("Nama sesi tidak boleh kosong!");
        return;
    }

    // Bersihkan QR lama
    qrContainer.innerHTML = "";
    
    // Buat QR Baru
    new QRCode(qrContainer, {
        text: text,
        width: 150,
        height: 150
    });
}

// ============================================================
// LOGIKA SAAT HALAMAN DIMUAT (DOMContentLoaded)
// ============================================================
document.addEventListener("DOMContentLoaded", function() {
    
    const path = window.location.pathname;

    // --- CEK SESI LOGIN (Proteksi Halaman) ---
    if (path.includes("admin.html") || path.includes("atlet.html")) {
        const role = localStorage.getItem("user_role");
        if (!role) {
            alert("Anda harus login dulu!");
            window.location.href = "login.html";
            return; // Stop eksekusi script di bawahnya
        }
    }

    // ==========================================
    // 1. HALAMAN LOGIN (login.html)
    // ==========================================
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", function(e) {
            e.preventDefault();
            
            const btn = document.querySelector(".btn");
            const originalText = btn.innerText;
            btn.innerText = "Memproses...";
            btn.disabled = true;

            const user = document.getElementById("username").value;
            const pass = document.getElementById("password").value;

            fetch(ENDPOINT_URL, {
                method: "POST",
                body: JSON.stringify({ action: "login", username: user, password: pass })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === "sukses") {
                    localStorage.setItem("user_nama", data.nama);
                    localStorage.setItem("user_role", data.role);
                    alert("Selamat datang, " + data.nama);
                    
                    if (data.role === "admin") window.location.href = "admin.html";
                    else window.location.href = "atlet.html";
                } else {
                    alert("Username atau Password salah!");
                    btn.innerText = originalText;
                    btn.disabled = false;
                }
            })
            .catch(err => {
                console.error(err);
                alert("Gagal koneksi server.");
                btn.innerText = originalText;
                btn.disabled = false;
            });
        });
    }

    // ==========================================
    // 2. HALAMAN PENDAFTARAN (daftar_atlet.html)
    // ==========================================
    const daftarForm = document.getElementById("daftarForm");
    if (daftarForm) {
        daftarForm.addEventListener("submit", function(e){
            e.preventDefault();
            
            const btn = document.querySelector("button[type=submit]");
            const originalText = btn.innerText;
            btn.innerText = "Mendaftarkan...";
            btn.disabled = true;

            const data = {
                action: "daftar",
                nama: document.getElementById("regNama").value,
                cabor: document.getElementById("regCabor").value,
                username: document.getElementById("regUser").value,
                password: document.getElementById("regPass").value
            };

            fetch(ENDPOINT_URL, {
                method: "POST",
                body: JSON.stringify(data)
            })
            .then(res => res.json())
            .then(d => {
                if(d.status === "sukses") {
                    alert("Pendaftaran Berhasil! Silakan Login.");
                    window.location.href = "login.html";
                } else {
                    alert("Gagal: " + d.pesan);
                    btn.innerText = originalText;
                    btn.disabled = false;
                }
            })
            .catch(err => {
                alert("Terjadi kesalahan sistem.");
                btn.innerText = originalText;
                btn.disabled = false;
            });
        });
    }

    // ==========================================
    // 3. HALAMAN ADMIN (admin.html)
    // ==========================================
    if (path.includes("admin.html")) {
        // Tampilkan Nama
        const adminName = localStorage.getItem("user_nama");
        if (adminName) document.getElementById("adminNameDisplay").innerText = "Halo, " + adminName;

        // Set Default Input QR
        const today = new Date();
        const dateStr = today.getDate() + "/" + (today.getMonth()+1) + "/" + today.getFullYear();
        const sessionInput = document.getElementById("sessionName");
        if(sessionInput) sessionInput.value = "Latihan " + dateStr;

        // Setup Grafik
        const ctx = document.getElementById('performanceChart');
        if (ctx) {
            const chartContext = ctx.getContext('2d');
            let myChart;

            function initChart(labels, dataValues) {
                if (myChart) myChart.destroy();
                myChart = new Chart(chartContext, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Rata-rata Performa Tim',
                            data: dataValues,
                            borderColor: '#0056b3',
                            backgroundColor: 'rgba(0, 86, 179, 0.1)',
                            tension: 0.3,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: { y: { beginAtZero: true, max: 100 } }
                    }
                });
            }

            fetch(ENDPOINT_URL, {
                method: "POST",
                body: JSON.stringify({ action: "getGrafik" })
            })
            .then(res => res.json())
            .then(response => {
                if (response.status === "sukses") initChart(response.labels, response.values);
                else initChart(["No Data"], [0]);
            });
        }
    }

    // ==========================================
    // 4. HALAMAN ATLET (atlet.html)
    // ==========================================
    if (path.includes("atlet.html")) {
        const atletName = localStorage.getItem("user_nama");
        if (atletName) document.getElementById("atletNameDisplay").innerText = "Halo, " + atletName;

        // Ambil Statistik
        fetch(ENDPOINT_URL, {
            method: "POST",
            body: JSON.stringify({ action: "getStatistikAtlet", nama: atletName })
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === "sukses") {
                const statBox = document.querySelector(".card h1"); 
                const statLabel = document.querySelector(".card h1 + p");
                if(statBox) {
                    statBox.innerText = data.hadir + " Kali";
                    statBox.style.color = "#28a745";
                    statLabel.innerText = "Total Kehadiran Latihan";
                }
            }
        });

        // Setup Scanner
        if(document.getElementById("reader")) {
            function onScanSuccess(decodedText, decodedResult) {
                html5QrcodeScanner.clear(); // Stop scan agar tidak double
                
                const resultDiv = document.getElementById("scanResult");
                const statusText = document.getElementById("scanStatus");
                
                statusText.innerText = "Memproses data...";
                
                fetch(ENDPOINT_URL, {
                    method: "POST",
                    body: JSON.stringify({ action: "absen", nama: atletName, sesi: decodedText })
                })
                .then(response => response.json())
                .then(data => {
                    if(data.status === "sukses") {
                        resultDiv.innerHTML = `✅ <strong>Berhasil!</strong><br>Absensi sesi: "${decodedText}" tercatat.`;
                        resultDiv.className = "success-anim";
                        statusText.innerText = "Selesai.";
                        setTimeout(() => window.location.reload(), 3000);
                    }
                })
                .catch(err => {
                    alert("Gagal koneksi.");
                    window.location.reload();
                });
            }
    
            let html5QrcodeScanner = new Html5QrcodeScanner(
                "reader", { fps: 10, qrbox: {width: 250, height: 250} }, false
            );
            html5QrcodeScanner.render(onScanSuccess, (err) => {});
        }
    }

    // ==========================================
    // 5. HALAMAN HOME (index.html)
    // ==========================================
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
                listDiv.innerHTML = "";
                response.data.forEach(item => {
                    let tgl = new Date(item.tanggal).toLocaleDateString("id-ID");
                    listDiv.innerHTML += `
                        <div class="announcement">
                            <h3>${item.judul}</h3>
                            <p>${item.isi}</p>
                            <small>📅 ${tgl}</small>
                        </div>`;
                });
            } else {
                listDiv.innerHTML = "<p>Belum ada pengumuman.</p>";
            }
        });
    }

});