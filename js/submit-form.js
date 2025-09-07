// index.html - File js/submit-form.js

// INDEX FUNCTION
AOS.init();

// Menambahkan kode JavaScript untuk menyimpan data
const form = document.getElementById("dataForm");

form.addEventListener("submit", function (event) {
  event.preventDefault();

  // Mengambil nilai dari semua form
  const unitLoader = document.getElementById("unitLoader").value;
  // const jenisMaterial = document.getElementById("jenisMaterial").value; // Dihapus
  const namaOperator = document.getElementById("namaOperator").value;
  const observer = document.getElementById("observer").value;
  const jarakDumping = document.getElementById("jarakDumping").value;
  const jumlahHauler = document.getElementById("jumlahHauler").value;

  // Memperbarui validasi untuk form yang tersisa
  if (
    unitLoader.trim() === "" ||
    namaOperator.trim() === "" ||
    observer.trim() === "" ||
    jarakDumping.trim() === "" ||
    jumlahHauler.trim() === ""
  ) {
    Swal.fire({
      icon: "error",
      title: "Gagal",
      text: "Semua form harus diisi!",
    });
    return;
  }

  // Menambahkan data baru ke dalam objek
  const data = {
    unit_loader: unitLoader,
    // jenis_material: jenisMaterial, // Dihapus
    nama_operator: namaOperator,
    observer: observer,
    jarak_dumping: jarakDumping,
    jumlah_hauler: jumlahHauler,
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
