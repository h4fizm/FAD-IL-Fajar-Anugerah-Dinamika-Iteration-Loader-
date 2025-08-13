// index.html - File js/script.js

// INDEX FUNCTION
AOS.init();

// Menambahkan kode JavaScript untuk menyimpan data
const form = document.getElementById("dataForm");

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const unitLoader = document.getElementById("unitLoader").value;
  const jenisMaterial = document.getElementById("jenisMaterial").value;
  const namaOperator = document.getElementById("namaOperator").value;
  const observer = document.getElementById("observer").value;

  if (
    unitLoader === "UNIT LOADER" ||
    jenisMaterial === "JENIS MATERIAL" ||
    namaOperator === "NAMA OPERATOR" ||
    observer === ""
  ) {
    Swal.fire({
      icon: "error",
      title: "Gagal",
      text: "Semua form harus diisi!",
    });
    return;
  }

  const data = {
    unit_loader: unitLoader,
    jenis_material: jenisMaterial,
    nama_operator: namaOperator,
    observer: observer,
    tanggal_pengajuan: new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  };

  const jsonData = JSON.stringify(data);
  localStorage.setItem("formData", jsonData);

  // Menghapus riwayat proses sebelumnya untuk memulai sesi baru
  localStorage.removeItem("processHistory");

  Swal.fire({
    icon: "success",
    title: "Berhasil!",
    text: "Data berhasil disimpan.",
    showConfirmButton: false,
    timer: 1500,
  }).then(() => {
    window.location.href = "index2.html";
  });
});

window.addEventListener("load", function () {
  const preloader = document.getElementById("preloader");
  if (preloader) {
    preloader.style.opacity = "0";
    setTimeout(() => {
      preloader.style.display = "none";
    }, 500);
  }
});
