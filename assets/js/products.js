// products.js

let productModal;
let unsubscribeProducts = null;
let allProducts = [];
let currentPage = 1;
const itemsPerPage = 10;

document.addEventListener('DOMContentLoaded', function () {
    productModal = new bootstrap.Modal(document.getElementById('productModal'));

    // Load Products (Real-time)
    loadProducts();

    // Save Product
    document.getElementById('btn-save-product').addEventListener('click', saveProduct);

    // Search Handler
    document.getElementById('search-product').addEventListener('input', function (e) {
        const keyword = e.target.value.toLowerCase();
        currentPage = 1; // Reset to page 1 on search
        filterAndRenderProducts(keyword);
    });

    // File Upload Handler (Disabled)
    // const fileInput = document.getElementById('product-image-file');
    // Removed ImgBB listener
});

// Update preview when manual URL is entered
document.getElementById('product-image-url').addEventListener('input', function (e) {
    const url = e.target.value;
    if (url) {
        showImagePreview(url);
    } else {
        document.getElementById('image-preview-container').classList.add('d-none');
    }
});

function loadProducts() {
    if (unsubscribeProducts) unsubscribeProducts();

    const tbody = document.getElementById('product-table-body');
    if (!tbody.innerHTML || tbody.innerHTML.includes('spinner')) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center p-5"><div class="spinner-border text-primary"></div></td></tr>';
    }

    unsubscribeProducts = db.collection('products')
        .onSnapshot(snapshot => {
            allProducts = [];
            snapshot.forEach(doc => {
                allProducts.push({ id: doc.id, ...doc.data() });
            });

            // SORTING LOGIC: Low stock (<= 10) comes first, then alphabetically
            allProducts.sort((a, b) => {
                const aLow = (a.stock <= 10) ? 0 : 1;
                const bLow = (b.stock <= 10) ? 0 : 1;

                if (aLow !== bLow) return aLow - bLow;
                return a.name.localeCompare(b.name);
            });

            filterAndRenderProducts();
        }, error => {
            console.error("Error loading products:", error);
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Gagal memuat data produk.</td></tr>';
        });
}

function filterAndRenderProducts(keyword = '') {
    const filtered = allProducts.filter(p =>
        !keyword || p.name.toLowerCase().includes(keyword.toLowerCase())
    );
    renderProductTable(filtered);
}

function renderProductTable(products) {
    const tbody = document.getElementById('product-table-body');
    if (!tbody) return;

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-5 text-muted">Produk tidak ditemukan.</td></tr>';
        document.getElementById('pagination-info').textContent = 'Showing 0 of 0 products';
        document.getElementById('product-pagination').innerHTML = '';
        return;
    }

    // Pagination Logic
    const totalItems = products.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Ensure current page is within bounds after filtering
    if (currentPage > totalPages) currentPage = totalPages || 1;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = products.slice(startIndex, endIndex);

    tbody.innerHTML = '';
    paginatedItems.forEach((product, index) => {
        const isLowStock = product.stock <= 10;
        const row = `
            <tr class="animate-up ${isLowStock ? 'low-stock-row' : ''}" style="animation-delay: ${index * 0.03}s">
                <td>
                    <div class="d-flex align-items-center">
                        <div class="bg-light rounded me-3 d-flex align-items-center justify-content-center" style="width: 40px; height: 40px; overflow: hidden; border: 1px solid #eee;">
                            ${product.image_url ? `<img src="${product.image_url}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.parentElement.innerHTML='<i class=\'fas fa-box text-muted\'></i>'">` : `<i class="fas fa-box text-muted"></i>`}
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

    // Update Pagination UI
    document.getElementById('pagination-info').textContent = `Showing ${startIndex + 1} to ${Math.min(endIndex, totalItems)} of ${totalItems} products`;
    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    const paginationEl = document.getElementById('product-pagination');
    paginationEl.innerHTML = '';

    if (totalPages <= 1) return;

    // Previous Button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="javascript:void(0)" ${currentPage === 1 ? '' : `onclick="changePage(${currentPage - 1})"`}><i class="fas fa-chevron-left"></i></a>`;
    paginationEl.appendChild(prevLi);

    // Page Numbers
    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="javascript:void(0)" onclick="changePage(${i})">${i}</a>`;
        paginationEl.appendChild(li);
    }

    // Next Button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="javascript:void(0)" ${currentPage === totalPages ? '' : `onclick="changePage(${currentPage + 1})"`}><i class="fas fa-chevron-right"></i></a>`;
    paginationEl.appendChild(nextLi);
}

window.changePage = function (page) {
    currentPage = page;
    const keyword = document.getElementById('search-product').value;
    filterAndRenderProducts(keyword);
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
        if (data.image_url) {
            showImagePreview(data.image_url);
        } else {
            document.getElementById('image-preview-container').classList.add('d-none');
        }

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
    // document.getElementById('product-image-file').value = '';
    document.getElementById('image-preview-container').classList.add('d-none');
    document.getElementById('image-preview').src = '';
    document.getElementById('upload-progress-container').classList.add('d-none');
    document.getElementById('productModalLabel').textContent = 'Tambah Produk';
}

window.showImagePreview = function (url) {
    const container = document.getElementById('image-preview-container');
    const img = document.getElementById('image-preview');
    img.src = url;
    container.classList.remove('d-none');
}

window.removeImage = function () {
    document.getElementById('product-image-url').value = '';
    // document.getElementById('product-image-file').value = '';
    document.getElementById('image-preview-container').classList.add('d-none');
    document.getElementById('image-preview').src = '';
}
