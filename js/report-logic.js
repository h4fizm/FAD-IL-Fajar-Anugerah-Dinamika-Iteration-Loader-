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
  const {
    initialData,
    calculatedResults: results,
    analisaProblem: analisa,
  } = data;

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

  const formatAnalysisForPDF = (arr) => {
    if (!arr || arr.length === 0 || (arr.length === 1 && arr[0] === "Nihil")) {
      return "Nihil";
    }
    const formattedArr = arr.map((it) => `• ${it.split(" : ")[1] || it}`);
    return formattedArr.join("\n");
  };

  // --- 2. TAMPILKAN HASIL KE HTML ---
  const pengajuanTanggal = initialData.tanggal_pengajuan.split(", ")[1];
  document.getElementById(
    "report-date"
  ).textContent = `Pengamatan: ${pengajuanTanggal} (Pukul Analisa: ${analisa.pengajuanAnalisa.jam})`;

  // Menggunakan perulangan untuk mengisi data ke HTML
  const fields = {
    "data-nama-unit": initialData.unit_loader,
    "data-jenis-material": analisa.jenisMaterial,
    "data-nama-operator": initialData.nama_operator,
    "data-observer": initialData.observer,
    "data-sesi-loader": `${results.perhitunganCount} kali`,
    "data-rata-passing": `${Math.round(results.rataRataPassing)} passing`,
    "data-rata-digging": `${(results.avgDiggingMs / 1000).toFixed(2)} detik`,
    "data-rata-swing-load": `${(results.avgSwingLoadMs / 1000).toFixed(
      2
    )} detik`,
    "data-rata-bucket-dump": `${(results.avgBucketDumpMs / 1000).toFixed(
      2
    )} detik`,
    "data-rata-swing-empty": `${(results.avgSwingEmptyMs / 1000).toFixed(
      2
    )} detik`,
    "data-rata-spotting": `${(results.avgSpottingMs / 1000).toFixed(2)} detik`,
    "data-rata-hanging-time": `${(results.avgHangingMs / 1000).toFixed(
      2
    )} detik`,
    "data-rata-cycletime-loader": formatMinutesAndSeconds(
      results.avgCycleTimeLoaderMs
    ),
    "data-rata-loadingtime": formatMinutesAndSeconds(results.avgLoadingTimeMs),
    "data-jarak-dumping": `${initialData.jarak_dumping} meter`,
    "data-jumlah-hauler": `${initialData.jumlah_hauler} Unit`,
    "data-rata-cycletime-hauler": formatMinutesAndSeconds(
      results.avgCycleTimeHaulerMs
    ),
    "data-rata-kecepatan-hauler": `${results.avgKecepatanHauler.toFixed(
      2
    )} km/jam`,
    "data-matching-fleet": results.matchingFleet.toFixed(2),
    "data-proyeksi-produktivitas": `${Math.round(
      results.proyeksiProdty
    )} Ritase`,
    "data-man": formatAnalysisForDisplay(analisa.man),
    "data-machine": formatAnalysisForDisplay(analisa.machine),
    "data-material": formatAnalysisForDisplay(analisa.material),
    "data-method": formatAnalysisForDisplay(analisa.method),
    "data-environment": formatAnalysisForDisplay(analisa.environment),
    "data-remaks": analisa.remaks,
  };

  for (const id in fields) {
    if (document.getElementById(id)) {
      document.getElementById(id).textContent = fields[id] || "N/A";
    }
  }

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
        const doc = new jsPDF();
        let currentY = 10;
        const marginX = 14;
        const unit_loader = initialData.unit_loader || "UNIT";
        const pengamatanDate = initialData.tanggal_pengajuan;
        const analisaTime = analisa.pengajuanAnalisa.jam;

        // Mendapatkan logo
        const logoData = await imageToBase64("img/picture.jpg");
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

        // Judul Laporan
        doc.setFontSize(14).setFont("helvetica", "bold");
        doc.text(
          "PT FAJAR ANUGERAH DINAMIKA",
          doc.internal.pageSize.getWidth() / 2,
          currentY + 5,
          { align: "center" }
        );
        doc.setFontSize(12).setFont("helvetica", "normal");
        doc.text(
          "Laporan Monitoring dan Evaluasi Productivity",
          doc.internal.pageSize.getWidth() / 2,
          currentY + 12,
          { align: "center" }
        );
        doc.setFontSize(10);
        currentY += 18 + 5;

        // Tanggal
        doc.setFontSize(10).setFont("helvetica", "normal");
        doc.text(
          `Pengamatan: ${pengamatanDate} (Pukul Pengamatan: ${analisaTime})`,
          doc.internal.pageSize.getWidth() / 2,
          currentY + 3,
          { align: "center" }
        );
        currentY += 3 + 10;

        // Opsi tabel
        const tableOptions = {
          theme: "grid",
          styles: {
            fontSize: 9,
            cellPadding: 1.5,
            overflow: "linebreak",
            valign: "middle",
          },
          headStyles: {
            fillColor: [210, 210, 210],
            textColor: 20,
            fontStyle: "bold",
            halign: "left",
            fontSize: 10,
          },
          columnStyles: {
            0: { fontStyle: "bold", cellWidth: 70 },
            1: { cellWidth: "auto" },
          },
          margin: { left: marginX, right: marginX },
        };

        // Data untuk tabel
        const generalInfo = [
          ["Nama Unit", initialData.unit_loader || "N/A"],
          ["Jenis Material", analisa.jenisMaterial || "N/A"],
          ["Nama Operator", initialData.nama_operator || "N/A"],
          ["Observer", initialData.observer || "N/A"],
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
            formatMinutesAndSeconds(results.avgCycleTimeLoaderMs),
          ],
          [
            "Rata-rata Loading Time",
            formatMinutesAndSeconds(results.avgLoadingTimeMs),
          ],
        ];

        const haulerAnalysis = [
          ["Jarak Dumping", `${initialData.jarak_dumping} meter`],
          ["Jumlah Hauler", `${initialData.jumlah_hauler} Unit`],
          [
            "Rata-rata Cycle Time Hauler",
            formatMinutesAndSeconds(results.avgCycleTimeHaulerMs),
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

        // Buat tabel di PDF secara berurutan
        doc.autoTable({
          startY: currentY,
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
          ...tableOptions,
        });

        doc.autoTable({
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
          ...tableOptions,
        });

        doc.autoTable({
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
          ...tableOptions,
        });

        doc.autoTable({
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
          ...tableOptions,
        });

        setTimeout(() => {
          const fileName = `Laporan_FAD_${unit_loader}_${pengamatanDate.replace(
            / /g,
            "-"
          )}.pdf`;
          doc.save(fileName);
          Swal.close();
        }, 1000);
      } catch (error) {
        console.error("Gagal membuat PDF:", error);
        Swal.fire("Gagal", "Tidak dapat membuat PDF.", "error");
      }
    });
});
