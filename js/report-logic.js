// File: js/report-logic.js (Dengan Perbaikan Data Final)
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

  const initialData = data.initialData;
  const loaderSessions = data.cycleTime.loader || {};
  const haulerSessions = data.cycleTime.hauler || {};

  // PERBAIKAN: Menggunakan nama key yang benar dari JSON Anda
  const namaUnit = initialData.unit_loader || "N/A";
  const jenisMaterial = initialData.jenis_material || "N/A";
  const namaOperator = initialData.nama_operator || "N/A";
  const observer = initialData.observer || "N/A";
  const jarakDumping = parseFloat(initialData.jarak_dumping || 0);
  const jumlahHauler = parseFloat(initialData.jumlah_hauler || 0);

  const jumlahSesiLoader = Object.keys(loaderSessions).length;
  const jumlahSesiHauler = Object.keys(haulerSessions).length;
  const allLoaderProcesses = Object.values(loaderSessions).flatMap(
    (s) => s.processes
  );

  const calculateAvg = (name) => {
    const p = allLoaderProcesses.filter(
      (proc) => proc.name.toUpperCase() === name.toUpperCase()
    );
    return p.length === 0
      ? 0
      : p.reduce((sum, proc) => sum + proc.time, 0) / p.length;
  };

  const totalDumps = allLoaderProcesses.filter(
    (p) => p.name.toUpperCase() === "BUCKET DUMP"
  ).length;
  const rataRataPassing =
    jumlahSesiLoader > 0 ? Math.round(totalDumps / jumlahSesiLoader) : 0;
  const totalCycleTimeLoaderMs = Object.values(loaderSessions).reduce(
    (s, c) => s + c.totalTime,
    0
  );
  const avgCycleTimeLoaderMs =
    jumlahSesiLoader > 0 ? totalCycleTimeLoaderMs / jumlahSesiLoader : 0;
  const avgLoadingTimeMin = avgCycleTimeLoaderMs / 1000 / 60;
  const totalCycleTimeHaulerMs = Object.values(haulerSessions).reduce(
    (s, c) => s + c.totalTime,
    0
  );
  const avgCycleTimeHaulerMin =
    (jumlahSesiHauler > 0 ? totalCycleTimeHaulerMs / jumlahSesiHauler : 0) /
    1000 /
    60;
  const avgKecepatanHauler =
    avgCycleTimeHaulerMin > 0
      ? (2 * (jarakDumping / 1000)) / (avgCycleTimeHaulerMin / 60)
      : 0;
  const matchingFleet =
    avgCycleTimeHaulerMin > 0
      ? (jumlahHauler * avgLoadingTimeMin) / avgCycleTimeHaulerMin
      : 0;
  const proyeksiProdty =
    avgLoadingTimeMin > 0 ? Math.round(60 / avgLoadingTimeMin) : 0;

  document.getElementById(
    "report-date"
  ).textContent = `${data.pengajuan.hari}, ${data.pengajuan.tanggal}`;
  document.getElementById("data-nama-unit").textContent = namaUnit;
  document.getElementById("data-jenis-material").textContent = jenisMaterial;
  document.getElementById("data-nama-operator").textContent = namaOperator;
  document.getElementById("data-observer").textContent = observer;
  document.getElementById(
    "data-sesi-loader"
  ).textContent = `${jumlahSesiLoader} kali`;

  document.getElementById(
    "data-rata-passing"
  ).textContent = `${rataRataPassing} passing`;
  document.getElementById("data-rata-digging").textContent = `${(
    calculateAvg("DIGGING") / 1000
  ).toFixed(2)} detik`;
  document.getElementById("data-rata-swing-load").textContent = `${(
    calculateAvg("SWING LOAD") / 1000
  ).toFixed(2)} detik`;
  document.getElementById("data-rata-bucket-dump").textContent = `${(
    calculateAvg("BUCKET DUMP") / 1000
  ).toFixed(2)} detik`;
  document.getElementById("data-rata-swing-empty").textContent = `${(
    calculateAvg("SWING EMPTY") / 1000
  ).toFixed(2)} detik`;
  document.getElementById("data-rata-spotting").textContent = `${(
    calculateAvg("SPOTTING") / 1000
  ).toFixed(2)} detik`;
  document.getElementById("data-rata-cycletime-loader").textContent = `${(
    avgCycleTimeLoaderMs / 1000
  ).toFixed(2)} detik`;
  document.getElementById(
    "data-rata-loadingtime"
  ).textContent = `${avgLoadingTimeMin.toFixed(2)} menit`;

  document.getElementById(
    "data-jarak-dumping"
  ).textContent = `${jarakDumping} meter`;
  document.getElementById(
    "data-jumlah-hauler"
  ).textContent = `${jumlahHauler} Unit`;
  document.getElementById(
    "data-rata-cycletime-hauler"
  ).textContent = `${avgCycleTimeHaulerMin.toFixed(2)} menit`;
  document.getElementById(
    "data-rata-kecepatan-hauler"
  ).textContent = `${avgKecepatanHauler.toFixed(2)} km/jam`;
  document.getElementById("data-matching-fleet").textContent =
    matchingFleet.toFixed(2);
  document.getElementById(
    "data-proyeksi-produktivitas"
  ).textContent = `${proyeksiProdty} Ritase`;

  const formatAnalysis = (arr) =>
    arr.length === 1 && arr[0].includes("-KOSONG") ? "Nihil" : arr.join("; ");
  document.getElementById("data-man").textContent = formatAnalysis(
    data.analisaProblem.man
  );
  document.getElementById("data-machine").textContent = formatAnalysis(
    data.analisaProblem.machine
  );
  document.getElementById("data-material").textContent = formatAnalysis(
    data.analisaProblem.material
  );
  document.getElementById("data-method").textContent = formatAnalysis(
    data.analisaProblem.method
  );
  document.getElementById("data-environment").textContent = formatAnalysis(
    data.analisaProblem.environment
  );
  document.getElementById("data-remaks").textContent =
    data.analisaProblem.remaks;

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
