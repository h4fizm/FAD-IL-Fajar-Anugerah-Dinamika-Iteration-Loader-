// CUSTOM JS
AOS.init();

window.addEventListener("load", function () {
  const preloader = document.getElementById("preloader");
  if (preloader) {
    preloader.style.opacity = "0";
    setTimeout(() => {
      preloader.style.display = "none";
    }, 500);
  }

  const formData = localStorage.getItem("formData");
  const savedHistory = localStorage.getItem("processHistory");
  const loadingTime = localStorage.getItem("loadingTime");

  if (!formData || !savedHistory || !loadingTime) {
    Swal.fire({
      icon: "error",
      title: "Akses Ditolak",
      text: "Silakan jalankan proses terlebih dahulu di halaman proses.",
      showConfirmButton: false,
      timer: 2000,
    }).then(() => {
      window.location.href = "index2.html";
    });
    return;
  }

  // Standar waktu dalam milidetik
  const standards = {
    "TOP SOIL": { digging: 11000, cycle: 25500, loading: 220000 },
    "OB FREE DIG": { digging: 14500, cycle: 29000, loading: 275000 },
    "OB BLASTING": { digging: 10000, cycle: 24500, loading: 240000 },
    "OB RIPPING": { digging: 12500, cycle: 27000, loading: 245000 },
    common: {
      swing: 7000,
      "dump-bucket": 2500,
      "swing-empty": 5000,
      secondary: 0,
    },
  };

  const processHistory = JSON.parse(savedHistory);
  const dataForm = JSON.parse(formData);
  const materialType = dataForm.jenis_material.toUpperCase().trim();

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const m = String(totalMinutes).padStart(2, "0");
    const s = String(totalSeconds % 60).padStart(2, "0");
    const ms = String(Math.floor((milliseconds % 1000) / 10)).padStart(2, "0");
    return `${m}:${s}:${ms}`;
  };

  const calculateAverage = (processName) => {
    const filteredProcess = processHistory.filter(
      (p) => p.name.toUpperCase() === processName.toUpperCase()
    );
    if (filteredProcess.length === 0) return 0;
    const totalTime = filteredProcess.reduce((sum, p) => sum + p.time, 0);
    return totalTime / filteredProcess.length;
  };

  const calculatePassing = () => {
    return processHistory.filter((p) => p.name.toUpperCase() === "DUMP BUCKET")
      .length;
  };

  const avgDiggingTime = calculateAverage("DIGGING");
  const avgSwingTime = calculateAverage("SWING");
  const avgDumpBucketTime = calculateAverage("DUMP BUCKET");
  const avgSwingEmptyTime = calculateAverage("SWING EMPTY");
  const avgSecondaryTime = calculateAverage("SECONDARY");
  const totalPassing = calculatePassing();
  const cycleTimeMs =
    avgDiggingTime + avgSwingTime + avgDumpBucketTime + avgSwingEmptyTime;
  const totalLoadingTime = parseInt(loadingTime);

  // Isi data ke HTML
  document.getElementById("observer-name").textContent = dataForm.observer;
  document.getElementById("unit-name").textContent = dataForm.unit_loader;
  document.getElementById("material-type").textContent = materialType;
  document.getElementById("operator-name").textContent = dataForm.nama_operator;
  document.getElementById("total-passing").textContent = totalPassing;

  document.getElementById("digging-time").textContent =
    formatTime(avgDiggingTime);
  document.getElementById("swing-time").textContent = formatTime(avgSwingTime);
  document.getElementById("dump-bucket-time").textContent =
    formatTime(avgDumpBucketTime);
  document.getElementById("swing-empty-time").textContent =
    formatTime(avgSwingEmptyTime);
  document.getElementById("secondary-time").textContent =
    formatTime(avgSecondaryTime);
  document.getElementById("cycle-time").textContent = formatTime(cycleTimeMs);
  document.getElementById("loading-time").textContent =
    formatTime(totalLoadingTime);

  const applyColor = (elementId, calculatedTime, standardTime) => {
    const timeElement = document.getElementById(elementId);
    const warningElement = document.getElementById(elementId + "-warning");

    if (!timeElement) return;

    timeElement.classList.remove(
      "text-fad-dark",
      "text-fad-red",
      "text-fad-green"
    );
    if (warningElement) warningElement.innerHTML = "";

    if (calculatedTime > standardTime) {
      timeElement.classList.add("text-fad-red");
    } else {
      timeElement.classList.add("text-fad-green");
    }
  };

  const materialStandards = standards[materialType];
  if (materialStandards) {
    applyColor("digging-time", avgDiggingTime, materialStandards.digging);
    applyColor("swing-time", avgSwingTime, standards.common.swing);
    applyColor(
      "dump-bucket-time",
      avgDumpBucketTime,
      standards.common["dump-bucket"]
    );
    applyColor(
      "swing-empty-time",
      avgSwingEmptyTime,
      standards.common["swing-empty"]
    );

    // Logika baru: Secondary Time selalu hijau
    const secondaryTimeElement = document.getElementById("secondary-time");
    if (secondaryTimeElement) {
      secondaryTimeElement.classList.remove("text-fad-dark", "text-fad-red");
      secondaryTimeElement.classList.add("text-fad-green");
    }

    applyColor("cycle-time", cycleTimeMs, materialStandards.cycle);
    applyColor("loading-time", totalLoadingTime, materialStandards.loading);
  }
});

document.getElementById("btn-beranda").addEventListener("click", () => {
  localStorage.clear();
});

// EXPORT SPREADSHEET
const APP_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzLd5bLxNvn4dJFev_G0BdM72csNksbIfMrLg3dtEAIp7wOfEsWuVC93YI2bLyRJ9nQGA/exec";
document
  .getElementById("btn-kirim-data")
  .addEventListener("click", function () {
    const formData = localStorage.getItem("formData");
    const savedHistory = localStorage.getItem("processHistory");
    const loadingTime = localStorage.getItem("loadingTime");

    if (!formData || !savedHistory || !loadingTime) {
      Swal.fire({
        icon: "error",
        title: "Data Tidak Ditemukan",
        text: "Pastikan Anda telah mengisi dan menyimpan data terlebih dahulu.",
      });
      return;
    }

    const dataForm = JSON.parse(formData);
    const processHistory = JSON.parse(savedHistory);
    const totalLoadingTime = parseInt(loadingTime, 10);

    // Fungsi hitung rata-rata waktu proses
    const calculateAverage = (processName) => {
      const filteredProcess = processHistory.filter(
        (p) => p.name.toUpperCase() === processName.toUpperCase()
      );
      if (filteredProcess.length === 0) return 0;
      const totalTime = filteredProcess.reduce((sum, p) => sum + p.time, 0);
      return totalTime / filteredProcess.length;
    };

    const calculatePassing = () => {
      return processHistory.filter(
        (p) => p.name.toUpperCase() === "DUMP BUCKET"
      ).length;
    };

    const avgDiggingTime = calculateAverage("DIGGING");
    const avgSwingTime = calculateAverage("SWING");
    const avgDumpBucketTime = calculateAverage("DUMP BUCKET");
    const avgSwingEmptyTime = calculateAverage("SWING EMPTY");
    const avgSecondaryTime = calculateAverage("SECONDARY");
    const totalPassing = calculatePassing();
    const cycleTimeMs =
      avgDiggingTime + avgSwingTime + avgDumpBucketTime + avgSwingEmptyTime;

    // Data yang dikirim
    const postData = [
      {
        observer: dataForm.observer,
        unit_loader: dataForm.unit_loader,
        jenis_material: dataForm.jenis_material,
        nama_operator: dataForm.nama_operator,
        totalPassing: totalPassing,
        avgDiggingTime: avgDiggingTime,
        avgSwingTime: avgSwingTime,
        avgDumpBucketTime: avgDumpBucketTime,
        avgSwingEmptyTime: avgSwingEmptyTime,
        avgSecondaryTime: avgSecondaryTime,
        cycleTimeMs: cycleTimeMs,
        totalLoadingTime: totalLoadingTime,
      },
    ];

    Swal.fire({
      title: "Mengirim Data...",
      text: "Mohon tunggu sebentar.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    fetch(APP_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(postData),
      headers: { "Content-Type": "text/plain;charset=utf-8" },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Success:", data);
        if (data.status === "success") {
          Swal.fire({
            icon: "success",
            title: "Berhasil!",
            text: "Data berhasil diexport ke spreadsheet.",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Gagal!",
            text:
              data.message ||
              "Terjadi kesalahan saat mengirim data. Coba lagi.",
          });
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        Swal.fire({
          icon: "error",
          title: "Gagal!",
          text: "Terjadi kesalahan jaringan. Coba lagi.",
        });
      });
  });
