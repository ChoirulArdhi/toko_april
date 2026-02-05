// products.js

let productModal;
let unsubscribeProducts = null;

document.addEventListener('DOMContentLoaded', function () {
    productModal = new bootstrap.Modal(document.getElementById('productModal'));

    // Load Products (Real-time)
    loadProducts();

    // Save Product
    document.getElementById('btn-save-product').addEventListener('click', saveProduct);

    // Search Handler
    document.getElementById('search-product').addEventListener('input', function (e) {
        const keyword = e.target.value.toLowerCase();
        loadProducts(keyword);
    });

    // File Upload Handler
    const fileInput = document.getElementById('product-image-file');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }
});

async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        showToast('File harus berupa gambar!', 'error');
        return;
    }

    const progressContainer = document.getElementById('upload-progress-container');
    const progressBar = document.getElementById('upload-progress-bar');
    const statusText = document.getElementById('upload-status');
    const urlInput = document.getElementById('product-image-url');

    progressContainer.classList.remove('d-none');
    statusText.textContent = 'Mengunggah...';

    const storageRef = firebase.storage().ref(`products/${Date.now()}_${file.name}`);
    const uploadTask = storageRef.put(file);

    uploadTask.on('state_changed',
        (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            progressBar.style.width = progress + '%';
        },
        (error) => {
            console.error("Upload Error:", error);
            showToast('Gagal mengunggah gambar: ' + error.message, 'error');
            progressContainer.classList.add('d-none');
        },
        async () => {
            const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
            urlInput.value = downloadURL;
            statusText.textContent = 'Berhasil diunggah!';
            showToast('Gambar berhasil diunggah');
            setTimeout(() => progressContainer.classList.add('d-none'), 2000);
        }
    );
}

function loadProducts(keyword = '') {
    if (unsubscribeProducts) unsubscribeProducts();

    const tbody = document.getElementById('product-table-body');
    if (!tbody.innerHTML || tbody.innerHTML.includes('spinner')) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center p-5"><div class="spinner-border text-primary"></div></td></tr>';
    }

    unsubscribeProducts = db.collection('products')
        .onSnapshot(snapshot => {
            let items = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                if (!keyword || data.name.toLowerCase().includes(keyword.toLowerCase())) {
                    items.push({ id: doc.id, ...data });
                }
            });

            // SORTING LOGIC: Low stock (<= 10) comes first, then alphabetically
            items.sort((a, b) => {
                const aLow = (a.stock <= 10) ? 0 : 1;
                const bLow = (b.stock <= 10) ? 0 : 1;

                if (aLow !== bLow) return aLow - bLow;
                return a.name.localeCompare(b.name);
            });

            renderProductTable(items);
        }, error => {
            console.error("Error loading products:", error);
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Gagal memuat data produk.</td></tr>';
        });
}

function renderProductTable(products) {
    const tbody = document.getElementById('product-table-body');
    if (!tbody) return;

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-5 text-muted">Produk tidak ditemukan.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    products.forEach((product, index) => {
        const isLowStock = product.stock <= 10;
        const row = `
            <tr class="animate-up ${isLowStock ? 'low-stock-row' : ''}" style="animation-delay: ${index * 0.03}s">
                <td>
                    <div class="d-flex align-items-center">
                        <div class="bg-light rounded me-3 d-flex align-items-center justify-content-center" style="width: 40px; height: 40px; overflow: hidden; border: 1px solid #eee;">
                            ${product.image_url ? `<img src="${product.image_url}" style="width: 100%; height: 100%; object-fit: cover;">` : `<i class="fas fa-box text-muted"></i>`}
                        </div>
                        <div>
                            <span class="fw-bold text-dark d-block">${product.name}</span>
                            ${isLowStock ? `<span class="low-stock-indicator"></span><small class="text-danger fw-bold">Stok Menipis</small>` : ''}
                        </div>
                    </div>
                </td>
                <td><span class="badge bg-light text-dark border">${product.category}</span></td>
                <td class="text-muted small">${formatRupiah(product.purchase_price)}</td>
                <td class="fw-bold text-primary">${formatRupiah(product.selling_price)}</td>
                <td>
                    <span class="badge ${isLowStock ? 'bg-danger' : 'bg-success'} bg-opacity-10 ${isLowStock ? 'text-danger' : 'text-success'} px-3 py-2 rounded-pill">
                        ${product.stock}
                    </span>
                </td>
                <td class="text-center">
                    <div class="btn-group">
                        <button class="btn btn-sm btn-light border shadow-sm me-2 rounded-pill px-3" onclick="editProduct('${product.id}')">
                            <i class="fas fa-edit text-primary"></i>
                        </button>
                        <button class="btn btn-sm btn-light border shadow-sm rounded-pill px-3" onclick="deleteProduct('${product.id}')">
                            <i class="fas fa-trash-alt text-danger"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

async function saveProduct() {
    const id = document.getElementById('product-id').value;
    const name = document.getElementById('product-name').value;
    const category = document.getElementById('product-category').value;
    const purchase_price = Number(document.getElementById('purchase-price').value);
    const selling_price = Number(document.getElementById('selling-price').value);
    const stock = Number(document.getElementById('stock').value);
    const image_url = document.getElementById('product-image-url').value;

    if (!name || !category || isNaN(purchase_price) || isNaN(selling_price) || isNaN(stock)) {
        showToast('Lengkapi semua data dengan benar!', 'error');
        return;
    }

    const btn = document.getElementById('btn-save-product');
    btn.disabled = true;
    btn.textContent = 'Menyimpan...';

    try {
        const data = {
            name,
            category,
            purchase_price,
            selling_price,
            stock,
            image_url: image_url || '',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (id) {
            await db.collection('products').doc(id).update(data);
            showToast('Produk berhasil diperbarui');
        } else {
            data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('products').add(data);
            showToast('Produk baru berhasil ditambahkan');
        }

        productModal.hide();
        resetForm(); // Reset form after save
    } catch (error) {
        console.error("Error saving product:", error);
        showToast('Gagal menyimpan produk: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Simpan Produk';
    }
}

async function editProduct(id) {
    try {
        const doc = await db.collection('products').doc(id).get();
        const data = doc.data();

        document.getElementById('product-id').value = id;
        document.getElementById('product-name').value = data.name;
        document.getElementById('product-category').value = data.category;
        document.getElementById('purchase-price').value = data.purchase_price;
        document.getElementById('selling-price').value = data.selling_price;
        document.getElementById('stock').value = data.stock;
        document.getElementById('product-image-url').value = data.image_url || '';

        document.getElementById('productModalLabel').textContent = 'Edit Produk';
        productModal.show();
    } catch (error) {
        console.error("Error fetching product:", error);
        showToast('Gagal memuat data produk', 'error');
    }
}

async function deleteProduct(id) {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
        try {
            await db.collection('products').doc(id).delete();
            showToast('Produk berhasil dihapus');
        } catch (error) {
            console.error("Error deleting product:", error);
            showToast('Gagal menghapus produk', 'error');
        }
    }
}

window.resetForm = function () {
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
    document.getElementById('product-image-url').value = '';
    document.getElementById('product-image-file').value = '';
    document.getElementById('upload-progress-container').classList.add('d-none');
    document.getElementById('productModalLabel').textContent = 'Tambah Produk';
}
