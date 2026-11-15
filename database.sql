CREATE DATABASE IF NOT EXISTS buku_kontak CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE buku_kontak;

CREATE TABLE IF NOT EXISTS contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  no_hp VARCHAR(20) NOT NULL,
  email VARCHAR(100) NOT NULL,
  alamat TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO contacts (nama, no_hp, email, alamat) VALUES
('Budi Santoso', '081234567890', 'budi@example.com', 'Jl. Melati No. 1, Jakarta'),
('Siti Rahayu', '081298765432', 'siti@example.com', 'Jl. Anggrek No. 2, Bandung'),
('Ahmad Hidayat', '081234560099', 'ahmad@example.com', 'Jl. Mawar No. 3, Surabaya');
