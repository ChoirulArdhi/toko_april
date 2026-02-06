// history.js

let historyUnsubscribe = null;

document.addEventListener('DOMContentLoaded', function () {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Default filter to today
    const filterInput = document.getElementById('filter-date');
    if (filterInput) {
        const localDate = today.toISOString().split('T')[0];
        filterInput.value = localDate;
    }

    loadHistory(today);

    // Filter Handler
    document.getElementById('btn-filter').addEventListener('click', () => {
        const dateVal = document.getElementById('filter-date').value;
        if (!dateVal) {
            showToast('Pilih tanggal filter!', 'error');
            return;
        }
        const filterDate = new Date(dateVal);
        filterDate.setHours(0, 0, 0, 0);
        loadHistory(filterDate);
    });

    // Detail Modal Printing
    const btnPrint = document.getElementById('btn-print-history');
    if (btnPrint) {
        btnPrint.addEventListener('click', () => {
            const orderId = btnPrint.getAttribute('data-transaction-id');
            if (orderId) {
                window.location.href = 'receipt.html?id=' + orderId;
            } else {
                showToast('ID Transaksi tidak ditemukan', 'error');
            }
        });
    }
});

function loadHistory(startDate) {
    // Unsubscribe previous listener if exists
    if (historyUnsubscribe) historyUnsubscribe();

    // Create start and end of day in local time
    const startOfDay = new Date(startDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(startDate);
    endOfDay.setHours(23, 59, 59, 999);

    const tbody = document.getElementById('history-table-body');
    if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="text-center p-5"><div class="spinner-border text-primary"></div></td></tr>';

    historyUnsubscribe = db.collection('transactions')
        .where('date', '>=', startOfDay)
        .where('date', '<=', endOfDay)
        .orderBy('date', 'desc')
        .onSnapshot(snapshot => {
            renderHistoryTable(snapshot);
        }, error => {
            console.error("History Error:", error);
            if (error.code === 'failed-precondition') {
                showToast('Database indexing sedang diproses...', 'error');
            }
            if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger py-4">Gagal memuat data.</td></tr>';
        });
}

function renderHistoryTable(snapshot) {
    const tbody = document.getElementById('history-table-body');
    if (!tbody) return;

    if (snapshot.empty) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-5 text-muted">Belum ada transaksi pada tanggal ini.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    snapshot.forEach((doc, index) => {
        const data = doc.data();
        const time = data.date ? new Date(data.date.seconds * 1000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--';

        const row = `
            <tr class="animate-up" style="animation-delay: ${index * 0.05}s">
                <td class="fw-bold">#${doc.id.substring(0, 8).toUpperCase()}</td>
                <td>${time}</td>
                <td class="fw-bold text-primary">${formatRupiah(data.total_price)}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-light rounded-pill px-3 shadow-sm border" onclick="showDetail('${doc.id}')">
                        <i class="fas fa-eye me-1"></i> Detail
                    </button>
                    <input type="hidden" id="full-id-${doc.id}" value="${doc.id}">
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

async function showDetail(transactionId) {
    const modal = new bootstrap.Modal(document.getElementById('detailModal'));

    // Clear previous
    document.getElementById('detail-items').innerHTML = '';

    try {
        const transDoc = await db.collection('transactions').doc(transactionId).get();
        const transData = transDoc.data();

        document.getElementById('detail-id').textContent = '#' + transactionId.substring(0, 8).toUpperCase();
        document.getElementById('detail-date').textContent = transData.date ? new Date(transData.date.seconds * 1000).toLocaleString('id-ID') : '-';
        document.getElementById('detail-total').textContent = formatRupiah(transData.total_price);
        document.getElementById('btn-print-history').setAttribute('data-transaction-id', transactionId);

        const itemsSnapshot = await db.collection('transaction_items').where('transaction_id', '==', transactionId).get();
        const itemsBody = document.getElementById('detail-items');

        itemsSnapshot.forEach(doc => {
            const item = doc.data();
            const row = `
                <tr>
                    <td>${item.product_name}</td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-end">${formatRupiah(item.subtotal)}</td>
                </tr>
            `;
            itemsBody.insertAdjacentHTML('beforeend', row);
        });

        modal.show();
    } catch (error) {
        console.error("Error loading details:", error);
        showToast('Gagal memuat detail transaksi', 'error');
    }
}

function printHistoryReceipt(orderId, totalStr, dateStr, items) {
    const printArea = document.getElementById('receipt-print');
    if (!printArea) return;

    let itemsHtml = '';
    items.forEach(item => {
        itemsHtml += `
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                <span>${item.name} x${item.quantity}</span>
                <span>${item.subtotal}</span>
            </div>
        `;
    });

    printArea.innerHTML = `
        <div style="text-align: center; margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px;">
            <h3 style="margin: 0; font-size: 18px;">TOKO APRIL</h3>
            <p style="margin: 5px 0; font-size: 12px;">Jl. Contoh No. 123, Kota Anda</p>
        </div>
        <div style="font-size: 12px; margin-bottom: 10px;">
            <p style="margin: 2px 0;">No: ${orderId}</p>
            <p style="margin: 2px 0;">Tgl: ${dateStr}</p>
        </div>
        <div style="border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; font-size: 12px;">
            ${itemsHtml}
        </div>
        <div style="font-size: 12px; font-weight: bold;">
            <div style="display: flex; justify-content: space-between;">
                <span>TOTAL</span>
                <span>${totalStr}</span>
            </div>
        </div>
        <div style="text-align: center; margin-top: 20px; font-size: 12px;">
            <p style="margin: 0;">Terima Kasih</p>
        </div>
    `;

    printArea.classList.remove('d-none');
    window.print();
    printArea.classList.add('d-none');
}
