const formData = localStorage.getItem("formData");
if (!formData) {
  Swal.fire({
    icon: "error",
    title: "Akses Ditolak",
    text: "Silakan isi data terlebih dahulu di halaman utama.",
    showConfirmButton: false,
    timer: 2000,
  }).then(() => {
    window.location.href = "index.html";
  });
}

AOS.init();
let mainTimer = 0;
let mainInterval;
let cardTimers = {
  digging: 0,
  swing: 0,
  "dump-bucket": 0,
  "swing-empty": 0,
  secondary: 0,
};
let cardIntervals = {};
let activeCard = null;
let processHistory = [];

const loadHistory = () => {
  const savedHistory = localStorage.getItem("processHistory");
  if (savedHistory) {
    processHistory = JSON.parse(savedHistory);
    console.log("Riwayat proses sebelumnya dimuat:", processHistory);
  }
};

const saveHistory = () => {
  localStorage.setItem("processHistory", JSON.stringify(processHistory));
  console.log("Riwayat proses disimpan:", processHistory);
};

const formatTime = (milliseconds) => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const m = String(totalMinutes).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  const ms = String(Math.floor((milliseconds % 1000) / 10)).padStart(2, "0");
  return `${m}:${s}:${ms}`;
};

const updateMainStopwatch = () => {
  document.getElementById("main-stopwatch").textContent = formatTime(mainTimer);
};

const updateCardStopwatch = (cardName) => {
  const cardElement = document.getElementById(`btn-${cardName}`);
  if (cardElement) {
    const timerDisplay = cardElement.querySelector(".digital-font:last-child");
    if (timerDisplay) {
      timerDisplay.textContent = formatTime(cardTimers[cardName]);
    }
  }
};

const startMainStopwatch = () => {
  if (!mainInterval) {
    mainInterval = setInterval(() => {
      mainTimer += 10;
      updateMainStopwatch();
    }, 10);
  }
};

const startCardStopwatch = (cardName) => {
  document.querySelectorAll("#main-grid button").forEach((button) => {
    button.classList.remove("active");
  });

  if (activeCard && activeCard !== cardName) {
    const elapsedTime = cardTimers[activeCard];
    const processName = document
      .getElementById(`btn-${activeCard}`)
      .querySelector(".font-bold").textContent;
    const newProcess = {
      name: processName,
      time: elapsedTime,
    };
    processHistory.push(newProcess);
    saveHistory();

    clearInterval(cardIntervals[activeCard]);
    cardTimers[activeCard] = 0;
    updateCardStopwatch(activeCard);
  }

  if (activeCard === cardName) {
    Swal.fire({
      icon: "warning",
      title: "Oops...",
      text: "Anda tidak dapat memulai proses yang sama!",
      timer: 2000,
      showConfirmButton: false,
    });
    return;
  }

  if (cardIntervals[cardName]) {
    clearInterval(cardIntervals[cardName]);
    delete cardIntervals[cardName];
  }

  cardIntervals[cardName] = setInterval(() => {
    cardTimers[cardName] += 10;
    updateCardStopwatch(cardName);
  }, 10);

  activeCard = cardName;
  document.getElementById(`btn-${cardName}`).classList.add("active");
};

const resetAll = () => {
  clearInterval(mainInterval);
  mainInterval = null;
  mainTimer = 0;
  updateMainStopwatch();

  if (activeCard) {
    const elapsedTime = cardTimers[activeCard];
    const processName = document
      .getElementById(`btn-${activeCard}`)
      .querySelector(".font-bold").textContent;
    const newProcess = {
      name: processName,
      time: elapsedTime,
    };
    processHistory.push(newProcess);
    saveHistory();
  }

  processHistory = [];
  localStorage.removeItem("processHistory");
  console.log("Riwayat proses direset.");

  for (const cn in cardIntervals) {
    clearInterval(cardIntervals[cn]);
  }
  cardIntervals = {};
  activeCard = null;

  for (const cn in cardTimers) {
    cardTimers[cn] = 0;
    updateCardStopwatch(cn);
  }
  document.querySelectorAll("#main-grid button").forEach((button) => {
    button.classList.remove("active");
  });
};

document.getElementById("main-grid").addEventListener("click", (e) => {
  const button = e.target.closest("button");
  if (button) {
    const cardName = button.id.replace("btn-", "");
    if (cardName) {
      startMainStopwatch();
      startCardStopwatch(cardName);
    }
  }
});

document.getElementById("reset-btn").addEventListener("click", resetAll);

document.getElementById("btn-finish").addEventListener("click", () => {
  if (activeCard) {
    const elapsedTime = cardTimers[activeCard];
    const processName = document
      .getElementById(`btn-${activeCard}`)
      .querySelector(".font-bold").textContent;
    const newProcess = {
      name: processName,
      time: elapsedTime,
    };
    processHistory.push(newProcess);
    saveHistory();
  }
  // Tambahkan total waktu main timer ke localStorage sebelum pindah halaman
  localStorage.setItem("loadingTime", mainTimer);
});

window.addEventListener("load", function () {
  const preloader = document.getElementById("preloader");
  if (preloader) {
    preloader.style.opacity = "0";
    setTimeout(() => {
      preloader.style.display = "none";
    }, 500);
  }
  loadHistory();

  if (formData) {
    const data = JSON.parse(formData);
    document.getElementById("observerName").textContent = data.observer;
  }
});
