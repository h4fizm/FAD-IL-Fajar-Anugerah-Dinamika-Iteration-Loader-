// File: js/analisa-form.js (Versi Sederhana untuk Redirect)
document.addEventListener("DOMContentLoaded", function () {
  // --- 1. VALIDASI DATA AWAL ---
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

  // --- 2. FUNGSI UNTUK DROPDOWN CHECKBOX (Tidak ada perubahan) ---
  const dropdowns = document.querySelectorAll("[data-multiselect-dropdown]");
  const updateMultiselectButtonText = (dropdown) => {
    const button = dropdown.querySelector(".multiselect-button");
    const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]');
    const buttonSpan = button.querySelector("span");
    const originalButtonText =
      buttonSpan.dataset.originalText || buttonSpan.textContent;
    if (!buttonSpan.dataset.originalText) {
      buttonSpan.dataset.originalText = originalButtonText;
    }
    const selectedCheckboxes = Array.from(checkboxes).filter(
      (cb) => cb.checked && !cb.dataset.kosong
    );
    const count = selectedCheckboxes.length;
    const isKosongSelected = dropdown.querySelector(
      'input[data-kosong="true"]'
    ).checked;
    if (isKosongSelected) {
      buttonSpan.textContent = `${originalButtonText} (Nihil)`;
    } else if (count === 0) {
      buttonSpan.textContent = originalButtonText;
    } else {
      buttonSpan.textContent = `${originalButtonText} (${count} terpilih)`;
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
    panel.addEventListener("click", (e) => e.stopPropagation());
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
            kosongCheckbox.checked = false;
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
  });
  window.addEventListener("click", () => {
    dropdowns.forEach((d) =>
      d.querySelector(".multiselect-panel").classList.add("hidden")
    );
  });

  // --- 3. LOGIKA FORM SUBMISSION ---
  const form = document.getElementById("dataForm");
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const getSelectedValues = (id) =>
      Array.from(document.getElementById(id).selectedOptions).map(
        (opt) => opt.value
      );
    const manProblems = getSelectedValues("manProblem");
    const machineProblems = getSelectedValues("machineProblem");
    const materialProblems = getSelectedValues("materialProblem");
    const methodProblems = getSelectedValues("methodProblem");
    const environmentProblems = getSelectedValues("environmentProblem");
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
    fullReportData.analisaProblem = {
      pengajuanAnalisa: {
        hari: new Date().toLocaleDateString("id-ID", { weekday: "long" }),
        tanggal: new Date().toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
        jam: new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
      man: manProblems,
      machine: machineProblems,
      material: materialProblems,
      method: methodProblems,
      environment: environmentProblems,
      remaks: document.getElementById("remaksTambahan").value.trim() || "-",
    };

    // Simpan data akhir...
    localStorage.setItem("fullCycleReportData", JSON.stringify(fullReportData));

    // ...lalu arahkan ke halaman laporan akhir.
    Swal.fire({
      icon: "success",
      title: "Analisa Tersimpan!",
      text: "Anda akan diarahkan ke halaman laporan akhir.",
      timer: 1500,
      showConfirmButton: false,
      allowOutsideClick: false,
    }).then(() => {
      window.location.href = "index5.html";
    });
  });
});
