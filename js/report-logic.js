// File: js/report-logic.js (Final - Hanya Menampilkan Data)
document.addEventListener("DOMContentLoaded", function () {
  const dataString = localStorage.getItem("fullCycleReportData");
  if (!dataString) {
    Swal.fire({
      icon: "error",
      title: "Data Tidak Ditemukan",
      text: "Tidak ada data laporan untuk ditampilkan. Silakan mulai dari awal.",
      confirmButtonText: "Kembali ke Awal",
      allowOutsideClick: false,
    }).then(() => {
      window.location.href = "index.html";
    });
    return;
  }

  const data = JSON.parse(dataString);

  // Validasi jika data hasil kalkulasi belum tersimpan
  if (!data.calculatedResults) {
    Swal.fire({
      icon: "error",
      title: "Data Tidak Lengkap",
      text: "Hasil kalkulasi tidak ditemukan. Harap ulangi dari halaman resume.",
      confirmButtonText: "Kembali",
    }).then(() => {
      window.location.href = "index3.html";
    });
    return;
  }

  // --- AMBIL DATA YANG SUDAH JADI DARI LOCALSTORAGE ---
  const initialData = data.initialData;
  const results = data.calculatedResults; // Ambil semua hasil perhitungan yang sudah matang
  const analisa = data.analisaProblem;

  // --- HAPUS BLOK PERHITUNGAN ULANG ---
  // Semua kode dari 'const namaUnit = ...' sampai 'const proyeksiProdty = ...'
  // telah dihapus karena tidak diperlukan lagi.

  // --- TAMPILKAN DATA KE HTML (MENGGUNAKAN VARIABEL BARU) ---
  document.getElementById(
    "report-date"
  ).textContent = `${data.pengajuan.hari}, ${data.pengajuan.tanggal}`;
  document.getElementById("data-nama-unit").textContent =
    initialData.unit_loader || "N/A";
  document.getElementById("data-jenis-material").textContent =
    initialData.jenis_material || "N/A";
  document.getElementById("data-nama-operator").textContent =
    initialData.nama_operator || "N/A";
  document.getElementById("data-observer").textContent =
    initialData.observer || "N/A";
  document.getElementById(
    "data-sesi-loader"
  ).textContent = `${results.perhitunganCount} kali`;

  document.getElementById(
    "data-rata-passing"
  ).textContent = `${results.rataRataPassing.toFixed(1)} passing`;
  document.getElementById("data-rata-digging").textContent = `${(
    results.avgDiggingMs / 1000
  ).toFixed(2)} detik`;
  document.getElementById("data-rata-swing-load").textContent = `${(
    results.avgSwingLoadMs / 1000
  ).toFixed(2)} detik`;
  document.getElementById("data-rata-bucket-dump").textContent = `${(
    results.avgBucketDumpMs / 1000
  ).toFixed(2)} detik`;
  document.getElementById("data-rata-swing-empty").textContent = `${(
    results.avgSwingEmptyMs / 1000
  ).toFixed(2)} detik`;
  document.getElementById("data-rata-spotting").textContent = `${(
    results.avgSpottingMs / 1000
  ).toFixed(2)} detik`;
  document.getElementById("data-rata-cycletime-loader").textContent = `${(
    results.avgCycleTimeLoaderMs / 1000
  ).toFixed(2)} detik`;
  document.getElementById(
    "data-rata-loadingtime"
  ).textContent = `${results.avgLoadingTimeMin.toFixed(2)} menit`;

  document.getElementById(
    "data-jarak-dumping"
  ).textContent = `${initialData.jarak_dumping} meter`;
  document.getElementById(
    "data-jumlah-hauler"
  ).textContent = `${initialData.jumlah_hauler} Unit`;
  document.getElementById(
    "data-rata-cycletime-hauler"
  ).textContent = `${results.avgCycleTimeHaulerMin.toFixed(2)} menit`;
  document.getElementById(
    "data-rata-kecepatan-hauler"
  ).textContent = `${results.avgKecepatanHauler.toFixed(2)} km/jam`;
  document.getElementById("data-matching-fleet").textContent =
    results.matchingFleet.toFixed(2);
  document.getElementById(
    "data-proyeksi-produktivitas"
  ).textContent = `${Math.round(results.proyeksiProdty)} Ritase`;

  // Menampilkan data analisa masalah
  const formatAnalysis = (arr) => {
    if (!arr || arr.length === 0) return "Nihil";
    return arr.length === 1 &&
      (arr[0] === "-KOSONG-" || arr[0].includes("Nihil"))
      ? "Nihil"
      : arr.join("; ");
  };
  document.getElementById("data-man").textContent = formatAnalysis(analisa.man);
  document.getElementById("data-machine").textContent = formatAnalysis(
    analisa.machine
  );
  document.getElementById("data-material").textContent = formatAnalysis(
    analisa.material
  );
  document.getElementById("data-method").textContent = formatAnalysis(
    analisa.method
  );
  document.getElementById("data-environment").textContent = formatAnalysis(
    analisa.environment
  );
  document.getElementById("data-remaks").textContent = analisa.remaks;

  // Tombol Mulai Sesi Baru
  document
    .getElementById("btn-start-new")
    .addEventListener("click", function (e) {
      e.preventDefault();
      Swal.fire({
        title: "Mulai Sesi Baru?",
        text: "Semua data monitoring saat ini akan dihapus.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#38A169",
        cancelButtonColor: "#d33",
        confirmButtonText: "Ya, Mulai Baru!",
        cancelButtonText: "Batal",
      }).then((result) => {
        if (result.isConfirmed) {
          localStorage.clear();
          window.location.href = "index.html";
        }
      });
    });
});
