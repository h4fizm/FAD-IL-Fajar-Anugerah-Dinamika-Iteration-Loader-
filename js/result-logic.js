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

  // --- 3. FUNGSI BANTUAN (HELPERS) ---
  const calculateAverageProcessTime = (processName) => {
    const relevantProcesses = allLoaderProcesses.filter(
      (p) => p.name.toUpperCase() === processName.toUpperCase()
    );
    if (relevantProcesses.length === 0) return 0;
    const totalTime = relevantProcesses.reduce((sum, p) => sum + p.time, 0);
    return totalTime / relevantProcesses.length;
  };

  // --- 4. PERHITUNGAN SEMUA POIN ---

  // POIN 1 & 2: Informasi Umum
  const perhitunganCount = jumlahSesiLoader;
  const namaUnit = initialData.unit_loader || "N/A";
  const jenisMaterial = initialData.jenis_material || "N/A";
  const namaOperator = initialData.nama_operator || "N/A";

  // POIN 3: Rata-rata Jumlah Passing
  const totalDumps = allLoaderProcesses.filter(
    (p) => p.name.toUpperCase() === "BUCKET DUMP"
  ).length;
  const rataRataPassing =
    jumlahSesiLoader > 0 ? totalDumps / jumlahSesiLoader : 0;

  // POIN 4: Rata-rata Waktu Proses Individual Loader
  const avgDiggingMs = calculateAverageProcessTime("DIGGING");
  const avgSwingLoadMs = calculateAverageProcessTime("SWING LOAD");
  const avgBucketDumpMs = calculateAverageProcessTime("BUCKET DUMP");
  const avgSwingEmptyMs = calculateAverageProcessTime("SWING EMPTY");
  const avgSpottingMs = calculateAverageProcessTime("SPOTTING");

  // POIN 5: Perhitungan Rata-rata Cycle Time Loader (BENAR: Tanpa Spotting)
  let totalPureCycleTimeMs = 0;
  loaderSessionValues.forEach((session) => {
    session.processes.forEach((proc) => {
      if (proc.name.toUpperCase() !== "SPOTTING") {
        totalPureCycleTimeMs += proc.time;
      }
    });
  });
  const avgCycleTimeLoaderMs =
    totalDumps > 0 ? totalPureCycleTimeMs / totalDumps : 0;

  // POIN 6: Perhitungan Rata-rata Loading Time (BENAR: Termasuk Spotting)
  const totalLoadingTimeMs = loaderSessionValues.reduce(
    (sum, session) => sum + session.totalTime,
    0
  );
  const avgLoadingTimeMs =
    jumlahSesiLoader > 0 ? totalLoadingTimeMs / jumlahSesiLoader : 0;
  const avgLoadingTimeMin = avgLoadingTimeMs / 1000 / 60;

  // POIN 7: Informasi Hauler
  const jarakDumping = parseFloat(initialData.jarak_dumping || 0);
  const jumlahHauler = parseFloat(initialData.jumlah_hauler || 0);

  // POIN 8: Rata-rata Cycle Time Hauler
  const totalCycleTimeHaulerMs = haulerSessionValues.reduce(
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
    avgCycleTimeHaulerMin > 0 && avgLoadingTimeMin > 0
      ? jumlahHauler / (avgCycleTimeHaulerMin / avgLoadingTimeMin)
      : 0;

  // POIN 11: Proyeksi Produktivitas
  const proyeksiProdty = avgLoadingTimeMin > 0 ? 60 / avgLoadingTimeMin : 0;

  // --- BAGIAN BARU: SIMPAN SEMUA HASIL PERHITUNGAN ---
  // Kita buat objek baru 'calculatedResults' di dalam data utama
  data.calculatedResults = {
    perhitunganCount: perhitunganCount,
    rataRataPassing: rataRataPassing,
    avgDiggingMs: avgDiggingMs,
    avgSwingLoadMs: avgSwingLoadMs,
    avgBucketDumpMs: avgBucketDumpMs,
    avgSwingEmptyMs: avgSwingEmptyMs,
    avgSpottingMs: avgSpottingMs,
    avgCycleTimeLoaderMs: avgCycleTimeLoaderMs,
    avgLoadingTimeMin: avgLoadingTimeMin,
    avgCycleTimeHaulerMin: avgCycleTimeHaulerMin,
    avgKecepatanHauler: avgKecepatanHauler,
    matchingFleet: matchingFleet,
    proyeksiProdty: proyeksiProdty,
  };

  // Simpan kembali objek 'data' yang sudah diperbarui ke localStorage
  localStorage.setItem("fullCycleReportData", JSON.stringify(data));
  // -------------------------------------------------------------

  // --- 5. TAMPILKAN HASIL KE HTML ---
  document.getElementById(
    "perhitungan-count"
  ).textContent = `Perhitungan (${perhitunganCount} kali)`;
  document.getElementById("nama-unit").textContent = `: ${namaUnit}`;
  document.getElementById("jenis-material").textContent = `: ${jenisMaterial}`;
  document.getElementById("nama-operator").textContent = `: ${namaOperator}`;

  document.getElementById(
    "rata-passing"
  ).textContent = `: ${rataRataPassing.toFixed(1)}`;
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
  document.getElementById(
    "rata-cycletime-hauler"
  ).textContent = `: ${avgCycleTimeHaulerMin.toFixed(2)} menit`;
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
    // Aksi untuk tombol selesai, jika ada.
  });
});
