// dashboard.js

document.addEventListener('DOMContentLoaded', function () {
    loadDashboardStats();
});

function loadDashboardStats() {
    // 1. Total Products (Real-time)
    db.collection('products').onSnapshot(snapshot => {
        document.getElementById('total-products').textContent = snapshot.size;
    });

    // 2. Low Stock (Real-time)
    db.collection('products').where('stock', '<=', 10).onSnapshot(snapshot => {
        const count = snapshot.size;
        const countEl = document.getElementById('low-stock');
        const alertHub = document.getElementById('low-stock-alert-hub');
        const alertMsg = document.getElementById('low-stock-message');

        if (countEl) countEl.textContent = count;

        if (alertHub) {
            if (count > 0) {
                alertHub.classList.remove('d-none');
                if (alertMsg) alertMsg.textContent = `${count} produk memiliki stok di bawah batas minimal (10).`;
            } else {
                alertHub.classList.add('d-none');
            }
        }
    });

    // 3. Today's Summary (Real-time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    db.collection('transactions').where('date', '>=', today).onSnapshot(snapshot => {
        let revenue = 0;
        let count = 0;

        // Clear recent activity first (optional, or just update)
        const activityList = document.getElementById('recent-activity-list');
        if (activityList) activityList.innerHTML = '';

        const recentDocs = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            revenue += data.total_price || 0;
            count++;
            recentDocs.push({ id: doc.id, ...data });
        });

        document.getElementById('today-transactions').textContent = count;
        document.getElementById('today-revenue').textContent = formatRupiah(revenue);

        // Update Recent Activity (Last 5)
        recentDocs.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));
        renderRecentActivity(recentDocs.slice(0, 5));
    });
}

function renderRecentActivity(activities) {
    const list = document.getElementById('recent-activity-list');
    if (!list) return;

    if (activities.length === 0) {
        list.innerHTML = '<li class="list-group-item border-0 text-center text-muted py-3">Belum ada transaksi hari ini.</li>';
        return;
    }

    activities.forEach((act, index) => {
        const time = act.date ? new Date(act.date.seconds * 1000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--';
        const item = `
            <li class="list-group-item border-0 d-flex justify-content-between align-items-center animate-up" style="animation-delay: ${index * 0.1}s">
                <div class="d-flex align-items-center">
                    <div class="bg-primary bg-opacity-10 p-2 rounded-circle me-3">
                        <i class="fas fa-shopping-bag text-primary"></i>
                    </div>
                    <div>
                        <h6 class="mb-0 fw-bold">Transaksi #${act.id.substring(0, 6).toUpperCase()}</h6>
                        <small class="text-muted">${time}</small>
                    </div>
                </div>
                <span class="fw-bold text-dark">${formatRupiah(act.total_price)}</span>
            </li>
        `;
        list.insertAdjacentHTML('beforeend', item);
    });
}
