  // GANTI URL INI dengan Web app URL dari Apps Script kamu sendiri
  const API_URL = "https://script.google.com/macros/s/AKfycbxW3pkhWUXThFyhgFO88T-BsH7wVe6Do-F4W_-ZoQCghuXtIiqbMk3uV18CvfmIl91BOg/exec";

  const KATEGORI = {
    masuk: ["Retribusi Surat", "Retribusi Pasar", "Sumbangan/Hibah", "Lain-lain Pemasukan"],
    keluar: ["ATK & Percetakan", "Konsumsi Kegiatan", "Transport Dinas", "Pemeliharaan Fasilitas", "Lain-lain Pengeluaran"]
  };

  let jenisAktif = "masuk";
  let transaksi = []; // sekarang kosong di awal, diisi dari Google Sheets lewat ambilData()

  const fmt = n => "Rp" + n.toLocaleString("id-ID");

  // Ambil semua data transaksi dari Google Sheets
  async function ambilData(){
    const tbody = document.getElementById("tbody");
    tbody.innerHTML = `<tr class="empty-row"><td colspan="4">Memuat data...</td></tr>`;
    try {
      const res = await fetch(API_URL);
      transaksi = await res.json();
    } catch (err) {
      console.error("Gagal mengambil data:", err);
      tbody.innerHTML = `<tr class="empty-row"><td colspan="4">Gagal memuat data. Cek koneksi atau API_URL.</td></tr>`;
      return;
    }
    render();
  }

  // Kirim satu transaksi baru ke Google Sheets
  async function simpanTransaksi(dataBaru){
    const tombol = document.getElementById("btn-tambah");
    tombol.disabled = true;
    tombol.textContent = "Menyimpan...";
    try {
      await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify(dataBaru)
      });
      await ambilData(); // ambil ulang data terbaru setelah berhasil simpan
    } catch (err) {
      console.error("Gagal menyimpan:", err);
      alert("Gagal menyimpan transaksi. Cek koneksi internet dan coba lagi.");
    } finally {
      tombol.disabled = false;
      tombol.textContent = "Simpan transaksi";
    }
  }

  function isiKategoriDropdown(){
    const sel = document.getElementById("kategori");
    sel.innerHTML = KATEGORI[jenisAktif].map(k => `<option>${k}</option>`).join("");
  }

  document.querySelectorAll(".jenis-toggle button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".jenis-toggle button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      jenisAktif = btn.dataset.jenis;
      isiKategoriDropdown();
    });
  });

  document.getElementById("btn-tambah").addEventListener("click", () => {
    const tgl = document.getElementById("Tanggal").value;
    const jumlah = parseInt(document.getElementById("Jumlah").value, 10);
    const kategori = document.getElementById("Kategori").value;
    const ket = document.getElementById("Keterangan").value.trim();

    if(!tgl || !jumlah || jumlah <= 0 || !ket){
      alert("Lengkapi tanggal, jumlah, dan keterangan terlebih dahulu.");
      return;
    }

    simpanTransaksi({ tgl, jenis: jenisAktif, kategori, ket, jumlah });
    document.getElementById("Jumlah").value = "";
    document.getElementById("Keterangan").value = "";
  });

  function render(){
    const sorted = [...transaksi].sort((a,b) => b.tgl.localeCompare(a.tgl));
    const totalMasuk = transaksi.filter(t => t.jenis === "masuk").reduce((s,t) => s+t.jumlah, 0);
    const totalKeluar = transaksi.filter(t => t.jenis === "keluar").reduce((s,t) => s+t.jumlah, 0);

    document.getElementById("total-masuk").textContent = fmt(totalMasuk);
    document.getElementById("total-keluar").textContent = fmt(totalKeluar);
    document.getElementById("total-saldo").textContent = fmt(totalMasuk - totalKeluar);

    // Table
    const tbody = document.getElementById("tbody");
    if(sorted.length === 0){
      tbody.innerHTML = `<tr class="empty-row"><td colspan="4">Belum ada transaksi tercatat.</td></tr>`;
    } else {
      tbody.innerHTML = sorted.map(t => `
        <tr>
          <td>${new Date(t.tgl).toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric" })}</td>
          <td><span class="tag ${t.jenis}">${t.kategori}</span></td>
          <td>${t.ket}</td>
          <td class="amt ${t.jenis}">${t.jenis === "masuk" ? "+" : "−"}${fmt(t.jumlah)}</td>
        </tr>
      `).join("");
    }

    // Chart per kategori (gabungan masuk+keluar, urut nilai terbesar)
    const byKategori = {};
    transaksi.forEach(t => {
      byKategori[t.kategori] = (byKategori[t.kategori] || 0) + t.jumlah;
    });
    const maxVal = Math.max(...Object.values(byKategori), 1);
    const chartBody = document.getElementById("chart-body");
    chartBody.innerHTML = Object.entries(byKategori)
      .sort((a,b) => b[1]-a[1])
      .map(([kat, val]) => `
        <div class="bar-row">
          <div class="cat-label">${kat}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${(val/maxVal*100).toFixed(0)}%"></div></div>
          <div class="cat-value">${fmt(val)}</div>
        </div>
      `).join("");
  }

  isiKategoriDropdown();
  ambilData();
