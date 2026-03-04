<?php
echo "<h2>Test Koneksi MySQL Server 8.0.45</h2>";

$host = "127.0.0.1";
$port = 3307;
$user = "root";
$pass = "4kun_database";
$db   = "mou_tracking";

// Test 1: Koneksi tanpa database
echo "<h3>Test 1: Koneksi Server</h3>";
$conn = mysqli_connect($host, $user, $pass, "", $port);
if ($conn) {
    echo "✅ Berhasil terhubung ke server MySQL<br>";
    
    // Tampilkan info server
    echo "Server version: " . mysqli_get_server_info($conn) . "<br>";
    echo "Host info: " . mysqli_get_host_info($conn) . "<br>";
} else {
    echo "❌ Gagal: " . mysqli_connect_error() . "<br>";
    exit;
}

// Test 2: Pilih database
echo "<h3>Test 2: Pilih Database</h3>";
if (mysqli_select_db($conn, $db)) {
    echo "✅ Database '$db' ditemukan<br>";
    
    // Tampilkan tabel
    $result = mysqli_query($conn, "SHOW TABLES");
    echo "Jumlah tabel: " . mysqli_num_rows($result) . "<br>";
} else {
    echo "❌ Database '$db' tidak ditemukan<br>";
}

mysqli_close($conn);
?>