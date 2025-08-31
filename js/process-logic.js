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
  let activeProcess = null;
  let processHistory = JSON.parse(localStorage.getItem("processHistory")) || [];
  let activeCycle = null;
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

  const loaderActionButtons = document.querySelectorAll(
    "#btn-digging, #btn-swing-load, #btn-bucket-dump, #btn-swing-empty, #btn-spotting, #btn-reset, #btn-finish"
  );
  const haulerActionButtons = document.querySelectorAll(
    "#btn-out, #btn-in, #btn-reset-hauler, #btn-finish-hauler"
  );

  // --- HELPER FUNCTIONS ---
  const toggleButtons = (buttons, disable) => {
    buttons.forEach((button) => {
      button.disabled = disable;
      if (disable) button.classList.add("opacity-50", "cursor-not-allowed");
      else button.classList.remove("opacity-50", "cursor-not-allowed");
    });
  };

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

  const stopProcess = (processName) => {
    if (processIntervals[processName]) {
      clearInterval(processIntervals[processName]);
      delete processIntervals[processName];
      const button = document.getElementById(`btn-${processName}`);
      const processLabel = button.querySelector(".uppercase").textContent;

      // --- PERUBAHAN 1: Menambahkan nomor sesi saat menyimpan riwayat ---
      const sessionNumber =
        activeCycle === "loader"
          ? loaderSessionCount + 1
          : haulerSessionCount + 1;
      processHistory.push({
        name: processLabel,
        time: processTimers[processName],
        cycle: activeCycle,
        session: sessionNumber, // <-- Kunci baru ditambahkan di sini
      });
      // -------------------------------------------------------------------

      saveHistory();
      processTimers[processName] = 0;
      updateProcessTimerDisplay(processName);
      button.classList.remove("active");
    }
  };

  const startProcess = (processName) => {
    if (activeProcess === processName) {
      Swal.fire("Proses Sedang Berjalan", "Proses ini sudah aktif.", "warning");
      return;
    }

    const isLoaderProcess = loaderProcesses.includes(processName);
    const isHaulerProcess = haulerProcesses.includes(processName);

    if (activeCycle === null) {
      if (isLoaderProcess) {
        activeCycle = "loader";
        toggleButtons(haulerActionButtons, true);
      } else if (isHaulerProcess) {
        activeCycle = "hauler";
        toggleButtons(loaderActionButtons, true);
      }
    }

    if (
      (activeCycle === "loader" && isHaulerProcess) ||
      (activeCycle === "hauler" && isLoaderProcess)
    ) {
      Swal.fire(
        "Siklus Sedang Berjalan",
        `Selesaikan siklus ${activeCycle} terlebih dahulu dengan menekan FINISH.`,
        "error"
      );
      return;
    }

    if (processName === "in" && activeProcess !== "out") {
      Swal.fire(
        "Urutan Salah",
        "Proses Hauler harus diawali dengan 'OUT'.",
        "error"
      );
      document.getElementById("btn-in").classList.remove("active");
      return;
    }

    if (activeProcess) {
      stopProcess(activeProcess);
    }

    activeProcess = processName;
    document.getElementById(`btn-${processName}`).classList.add("active");

    if (isLoaderProcess) startMainTimer("loader");
    else if (isHaulerProcess) startMainTimer("hauler");

    processIntervals[processName] = setInterval(() => {
      processTimers[processName] += 10;
      updateProcessTimerDisplay(processName);
    }, 10);
  };

  const resetSpecificCycle = (cycleType) => {
    const processesToReset =
      cycleType === "loader" ? loaderProcesses : haulerProcesses;

    if (cycleType === "loader") {
      clearInterval(loaderInterval);
      loaderInterval = null;
      loaderTimer = 0;
      loaderSessionCount = 0;
      updateMainTimerDisplay("loader");
    } else {
      clearInterval(haulerInterval);
      haulerInterval = null;
      haulerTimer = 0;
      haulerSessionCount = 0;
      updateMainTimerDisplay("hauler");
    }

    if (activeCycle === cycleType && activeProcess) {
      stopProcess(activeProcess);
      activeProcess = null;
    }

    processesToReset.forEach((pName) => {
      if (processIntervals[pName]) clearInterval(processIntervals[pName]);
      processTimers[pName] = 0;
      updateProcessTimerDisplay(pName);
      document.getElementById(`btn-${pName}`).classList.remove("active");
    });

    processHistory = processHistory.filter((p) => p.cycle !== cycleType);
    saveHistory();

    if (activeCycle === cycleType) {
      activeCycle = null;
      toggleButtons(loaderActionButtons, false);
      toggleButtons(haulerActionButtons, false);
    }

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
    if (!activeProcess && loaderTimer === 0) {
      Swal.fire(
        "Proses Belum Dimulai",
        "Anda harus menjalankan setidaknya satu proses loader.",
        "warning"
      );
      return;
    }

    if (activeProcess && loaderProcesses.includes(activeProcess)) {
      stopProcess(activeProcess);
    }

    clearInterval(loaderInterval);
    loaderInterval = null;
    activeProcess = null;
    loaderSessionCount++;

    loaderTimer = 0; // Reset timer sesi
    updateMainTimerDisplay("loader"); // Perbarui tampilan ke 00:00:00

    Swal.fire({
      icon: "success",
      title: `Siklus Loader Sesi ${loaderSessionCount} Selesai!`,
      text: "Data untuk siklus ini telah direkam.",
      timer: 2000,
      showConfirmButton: false,
    });

    activeCycle = null;
    toggleButtons(loaderActionButtons, false);
    toggleButtons(haulerActionButtons, false);
  };

  const finishHaulerCycle = () => {
    if (!activeProcess && haulerTimer === 0) {
      Swal.fire(
        "Proses Belum Dimulai",
        "Anda harus menjalankan setidaknya satu proses hauler.",
        "warning"
      );
      return;
    }

    if (activeProcess && haulerProcesses.includes(activeProcess)) {
      stopProcess(activeProcess);
    }

    clearInterval(haulerInterval);
    haulerInterval = null;
    activeProcess = null;
    haulerSessionCount++;

    haulerTimer = 0; // Reset timer sesi
    updateMainTimerDisplay("hauler"); // Perbarui tampilan ke 00:00:00

    Swal.fire({
      icon: "success",
      title: `Siklus Hauler Sesi ${haulerSessionCount} Selesai!`,
      text: "Data untuk siklus ini telah direkam.",
      timer: 2000,
      showConfirmButton: false,
    });

    activeCycle = null;
    toggleButtons(loaderActionButtons, false);
    toggleButtons(haulerActionButtons, false);
  };

  // --- PERUBAHAN 2: Fungsi submitAllData diganti total untuk struktur JSON baru ---
  const submitAllData = () => {
    if (processHistory.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Tidak Ada Data",
        text: "Rekam setidaknya satu siklus proses.",
      });
      return;
    }
    if (activeProcess) stopProcess(activeProcess);

    clearInterval(loaderInterval);
    clearInterval(haulerInterval);

    // Fungsi helper untuk mengelompokkan proses berdasarkan sesi
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

    // Struktur data final yang akan disimpan
    const allFinalData = {
      pengajuan: {
        hari: new Date().toLocaleDateString("id-ID", { weekday: "long" }),
        tanggal: new Date().toLocaleDateString("id-ID", {
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

    // Menyimpan semua data dalam satu item localStorage
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
  // --------------------------------------------------------------------------------

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
