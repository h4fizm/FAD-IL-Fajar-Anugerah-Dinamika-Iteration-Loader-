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

  // --- PERUBAHAN KUNCI 1: Pisahkan status proses aktif ---
  // Kita tidak lagi menggunakan satu 'activeProcess' dan 'activeCycle'.
  // Sekarang setiap siklus punya status aktifnya sendiri.
  let loaderActiveProcess = null;
  let haulerActiveProcess = null;
  // --------------------------------------------------------

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
  const haulerProcesses = ["out", "in"];

  let processTimers = {
    digging: 0,
    "swing-load": 0,
    "bucket-dump": 0,
    "swing-empty": 0,
    spotting: 0,
    out: 0,
    in: 0,
  };
  let processIntervals = {};

  // --- DOM ELEMENTS ---
  const loaderTimerDisplay = document.querySelector("#loader-timer-display p");
  const haulerTimerDisplay = document.querySelector("#hauler-timer-display p");
  const mainContainer = document.querySelector("main");
  const observerNameEl = document.getElementById("observerName");
  observerNameEl.textContent = JSON.parse(formData).observer;

  // --- HELPER FUNCTIONS ---
  // Fungsi toggleButtons tidak lagi diperlukan karena kedua siklus selalu aktif
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

  const updateProcessTimerDisplay = (processName) => {
    const button = document.getElementById(`btn-${processName}`);
    if (button) {
      const timerEl = button.querySelector(".font-mono");
      if (timerEl)
        timerEl.textContent = formatTimeShort(processTimers[processName]);
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
      const processLabel = button.querySelector(".uppercase").textContent;

      const sessionNumber =
        cycleType === "loader"
          ? loaderSessionCount + 1
          : haulerSessionCount + 1;
      processHistory.push({
        name: processLabel,
        time: processTimers[processName],
        cycle: cycleType,
        session: sessionNumber,
      });

      saveHistory();
      processTimers[processName] = 0;
      updateProcessTimerDisplay(processName);
      button.classList.remove("active");
    }
  };

  // --- PERUBAHAN KUNCI 2: Logic startProcess dirombak total ---
  const startProcess = (processName) => {
    const isLoaderProcess = loaderProcesses.includes(processName);
    const isHaulerProcess = haulerProcesses.includes(processName);

    if (isLoaderProcess) {
      // Jika ada proses loader lain yang aktif, hentikan dulu
      if (loaderActiveProcess && loaderActiveProcess !== processName) {
        stopProcess(loaderActiveProcess, "loader");
      }
      if (loaderActiveProcess === processName) {
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
      // Validasi urutan khusus untuk hauler
      if (processName === "in" && haulerActiveProcess !== "out") {
        Swal.fire(
          "Urutan Salah",
          "Proses Hauler harus diawali dengan 'OUT'.",
          "error"
        );
        return;
      }
      // Jika ada proses hauler lain yang aktif, hentikan dulu
      if (haulerActiveProcess && haulerActiveProcess !== processName) {
        stopProcess(haulerActiveProcess, "hauler");
      }
      if (haulerActiveProcess === processName) {
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

    // Jalankan timer untuk proses yang baru
    document.getElementById(`btn-${processName}`).classList.add("active");
    processIntervals[processName] = setInterval(() => {
      processTimers[processName] += 10;
      updateProcessTimerDisplay(processName);
    }, 10);
  };
  // -----------------------------------------------------------------

  const resetSpecificCycle = (cycleType) => {
    if (cycleType === "loader") {
      // Hentikan proses loader yang mungkin aktif
      if (loaderActiveProcess) {
        stopProcess(loaderActiveProcess, "loader");
        loaderActiveProcess = null;
      }
      // Reset timer utama loader
      clearInterval(loaderInterval);
      loaderInterval = null;
      loaderTimer = 0;
      loaderSessionCount = 0;
      updateMainTimerDisplay("loader");
      // Reset semua timer proses loader
      loaderProcesses.forEach((pName) => {
        if (processIntervals[pName]) clearInterval(processIntervals[pName]);
        processTimers[pName] = 0;
        updateProcessTimerDisplay(pName);
        document.getElementById(`btn-${pName}`).classList.remove("active");
      });
    } else {
      // cycleType === 'hauler'
      // Hentikan proses hauler yang mungkin aktif
      if (haulerActiveProcess) {
        stopProcess(haulerActiveProcess, "hauler");
        haulerActiveProcess = null;
      }
      // Reset timer utama hauler
      clearInterval(haulerInterval);
      haulerInterval = null;
      haulerTimer = 0;
      haulerSessionCount = 0;
      updateMainTimerDisplay("hauler");
      // Reset semua timer proses hauler
      haulerProcesses.forEach((pName) => {
        if (processIntervals[pName]) clearInterval(processIntervals[pName]);
        processTimers[pName] = 0;
        updateProcessTimerDisplay(pName);
        document.getElementById(`btn-${pName}`).classList.remove("active");
      });
    }

    // Hapus riwayat untuk siklus yang di-reset
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

  const finishLoaderCycle = () => {
    if (!loaderActiveProcess && loaderTimer === 0) {
      Swal.fire(
        "Proses Belum Dimulai",
        "Anda harus menjalankan setidaknya satu proses loader.",
        "warning"
      );
      return;
    }
    // Hentikan proses loader yang sedang berjalan
    if (loaderActiveProcess) {
      stopProcess(loaderActiveProcess, "loader");
    }

    clearInterval(loaderInterval);
    loaderInterval = null;
    loaderActiveProcess = null;
    loaderSessionCount++;
    loaderTimer = 0; // Reset timer sesi
    updateMainTimerDisplay("loader");

    Swal.fire({
      icon: "success",
      title: `Siklus Loader Sesi ${loaderSessionCount} Selesai!`,
      text: "Data untuk siklus ini telah direkam.",
      timer: 2000,
      showConfirmButton: false,
    });
  };

  const finishHaulerCycle = () => {
    if (!haulerActiveProcess && haulerTimer === 0) {
      Swal.fire(
        "Proses Belum Dimulai",
        "Anda harus menjalankan setidaknya satu proses hauler.",
        "warning"
      );
      return;
    }
    // Hentikan proses hauler yang sedang berjalan
    if (haulerActiveProcess) {
      stopProcess(haulerActiveProcess, "hauler");
    }

    clearInterval(haulerInterval);
    haulerInterval = null;
    haulerActiveProcess = null;
    haulerSessionCount++;
    haulerTimer = 0; // Reset timer sesi
    updateMainTimerDisplay("hauler");

    Swal.fire({
      icon: "success",
      title: `Siklus Hauler Sesi ${haulerSessionCount} Selesai!`,
      text: "Data untuk siklus ini telah direkam.",
      timer: 2000,
      showConfirmButton: false,
    });
  };

  // Fungsi submit tidak perlu diubah karena sudah memproses berdasarkan 'processHistory'
  const submitAllData = () => {
    if (processHistory.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Tidak Ada Data",
        text: "Rekam setidaknya satu siklus proses.",
      });
      return;
    }
    // Hentikan SEMUA proses yang mungkin masih berjalan sebelum submit
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
            acc[sessionKey] = {
              totalTime: 0,
              processes: [],
            };
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

    // Mengingat permintaan Anda sebelumnya
    const today = new Date();
    const allFinalData = {
      pengajuan: {
        hari: today.toLocaleDateString("id-ID", { weekday: "long" }),
        tanggal: today.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
      },
      initialData: JSON.parse(formData),
      cycleTime: {
        loader: loaderDataBySession,
        hauler: haulerDataBySession,
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
      finishLoaderCycle();
    } else if (id === "btn-finish-hauler") {
      finishHaulerCycle();
    } else if (id === "btn-submit-all") {
      submitAllData();
    }
  });
}
