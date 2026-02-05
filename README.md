# Toko April 🏪

Aplikasi manajemen toko sembako sederhana berbasis web, responsif, dan ringan.

## Fitur
- **Dashboard**: Ringkasan stok, transaksi, dan pendapatan.
- **Kasir (POS)**: Transaksi cepat dengan perhitungan otomatis.
- **Produk**: Manajemen data barang (CRUD) dan stok.
- **Riwayat**: Log transaksi lengkap dengan filter tanggal.
- **Laporan**: Ringkasan penjualan harian.

## Teknologi
- Frontend: HTML5, Bootstrap 5, Vanilla JS
- Backend: Firebase (Firestore & Auth)

---

## 🚀 Panduan Setup (Firebase)

Agar aplikasi ini dapat berjalan, Anda perlu menghubungkannya dengan database Firebase milik Anda sendiri.

1. Buka [Firebase Console](https://console.firebase.google.com/).
2. Buat Project baru bernama `Toko April` (atau bebas).
3. Matikan Google Analytics (agar setup lebih cepat).
4. Setelah project siap, masuk ke dashboard project:
   - Pilih icon **Web (</>)** untuk menambahkan aplikasi web.
   - Register app dengan nama "Toko April".
   - Salin konfigurasi `firebaseConfig` yang muncul.
5. Setup **Authentication**:
   - Menu Build -> Authentication -> Get Started.
   - Tab **Sign-in method**, aktifkan **Email/Password**.
   - Tambahkan user pertama secara manual (Users -> Add user) untuk login admin (contoh: `admin@tokoapril.com` / `admin123`).
6. Setup **Firestore Database**:
   - Menu Build -> Firestore Database -> Create Database.
   - Pilih lokasi server terdekat (misal: `asia-southeast2` untuk Jakarta).
   - Pilih **Start in Test Mode** (untuk pengembangan awal).
7. Update Kode:
   - Buka file `assets/js/firebase-config.js` di folder project ini.
   - Ganti isi `const firebaseConfig = { ... }` dengan config yang Anda salin tadi.

---

## 💻 Menjalankan di Lubuntu 24.04 (Lokal)

Karena aplikasi ini murni Client-Side (HTML/JS), Anda tidak butuh Node.js atau server backend khusus untuk menjalankannya. Namun, disarankan menggunakan simple HTTP server agar tidak ada masalah CORS/loading file lokal.

### Cara 1: Menggunakan Python (Termudah)
Lubuntu biasanya sudah terinstal Python 3.
1. Buka terminal (Ctrl+Alt+T).
2. Masuk ke direktori project:
   ```bash
   cd /path/to/toko_april
   ```
3. Jalankan server:
   ```bash
   python3 -m http.server 8000
   ```
4. Buka browser dan akses: `http://localhost:8000`

### Cara 2: Langsung Buka File
Anda bisa mencoba klik kanan `index.html` -> Open With Web Browser. 
*Catatan: Beberapa fitur browser mungkin memblokir akses module jika dibuka langsung tanpa server.*

---

## 🌐 Deploy ke GitHub Pages

1. Buat repository baru di GitHub.
2. Push source code ini ke repository tersebut:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/USERNAME/REPO_NAME.git
   git push -u origin main
   ```
3. Di halaman repository GitHub -> **Settings** -> **Pages**.
4. Pada bagian **Build and deployment** -> **Branch**, pilih `main` / `root` lalu Save.
5. Tunggu beberapa menit, link website akan muncul!

---

## Data Dummy (Opsional)
Untuk mencoba, Anda bisa login dan mulai input data barang di menu **Produk**.
Contoh barang:
- Beras 5kg (Harga Beli: 60000, Jual: 65000, Stok: 20)
- Telur 1kg (Harga Beli: 24000, Jual: 26000, Stok: 50)
- Minyak Goreng 2L (Harga Beli: 32000, Jual: 35000, Stok: 15)
