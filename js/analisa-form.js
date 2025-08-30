document.addEventListener("DOMContentLoaded", function () {
  // --- FUNGSI UNTUK DROPDOWN CHECKBOX ---
  const dropdowns = document.querySelectorAll("[data-multiselect-dropdown]");

  window.updateMultiselectButtonText = (dropdown) => {
    const button = dropdown.querySelector(".multiselect-button");
    const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]');
    const buttonSpan = button.querySelector("span");
    const originalButtonText =
      buttonSpan.dataset.originalText || buttonSpan.textContent;

    if (!buttonSpan.dataset.originalText) {
      buttonSpan.dataset.originalText = originalButtonText;
    }

    const selectedCheckboxes = Array.from(checkboxes).filter(
      (cb) => cb.checked
    );
    const count = selectedCheckboxes.length;

    if (count === 0) {
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

    // Panggil update teks saat pertama kali load
    window.updateMultiselectButtonText(dropdown);

    // --- PERBAIKAN 1: MENCEGAH DROPDOWN TERTUTUP SAAT KLIK DI DALAM PANEL ---
    panel.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    button.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdowns.forEach((otherDropdown) => {
        if (otherDropdown !== dropdown) {
          otherDropdown
            .querySelector(".multiselect-panel")
            .classList.add("hidden");
        }
      });
      panel.classList.toggle("hidden");
    });

    // --- PERBAIKAN 2: LOGIKA EKSKLUSIF UNTUK CHECKBOX "KOSONG / NIHIL" ---
    allCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          if (checkbox.dataset.kosong === "true") {
            // Jika "Kosong" dicentang, hapus centang lainnya
            normalCheckboxes.forEach((cb) => (cb.checked = false));
          } else {
            // Jika checkbox normal dicentang, hapus centang "Kosong"
            kosongCheckbox.checked = false;
          }
        }

        // Sinkronkan SEMUA checkbox ke hidden select setelah logika di atas
        allCheckboxes.forEach((cb) => {
          const option = hiddenSelect.querySelector(
            `option[value="${cb.value}"]`
          );
          if (option) {
            option.selected = cb.checked;
          }
        });

        window.updateMultiselectButtonText(dropdown);
      });
    });
  });

  window.addEventListener("click", () => {
    dropdowns.forEach((dropdown) => {
      dropdown.querySelector(".multiselect-panel").classList.add("hidden");
    });
  });

  const form = document.getElementById("dataForm");

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const manProblemSelect = document.getElementById("manProblem");
    const machineProblemSelect = document.getElementById("machineProblem");
    const materialProblemSelect = document.getElementById("materialProblem");
    const methodProblemSelect = document.getElementById("methodProblem");
    const environmentProblemSelect =
      document.getElementById("environmentProblem");
    const remaksTambahan = document.getElementById("remaksTambahan").value;

    if (
      manProblemSelect.selectedOptions.length === 0 ||
      machineProblemSelect.selectedOptions.length === 0 ||
      materialProblemSelect.selectedOptions.length === 0 ||
      methodProblemSelect.selectedOptions.length === 0 ||
      environmentProblemSelect.selectedOptions.length === 0
    ) {
      Swal.fire({
        icon: "error",
        title: "Data Tidak Lengkap!",
        text: "Anda harus memilih minimal satu opsi di setiap kategori.",
      });
      return;
    }

    const getSelectedValues = (selectElement) =>
      Array.from(selectElement.selectedOptions).map((option) => option.value);

    const data = {
      man: getSelectedValues(manProblemSelect),
      machine: getSelectedValues(machineProblemSelect),
      material: getSelectedValues(materialProblemSelect),
      method: getSelectedValues(methodProblemSelect),
      environment: getSelectedValues(environmentProblemSelect),
      remaks: remaksTambahan,
    };

    console.log("Data yang akan dikirim:", data);

    Swal.fire({
      icon: "success",
      title: "Berhasil!",
      text: "Data Anda telah berhasil disimpan.",
      timer: 2000,
      showConfirmButton: false,
    });

    form.reset();
    dropdowns.forEach((dropdown) => {
      const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach((cb) => (cb.checked = false));
      window.updateMultiselectButtonText(dropdown);
    });
  });
});
