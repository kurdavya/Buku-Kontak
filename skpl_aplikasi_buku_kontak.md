# SPESIFIKASI KEBUTUHAN PERANGKAT LUNAK (SKPL)
## APLIKASI BUKU KONTAK

---

### 1. Deskripsi Pekerjaan
Pengembangan aplikasi Buku Kontak berbasis web yang digunakan untuk menyimpan dan mengelola data kontak secara terstruktur. Aplikasi memungkinkan pengguna untuk menambahkan, melihat, mengubah, dan menghapus data kontak (CRUD). Proyek ini dirancang sebagai proyek tingkat dasar menggunakan pendekatan *Vibe Coding* dengan fokus pada validasi format data serta struktur database sederhana.

### 2. Capaian Utama (Main Achievement)
Terbangunnya aplikasi pengelolaan kontak berbasis web yang fungsional, mencakup manajemen data (CRUD), pencarian kontak, serta validasi integritas input data nomor telepon dan email yang divalidasi keandalannya melalui *Black Box Testing*.

### 3. Tujuan Aplikasi
1. Melatih pemahaman dasar pengembangan aplikasi menggunakan *Vibe Coding*.
2. Mengimplementasikan fungsi pengelolaan data penuh (CRUD).
3. Menerapkan validasi input pada form kontak (email dan nomor HP).
4. Melakukan *testing* dan identifikasi kerentanan dasar aplikasi.

### 4. Teknologi yang Digunakan (Tech Stack)
* **Frontend:** HTML5, CSS3 (Tailwind CSS / Bootstrap), JavaScript.
* **Backend:** PHP / Node.js.
* **Database:** MySQL / MariaDB.
* **Testing:** Black Box Testing & Basic Security Assessment.

### 5. Alur Utama Sistem

```text
Buka Aplikasi ──▶ Melihat Daftar Kontak
                    ├──▶ Tambah Kontak ──▶ Validasi Input ──▶ Simpan
                    ├──▶ Melihat Detail ──▶ Edit ──▶ Update
                    └──▶ Hapus
```

### 6. Format Narasumber (NARSUM)
> **PENTING:** Apabila terdapat format penyampaian laporan, struktur pengumpulan dokumen, atau spesifikasi khusus yang diberikan secara langsung oleh Narasumber (Narsum) / Dosen / Pembimbing, maka format dari narsum tersebut bersifat mutlak dan harus menjadi acuan utama, mengesampingkan template dasar yang ada pada dokumen ini.

### 7. Batasan Scope
* Hanya mencakup pengelolaan data kontak sederhana.
* Tidak mencakup sinkronisasi kontak dengan perangkat atau Google Contacts.
* Tidak mencakup fitur import/export VCF/CSV.
* Tidak mencakup fitur chat atau komunikasi langsung.
* Tidak mencakup sistem multi-role.

---

### 8. MODUL, SCOPE OF WORK, DAN TEMPLATE PENGERJAAN

#### Modul 1 - Analisis Kebutuhan
* **Cakupan:** Identifikasi kebutuhan data kontak, penentuan field, dan pembatasan scope.
* **Output:** Dokumen spesifikasi kebutuhan aplikasi kontak.

| ID Kebutuhan | Nama Fitur | Deskripsi Fungsionalitas |
| :--- | :--- | :--- |
| **REQ-01** | Daftar Kontak | Sistem menampilkan seluruh daftar kontak tersimpan secara terstruktur. |
| **REQ-02** | Manajemen Kontak | Sistem memungkinkan penambahan, pengubahan, dan penghapusan data kontak. |
| **REQ-03** | Validasi Form | Sistem memvalidasi format email dan nomor telepon saat pengisian form. |

#### Modul 2 - Database & Struktur Aplikasi
* **Cakupan:** Setup proyek, perancangan tabel `contacts`, dan konfigurasi koneksi database.
* **Output:** Database dan tabel kontak siap pakai.

| Nama Tabel | Field Utama | Tipe Data | Keterangan / Relasi |
| :--- | :--- | :--- | :--- |
| `contacts` | `id` | `INT` (PK, Auto Increment) | Tabel utama menyimpan data kontak. |
| | `nama` | `VARCHAR(100)` | Nama lengkap kontak. |
| | `no_hp` | `VARCHAR(20)` | Nomor telepon kontak. |
| | `email` | `VARCHAR(100)` | Alamat email kontak. |
| | `alamat` | `TEXT` | Alamat kontak. |

#### Modul 3 - Tampilan Aplikasi (UI/UX)
* **Cakupan:** Halaman daftar kontak, form tambah/edit, detail kontak, tombol hapus, dan notifikasi.
* **Output:** Antarmuka (Interface) aplikasi Buku Kontak.

#### Modul 4 - CRUD Kontak
* **Cakupan:** Implementasi fungsi Create, Read, Update, Delete data kontak dan validasi input.
* **Output:** Fitur CRUD kontak yang berfungsi penuh.

#### Modul 5 - Testing & Basic Security
* **Cakupan:** Pengujian fungsionalitas CRUD, pengujian form kosong, dan identifikasi kerentanan input dasar.

| ID Test | Skenario Pengujian | Input Data | Hasil yang Diharapkan | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Tambah Kontak Valid | Nama: `Budi`, No HP: `08123456789` | Data tersimpan, kontak muncul di daftar. | **PASS** |
| **TC-02** | Validasi Email Salah | Email: `budiatgmail.com` | Sistem menolak data dan menampilkan peringatan. | **PASS** |
