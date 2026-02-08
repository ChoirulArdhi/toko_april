// transactions.js

let products = [];
let cart = [];
let checkoutModal;
let allProducts = [];
let currentPage = 1;
const itemsPerPage = 8;

document.addEventListener('DOMContentLoaded', function () {
    checkoutModal = new bootstrap.Modal(document.getElementById('checkoutModal'));

    // Load Products for Grid
    loadProductsForPOS();

    // Search Handler
    document.getElementById('search-pos').addEventListener('input', function (e) {
        const keyword = e.target.value.toLowerCase();
        currentPage = 1; // Reset to page 1
        filterAndRenderGrid(keyword);
    });

    // Checkout Button
    document.getElementById('btn-checkout').addEventListener('click', () => {
        const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
        document.getElementById('modal-total').textContent = formatRupiah(total);
        document.getElementById('cash-received').value = '';
        document.getElementById('change-amount').textContent = formatRupiah(0);
        checkoutModal.show();
    });

    // Cash Change Calculation
    document.getElementById('cash-received').addEventListener('input', function (e) {
        const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
        const cash = Number(e.target.value);
        const change = cash - total;
        document.getElementById('change-amount').textContent = formatRupiah(Math.max(0, change));
    });

    // Confirm Payment
    document.getElementById('btn-confirm-payment').addEventListener('click', processPayment);
});

async function loadProductsForPOS() {
    // Simplified query to avoid missing index errors
    db.collection('products').where('stock', '>', 0).onSnapshot(snapshot => {
        allProducts = [];
        snapshot.forEach(doc => {
            allProducts.push({ id: doc.id, ...doc.data() });
        });
        // Local sort by name
        allProducts.sort((a, b) => a.name.localeCompare(b.name));
        filterAndRenderGrid();
    }, error => {
        console.error("Error loading products:", error);
    });
}

function filterAndRenderGrid(keyword = '') {
    const filtered = allProducts.filter(p =>
        !keyword || p.name.toLowerCase().includes(keyword.toLowerCase())
    );
    renderProductGrid(filtered);
}

function renderProductGrid(data) {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = '';

    if (data.length === 0) {
        grid.innerHTML = '<div class="col-12 text-center text-muted py-5 animate-up">Produk tidak ditemukan atau stok habis.</div>';
        document.getElementById('pagination-info').textContent = 'Show 0 of 0 products';
        document.getElementById('product-pagination').innerHTML = '';
        return;
    }

    // Pagination Logic
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (currentPage > totalPages) currentPage = totalPages || 1;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = data.slice(startIndex, endIndex);

    paginatedItems.forEach((product, index) => {
        const imageHtml = product.image_url
            ? `<img src="${product.image_url}" alt="${product.name}" onerror="this.parentElement.innerHTML='<i class=\'fas fa-box fa-2x text-muted opacity-50 product-img-placeholder\'></i>'">`
            : `<i class="fas fa-box fa-2x text-muted opacity-50 product-img-placeholder"></i>`;

        const card = `
            <div class="col-6 col-md-4 col-lg-3 animate-up" style="animation-delay: ${0.1 + (index * 0.05)}s">
                <div class="card product-card h-100" onclick="addToCart('${product.id}')">
                    <div class="card-body text-center p-3">
                        <div class="product-img-container">
                            ${imageHtml}
                        </div>
                        <h6 class="card-title text-truncate mb-1 fw-bold" title="${product.name}">${product.name}</h6>
                        <p class="card-text fw-bold text-primary mb-1">${formatRupiah(product.selling_price)}</p>
                        <span class="badge ${product.stock < 10 ? 'bg-danger bg-opacity-10 text-danger' : 'bg-light text-muted'} px-2 py-1 rounded-pill" style="font-size: 0.7rem;">
                            Stok: ${product.stock}
                        </span>
                    </div>
                </div>
            </div>
        `;
        grid.insertAdjacentHTML('beforeend', card);
    });

    // Update Pagination UI
    document.getElementById('pagination-info').textContent = `Show ${startIndex + 1} to ${Math.min(endIndex, totalItems)} of ${totalItems} products`;
    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    const paginationEl = document.getElementById('product-pagination');
    paginationEl.innerHTML = '';

    if (totalPages <= 1) return;

    const isMobile = window.innerWidth < 768;

    if (isMobile) {
        // Mobile View
        paginationEl.innerHTML = `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="javascript:void(0)" onclick="${currentPage === 1 ? '' : `changePage(${currentPage - 1})`}"><i class="fas fa-chevron-left"></i></a>
            </li>
            <li class="page-item disabled"><span class="page-link text-dark fw-bold">${currentPage} / ${totalPages}</span></li>
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="javascript:void(0)" onclick="${currentPage === totalPages ? '' : `changePage(${currentPage + 1})`}"><i class="fas fa-chevron-right"></i></a>
            </li>
        `;
    } else {
        // Desktop View: Sliding Window
        const maxVisible = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);

        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        // Previous
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `<a class="page-link" href="javascript:void(0)" onclick="${currentPage === 1 ? '' : `changePage(${currentPage - 1})`}"><i class="fas fa-chevron-left"></i></a>`;
        paginationEl.appendChild(prevLi);

        if (startPage > 1) {
            const firstLi = document.createElement('li');
            firstLi.className = 'page-item';
            firstLi.innerHTML = `<a class="page-link" href="javascript:void(0)" onclick="changePage(1)">1</a>`;
            paginationEl.appendChild(firstLi);
            if (startPage > 2) {
                const dotLi = document.createElement('li');
                dotLi.className = 'page-item disabled';
                dotLi.innerHTML = `<span class="page-link">...</span>`;
                paginationEl.appendChild(dotLi);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const li = document.createElement('li');
            li.className = `page-item ${i === currentPage ? 'active' : ''}`;
            li.innerHTML = `<a class="page-link" href="javascript:void(0)" onclick="changePage(${i})">${i}</a>`;
            paginationEl.appendChild(li);
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const dotLi = document.createElement('li');
                dotLi.className = 'page-item disabled';
                dotLi.innerHTML = `<span class="page-link">...</span>`;
                paginationEl.appendChild(dotLi);
            }
            const lastLi = document.createElement('li');
            lastLi.className = 'page-item';
            lastLi.innerHTML = `<a class="page-link" href="javascript:void(0)" onclick="changePage(${totalPages})">${totalPages}</a>`;
            paginationEl.appendChild(lastLi);
        }

        // Next
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
        nextLi.innerHTML = `<a class="page-link" href="javascript:void(0)" onclick="${currentPage === totalPages ? '' : `changePage(${currentPage + 1})`}"><i class="fas fa-chevron-right"></i></a>`;
        paginationEl.appendChild(nextLi);
    }
}

window.changePage = function (page) {
    currentPage = page;
    const keyword = document.getElementById('search-pos').value;
    filterAndRenderGrid(keyword);
}

function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.product_id === productId);

    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity++;
            existingItem.subtotal = existingItem.quantity * existingItem.price;
        } else {
            showToast('Stok tidak mencukupi', 'error');
            return;
        }
    } else {
        cart.push({
            product_id: product.id,
            name: product.name,
            price: product.selling_price,
            purchase_price: product.purchase_price || 0, // CRITICAL: Store HPP
            quantity: 1,
            subtotal: product.selling_price
        });
    }

    updateCartUI();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

window.adjustQuantity = function (index, delta) {
    const item = cart[index];
    const product = products.find(p => p.id === item.product_id);

    if (delta > 0) {
        if (item.quantity < product.stock) {
            item.quantity++;
        } else {
            showToast('Stok tidak mencukupi', 'error');
            return;
        }
    } else {
        if (item.quantity > 1) {
            item.quantity--;
        } else {
            removeFromCart(index);
            return;
        }
    }

    item.subtotal = item.quantity * item.price;
    updateCartUI();
}

window.clearCart = function () {
    if (cart.length > 0 && confirm('Kosongkan keranjang?')) {
        cart = [];
        updateCartUI();
    }
}

function updateCartUI() {
    const cartContainer = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    const btnCheckout = document.getElementById('btn-checkout');

    cartContainer.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div class="text-center opacity-25 mt-5 animate-up">
                <i class="fas fa-shopping-cart fa-4x mb-3"></i>
                <p class="fw-bold">Keranjang Kosong</p>
            </div>
        `;
        btnCheckout.disabled = true;
        totalEl.textContent = 'Rp 0';
        return;
    }

    cart.forEach((item, index) => {
        total += item.subtotal;
        const itemHtml = `
            <div class="card border-0 shadow-sm mb-3 animate-up" style="border-radius: 12px; animation-delay: ${index * 0.05}s">
                <div class="card-body p-3 d-flex justify-content-between align-items-center">
                    <div style="flex: 1;">
                        <h6 class="mb-0 fw-bold text-truncate" style="max-width: 150px;">${item.name}</h6>
                        <small class="text-muted">${formatRupiah(item.price)}</small>
                        <div class="d-flex align-items-center mt-2">
                            <button class="btn btn-sm btn-light border py-1 px-2" onclick="adjustQuantity(${index}, -1)">-</button>
                            <span class="mx-3 fw-bold">${item.quantity}</span>
                            <button class="btn btn-sm btn-light border py-1 px-2" onclick="adjustQuantity(${index}, 1)">+</button>
                        </div>
                    </div>
                    <div class="text-end ms-2">
                        <span class="d-block fw-bold text-primary">${formatRupiah(item.subtotal)}</span>
                        <button class="btn btn-sm text-danger p-0 mt-2" onclick="removeFromCart(${index})">
                            <i class="fas fa-trash-alt" style="font-size: 0.8rem;"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        cartContainer.insertAdjacentHTML('beforeend', itemHtml);
    });

    totalEl.textContent = formatRupiah(total);
    btnCheckout.disabled = false;
}

async function processPayment() {
    const cash = Number(document.getElementById('cash-received').value);
    const total = cart.reduce((sum, item) => sum + item.subtotal, 0);

    if (cash < total) {
        showToast('Uang yang diterima kurang!', 'error');
        return;
    }

    const btnConfirm = document.getElementById('btn-confirm-payment');
    btnConfirm.disabled = true;
    btnConfirm.textContent = 'Memproses...';

    try {
        const batch = db.batch();
        const transactionRef = db.collection('transactions').doc();

        // 1. Create Transaction Record
        batch.set(transactionRef, {
            date: firebase.firestore.FieldValue.serverTimestamp(),
            total_price: total,
            cash_received: cash,
            change: cash - total,
            user_id: firebase.auth().currentUser ? firebase.auth().currentUser.uid : 'Kasir Offline'
        });

        // 2. Create Transaction Items & Deduct Stock
        for (const item of cart) {
            const itemRef = db.collection('transaction_items').doc();
            batch.set(itemRef, {
                transaction_id: transactionRef.id,
                product_id: item.product_id,
                product_name: item.name,
                quantity: item.quantity,
                price: item.price,
                purchase_price: item.purchase_price, // HPP saved
                subtotal: item.subtotal,
                date: firebase.firestore.FieldValue.serverTimestamp() // For easy querying later
            });

            // Update Stock
            const productRef = db.collection('products').doc(item.product_id);
            batch.update(productRef, {
                stock: firebase.firestore.FieldValue.increment(-item.quantity)
            });
        }

        await batch.commit();

        showToast('Transaksi Berhasil! Mengalihkan ke Struk...', 'success');

        setTimeout(() => {
            window.location.href = 'receipt.html?id=' + transactionRef.id;
        }, 1500);


        cart = [];
        updateCartUI();
        checkoutModal.hide();

    } catch (error) {
        console.error("Transaction Error:", error);
        showToast('Transaksi Gagal: ' + error.message, 'error');
    } finally {
        btnConfirm.disabled = false;
        btnConfirm.textContent = 'PROSES TRANSAKSI';
    }
}

function printReceipt(orderId, total, cash, items) {
    const printArea = document.getElementById('receipt-print');
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID') + ' ' + now.toLocaleTimeString('id-ID');

    let itemsHtml = '';
    items.forEach(item => {
        itemsHtml += `
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                <span>${item.name} x${item.quantity}</span>
                <span>${formatRupiah(item.subtotal)}</span>
            </div>
        `;
    });

    printArea.innerHTML = `
        <div style="text-align: center; margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px;">
            <h3 style="margin: 0; font-size: 18px;">TOKO APRIL</h3>
            <p style="margin: 5px 0; font-size: 11px;">Dsn Gendong RT 03 RW 08 Desa Purworejo Kec. Sanankulon</p>
            <p style="margin: 0; font-size: 11px;">WA: 081918435875</p>
        </div>
        <div style="font-size: 12px; margin-bottom: 10px;">
            <p style="margin: 2px 0;">No: #${orderId.substring(0, 8).toUpperCase()}</p>
            <p style="margin: 2px 0;">Tgl: ${dateStr}</p>
            <p style="margin: 2px 0;">Kasir: ${firebase.auth().currentUser ? firebase.auth().currentUser.email.split('@')[0] : 'Kasir'}</p>
        </div>
        <div style="border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; font-size: 12px;">
            ${itemsHtml}
        </div>
        <div style="font-size: 12px; font-weight: bold;">
            <div style="display: flex; justify-content: space-between;">
                <span>TOTAL</span>
                <span>${formatRupiah(total)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>TUNAI</span>
                <span>${formatRupiah(cash)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>KEMBALI</span>
                <span>${formatRupiah(cash - total)}</span>
            </div>
        </div>
        <div style="text-align: center; margin-top: 20px; font-size: 12px;">
            <p style="margin: 0;">Terima Kasih Atas Kunjungan Anda</p>
            <p style="margin: 5px 0;">Barang yang sudah dibeli</p>
            <p style="margin: 0;">tidak dapat ditukar/dikembalikan</p>
        </div>
    `;

    printArea.classList.remove('d-none');
    window.print();
    printArea.classList.add('d-none');
}

