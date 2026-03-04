<?php
// Tentukan informasi koneksi database
$servername = "localhost";  // Alamat server, gunakan "localhost" untuk server lokal
$username = "root";         // Username MySQL, default biasanya "root"
$password = "4kun_database";             // Password MySQL, kosong jika tidak diatur
$dbname = "mou_tracking";   // Nama database yang digunakan (ganti dengan database yang Anda buat)

// Buat koneksi ke database MySQL
$conn = new mysqli($servername, $username, $password, $dbname, 3307);  // Pastikan port sesuai dengan konfigurasi Anda

// Cek koneksi
if ($conn->connect_error) {
    die("Koneksi gagal: " . $conn->connect_error);  // Jika gagal, tampilkan pesan error
}
echo "Koneksi berhasil ke database $dbname";  // Jika berhasil, tampilkan pesan sukses
?>