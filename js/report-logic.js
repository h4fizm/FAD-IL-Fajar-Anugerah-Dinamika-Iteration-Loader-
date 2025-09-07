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
  const initialData = data.initialData;
  const results = data.calculatedResults;
  const analisa = data.analisaProblem;

  // Validasi jika data hasil kalkulasi atau analisa belum tersimpan
  if (!results || !analisa) {
    Swal.fire({
      icon: "error",
      title: "Data Tidak Lengkap",
      text: "Hasil kalkulasi tidak ditemukan. Harap ulangi dari halaman analisa.",
      confirmButtonText: "Kembali",
    }).then(() => {
      window.location.href = "index4.html";
    });
    return;
  }

  // --- FUNGSI BANTUAN (HELPERS) ---
  const formatMinutesAndSeconds = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes} menit ${String(seconds).padStart(2, "0")} detik`;
  };

  const formatAnalysisForDisplay = (arr) => {
    if (!arr || arr.length === 0) return "N/A";
    return arr.length === 1 && arr[0] === "Nihil" ? "Nihil" : arr.join(", ");
  };

  // --- 2. TAMPILKAN HASIL KE HTML ---
  const pengajuanTanggal = initialData.tanggal_pengajuan.split(", ")[1];
  document.getElementById(
    "report-date"
  ).textContent = `Pengamatan: ${pengajuanTanggal} (Pukul Analisa: ${analisa.pengajuanAnalisa.jam})`;

  document.getElementById("data-nama-unit").textContent =
    initialData.unit_loader || "N/A";
  document.getElementById("data-jenis-material").textContent =
    analisa.jenisMaterial || "N/A";
  document.getElementById("data-nama-operator").textContent =
    initialData.nama_operator || "N/A";
  document.getElementById("data-observer").textContent =
    initialData.observer || "N/A";
  document.getElementById(
    "data-sesi-loader"
  ).textContent = `${results.perhitunganCount} kali`;

  // Analisis Loader
  document.getElementById("data-rata-passing").textContent = `${Math.round(
    results.rataRataPassing
  )} passing`;
  document.getElementById("data-rata-digging").textContent = `${(
    results.avgDiggingMs / 1000
  ).toFixed(2)} detik`;
  document.getElementById("data-rata-swing-load").textContent = `${(
    results.avgSwingLoadMs / 1000
  ).toFixed(2)} detik`;
  document.getElementById("data-rata-bucket-dump").textContent = `${(
    results.avgBucketDumpMs / 1000
  ).toFixed(2)} detik`;
  document.getElementById("data-rata-swing-empty").textContent = `${(
    results.avgSwingEmptyMs / 1000
  ).toFixed(2)} detik`;
  document.getElementById("data-rata-spotting").textContent = `${(
    results.avgSpottingMs / 1000
  ).toFixed(2)} detik`;
  document.getElementById("data-rata-hanging-time").textContent = `${(
    results.avgHangingMs / 1000
  ).toFixed(2)} detik`;

  document.getElementById("data-rata-cycletime-loader").textContent =
    formatMinutesAndSeconds(results.avgCycleTimeLoaderMs);
  document.getElementById("data-rata-loadingtime").textContent =
    formatMinutesAndSeconds(results.avgLoadingTimeMs);

  // Analisis Hauler & Produktivitas
  document.getElementById(
    "data-jarak-dumping"
  ).textContent = `${initialData.jarak_dumping} meter`;
  document.getElementById(
    "data-jumlah-hauler"
  ).textContent = `${initialData.jumlah_hauler} Unit`;
  document.getElementById("data-rata-cycletime-hauler").textContent =
    formatMinutesAndSeconds(results.avgCycleTimeHaulerMs);
  document.getElementById(
    "data-rata-kecepatan-hauler"
  ).textContent = `${results.avgKecepatanHauler.toFixed(2)} km/jam`;
  document.getElementById("data-matching-fleet").textContent =
    results.matchingFleet.toFixed(2);
  document.getElementById(
    "data-proyeksi-produktivitas"
  ).textContent = `${Math.round(results.proyeksiProdty)} Ritase`;

  // Analisa Problem Produktivitas
  document.getElementById("data-man").textContent = formatAnalysisForDisplay(
    analisa.man
  );
  document.getElementById("data-machine").textContent =
    formatAnalysisForDisplay(analisa.machine);
  document.getElementById("data-material").textContent =
    formatAnalysisForDisplay(analisa.material);
  document.getElementById("data-method").textContent = formatAnalysisForDisplay(
    analisa.method
  );
  document.getElementById("data-environment").textContent =
    formatAnalysisForDisplay(analisa.environment);
  document.getElementById("data-remaks").textContent = analisa.remaks;

  // --- 3. EVENT LISTENER UNTUK TOMBOL "Selesai & Mulai Baru" ---
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
        cancelButtonColor: "#E53E3E",
        confirmButtonText: "Ya, Mulai Baru!",
        cancelButtonText: "Batal",
      }).then((result) => {
        if (result.isConfirmed) {
          localStorage.clear();
          window.location.href = e.target.href;
        }
      });
    });

  // --- 4. LOGIKA UNTUK PDF ---
  const imageToBase64 = async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network response was not ok.");
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Gagal memuat gambar untuk PDF:", error);
      return null;
    }
  };

  document
    .getElementById("btn-preview-pdf")
    .addEventListener("click", async function () {
      const { jsPDF } = window.jspdf;

      if (!results || !analisa) {
        Swal.fire(
          "Data Tidak Lengkap",
          "Data laporan tidak lengkap. Harap ulangi proses.",
          "error"
        );
        return;
      }

      Swal.fire({
        title: "Sedang menyiapkan PDF...",
        text: "Harap tunggu sebentar.",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      try {
        const logoData = await imageToBase64("img/picture.jpg");

        const doc = new jsPDF();
        let currentY = 10;
        const marginX = 14;

        if (logoData) {
          const img = new Image();
          img.src = logoData;
          await new Promise((resolve) => (img.onload = resolve));
          const imgWidth = img.width;
          const imgHeight = img.height;
          const logoDisplayWidth = 40;
          const logoDisplayHeight = (imgHeight / imgWidth) * logoDisplayWidth;

          doc.addImage(
            logoData,
            "JPEG",
            doc.internal.pageSize.getWidth() / 2 - logoDisplayWidth / 2,
            currentY,
            logoDisplayWidth,
            logoDisplayHeight
          );
          currentY += logoDisplayHeight + 5;
        }

        doc.setFontSize(16).setFont("helvetica", "bold");
        doc.text(
          "Laporan Monitoring dan Evaluasi Productivity",
          doc.internal.pageSize.getWidth() / 2,
          currentY + 5,
          { align: "center" }
        );
        currentY += 5 + 7;

        doc.setFontSize(10).setFont("helvetica", "normal");
        const pengamatanDate = initialData.tanggal_pengajuan;
        const analisaTime = analisa.pengajuanAnalisa.jam;
        doc.text(
          `Pengamatan: ${pengamatanDate} (Pukul Analisa: ${analisaTime})`,
          doc.internal.pageSize.getWidth() / 2,
          currentY + 3,
          { align: "center" }
        );
        currentY += 3 + 10;

        const formatMinutesAndSecondsPDF = (ms) => {
          const totalSeconds = Math.floor(ms / 1000);
          const minutes = Math.floor(totalSeconds / 60);
          const seconds = totalSeconds % 60;
          return `${minutes} menit ${String(seconds).padStart(2, "0")} detik`;
        };
        const formatAnalysisForPDF = (arr) => {
          if (!arr || arr.length === 0) return "Nihil";
          const formattedArr = arr.map((it) => {
            const bagian = it.split(" : ");
            return "• " + (bagian[1] || it);
          });
          return formattedArr.join("\n");
        };

        const tableOptions = {
          startY: currentY,
          theme: "grid",
          styles: { fontSize: 8, cellPadding: 1.5, overflow: "linebreak" },
          headStyles: {
            fillColor: [210, 210, 210],
            textColor: 20,
            fontStyle: "bold",
            halign: "left",
            fontSize: 9,
          },
          columnStyles: {
            0: { fontStyle: "bold", cellWidth: 60 },
            1: { cellWidth: "auto" },
          },
          margin: { left: marginX, right: marginX },
        };

        const generalInfo = [
          ["Nama Unit", initialData.unit_loader || "-"],
          ["Jenis Material", analisa.jenisMaterial || "-"],
          ["Nama Operator", initialData.nama_operator || "-"],
          ["Observer", initialData.observer || "-"],
          ["Jumlah Sesi Loader", `${results.perhitunganCount} Kali`],
        ];

        const loaderAnalysis = [
          [
            "Rata-rata Jumlah Passing",
            `${Math.round(results.rataRataPassing)} passing`,
          ],
          [
            "Rata-rata Digging Time",
            `${(results.avgDiggingMs / 1000).toFixed(2)} detik`,
          ],
          [
            "Rata-rata Swing Load",
            `${(results.avgSwingLoadMs / 1000).toFixed(2)} detik`,
          ],
          [
            "Rata-rata Bucket Dump",
            `${(results.avgBucketDumpMs / 1000).toFixed(2)} detik`,
          ],
          [
            "Rata-rata Swing Empty",
            `${(results.avgSwingEmptyMs / 1000).toFixed(2)} detik`,
          ],
          [
            "Rata-rata Spotting Time",
            `${(results.avgSpottingMs / 1000).toFixed(2)} detik`,
          ],
          [
            "Rata-rata Hanging Time",
            `${(results.avgHangingMs / 1000).toFixed(2)} detik`,
          ],
          [
            "Rata-rata Cycle Time Loader",
            formatMinutesAndSecondsPDF(results.avgCycleTimeLoaderMs),
          ],
          [
            "Rata-rata Loading Time",
            formatMinutesAndSecondsPDF(results.avgLoadingTimeMs),
          ],
        ];

        const haulerAnalysis = [
          ["Jarak Dumping", `${initialData.jarak_dumping} meter`],
          ["Jumlah Hauler", `${initialData.jumlah_hauler} Unit`],
          [
            "Rata-rata Cycle Time Hauler",
            formatMinutesAndSecondsPDF(results.avgCycleTimeHaulerMs),
          ],
          [
            "Rata-rata Kecepatan Hauler",
            `${results.avgKecepatanHauler.toFixed(2)} km/jam`,
          ],
          ["Matching Fleet", results.matchingFleet.toFixed(2)],
          [
            "Proyeksi Produktivitas",
            `${Math.round(results.proyeksiProdty)} Ritase`,
          ],
        ];

        const problemAnalysis = [
          ["Man", formatAnalysisForPDF(analisa.man)],
          ["Machine", formatAnalysisForPDF(analisa.machine)],
          ["Material", formatAnalysisForPDF(analisa.material)],
          ["Method", formatAnalysisForPDF(analisa.method)],
          ["Environment", formatAnalysisForPDF(analisa.environment)],
          ["Remaks Tambahan", analisa.remaks || "-"],
        ];

        doc.autoTable({
          ...tableOptions,
          head: [
            [
              {
                content: "Informasi Umum",
                colSpan: 2,
                styles: { halign: "left", fillColor: [210, 210, 210] },
              },
            ],
          ],
          body: generalInfo,
        });

        doc.autoTable({
          ...tableOptions,
          head: [
            [
              {
                content: "Analisis Loader",
                colSpan: 2,
                styles: { halign: "left", fillColor: [210, 210, 210] },
              },
            ],
          ],
          body: loaderAnalysis,
        });

        doc.autoTable({
          ...tableOptions,
          head: [
            [
              {
                content: "Analisis Hauler & Produktivitas",
                colSpan: 2,
                styles: { halign: "left", fillColor: [210, 210, 210] },
              },
            ],
          ],
          body: haulerAnalysis,
        });

        doc.autoTable({
          ...tableOptions,
          head: [
            [
              {
                content: "Analisa Problem Produktivitas",
                colSpan: 2,
                styles: { halign: "left", fillColor: [210, 210, 210] },
              },
            ],
          ],
          body: problemAnalysis,
        });

        setTimeout(() => {
          const fileName = `Laporan_FAD_${initialData.unit_loader || "UNIT"}_${
            analisa.pengajuanAnalisa.tanggal
          }.pdf`;
          doc.save(fileName);
          Swal.close();
        }, 1000);
      } catch (error) {
        console.error("Gagal membuat PDF:", error);
        Swal.fire("Gagal", "Tidak dapat membuat PDF.", "error");
      }
    });
});
