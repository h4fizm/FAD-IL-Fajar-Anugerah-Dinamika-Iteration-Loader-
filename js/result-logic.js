// // File: js/results-logic.js (SUDAH DIPERBAIKI)

// document.addEventListener("DOMContentLoaded", function () {
//   AOS.init();

//   const APP_SCRIPT_URL =
//     "https://script.google.com/macros/s/AKfycbzLd5bLxNvn4dJFev_G0BdM72csNksbIfMrLg3dtEAIp7wOfEsWuVC93YI2bLyRJ9nQGA/exec";

//   const preloader = document.getElementById("preloader");
//   if (preloader) {
//     preloader.style.opacity = "0";
//     setTimeout(() => {
//       preloader.style.display = "none";
//     }, 500);
//   }

//   const formData = localStorage.getItem("formData");
//   const savedHistory = localStorage.getItem("processHistory");
//   const loadingTime = localStorage.getItem("loadingTime");

//   if (!formData || !savedHistory || !loadingTime) {
//     Swal.fire({
//       icon: "error",
//       title: "Akses Ditolak",
//       text: "Silakan jalankan proses terlebih dahulu.",
//       showConfirmButton: false,
//       timer: 2000,
//     }).then(() => {
//       window.location.href = "index2.html";
//     });
//     return;
//   }

//   const processHistory = JSON.parse(savedHistory);
//   const dataForm = JSON.parse(formData);
//   const totalLoadingTime = parseInt(loadingTime);

//   const formatTime = (milliseconds) => {
//     const totalSeconds = Math.floor(milliseconds / 1000);
//     const totalMinutes = Math.floor(totalSeconds / 60);
//     const m = String(totalMinutes).padStart(2, "0");
//     const s = String(totalSeconds % 60).padStart(2, "0");
//     const ms = String(Math.floor((milliseconds % 1000) / 10)).padStart(2, "0");
//     return `${m}:${s}:${ms}`;
//   };

//   const calculateAverage = (processName) => {
//     const filteredProcess = processHistory.filter(
//       (p) => p.name.toUpperCase() === processName.toUpperCase()
//     );
//     if (filteredProcess.length === 0) return 0;
//     const totalTime = filteredProcess.reduce((sum, p) => sum + p.time, 0);
//     return totalTime / filteredProcess.length;
//   };

//   const calculatePassing = () => {
//     return processHistory.filter((p) => p.name.toUpperCase() === "DUMP BUCKET")
//       .length;
//   };

//   const avgDiggingTime = calculateAverage("DIGGING");
//   const avgSwingTime = calculateAverage("SWING");
//   const avgDumpBucketTime = calculateAverage("DUMP BUCKET");
//   const avgSwingEmptyTime = calculateAverage("SWING EMPTY");
//   const avgSecondaryTime = calculateAverage("SECONDARY");
//   const totalPassing = calculatePassing();
//   const cycleTimeMs =
//     avgDiggingTime + avgSwingTime + avgDumpBucketTime + avgSwingEmptyTime;

//   // Tampilkan data ke HTML
//   document.getElementById("observer-name").textContent = dataForm.observer;
//   document.getElementById("unit-name").textContent = dataForm.unit_loader;
//   document.getElementById("material-type").textContent =
//     dataForm.jenis_material;
//   document.getElementById("operator-name").textContent = dataForm.nama_operator;
//   document.getElementById("total-passing").textContent = totalPassing;
//   document.getElementById("digging-time").textContent =
//     formatTime(avgDiggingTime);
//   document.getElementById("swing-time").textContent = formatTime(avgSwingTime);
//   document.getElementById("dump-bucket-time").textContent =
//     formatTime(avgDumpBucketTime);
//   document.getElementById("swing-empty-time").textContent =
//     formatTime(avgSwingEmptyTime);
//   document.getElementById("secondary-time").textContent =
//     formatTime(avgSecondaryTime);
//   document.getElementById("cycle-time").textContent = formatTime(cycleTimeMs);
//   document.getElementById("loading-time").textContent =
//     formatTime(totalLoadingTime);

//   // Event Listeners
//   document.getElementById("btn-beranda").addEventListener("click", () => {
//     localStorage.clear();
//   });

//   document
//     .getElementById("btn-kirim-data")
//     .addEventListener("click", function () {
//       // Fungsi untuk mendapatkan tanggal berformat "Sabtu, 30 Agustus 2025"
//       const getFormattedDate = () => {
//         const now = new Date();
//         const options = {
//           weekday: "long",
//           year: "numeric",
//           month: "long",
//           day: "numeric",
//         };
//         return now.toLocaleDateString("id-ID", options);
//       };

//       const postData = [
//         {
//           // DIUBAH: Tambahkan tanggal yang diformat
//           tanggal_pengajuan: getFormattedDate(),
//           observer: dataForm.observer,
//           unit_loader: dataForm.unit_loader,
//           jenis_material: dataForm.jenis_material,
//           nama_operator: dataForm.nama_operator,
//           totalPassing: totalPassing,
//           // DIUBAH: Kirim dalam milidetik asli (tanpa / 1000)
//           avgDiggingTime: avgDiggingTime,
//           avgSwingTime: avgSwingTime,
//           avgDumpBucketTime: avgDumpBucketTime,
//           avgSwingEmptyTime: avgSwingEmptyTime,
//           avgSecondaryTime: avgSecondaryTime,
//           // DIUBAH: Nama key diperbaiki dan dikirim dalam milidetik
//           cycleTimeMs: cycleTimeMs,
//           totalLoadingTime: totalLoadingTime,
//         },
//       ];

//       Swal.fire({
//         title: "Mengirim Data...",
//         text: "Mohon tunggu sebentar.",
//         allowOutsideClick: false,
//         didOpen: () => {
//           Swal.showLoading();
//         },
//       });

//       fetch(APP_SCRIPT_URL, {
//         method: "POST",
//         body: JSON.stringify(postData),
//         headers: { "Content-Type": "text/plain;charset=utf-8" },
//       })
//         .then((response) => response.json())
//         .then((data) => {
//           if (data.status === "success") {
//             Swal.fire({
//               icon: "success",
//               title: "Berhasil!",
//               text: "Data berhasil diexport.",
//             });
//           } else {
//             Swal.fire({
//               icon: "error",
//               title: "Gagal!",
//               text: data.message || "Terjadi kesalahan.",
//             });
//           }
//         })
//         .catch((error) => {
//           console.error("Error:", error);
//           Swal.fire({
//             icon: "error",
//             title: "Gagal!",
//             text: "Terjadi kesalahan jaringan.",
//           });
//         });
//     });
// });
