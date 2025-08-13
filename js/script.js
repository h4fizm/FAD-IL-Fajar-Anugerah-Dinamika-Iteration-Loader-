// INDEX FUNCTION
AOS.init();

// Menambahkan kode JavaScript untuk menyimpan data
const form = document.getElementById("dataForm");

form.addEventListener("submit", function (event) {
  // Mencegah form untuk melakukan reload halaman
  event.preventDefault();

  // Mengambil nilai dari setiap input
  const unitLoader = document.getElementById("unitLoader").value;
  const jenisMaterial = document.getElementById("jenisMaterial").value;
  const namaOperator = document.getElementById("namaOperator").value;
  const observer = document.getElementById("observer").value;

  // Validasi form
  if (
    unitLoader === "UNIT LOADER" ||
    jenisMaterial === "JENIS MATERIAL" ||
    namaOperator === "NAMA OPERATOR" ||
    observer === ""
  ) {
    // Tampilkan SweetAlert jika ada form yang kosong
    Swal.fire({
      icon: "error",
      title: "Gagal",
      text: "Semua form harus diisi!",
    });
    return; // Hentikan eksekusi kode selanjutnya
  }

  // Membuat objek JavaScript
  const data = {
    unit_loader: unitLoader,
    jenis_material: jenisMaterial,
    nama_operator: namaOperator,
    observer: observer,
    // [2025-08-11] Tanggal pengajuan dalam format hari, tanggal bulan tahun.
    tanggal_pengajuan: new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  };

  // Mengubah objek menjadi string JSON
  const jsonData = JSON.stringify(data);

  // Menyimpan string JSON ke Local Storage
  localStorage.setItem("formData", jsonData);

  console.log("Data berhasil disimpan di Local Storage:", jsonData);

  // Tampilkan SweetAlert jika berhasil
  Swal.fire({
    icon: "success",
    title: "Berhasil!",
    text: "Data berhasil disimpan.",
    showConfirmButton: false,
    timer: 1500, // SweetAlert akan tertutup otomatis setelah 1.5 detik
  }).then(() => {
    // Arahkan ke halaman selanjutnya setelah SweetAlert tertutup
    window.location.href = "index2.html";
  });
});

// Sembunyikan preloader setelah halaman selesai dimuat
window.addEventListener("load", function () {
  const preloader = document.getElementById("preloader");
  if (preloader) {
    preloader.style.opacity = "0";
    setTimeout(() => {
      preloader.style.display = "none";
    }, 500);
  }
});
