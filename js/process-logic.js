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
    "hanging",
  ];
  const haulerProcesses = ["start-hauler", "stop-hauler"];

  let processTimers = {
    digging: 0,
    "swing-load": 0,
    "bucket-dump": 0,
    "swing-empty": 0,
    spotting: 0,
    hanging: 0,
    "start-hauler": 0,
    "stop-hauler": 0,
  };
  let processIntervals = {};
  let selectedHaulerUnit = null;

  // --- DOM ELEMENTS ---
  const loaderTimerDisplay = document.querySelector("#loader-timer-display p");
  const haulerTimerDisplay = document.querySelector("#hauler-timer-display p");
  const mainContainer = document.querySelector("main");
  const observerNameEl = document.getElementById("observerName");
  observerNameEl.textContent = JSON.parse(formData).observer;
  const finishLoaderBtn = document.getElementById("btn-finish");
  const haulerUnitSelector = document.getElementById("haulerUnitSelector");

  if (finishLoaderBtn)
    finishLoaderBtn.querySelector("span:last-child").textContent = "DONE";

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
      let timerEl = button.querySelector(".font-mono");
      if (!timerEl && showTime) {
        timerEl = document.createElement("span");
        timerEl.classList.add("font-mono", "text-gray-500", "text-sm", "mt-1");
        button.appendChild(timerEl);
      }
      if (timerEl) {
        if (showTime) {
          timerEl.textContent = formatTimeShort(processTimers[processName]);
        } else {
          if (button.contains(timerEl)) {
            button.removeChild(timerEl);
          }
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

  const stopProcess = (processName, cycleType, haulerUnit = null) => {
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
        unit: haulerUnit,
      });

      saveHistory();
      processTimers[processName] = 0;
      updateProcessTimerDisplay(processName, false);
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

    updateProcessTimerDisplay(processName);

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
        updateProcessTimerDisplay(pName, false);
        const button = document.getElementById(`btn-${pName}`);
        button.classList.remove("active");
      });
    } else {
      if (haulerActiveProcess) {
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
        updateProcessTimerDisplay(pName, false);
        const button = document.getElementById(`btn-${pName}`);
        button.classList.remove("active");
      });
      haulerUnitSelector.value = "PILIHAN UNIT HAULER";
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
  };

  // ✅ Perbaikan di sini
  const stopHaulerCycle = () => {
    if (!haulerActiveProcess || haulerActiveProcess !== "start-hauler") {
      Swal.fire({
        icon: "warning",
        title: "Tidak Ada Proses Aktif",
        text: "Anda harus memulai siklus dengan 'START' terlebih dahulu.",
      });
      return;
    }

    const sessionTime = haulerTimer;

    clearInterval(haulerInterval);
    haulerInterval = null;

    // Hentikan interval khusus Start Hauler
    if (processIntervals["start-hauler"]) {
      clearInterval(processIntervals["start-hauler"]);
      delete processIntervals["start-hauler"];
    }
    processTimers["start-hauler"] = 0;
    updateProcessTimerDisplay("start-hauler", false);

    // Hilangkan status aktif tombol START
    const startButton = document.getElementById("btn-start-hauler");
    if (startButton) startButton.classList.remove("active");

    processHistory.push({
      name: "START-STOP",
      time: sessionTime,
      cycle: "hauler",
      session: haulerSessionCount + 1,
      unit: haulerUnitSelector.value,
    });
    saveHistory();

    haulerActiveProcess = null;
    haulerSessionCount++;
    haulerTimer = 0;
    updateMainTimerDisplay("hauler");

    Swal.fire({
      icon: "success",
      title: "Siklus Hauler Selesai!",
      text: `Waktu siklus untuk Unit Hauler ${haulerUnitSelector.value} telah dicatat.`,
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: "top-end",
    });
  };

  const submitAllData = () => {
    if (haulerUnitSelector.value === "PILIHAN UNIT HAULER") {
      Swal.fire({
        icon: "warning",
        title: "Unit Hauler Belum Dipilih",
        text: "Silakan pilih unit hauler terlebih dahulu.",
      });
      return;
    }

    if (processHistory.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Tidak Ada Data",
        text: "Rekam setidaknya satu siklus proses.",
      });
      return;
    } // Berhenti jika ada proses yang masih aktif

    if (loaderActiveProcess) stopProcess(loaderActiveProcess, "loader");
    if (haulerActiveProcess) {
      Swal.fire({
        icon: "info",
        title: "Siklus Hauler Terakhir Telah Dicatat",
        text: "Siklus yang sedang berjalan akan dihentikan dan disimpan.",
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      }).then(() => {
        const sessionTime = haulerTimer;
        clearInterval(haulerInterval);
        processHistory.push({
          name: "START-STOP",
          time: sessionTime,
          cycle: "hauler",
          session: haulerSessionCount + 1,
          unit: haulerUnitSelector.value,
        });
        saveHistory();
        proceedToFinalSummary();
      });
    } else {
      proceedToFinalSummary();
    }
  };

  const proceedToFinalSummary = () => {
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
    const avgHangingMs = calculateAverageProcessTime("HANGING");

    const totalLoadingTimeMs = Object.values(loaderDataBySession).reduce(
      (sum, session) => sum + session.totalTime,
      0
    );
    const avgCycleTimeLoaderMs =
      jumlahSesiLoader > 0 ? totalLoadingTimeMs / jumlahSesiLoader : 0;
    const avgLoadingTimeMin = avgCycleTimeLoaderMs / 1000 / 60;

    const totalCycleTimeHaulerMs = processHistory
      .filter((p) => p.cycle === "hauler")
      .reduce((sum, p) => sum + p.time, 0);
    const haulerSessions = processHistory.filter((p) => p.cycle === "hauler");
    const jumlahSesiHauler = haulerSessions.length;
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

    const pengajuanTanggal = JSON.parse(formData).tanggal_pengajuan;

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
        avgHangingMs: avgHangingMs,
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
  }; // --- EVENT LISTENERS ---

  mainContainer.addEventListener("click", (e) => {
    const button = e.target.closest("button");
    if (!button) return;
    const id = button.id;
    const processName = id.replace("btn-", "");
    if (loaderProcesses.includes(processName)) {
      button.classList.add("process-button");
      startProcess(processName);
    } else if (id === "btn-start-hauler") {
      startProcess("start-hauler");
    } else if (id === "btn-stop-hauler") {
      stopHaulerCycle();
    } else if (id === "btn-reset") {
      resetSpecificCycle("loader");
    } else if (id === "btn-reset-hauler") {
      resetSpecificCycle("hauler");
    } else if (id === "btn-finish") {
      stopLoaderCycle();
    } else if (id === "btn-submit-all") {
      submitAllData();
    }
  });
}
