// File: js/analisa-form.js
document.addEventListener("DOMContentLoaded", function () {
  // --- KONFIGURASI ---
  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbxfbwIuMsngftdCMrKgwjAoPBo_HVsJM8xjlOVuM2avtA05TMagdu5BrJp1dVJ4yH4Kqg/exec";

  // --- CEK DATA AWAL ---
  if (!localStorage.getItem("fullCycleReportData")) {
    Swal.fire({
      icon: "error",
      title: "Akses Ditolak",
      text: "Data resume monitoring tidak ditemukan. Silakan ulangi proses.",
      confirmButtonText: "Kembali",
      allowOutsideClick: false,
    }).then(() => {
      window.location.href = "index3.html";
    });
    return;
  }

  // --- FUNGSI MULTISELECT DROPDOWN ---
  const dropdowns = document.querySelectorAll("[data-multiselect-dropdown]");

  const updateMultiselectButtonText = (dropdown) => {
    const button = dropdown.querySelector(".multiselect-button");
    const buttonSpan = button.querySelector("span");
    const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]');

    const originalText =
      buttonSpan.dataset.originalText || buttonSpan.textContent;

    if (!buttonSpan.dataset.originalText) {
      buttonSpan.dataset.originalText = originalText;
    }

    const selectedCheckboxes = Array.from(checkboxes).filter(
      (cb) => cb.checked && !cb.dataset.kosong
    );

    const count = selectedCheckboxes.length;
    const isKosongSelected = dropdown.querySelector(
      'input[data-kosong="true"]'
    ).checked;

    if (isKosongSelected) {
      buttonSpan.textContent = `${originalText} (Nihil)`;
    } else if (count === 0) {
      buttonSpan.textContent = originalText;
    } else {
      buttonSpan.textContent = `${originalText} (${count} terpilih)`;
    }
  };

  dropdowns.forEach((dropdown) => {
    const button = dropdown.querySelector(".multiselect-button");
    const panel = dropdown.querySelector(".multiselect-panel");
    const hiddenSelect = dropdown.querySelector("select");
    const allCheckboxes = dropdown.querySelectorAll('input[type="checkbox"]');
    const kosongCheckbox = dropdown.querySelector('input[data-kosong="true"]');
    const normalCheckboxes = dropdown.querySelectorAll(
      'input:not([data-kosong="true"])'
    );

    updateMultiselectButtonText(dropdown);

    button.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdowns.forEach((other) => {
        if (other !== dropdown) {
          other.querySelector(".multiselect-panel").classList.add("hidden");
        }
      });
      panel.classList.toggle("hidden");
    });

    allCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          if (checkbox.dataset.kosong === "true") {
            normalCheckboxes.forEach((cb) => (cb.checked = false));
          } else {
            if (kosongCheckbox) {
              kosongCheckbox.checked = false;
            }
          }
        }
        allCheckboxes.forEach((cb) => {
          const option = hiddenSelect.querySelector(
            `option[value="${cb.value}"]`
          );
          if (option) option.selected = cb.checked;
        });
        updateMultiselectButtonText(dropdown);
      });
    });

    panel.addEventListener("click", (e) => e.stopPropagation());
  });

  window.addEventListener("click", () => {
    dropdowns.forEach((d) =>
      d.querySelector(".multiselect-panel").classList.add("hidden")
    );
  });

  // --- FORM SUBMISSION ---
  const form = document.getElementById("dataForm");
  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    // Fungsi untuk mengambil nilai dari dropdown multiselect
    const getSelectedValues = (container) => {
      const checkedBoxes = container.querySelectorAll(
        'input[type="checkbox"]:checked:not([data-kosong="true"])'
      );
      const kosongBox = container.querySelector(
        'input[type="checkbox"][data-kosong="true"]'
      );
      if (kosongBox && kosongBox.checked) {
        return ["Nihil"];
      }
      return Array.from(checkedBoxes).map((cb) => cb.value);
    };

    const jenisMaterial = document.getElementById("jenisMaterial").value;
    const manProblems = getSelectedValues(
      document
        .getElementById("manProblem")
        .closest("[data-multiselect-dropdown]")
    );
    const machineProblems = getSelectedValues(
      document
        .getElementById("machineProblem")
        .closest("[data-multiselect-dropdown]")
    );
    const materialProblems = getSelectedValues(
      document
        .getElementById("materialProblem")
        .closest("[data-multiselect-dropdown]")
    );
    const methodProblems = getSelectedValues(
      document
        .getElementById("methodProblem")
        .closest("[data-multiselect-dropdown]")
    );
    const environmentProblems = getSelectedValues(
      document
        .getElementById("environmentProblem")
        .closest("[data-multiselect-dropdown]")
    );

    // Validasi Jenis Material (dropdown standar)
    if (jenisMaterial === "JENIS MATERIAL") {
      Swal.fire({
        icon: "error",
        title: "Data Tidak Lengkap!",
        text: "Silakan pilih Jenis Material terlebih dahulu.",
      });
      return;
    }

    // Validasi Multiselect Dropdown
    if (
      manProblems.length === 0 ||
      machineProblems.length === 0 ||
      materialProblems.length === 0 ||
      methodProblems.length === 0 ||
      environmentProblems.length === 0
    ) {
      Swal.fire({
        icon: "error",
        title: "Data Tidak Lengkap!",
        text: "Anda harus memilih minimal satu opsi di setiap kategori.",
      });
      return;
    }

    const fullReportData = JSON.parse(
      localStorage.getItem("fullCycleReportData")
    );

    const submissionDate = new Date();
    fullReportData.analisaProblem = {
      pengajuanAnalisa: {
        hari: submissionDate.toLocaleDateString("id-ID", { weekday: "long" }),
        tanggal: submissionDate.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
        jam: submissionDate.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
      jenisMaterial: jenisMaterial,
      man: manProblems,
      machine: machineProblems,
      material: materialProblems,
      method: methodProblems,
      environment: environmentProblems,
      remaks: document.getElementById("remaksTambahan").value.trim() || "-",
    };

    localStorage.setItem("fullCycleReportData", JSON.stringify(fullReportData));

    Swal.fire({
      title: "Mengirim Data...",
      text: "Mohon tunggu sebentar.",
      didOpen: () => {
        Swal.showLoading();
      },
      allowOutsideClick: false,
      allowEscapeKey: false,
    });

    try {
      const response = await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(fullReportData),
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
      });

      const result = await response.json();

      if (result.status === "success") {
        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: "Data telah dikirim ke Spreadsheet.",
          confirmButtonText: "OK",
        }).then((res) => {
          if (res.isConfirmed) {
            window.location.href = "index5.html";
          }
        });
      } else {
        throw new Error(
          result.message || "Terjadi error yang tidak diketahui dari server."
        );
      }
    } catch (error) {
      console.error("Error submitting data:", error);
      Swal.fire({
        icon: "error",
        title: "Gagal Mengirim",
        text: `Terjadi kesalahan: ${error.message}`,
        confirmButtonText: "OK",
      }).then((res) => {
        if (res.isConfirmed) {
          window.location.href = "index5.html";
        }
      });
    }
  });
});
