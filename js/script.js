const stopwatchCount = 5; // jumlah stopwatch
const container = document.getElementById("stopwatches");

// Membuat stopwatch dinamis
for (let i = 1; i <= stopwatchCount; i++) {
  container.innerHTML += `
        <div style="margin-bottom:20px; border:1px solid #ccc; padding:10px;">
            <h3>Stopwatch ${i}</h3>
            <div id="display-${i}">00:00:00</div>
            <button id="playBtn-${i}">Play</button>
            <button id="stopBtn-${i}">Stop</button>
            <button id="resetBtn-${i}">Reset</button>
            <button id="exportBtn-${i}">Export Excel</button>
        </div>
    `;
}

let stopwatches = {};

// Fungsi membuat setiap stopwatch
function createStopwatch(id) {
  let startTime;
  let timerInterval;
  let isStopped = false;

  function updateDisplay() {
    const elapsedTime = Date.now() - startTime;
    const totalSeconds = Math.floor(elapsedTime / 1000);

    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
      2,
      "0"
    );
    const seconds = String(totalSeconds % 60).padStart(2, "0");

    document.getElementById(
      `display-${id}`
    ).textContent = `${hours}:${minutes}:${seconds}`;
  }

  document
    .getElementById(`playBtn-${id}`)
    .addEventListener("click", function () {
      if (isStopped) return;
      startTime = Date.now();
      clearInterval(timerInterval);
      timerInterval = setInterval(updateDisplay, 1000);
    });

  document
    .getElementById(`stopBtn-${id}`)
    .addEventListener("click", function () {
      if (isStopped) return;
      clearInterval(timerInterval);
      isStopped = true;

      const finalTime = document.getElementById(`display-${id}`).textContent;
      let historyKey = `history${id}`;
      let history = JSON.parse(localStorage.getItem(historyKey)) || [];
      let newId = history.length > 0 ? history[history.length - 1].id + 1 : 1;
      history.push({ id: newId, time: finalTime });
      localStorage.setItem(historyKey, JSON.stringify(history));
    });

  document
    .getElementById(`resetBtn-${id}`)
    .addEventListener("click", function () {
      clearInterval(timerInterval);
      document.getElementById(`display-${id}`).textContent = "00:00:00";
      isStopped = false;
      localStorage.removeItem(`history${id}`);
    });

  document
    .getElementById(`exportBtn-${id}`)
    .addEventListener("click", function () {
      let history = JSON.parse(localStorage.getItem(`history${id}`)) || [];
      if (history.length === 0) {
        alert(`Stopwatch ${id}: Tidak ada data untuk diexport!`);
        return;
      }
      const worksheet = XLSX.utils.json_to_sheet(history);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `History-${id}`);
      XLSX.writeFile(workbook, `stopwatch${id}_history.xlsx`);
    });
}

// Buat semua stopwatch
for (let i = 1; i <= stopwatchCount; i++) {
  stopwatches[i] = createStopwatch(i);
}
