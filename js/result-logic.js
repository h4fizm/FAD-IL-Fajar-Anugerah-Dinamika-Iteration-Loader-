document.addEventListener("DOMContentLoaded", function () {
  // --- 1. PENGAMBILAN & VALIDASI DATA ---
  const dataString = localStorage.getItem("fullCycleReportData");

  if (!dataString) {
    Swal.fire({
      icon: "error",
      title: "Data Tidak Ditemukan",
      text: "Silakan jalankan proses monitoring terlebih dahulu.",
      showConfirmButton: false,
      timer: 2500,
    }).then(() => {
      window.location.href = "index2.html"; // Redirect ke halaman awal
    });
    return;
  }

  const data = JSON.parse(dataString);

  // --- 2. EKSTRAKSI DATA UNTUK MEMUDAHKAN ---
  const initialData = data.initialData;
  const loaderSessions = data.cycleTime.loader || {};
  const haulerSessions = data.cycleTime.hauler || {};

  const jumlahSesiLoader = Object.keys(loaderSessions).length;
  const jumlahSesiHauler = Object.keys(haulerSessions).length;

  const allLoaderProcesses = Object.values(loaderSessions).flatMap(
    (session) => session.processes
  );

  // --- 3. FUNGSI BANTUAN (HELPERS) ---
  const calculateAverageProcessTime = (processName) => {
    const relevantProcesses = allLoaderProcesses.filter(
      (p) => p.name.toUpperCase() === processName.toUpperCase()
    );
    if (relevantProcesses.length === 0) return 0;
    const totalTime = relevantProcesses.reduce((sum, p) => sum + p.time, 0);
    return totalTime / relevantProcesses.length;
  };

  // --- 4. PERHITUNGAN SEMUA 12 POIN ---

  // ##### PERBAIKAN DIMULAI DI SINI #####
  // POIN 1 & 2: Informasi Umum
  // Mencoba beberapa kemungkinan nama key dari form awal
  const perhitunganCount = jumlahSesiLoader;
  const namaUnit = initialData.unit || initialData.unit_loader || "N/A";
  const jenisMaterial =
    initialData.material || initialData.jenis_material || "N/A";
  const namaOperator =
    initialData.operator || initialData.nama_operator || "N/A";

  // POIN 3: Rata-rata Jumlah Passing
  const totalDumps = allLoaderProcesses.filter(
    (p) => p.name.toUpperCase() === "BUCKET DUMP"
  ).length;
  const rataRataPassing =
    jumlahSesiLoader > 0 ? Math.round(totalDumps / jumlahSesiLoader) : 0;

  // POIN 4: Rata-rata Waktu Proses Loader
  const avgDiggingMs = calculateAverageProcessTime("DIGGING");
  const avgSwingLoadMs = calculateAverageProcessTime("SWING LOAD");
  const avgBucketDumpMs = calculateAverageProcessTime("BUCKET DUMP");
  const avgSwingEmptyMs = calculateAverageProcessTime("SWING EMPTY");
  const avgSpottingMs = calculateAverageProcessTime("SPOTTING");

  // POIN 5 & 6: Rata-rata Cycle Time & Loading Time Loader
  const totalCycleTimeLoaderMs = Object.values(loaderSessions).reduce(
    (sum, session) => sum + session.totalTime,
    0
  );
  const avgCycleTimeLoaderMs =
    jumlahSesiLoader > 0 ? totalCycleTimeLoaderMs / jumlahSesiLoader : 0;
  const avgLoadingTimeMin = avgCycleTimeLoaderMs / 1000 / 60;

  // POIN 7: Informasi Hauler
  // Mencoba beberapa kemungkinan nama key dari form awal
  const jarakDumping = parseFloat(
    initialData.jarak || initialData.jarak_dumping || 0
  );
  const jumlahHauler = parseFloat(
    initialData.jumlahHauler || initialData.jumlah_hauler || 0
  );
  // ##### PERBAIKAN SELESAI DI SINI #####

  // POIN 8: Rata-rata Cycle Time Hauler
  const totalCycleTimeHaulerMs = Object.values(haulerSessions).reduce(
    (sum, session) => sum + session.totalTime,
    0
  );
  const avgCycleTimeHaulerMs =
    jumlahSesiHauler > 0 ? totalCycleTimeHaulerMs / jumlahSesiHauler : 0;
  const avgCycleTimeHaulerMin = avgCycleTimeHaulerMs / 1000 / 60;

  // POIN 9: Rata-rata Kecepatan Hauler
  const jarakKm = jarakDumping / 1000;
  const avgCycleTimeHaulerJam = avgCycleTimeHaulerMin / 60;
  const avgKecepatanHauler =
    avgCycleTimeHaulerJam > 0 ? (2 * jarakKm) / avgCycleTimeHaulerJam : 0;

  // POIN 10: Matching Fleet
  const matchingFleet =
    avgCycleTimeHaulerMin > 0
      ? (jumlahHauler * avgLoadingTimeMin) / avgCycleTimeHaulerMin
      : 0;

  // POIN 11: Proyeksi Produktivitas
  const proyeksiProdty =
    avgLoadingTimeMin > 0 ? Math.round(60 / avgLoadingTimeMin) : 0;

  // --- 5. TAMPILKAN HASIL KE HTML ---
  document.getElementById(
    "perhitungan-count"
  ).textContent = `Perhitungan (${perhitunganCount} kali)`;
  document.getElementById("nama-unit").textContent = `: ${namaUnit}`;
  document.getElementById("jenis-material").textContent = `: ${jenisMaterial}`;
  document.getElementById("nama-operator").textContent = `: ${namaOperator}`;

  document.getElementById("rata-passing").textContent = `: ${rataRataPassing}`;
  document.getElementById("rata-digging").textContent = `: ${(
    avgDiggingMs / 1000
  ).toFixed(2)} detik`;
  document.getElementById("rata-swing-load").textContent = `: ${(
    avgSwingLoadMs / 1000
  ).toFixed(2)} detik`;
  document.getElementById("rata-bucket-dump").textContent = `: ${(
    avgBucketDumpMs / 1000
  ).toFixed(2)} detik`;
  document.getElementById("rata-swing-empty").textContent = `: ${(
    avgSwingEmptyMs / 1000
  ).toFixed(2)} detik`;
  document.getElementById("rata-spotting").textContent = `: ${(
    avgSpottingMs / 1000
  ).toFixed(2)} detik`;
  document.getElementById("rata-cycletime-loader").textContent = `: ${(
    avgCycleTimeLoaderMs / 1000
  ).toFixed(2)} detik`;
  document.getElementById(
    "rata-loadingtime"
  ).textContent = `: ${avgLoadingTimeMin.toFixed(2)} menit`;

  document.getElementById(
    "jarak-dumping"
  ).textContent = `: ${jarakDumping} meter`;
  document.getElementById(
    "jumlah-hauler"
  ).textContent = `: ${jumlahHauler} Unit`;
  document.getElementById("rata-cycletime-hauler").textContent = `: ${
    avgCycleTimeHaulerMin > 0 ? avgCycleTimeHaulerMin.toFixed(2) : "0.00"
  } menit`;
  document.getElementById("rata-kecepatan-hauler").textContent = `: ${
    avgKecepatanHauler > 0 ? avgKecepatanHauler.toFixed(2) : "0.00"
  } km/jam`;

  document.getElementById("matching-fleet").textContent =
    matchingFleet > 0 ? matchingFleet.toFixed(2) : "0.00";
  document.getElementById(
    "proyeksi-produktivitas"
  ).innerHTML = `${proyeksiProdty} <span class="text-base">Ritase</span>`;

  // --- 6. EVENT LISTENERS ---
  document.getElementById("btn-ulangi").addEventListener("click", (e) => {
    e.preventDefault();
    Swal.fire({
      title: "Ulangi Proses?",
      text: "Data monitoring saat ini akan dihapus dan Anda akan kembali ke halaman timer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#38A169",
      cancelButtonColor: "#E53E3E",
      confirmButtonText: "Ya, Ulangi!",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("fullCycleReportData");
        window.location.href = e.target.href;
      }
    });
  });

  document.getElementById("btn-selesai").addEventListener("click", () => {
    // localStorage.clear();
  });
});
