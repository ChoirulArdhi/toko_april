// reports.js

let currentPeriodListeners = [];

document.addEventListener('DOMContentLoaded', function () {
    const today = new Date();
    const dateEl = document.getElementById('today-date');
    if (dateEl) {
        dateEl.textContent = today.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    loadAllReports();
});

function clearListeners() {
    currentPeriodListeners.forEach(unsub => unsub());
    currentPeriodListeners = [];
}

async function loadAllReports(filterDate = null, searchKeyword = '') {
    clearListeners();

    const today = filterDate || new Date();

    const startOfSelected = new Date(today);
    startOfSelected.setHours(0, 0, 0, 0);

    const endOfSelected = new Date(today);
    endOfSelected.setHours(23, 59, 59, 999);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today);
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // If filterDate is set, we only care about that specific range for 'Daily'
    // but for simplicity, we'll update all based on the 'selected' anchor.

    fetchPeriodData(startOfSelected, endOfSelected, 'daily', searchKeyword);
    fetchPeriodData(startOfWeek, null, 'weekly', searchKeyword);
    fetchPeriodData(startOfMonth, null, 'monthly', searchKeyword);

    loadTopProducts(startOfSelected, endOfSelected, searchKeyword);
}

async function fetchPeriodData(startDate, endDate, elementPrefix, keyword = '') {
    let query = db.collection('transaction_items').where('date', '>=', startDate);
    if (endDate) {
        query = query.where('date', '<=', endDate);
    }

    const unsub = query.onSnapshot(snapshot => {
        let totalRevenue = 0;
        let totalCOGS = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            const name = data.product_name || '';
            const tid = data.transaction_id || '';

            // Apply keyword filter locally (Firestore doesn't support easy multi-field partial search)
            if (!keyword || name.toLowerCase().includes(keyword.toLowerCase()) || tid.toLowerCase().includes(keyword.toLowerCase())) {
                totalRevenue += data.subtotal || 0;
                totalCOGS += (data.purchase_price || 0) * (data.quantity || 0);
            }
        });

        const profit = totalRevenue - totalCOGS;

        const revEl = document.getElementById(`${elementPrefix}-revenue`);
        const cogsEl = document.getElementById(`${elementPrefix}-cogs`);
        const profitEl = document.getElementById(`${elementPrefix}-profit`);

        if (revEl) revEl.textContent = formatRupiah(totalRevenue);
        if (cogsEl) cogsEl.textContent = formatRupiah(totalCOGS);
        if (profitEl) {
            profitEl.textContent = formatRupiah(profit);
            profitEl.className = profit >= 0 ? 'fw-bold mb-0 text-success' : 'fw-bold mb-0 text-danger';
        }
    }, error => {
        console.error(`Error loading ${elementPrefix} report:`, error);
    });

    currentPeriodListeners.push(unsub);
}

async function loadTopProducts(startDate, endDate, keyword = '') {
    let query = db.collection('transaction_items').where('date', '>=', startDate);
    if (endDate) {
        query = query.where('date', '<=', endDate);
    }

    const unsub = query.onSnapshot(snapshot => {
        const productStats = {};

        snapshot.forEach(doc => {
            const data = doc.data();
            const name = data.product_name;
            const tid = data.transaction_id || '';

            if (!keyword || name.toLowerCase().includes(keyword.toLowerCase()) || tid.toLowerCase().includes(keyword.toLowerCase())) {
                if (!productStats[name]) {
                    productStats[name] = { qty: 0, revenue: 0 };
                }
                productStats[name].qty += data.quantity;
                productStats[name].revenue += data.subtotal;
            }
        });

        const sortedProducts = Object.keys(productStats)
            .map(name => ({ name, ...productStats[name] }))
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 10);

        renderTopProducts(sortedProducts);
    }, error => {
        console.error("Error loading top products:", error);
    });

    currentPeriodListeners.push(unsub);
}

function renderTopProducts(products) {
    const tbody = document.getElementById('top-products-body');
    if (!tbody) return;

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center py-5 text-muted">Belum ada data penjualan pada periode/filter ini.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    products.forEach((p, index) => {
        const row = `
            <tr class="animate-up" style="animation-delay: ${index * 0.05}s">
                <td>
                    <div class="d-flex align-items-center">
                        <span class="badge bg-primary bg-opacity-10 text-primary me-3 rounded-circle d-flex align-items-center justify-content-center" style="width: 24px; height: 24px; font-size: 10px;">${index + 1}</span>
                        <span class="fw-bold text-dark">${p.name}</span>
                    </div>
                </td>
                <td class="text-center"><span class="badge bg-light text-dark px-3 py-2 rounded-pill border">${p.qty} Item</span></td>
                <td class="text-end fw-bold text-success">${formatRupiah(p.revenue)}</td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

window.applyReportFilters = function () {
    const dateVal = document.getElementById('report-date-filter').value;
    const searchVal = document.getElementById('report-search').value;

    let filterDate = null;
    if (dateVal) {
        filterDate = new Date(dateVal);
    }

    loadAllReports(filterDate, searchVal);
}

window.resetReportFilters = function () {
    document.getElementById('report-date-filter').value = '';
    document.getElementById('report-search').value = '';
    loadAllReports();
}
