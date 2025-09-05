// File: js/report-logic.js (Final - Hanya Menampilkan Data)
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

  // Validasi jika data hasil kalkulasi belum tersimpan
  if (!data.calculatedResults) {
    Swal.fire({
      icon: "error",
      title: "Data Tidak Lengkap",
      text: "Hasil kalkulasi tidak ditemukan. Harap ulangi dari halaman resume.",
      confirmButtonText: "Kembali",
    }).then(() => {
      window.location.href = "index3.html";
    });
    return;
  }

  const initialData = data.initialData;
  const results = data.calculatedResults;
  const analisa = data.analisaProblem;

  // --- gunakan analisa.pengajuanAnalisa untuk tanggal & jam ---
  const pengajuanHari = analisa.pengajuanAnalisa?.hari || "-";
  const pengajuanTanggal = analisa.pengajuanAnalisa?.tanggal || "-";
  const pengajuanJam = analisa.pengajuanAnalisa?.jam || "-";

  // --- TAMPILKAN DATA KE HTML (MENGGUNAKAN VARIABEL BARU) ---
  document.getElementById(
    "report-date"
  ).textContent = `${pengajuanHari}, ${pengajuanTanggal}`;
  document.getElementById("data-nama-unit").textContent =
    initialData.unit_loader || "N/A";
  document.getElementById("data-jenis-material").textContent =
    initialData.jenis_material || "N/A";
  document.getElementById("data-nama-operator").textContent =
    initialData.nama_operator || "N/A";
  document.getElementById("data-observer").textContent =
    initialData.observer || "N/A";
  document.getElementById(
    "data-sesi-loader"
  ).textContent = `${results.perhitunganCount} kali`;

  // Penyesuaian: Menggunakan toFixed(0) untuk membulatkan
  document.getElementById(
    "data-rata-passing"
  ).textContent = `${results.rataRataPassing.toFixed(0)} passing`;

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
  document.getElementById("data-rata-cycletime-loader").textContent = `${(
    results.avgCycleTimeLoaderMs / 1000
  ).toFixed(2)} detik`;
  document.getElementById(
    "data-rata-loadingtime"
  ).textContent = `${results.avgLoadingTimeMin.toFixed(2)} menit`;

  document.getElementById(
    "data-jarak-dumping"
  ).textContent = `${initialData.jarak_dumping} meter`;
  document.getElementById(
    "data-jumlah-hauler"
  ).textContent = `${initialData.jumlah_hauler} Unit`;
  document.getElementById(
    "data-rata-cycletime-hauler"
  ).textContent = `${results.avgCycleTimeHaulerMin.toFixed(2)} menit`;
  document.getElementById(
    "data-rata-kecepatan-hauler"
  ).textContent = `${results.avgKecepatanHauler.toFixed(2)} km/jam`;
  document.getElementById("data-matching-fleet").textContent =
    results.matchingFleet.toFixed(2);

  // Penyesuaian: Menggunakan toFixed(0) untuk membulatkan
  document.getElementById(
    "data-proyeksi-produktivitas"
  ).textContent = `${results.proyeksiProdty.toFixed(0)} Ritase`;

  // Menampilkan data analisa masalah
  const formatAnalysis = (arr) => {
    if (!arr || arr.length === 0) return "Nihil";
    return arr.length === 1 &&
      (arr[0] === "-KOSONG-" || arr[0].includes("Nihil"))
      ? "Nihil"
      : arr.join("; ");
  };
  document.getElementById("data-man").textContent = formatAnalysis(analisa.man);
  document.getElementById("data-machine").textContent = formatAnalysis(
    analisa.machine
  );
  document.getElementById("data-material").textContent = formatAnalysis(
    analisa.material
  );
  document.getElementById("data-method").textContent = formatAnalysis(
    analisa.method
  );
  document.getElementById("data-environment").textContent = formatAnalysis(
    analisa.environment
  );
  document.getElementById("data-remaks").textContent = analisa.remaks;

  // Tombol Mulai Sesi Baru
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

  // Skrip PDF - Cukup mengambil data yang sudah diformat
  document
    .getElementById("btn-preview-pdf")
    .addEventListener("click", async function () {
      const { jsPDF } = window.jspdf;
      const reportDataString = localStorage.getItem("fullCycleReportData");

      if (
        !reportDataString ||
        !JSON.parse(reportDataString).calculatedResults
      ) {
        Swal.fire(
          "Data Tidak Lengkap",
          "Data laporan tidak lengkap atau belum dihitung. Harap ulangi proses.",
          "error"
        );
        return;
      }

      const reportData = JSON.parse(reportDataString);

      Swal.fire({
        title: "Sedang menyiapkan PDF...",
        text: "Harap tunggu sebentar",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      try {
        const logoData = await imageToBase64("img/icon.jpg");

        const initialData = reportData.initialData;
        const results = reportData.calculatedResults;
        const analisa = reportData.analisaProblem;
        const pengajuan = reportData.pengajuan;

        const doc = new jsPDF();

        let currentY = 10;
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
            14,
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
        doc.text(
          `Pengamatan: ${pengajuanHari}, ${pengajuanTanggal} (Pukul Pengamatan: ${pengajuanJam})`,
          doc.internal.pageSize.getWidth() / 2,
          currentY + 3,
          { align: "center" }
        );

        const tableOptions = {
          theme: "grid",
          styles: { fontSize: 8, cellPadding: 1.5 },
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
          margin: { left: 14, right: 14 },
        };
        const generalInfo = [
          ["Nama Unit", initialData.unit_loader || "-"],
          ["Jenis Material", initialData.jenis_material || "-"],
          ["Nama Operator", initialData.nama_operator || "-"],
          ["Observer", initialData.observer || "-"],
          ["Jumlah Sesi Loader", `${results.perhitunganCount} Kali`],
        ];

        // Penyesuaian untuk PDF: Menggunakan toFixed(0)
        const loaderAnalysis = [
          [
            "Rata-rata Jumlah Passing",
            `${results.rataRataPassing.toFixed(0)} passing`,
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
            "Rata-rata Cycle Time Loader",
            `${(results.avgCycleTimeLoaderMs / 1000).toFixed(2)} detik`,
          ],
          [
            "Rata-rata Loading Time",
            `${results.avgLoadingTimeMin.toFixed(2)} menit`,
          ],
        ];

        const haulerAnalysis = [
          ["Jarak Dumping", `${initialData.jarak_dumping} meter`],
          ["Jumlah Hauler", `${initialData.jumlah_hauler} Unit`],
          [
            "Rata-rata Cycle Time Hauler",
            `${results.avgCycleTimeHaulerMin.toFixed(2)} menit`,
          ],
          [
            "Rata-rata Kecepatan Hauler",
            `${results.avgKecepatanHauler.toFixed(2)} km/jam`,
          ],
          ["Matching Fleet", results.matchingFleet.toFixed(2)],
          [
            "Proyeksi Produktivitas",
            `${results.proyeksiProdty.toFixed(0)} Ritase`,
          ],
        ];

        const formatAnalysisForPDF = (arr) => {
          if (!arr || arr.length === 0) return "Nihil";
          return arr.length === 1 &&
            (arr[0] === "-KOSONG-" || arr[0].includes("Nihil"))
            ? "Nihil"
            : arr.join("; ");
        };
        const problemAnalysis = [
          ["Man", formatAnalysisForPDF(analisa.man)],
          ["Machine", formatAnalysisForPDF(analisa.machine)],
          ["Material", formatAnalysisForPDF(analisa.material)],
          ["Method", formatAnalysisForPDF(analisa.method)],
          ["Environment", formatAnalysisForPDF(analisa.environment)],
          ["Remaks Tambahan", analisa.remaks || "-"],
        ];

        doc.autoTable({
          startY: currentY + 5,
          head: [
            [
              {
                content: "Informasi Umum",
                colSpan: 2,
                styles: { halign: "left" },
              },
            ],
          ],
          body: generalInfo,
          ...tableOptions,
        });
        doc.autoTable({
          head: [
            [
              {
                content: "Analisis Loader",
                colSpan: 2,
                styles: { halign: "left" },
              },
            ],
          ],
          body: loaderAnalysis,
          ...tableOptions,
        });
        doc.autoTable({
          head: [
            [
              {
                content: "Analisis Hauler & Produktivitas",
                colSpan: 2,
                styles: { halign: "left" },
              },
            ],
          ],
          body: haulerAnalysis,
          ...tableOptions,
        });
        doc.autoTable({
          head: [
            [
              {
                content: "Analisa Problem Produktivitas",
                colSpan: 2,
                styles: { halign: "left" },
              },
            ],
          ],
          body: problemAnalysis,
          ...tableOptions,
        });

        setTimeout(() => {
          const fileName = `Laporan_FAD_${
            initialData.unit_loader || "UNIT"
          }_${pengajuanTanggal}.pdf`;
          doc.save(fileName);
          Swal.close();
        }, 1000);
      } catch (error) {
        console.error("Gagal membuat PDF:", error);
        Swal.fire(
          "Gagal",
          "Tidak dapat memuat logo atau membuat PDF.",
          "error"
        );
      }
    });
});
