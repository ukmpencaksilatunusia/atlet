// ============================================================
// KONFIGURASI UTAMA
// ============================================================
// PASTE URL DEPLOYMENT BARU ANDA DI SINI
const ENDPOINT_URL = "https://script.google.com/macros/s/AKfycbzhnJI4xolJJi7x9cWHCqKZhIyrrqK7Uf64VvdNBVMwWFx-gmayna2rUAcsSKDpORAPqw/exec";

// ============================================================
// FUNGSI GLOBAL
// ============================================================

function logout() {
    if(confirm("Yakin ingin keluar?")) {
        localStorage.clear();
        window.location.href = "login.html";
    }
}

function generateQR() {
    const inputSesi = document.getElementById("sessionName");
    const qrContainer = document.getElementById("qrcode");
    
    if (!inputSesi || !qrContainer) return;

    const text = inputSesi.value;
    if (text.trim() === "") {
        alert("Nama sesi tidak boleh kosong!");
        return;
    }
    qrContainer.innerHTML = "";
    new QRCode(qrContainer, { text: text, width: 150, height: 150 });
}

// ============================================================
// LOGIKA SAAT HALAMAN DIMUAT
// ============================================================
document.addEventListener("DOMContentLoaded", function() {
    
    const path = window.location.pathname;

    // --- CEK SESI LOGIN ---
    if (path.includes("admin.html") || path.includes("atlet.html")) {
        const role = localStorage.getItem("user_role");
        if (!role) {
            alert("Anda harus login dulu!");
            window.location.href = "login.html";
            return;
        }
    }

    // ==========================================
    // 1. HALAMAN LOGIN
    // ==========================================
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", function(e) {
            e.preventDefault();
            const btn = document.querySelector(".btn");
            const originalText = btn.innerText;
            btn.innerText = "Memproses..."; btn.disabled = true;

            fetch(ENDPOINT_URL, {
                method: "POST",
                body: JSON.stringify({ 
                    action: "login", 
                    username: document.getElementById("username").value, 
                    password: document.getElementById("password").value 
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === "sukses") {
                    localStorage.setItem("user_nama", data.nama);
                    localStorage.setItem("user_role", data.role);
                    alert("Selamat datang, " + data.nama);
                    if (data.role === "admin") window.location.href = "admin.html";
                    else window.location.href = "atlet.html";
                } else {
                    alert("Username/Password salah!");
                    btn.innerText = originalText; btn.disabled = false;
                }
            })
            .catch(err => { alert("Error Server"); btn.innerText = originalText; btn.disabled = false; });
        });
    }

    // ==========================================
    // 2. HALAMAN PENDAFTARAN
    // ==========================================
    const daftarForm = document.getElementById("daftarForm");
    if (daftarForm) {
        daftarForm.addEventListener("submit", function(e){
            e.preventDefault();
            const btn = document.querySelector("button[type=submit]");
            btn.innerText = "Mendaftarkan..."; btn.disabled = true;

            fetch(ENDPOINT_URL, {
                method: "POST",
                body: JSON.stringify({
                    action: "daftar",
                    nama: document.getElementById("regNama").value,
                    cabor: document.getElementById("regCabor").value,
                    username: document.getElementById("regUser").value,
                    password: document.getElementById("regPass").value
                })
            })
            .then(res => res.json())
            .then(d => {
                if(d.status === "sukses") {
                    alert("Berhasil! Silakan Login.");
                    window.location.href = "login.html";
                } else {
                    alert("Gagal: " + d.pesan);
                    btn.innerText = "DAFTAR"; btn.disabled = false;
                }
            });
        });
    }

    // ==========================================
    // 3. HALAMAN ADMIN (LENGKAP)
    // ==========================================
    if (path.includes("admin.html")) {
        const adminName = localStorage.getItem("user_nama");
        if (adminName) document.getElementById("adminNameDisplay").innerText = "Halo, " + adminName;

        // A. Set Default Tanggal
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0]; // Format YYYY-MM-DD untuk input date
        const prettyDate = today.getDate() + "/" + (today.getMonth()+1) + "/" + today.getFullYear();
        
        const sessInput = document.getElementById("sessionName");
        if(sessInput) sessInput.value = "Latihan " + prettyDate;
        
        const dateInput = document.getElementById("inputTanggal");
        if(dateInput) dateInput.value = dateStr;

        document.getElementById("todayDisplay").innerText = prettyDate;

        // B. Load Dropdown Nama Atlet
        const selectAtlet = document.getElementById("inputNamaAtlet");
        if(selectAtlet) {
            fetch(ENDPOINT_URL, {
                method: "POST",
                body: JSON.stringify({ action: "getDaftarAtlet" })
            })
            .then(res => res.json())
            .then(data => {
                if(data.status === "sukses") {
                    selectAtlet.innerHTML = ""; // Hapus loading
                    document.getElementById("totalUserDisplay").innerText = data.data.length + " Atlet";
                    data.data.forEach(nama => {
                        let option = document.createElement("option");
                        option.text = nama;
                        option.value = nama;
                        selectAtlet.add(option);
                    });
                }
            });
        }

        // C. Setup Grafik
        const ctx = document.getElementById('performanceChart');
        let myChart;

        function loadGrafik() {
            fetch(ENDPOINT_URL, {
                method: "POST",
                body: JSON.stringify({ action: "getGrafik" })
            })
            .then(res => res.json())
            .then(response => {
                if (response.status === "sukses") {
                    if (myChart) myChart.destroy();
                    myChart = new Chart(ctx.getContext('2d'), {
                        type: 'line',
                        data: {
                            labels: response.labels,
                            datasets: [{
                                label: 'Rata-rata Tim',
                                data: response.values,
                                borderColor: '#0056b3',
                                backgroundColor: 'rgba(0, 86, 179, 0.1)',
                                tension: 0.3, fill: true
                            }]
                        },
                        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } } }
                    });
                }
            });
        }
        if(ctx) loadGrafik(); // Load pertama kali

        // D. Handle Input Nilai (Form Submit)
        const formNilai = document.getElementById("formNilai");
        if(formNilai) {
            formNilai.addEventListener("submit", function(e){
                e.preventDefault();
                const btnSimpan = formNilai.querySelector("button");
                const txtAsli = btnSimpan.innerText;
                btnSimpan.innerText = "Menyimpan..."; btnSimpan.disabled = true;

                fetch(ENDPOINT_URL, {
                    method: "POST",
                    body: JSON.stringify({
                        action: "inputNilai",
                        nama: document.getElementById("inputNamaAtlet").value,
                        tanggal: document.getElementById("inputTanggal").value,
                        nilai: document.getElementById("inputSkor").value
                    })
                })
                .then(res => res.json())
                .then(data => {
                    if(data.status === "sukses") {
                        alert("Data Berhasil Disimpan!");
                        loadGrafik(); // Refresh grafik otomatis
                        document.getElementById("inputSkor").value = ""; // Reset input skor
                    } else {
                        alert("Gagal menyimpan.");
                    }
                    btnSimpan.innerText = txtAsli; btnSimpan.disabled = false;
                });
            });
        }
    }

    // ==========================================
    // 4. HALAMAN ATLET
    // ==========================================
    if (path.includes("atlet.html")) {
        const atletName = localStorage.getItem("user_nama");
        if (atletName) document.getElementById("atletNameDisplay").innerText = "Halo, " + atletName;

        fetch(ENDPOINT_URL, {
            method: "POST",
            body: JSON.stringify({ action: "getStatistikAtlet", nama: atletName })
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === "sukses") {
                const statBox = document.querySelector(".card h1"); 
                if(statBox) statBox.innerText = data.hadir + " Kali";
            }
        });

        if(document.getElementById("reader")) {
            function onScanSuccess(decodedText) {
                html5QrcodeScanner.clear();
                document.getElementById("scanStatus").innerText = "Memproses...";
                
                fetch(ENDPOINT_URL, {
                    method: "POST",
                    body: JSON.stringify({ action: "absen", nama: atletName, sesi: decodedText })
                })
                .then(res => res.json())
                .then(data => {
                    if(data.status === "sukses") {
                        const resultDiv = document.getElementById("scanResult");
                        resultDiv.innerHTML = `✅ <strong>Berhasil!</strong><br>Sesi: "${decodedText}"`;
                        resultDiv.className = "success-anim";
                        setTimeout(() => window.location.reload(), 3000);
                    }
                });
            }
            let html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: {width: 250, height: 250} }, false);
            html5QrcodeScanner.render(onScanSuccess, (err) => {});
        }
    }

    // ==========================================
    // 5. HALAMAN HOME (PENGUMUMAN)
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
