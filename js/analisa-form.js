document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("dataForm");

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    // Mengambil nilai dari setiap input
    const manProblem = document.getElementById("manProblem").value;
    const machineProblem = document.getElementById("machineProblem").value;
    const materialProblem = document.getElementById("materialProblem").value;
    const methodProblem = document.getElementById("methodProblem").value;
    const environmentProblem =
      document.getElementById("environmentProblem").value;

    // --- PERBAIKAN LOGIKA VALIDASI DI SINI ---
    // Pengecekan: Jika nilai yang terpilih masih berupa placeholder awal.
    if (
      manProblem === "MAN" ||
      machineProblem === "MACHINE" ||
      materialProblem === "MATERIAL" ||
      methodProblem === "METHOD" ||
      environmentProblem === "ENVIRONMENT"
    ) {
      // Tampilkan notifikasi error
      Swal.fire({
        icon: "error",
        title: "Data Tidak Lengkap!",
        text: "Anda harus memilih salah satu opsi di setiap kategori.",
      });
      return; // Hentikan proses
    }

    // Jika semua data sudah dipilih (termasuk "-- Kosong --"), tampilkan sukses
    Swal.fire({
      icon: "success",
      title: "Berhasil!",
      text: "Data Anda telah berhasil disimpan.",
      timer: 2000,
      showConfirmButton: false,
    });

    form.reset();
  });
});
