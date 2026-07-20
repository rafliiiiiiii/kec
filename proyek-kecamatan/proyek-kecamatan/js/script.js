  const KATEGORI = {
    masuk: ["Retribusi Surat", "Retribusi Pasar", "Sumbangan/Hibah", "Lain-lain Pemasukan"],
    keluar: ["ATK & Percetakan", "Konsumsi Kegiatan", "Transport Dinas", "Pemeliharaan Fasilitas", "Lain-lain Pengeluaran"]
  };

  let jenisAktif = "masuk";
  let transaksi = [
    { tgl: "2026-07-02", jenis: "masuk", kategori: "Retribusi Surat", ket: "Retribusi surat domisili & KTP", jumlah: 450000 },
    { tgl: "2026-07-05", jenis: "keluar", kategori: "ATK & Percetakan", ket: "Kertas dan tinta printer", jumlah: 320000 },
    { tgl: "2026-07-09", jenis: "masuk", kategori: "Retribusi Pasar", ket: "Retribusi pasar mingguan", jumlah: 1200000 },
    { tgl: "2026-07-12", jenis: "keluar", kategori: "Konsumsi Kegiatan", ket: "Konsumsi rapat koordinasi", jumlah: 275000 },
    { tgl: "2026-07-15", jenis: "keluar", kategori: "Transport Dinas", ket: "Transport survei lapangan", jumlah: 180000 },
  ];

  const fmt = n => "Rp" + n.toLocaleString("id-ID");

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
    const tgl = document.getElementById("tgl").value;
    const jumlah = parseInt(document.getElementById("jumlah").value, 10);
    const kategori = document.getElementById("kategori").value;
    const ket = document.getElementById("ket").value.trim();

    if(!tgl || !jumlah || jumlah <= 0 || !ket){
      alert("Lengkapi tanggal, jumlah, dan keterangan terlebih dahulu.");
      return;
    }

    transaksi.push({ tgl, jenis: jenisAktif, kategori, ket, jumlah });
    document.getElementById("jumlah").value = "";
    document.getElementById("ket").value = "";
    render();
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
  render();
