/**
 * Format a number as Indonesian Rupiah (IDR)
 * @param {number} number 
 * @returns {string} Formatted string (e.g., "Rp 15.000")
 */
function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(number);
}

/**
 * Format a date object to a readable string
 * @param {Date} date 
 * @returns {string} Formatted date (e.g., "05/02/2026 15:30")
 */
function formatDate(date) {
    if (!date) return '-';
    // Handle Firestore Timestamp
    if (date.toDate) {
        date = date.toDate();
    }
    // Handle string date
    if (typeof date === 'string') {
        date = new Date(date);
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

/**
 * Show a simple toast notification
 * @param {string} message 
 * @param {string} type 'success' or 'error'
 */
function showToast(message, type = 'success') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '1100';
        document.body.appendChild(toastContainer);
    }

    const toastId = 'toast-' + Date.now();
    const bgClass = type === 'success' ? 'text-bg-success' : 'text-bg-danger';

    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center ${bgClass} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;

    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement);
    toast.show();

    // Cleanup after hide
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}
