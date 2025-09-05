// Menambahkan style untuk tombol aktif
const style = document.createElement("style");
style.innerHTML = `
  .process-button.active {
    border: 3px solid #38A169; /* fad-green */
    box-shadow: 0 0 10px rgba(56, 161, 105, 0.7);
    transform: scale(1.05);
  }
`;
document.head.appendChild(style);

const formData = localStorage.getItem("formData");
if (!formData) {
  Swal.fire({
    icon: "error",
    title: "Akses Ditolak",
    text: "Silakan isi data terlebih dahulu.",
    showConfirmButton: false,
    timer: 2000,
  }).then(() => {
    window.location.href = "index.html";
  });
} else {
  initializeProcess();
}

function initializeProcess() {
  // --- STATE MANAGEMENT ---
  let loaderTimer = 0,
    haulerTimer = 0;
  let loaderInterval, haulerInterval;

  let loaderActiveProcess = null;
  let haulerActiveProcess = null;

  let processHistory = JSON.parse(localStorage.getItem("processHistory")) || [];
  let loaderSessionCount = 0;
  let haulerSessionCount = 0;

  const loaderProcesses = [
    "digging",
    "swing-load",
    "bucket-dump",
    "swing-empty",
    "spotting",
  ];
  const haulerProcesses = ["start-hauler", "stop-hauler"];

  let processTimers = {
    digging: 0,
    "swing-load": 0,
    "bucket-dump": 0,
    "swing-empty": 0,
    spotting: 0,
    "start-hauler": 0,
    "stop-hauler": 0,
  };
  let processIntervals = {};

  // --- DOM ELEMENTS ---
  const loaderTimerDisplay = document.querySelector("#loader-timer-display p");
  const haulerTimerDisplay = document.querySelector("#hauler-timer-display p");
  const mainContainer = document.querySelector("main");
  const observerNameEl = document.getElementById("observerName");
  observerNameEl.textContent = JSON.parse(formData).observer;
  const finishLoaderBtn = document.getElementById("btn-finish");
  const finishHaulerBtn = document.getElementById("btn-done-hauler");
  if (finishLoaderBtn)
    finishLoaderBtn.querySelector("span:last-child").textContent = "DONE";
  if (finishHaulerBtn)
    finishHaulerBtn.querySelector("span:last-child").textContent = "DONE";

  // --- HELPER FUNCTIONS ---
  const saveHistory = () => {
    localStorage.setItem("processHistory", JSON.stringify(processHistory));
  };

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}:${String(milliseconds).padStart(2, "0")}`;
  };

  const formatTimeShort = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${String(totalSeconds).padStart(2, "0")}:${String(
      milliseconds
    ).padStart(2, "0")}`;
  };

  const updateMainTimerDisplay = (timerType) => {
    if (timerType === "loader")
      loaderTimerDisplay.textContent = formatTime(loaderTimer);
    else haulerTimerDisplay.textContent = formatTime(haulerTimer);
  };

  const updateProcessTimerDisplay = (processName, showTime = true) => {
    const button = document.getElementById(`btn-${processName}`);
    if (button) {
      // Periksa apakah elemen timer sudah ada
      let timerEl = button.querySelector(".font-mono");
      if (!timerEl && showTime) {
        // Jika tidak ada, buat elemen baru
        timerEl = document.createElement("span");
        timerEl.classList.add("font-mono", "text-gray-500", "text-sm", "mt-1");
        button.appendChild(timerEl);
      }
      if (timerEl) {
        if (showTime) {
          timerEl.textContent = formatTimeShort(processTimers[processName]);
        } else {
          // Jika showTime false, hapus elemen timer
          button.removeChild(timerEl);
        }
      }
    }
  };

  const startMainTimer = (timerType) => {
    if (timerType === "loader" && !loaderInterval) {
      loaderInterval = setInterval(() => {
        loaderTimer += 10;
        updateMainTimerDisplay("loader");
      }, 10);
    } else if (timerType === "hauler" && !haulerInterval) {
      haulerInterval = setInterval(() => {
        haulerTimer += 10;
        updateMainTimerDisplay("hauler");
      }, 10);
    }
  };

  const stopProcess = (processName, cycleType) => {
    if (processIntervals[processName]) {
      clearInterval(processIntervals[processName]);
      delete processIntervals[processName];
      const button = document.getElementById(`btn-${processName}`);

      const sessionNumber =
        cycleType === "loader"
          ? loaderSessionCount + 1
          : haulerSessionCount + 1;

      processHistory.push({
        name: processName.toUpperCase().replace("-", " "),
        time: processTimers[processName],
        cycle: cycleType,
        session: sessionNumber,
      });

      saveHistory();
      processTimers[processName] = 0;
      updateProcessTimerDisplay(processName, false); // Sembunyikan waktu
      button.classList.remove("active");
    }
  };

  const startProcess = (processName) => {
    const isLoaderProcess = loaderProcesses.includes(processName);
    const isHaulerProcess = haulerProcesses.includes(processName);

    const prevLoaderProcess = loaderActiveProcess;
    const prevHaulerProcess = haulerActiveProcess;

    if (isLoaderProcess) {
      if (prevLoaderProcess && prevLoaderProcess !== processName) {
        stopProcess(prevLoaderProcess, "loader");
      }
      if (prevLoaderProcess === processName) {
        Swal.fire(
          "Proses Sedang Berjalan",
          "Proses ini sudah aktif.",
          "warning"
        );
        return;
      }
      loaderActiveProcess = processName;
      startMainTimer("loader");
    } else if (isHaulerProcess) {
      if (
        processName === "stop-hauler" &&
        prevHaulerProcess !== "start-hauler"
      ) {
        Swal.fire(
          "Urutan Salah",
          "Proses Hauler harus diawali dengan 'START'.",
          "error"
        );
        return;
      }
      if (prevHaulerProcess && prevHaulerProcess !== processName) {
        stopProcess(prevHaulerProcess, "hauler");
      }
      if (prevHaulerProcess === processName) {
        Swal.fire(
          "Proses Sedang Berjalan",
          "Proses ini sudah aktif.",
          "warning"
        );
        return;
      }
      haulerActiveProcess = processName;
      startMainTimer("hauler");
    }

    const button = document.getElementById(`btn-${processName}`);
    button.classList.add("active");

    updateProcessTimerDisplay(processName); // Tampilkan dan mulai perbarui waktu

    processIntervals[processName] = setInterval(() => {
      processTimers[processName] += 10;
      updateProcessTimerDisplay(processName);
    }, 10);
  };

  const resetSpecificCycle = (cycleType) => {
    if (cycleType === "loader") {
      if (loaderActiveProcess) {
        stopProcess(loaderActiveProcess, "loader");
        loaderActiveProcess = null;
      }
      clearInterval(loaderInterval);
      loaderInterval = null;
      loaderTimer = 0;
      loaderSessionCount = 0;
      updateMainTimerDisplay("loader");
      loaderProcesses.forEach((pName) => {
        if (processIntervals[pName]) clearInterval(processIntervals[pName]);
        processTimers[pName] = 0;
        updateProcessTimerDisplay(pName, false); // Sembunyikan waktu
        const button = document.getElementById(`btn-${pName}`);
        button.classList.remove("active");
      });
    } else {
      if (haulerActiveProcess) {
        stopProcess(haulerActiveProcess, "hauler");
        haulerActiveProcess = null;
      }
      clearInterval(haulerInterval);
      haulerInterval = null;
      haulerTimer = 0;
      haulerSessionCount = 0;
      updateMainTimerDisplay("hauler");
      haulerProcesses.forEach((pName) => {
        if (processIntervals[pName]) clearInterval(processIntervals[pName]);
        processTimers[pName] = 0;
        updateProcessTimerDisplay(pName, false); // Sembunyikan waktu
        const button = document.getElementById(`btn-${pName}`);
        button.classList.remove("active");
      });
    }

    processHistory = processHistory.filter((p) => p.cycle !== cycleType);
    saveHistory();

    Swal.fire({
      icon: "info",
      title: `Data Siklus ${
        cycleType.charAt(0).toUpperCase() + cycleType.slice(1)
      } Direset!`,
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 2000,
    });
  };

  const stopLoaderCycle = () => {
    if (!loaderActiveProcess) {
      Swal.fire(
        "Tidak Ada Proses Aktif",
        "Anda harus memulai sebuah proses terlebih dahulu.",
        "warning"
      );
      return;
    }
    stopProcess(loaderActiveProcess, "loader");
    clearInterval(loaderInterval);
    loaderInterval = null;
    loaderActiveProcess = null;
    loaderSessionCount++;
    loaderTimer = 0;
    updateMainTimerDisplay("loader");

    Swal.fire({
      icon: "success",
      title: `Siklus Loader Sesi ${loaderSessionCount} Selesai!`,
      text: "Data untuk siklus ini telah direkam.",
      timer: 2000,
      showConfirmButton: false,
    });
  };

  const stopHaulerCycle = () => {
    if (!haulerActiveProcess) {
      Swal.fire(
        "Tidak Ada Proses Aktif",
        "Anda harus memulai sebuah proses terlebih dahulu.",
        "warning"
      );
      return;
    }
    stopProcess(haulerActiveProcess, "hauler");
    clearInterval(haulerInterval);
    haulerInterval = null;
    haulerActiveProcess = null;
    haulerSessionCount++;
    haulerTimer = 0;
    updateMainTimerDisplay("hauler");

    Swal.fire({
      icon: "success",
      title: `Siklus Hauler Sesi ${haulerSessionCount} Selesai!`,
      text: "Data untuk siklus ini telah direkam.",
      timer: 2000,
      showConfirmButton: false,
    });
  };

  const submitAllData = () => {
    if (processHistory.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Tidak Ada Data",
        text: "Rekam setidaknya satu siklus proses.",
      });
      return;
    }
    if (loaderActiveProcess) stopProcess(loaderActiveProcess, "loader");
    if (haulerActiveProcess) stopProcess(haulerActiveProcess, "hauler");
    clearInterval(loaderInterval);
    clearInterval(haulerInterval);

    const groupProcessesBySession = (cycleType) => {
      return processHistory
        .filter((p) => p.cycle === cycleType)
        .reduce((acc, process) => {
          const sessionKey = process.session;
          if (!acc[sessionKey]) {
            acc[sessionKey] = { totalTime: 0, processes: [] };
          }
          acc[sessionKey].processes.push({
            name: process.name,
            time: process.time,
          });
          acc[sessionKey].totalTime += process.time;
          return acc;
        }, {});
    };

    const loaderDataBySession = groupProcessesBySession("loader");
    const haulerDataBySession = groupProcessesBySession("hauler");

    const allLoaderProcesses = Object.values(loaderDataBySession).flatMap(
      (session) => session.processes
    );
    const totalDumps = allLoaderProcesses.filter(
      (p) => p.name.toUpperCase() === "BUCKET DUMP"
    ).length;
    const jumlahSesiLoader = Object.keys(loaderDataBySession).length;
    const rataRataPassing =
      jumlahSesiLoader > 0 ? totalDumps / jumlahSesiLoader : 0;

    const calculateAverageProcessTime = (processName) => {
      const relevant = allLoaderProcesses.filter(
        (p) => p.name.toUpperCase() === processName.toUpperCase()
      );
      if (relevant.length === 0) return 0;
      const totalTime = relevant.reduce((sum, p) => sum + p.time, 0);
      return totalTime / relevant.length;
    };

    const avgDiggingMs = calculateAverageProcessTime("DIGGING");
    const avgSwingLoadMs = calculateAverageProcessTime("SWING LOAD");
    const avgBucketDumpMs = calculateAverageProcessTime("BUCKET DUMP");
    const avgSwingEmptyMs = calculateAverageProcessTime("SWING EMPTY");
    const avgSpottingMs = calculateAverageProcessTime("SPOTTING");

    const totalLoadingTimeMs = Object.values(loaderDataBySession).reduce(
      (sum, session) => sum + session.totalTime,
      0
    );
    const avgCycleTimeLoaderMs =
      jumlahSesiLoader > 0 ? totalLoadingTimeMs / jumlahSesiLoader : 0;
    const avgLoadingTimeMin = avgCycleTimeLoaderMs / 1000 / 60;

    const totalCycleTimeHaulerMs = Object.values(haulerDataBySession).reduce(
      (sum, session) => sum + session.totalTime,
      0
    );
    const jumlahSesiHauler = Object.keys(haulerDataBySession).length;
    const avgCycleTimeHaulerMs =
      jumlahSesiHauler > 0 ? totalCycleTimeHaulerMs / jumlahSesiHauler : 0;
    const avgCycleTimeHaulerMin = avgCycleTimeHaulerMs / 1000 / 60;

    const jarakDumping = parseFloat(JSON.parse(formData).jarak_dumping || 0);
    const jumlahHauler = parseFloat(JSON.parse(formData).jumlah_hauler || 0);
    const avgCycleTimeHaulerJam = avgCycleTimeHaulerMin / 60;
    const avgKecepatanHauler =
      avgCycleTimeHaulerJam > 0
        ? (2 * (jarakDumping / 1000)) / avgCycleTimeHaulerJam
        : 0;

    const matchingFleet =
      avgCycleTimeHaulerMin > 0 && avgLoadingTimeMin > 0
        ? jumlahHauler / (avgCycleTimeHaulerMin / avgLoadingTimeMin)
        : 0;

    const proyeksiProdty =
      avgLoadingTimeMin > 0 ? (60 / avgLoadingTimeMin) * 0.83 : 0;

    const pengajuanTanggal = `Hari, 11 Agustus 2025`;

    const allFinalData = {
      pengajuan: {
        hari: pengajuanTanggal,
      },
      initialData: JSON.parse(formData),
      cycleTime: {
        loader: loaderDataBySession,
        hauler: haulerDataBySession,
      },
      calculatedResults: {
        perhitunganCount: jumlahSesiLoader,
        rataRataPassing: rataRataPassing,
        avgDiggingMs: avgDiggingMs,
        avgSwingLoadMs: avgSwingLoadMs,
        avgBucketDumpMs: avgBucketDumpMs,
        avgSwingEmptyMs: avgSwingEmptyMs,
        avgSpottingMs: avgSpottingMs,
        avgCycleTimeLoaderMs: avgCycleTimeLoaderMs,
        avgLoadingTimeMin: avgLoadingTimeMin,
        avgCycleTimeHaulerMs: avgCycleTimeHaulerMs,
        avgCycleTimeHaulerMin: avgCycleTimeHaulerMin,
        avgKecepatanHauler: avgKecepatanHauler,
        matchingFleet: matchingFleet,
        proyeksiProdty: proyeksiProdty,
      },
    };

    localStorage.setItem("fullCycleReportData", JSON.stringify(allFinalData));

    Swal.fire({
      icon: "success",
      title: "Semua Data Tersimpan!",
      text: "Anda akan diarahkan ke halaman hasil.",
      showConfirmButton: false,
      timer: 2000,
    }).then(() => {
      localStorage.removeItem("processHistory");
      localStorage.removeItem("formData");
      window.location.href = "index3.html";
    });
  };

  // --- EVENT LISTENERS ---
  mainContainer.addEventListener("click", (e) => {
    const button = e.target.closest("button");
    if (!button) return;
    const id = button.id;
    const processName = id.replace("btn-", "");
    if (
      loaderProcesses.includes(processName) ||
      haulerProcesses.includes(processName)
    ) {
      button.classList.add("process-button");
      startProcess(processName);
    } else if (id === "btn-reset") {
      resetSpecificCycle("loader");
    } else if (id === "btn-reset-hauler") {
      resetSpecificCycle("hauler");
    } else if (id === "btn-finish") {
      stopLoaderCycle();
    } else if (id === "btn-done-hauler") {
      stopHaulerCycle();
    } else if (id === "btn-submit-all") {
      submitAllData();
    }
  });
}
