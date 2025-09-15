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
      window.location.href = "index2.html";
    });
    return;
  }

  const data = JSON.parse(dataString);

  // --- 2. EKSTRAKSI DATA UNTUK MEMUDAHKAN ---
  const initialData = data.initialData;
  const loaderSessions = data.cycleTime.loader || {};
  const haulerSessions = data.cycleTime.hauler || {};
  const loaderSessionValues = Object.values(loaderSessions);
  const haulerSessionValues = Object.values(haulerSessions);

  const jumlahSesiLoader = loaderSessionValues.length;
  const jumlahSesiHauler = haulerSessionValues.length;

  const allLoaderProcesses = loaderSessionValues.flatMap(
    (session) => session.processes
  );

  // Menambahkan perhitungan untuk sesi hauler
  const allHaulerProcesses = haulerSessionValues.flatMap(
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

  // Fungsi untuk memformat milidetik ke 'menit detik' atau 'detik'
  const formatMinutesAndSeconds = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes > 0) {
      return `${minutes} menit ${seconds} detik`;
    } else {
      return `${(ms / 1000).toFixed(2)} detik`;
    }
  };

  // --- 4. PERHITUNGAN SEMUA POIN ---

  // POIN 1 & 2: Informasi Umum
  const perhitunganCount = jumlahSesiLoader;
  const namaUnit = initialData.unit_loader || "N/A";
  const namaOperator = initialData.nama_operator || "N/A";
  const observerName = initialData.observer || "N/A";

  // POIN 3: Rata-rata Jumlah Passing
  const totalDumps = allLoaderProcesses.filter(
    (p) => p.name.toUpperCase() === "BUCKET DUMP"
  ).length;
  const rataRataPassing =
    jumlahSesiLoader > 0 ? Math.round(totalDumps / jumlahSesiLoader) : 0;

  // POIN 4: Rata-rata Waktu Proses Individual Loader
  const avgDiggingMs = calculateAverageProcessTime("DIGGING");
  const avgSwingLoadMs = calculateAverageProcessTime("SWING LOAD");
  const avgBucketDumpMs = calculateAverageProcessTime("BUCKET DUMP");
  const avgSwingEmptyMs = calculateAverageProcessTime("SWING EMPTY");
  const avgSpottingMs = calculateAverageProcessTime("SPOTTING");
  const avgHangingMs = calculateAverageProcessTime("HANGING");

  // POIN 5: Perhitungan Rata-rata Cycle Time Loader
  const totalCycleTimeLoaderMs = loaderSessionValues.reduce(
    (sum, session) => sum + session.totalTime,
    0
  );
  const avgCycleTimeLoaderMs =
    jumlahSesiLoader > 0 ? totalCycleTimeLoaderMs / jumlahSesiLoader : 0;

  // Perbaikan: Membagi rata-rata cycle time loader dengan rata-rata passing
  const correctedAvgCycleTimeLoaderMs = avgCycleTimeLoaderMs / rataRataPassing;

  // POIN 6: Perhitungan Rata-rata Loading Time (tidak dibagi)
  const avgLoadingTimeMs = avgCycleTimeLoaderMs;

  // POIN 7: Informasi Hauler
  const jarakDumping = parseFloat(initialData.jarak_dumping || 0);
  const jumlahHauler = parseFloat(initialData.jumlah_hauler || 0);

  // --- PERUBAHAN DI SINI: SESUAI DENGAN RUMUS ANDA ---
  // POIN 8: Rata-rata Cycle Time Hauler
  const totalCycleTimeHaulerMs = haulerSessionValues.reduce(
    (sum, session) => sum + session.totalTime,
    0
  );
  const avgCycleTimeHaulerMs =
    jumlahSesiHauler > 0 ? totalCycleTimeHaulerMs / jumlahSesiHauler : 0;

  // RUMUS 2: cycle time hauler = (stop - start - 90 detik) / berapa kali dilakukan
  const correctedAvgCycleTimeHaulerMs = avgCycleTimeHaulerMs - 90 * 1000; // 90 detik = 90000 ms
  const avgCycleTimeHaulerMin = correctedAvgCycleTimeHaulerMs / 1000 / 60;

  // POIN 9: Rata-rata Kecepatan Hauler
  const jarakKm = jarakDumping / 1000;
  const avgCycleTimeHaulerJam = avgCycleTimeHaulerMin / 60;
  const avgKecepatanHauler =
    avgCycleTimeHaulerJam > 0 ? (2 * jarakKm) / avgCycleTimeHaulerJam : 0;

  // RUMUS 1: Matching Fleet = (jumlah hauler x loading time loader) / cycle time hauler
  const matchingFleet =
    correctedAvgCycleTimeHaulerMs > 0
      ? (jumlahHauler * avgLoadingTimeMs) / correctedAvgCycleTimeHaulerMs
      : 0;

  // POIN 11: Proyeksi Produktivitas
  const proyeksiProdty =
    avgLoadingTimeMs / 1000 / 60 > 0
      ? (60 / (avgLoadingTimeMs / 1000 / 60)) * 0.83
      : 0;

  // --- BAGIAN BARU: SIMPAN SEMUA HASIL PERHITUNGAN ---
  data.calculatedResults = {
    perhitunganCount: perhitunganCount,
    rataRataPassing: rataRataPassing,
    avgDiggingMs: avgDiggingMs,
    avgSwingLoadMs: avgSwingLoadMs,
    avgBucketDumpMs: avgBucketDumpMs,
    avgSwingEmptyMs: avgSwingEmptyMs,
    avgSpottingMs: avgSpottingMs,
    avgHangingMs: avgHangingMs,
    avgCycleTimeLoaderMs: correctedAvgCycleTimeLoaderMs,
    avgLoadingTimeMs: avgLoadingTimeMs,
    avgCycleTimeHaulerMs: correctedAvgCycleTimeHaulerMs,
    avgKecepatanHauler: avgKecepatanHauler,
    matchingFleet: matchingFleet,
    proyeksiProdty: proyeksiProdty,
  };
  localStorage.setItem("fullCycleReportData", JSON.stringify(data));

  // --- 5. TAMPILKAN HASIL KE HTML ---
  document.getElementById(
    "perhitungan-count"
  ).textContent = `Perhitungan (${perhitunganCount} kali)`;
  document.getElementById("nama-unit").textContent = `: ${namaUnit}`;
  document.getElementById("nama-operator").textContent = `: ${namaOperator}`;

  // Menambahkan nama observer
  const observerEl = document.createElement("div");
  observerEl.classList.add("flex", "text-sm");
  observerEl.innerHTML = `
      <span class="w-3/5 text-gray-600">Nama Observer</span>
      <span id="nama-observer" class="w-2/5 font-semibold text-fad-dark">: ${observerName}</span>
  `;
  document
    .querySelector(".space-y-3")
    .insertBefore(
      observerEl,
      document.getElementById("nama-unit").parentNode.nextSibling
    );

  // Menghapus elemen Jenis Material dari DOM
  const jenisMaterialEl = document.getElementById("jenis-material").parentNode;
  if (jenisMaterialEl) {
    jenisMaterialEl.remove();
  }

  // Tampilan Rata-rata Jumlah Passing (dibulatkan)
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
  document.getElementById(
    "rata-cycletime-loader"
  ).textContent = `: ${formatMinutesAndSeconds(correctedAvgCycleTimeLoaderMs)}`;
  document.getElementById(
    "rata-loadingtime"
  ).textContent = `: ${formatMinutesAndSeconds(avgLoadingTimeMs)}`;

  document.getElementById(
    "jarak-dumping"
  ).textContent = `: ${jarakDumping} meter`;
  document.getElementById(
    "jumlah-hauler"
  ).textContent = `: ${jumlahHauler} Unit`;
  document.getElementById(
    "rata-cycletime-hauler"
  ).textContent = `: ${formatMinutesAndSeconds(correctedAvgCycleTimeHaulerMs)}`;
  document.getElementById(
    "rata-kecepatan-hauler"
  ).textContent = `: ${avgKecepatanHauler.toFixed(2)} km/jam`;
  document.getElementById("matching-fleet").textContent =
    matchingFleet.toFixed(2);
  document.getElementById("proyeksi-produktivitas").innerHTML = `${Math.round(
    proyeksiProdty
  )} <span class="text-base">Ritase</span>`;

  // --- 6. EVENT LISTENERS ---
  document.getElementById("btn-ulangi").addEventListener("click", (e) => {
    e.preventDefault();
    Swal.fire({
      title: "Ulangi Proses?",
      text: "Data monitoring saat ini akan dihapus dan Anda akan kembali ke halaman awal.",
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

  // Event listener untuk tombol "Analisa"
  document.getElementById("btn-selesai").addEventListener("click", () => {
    // Aksi untuk tombol selesai, jika ada.
  });
});
