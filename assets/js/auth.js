// auth.js

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('login-form');

    // Check if we are on the login page
    if (loginForm) {
        // Redirect if already logged in
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                window.location.href = 'dashboard.html';
            }
        });

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btnLogin = document.getElementById('btn-login');
            const btnText = document.getElementById('btn-text');
            const btnSpinner = document.getElementById('btn-spinner');

            // UI Loading State
            btnLogin.disabled = true;
            if (btnText) btnText.classList.add('d-none');
            if (btnSpinner) btnSpinner.classList.remove('d-none');

            try {
                await firebase.auth().signInWithEmailAndPassword(email, password);
                showToast('Login berhasil! Mengalihkan...', 'success');
                // Redirect will be handled by the onAuthStateChanged listener
            } catch (error) {
                console.error(error);
                let msg = 'Login gagal. Periksa email dan password.';
                if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                    msg = 'Email atau password salah.';
                } else if (error.code === 'auth/invalid-email') {
                    msg = 'Format email tidak valid.';
                } else if (error.code === 'auth/network-request-failed') {
                    msg = 'Koneksi internet bermasalah.';
                }
                showToast(msg, 'error');

                // Reset UI
                btnLogin.disabled = false;
                if (btnText) btnText.classList.remove('d-none');
                if (btnSpinner) btnSpinner.classList.add('d-none');
            }
        });
    }

    // Logout Functionality (Desktop & Mobile)
    const handleLogout = (e) => {
        e.preventDefault();
        if (confirm('Apakah Anda yakin ingin keluar?')) {
            firebase.auth().signOut().then(() => {
                window.location.href = 'index.html';
            }).catch((error) => {
                console.error('Logout Error:', error);
            });
        }
    };

    const logoutBtn = document.getElementById('logout-btn');
    const logoutBtnMobile = document.getElementById('logout-btn-mobile');

    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (logoutBtnMobile) logoutBtnMobile.addEventListener('click', handleLogout);

    // Auth Guard for protected pages
    if (!loginForm) {
        firebase.auth().onAuthStateChanged(async (user) => {
            if (!user) {
                window.location.href = 'index.html';
            } else {
                // Roles Implementation (Simple check for admin@... or check custom claims if scaled)
                // For now, let's assume if they aren't admin they can't see Products/Reports
                const isAdmin = user.email.includes('admin'); // Simple role check as per user request
                const page = window.location.pathname.split('/').pop();

                // Block cashier from sensitive pages
                const adminPages = ['products.html', 'reports.html'];
                if (!isAdmin && adminPages.includes(page)) {
                    showToast('Akses ditolak: Hanya untuk Admin', 'error');
                    setTimeout(() => window.location.href = 'dashboard.html', 2000);
                }

                // Update UI with user info
                const userEmailEl = document.getElementById('user-email-display');
                if (userEmailEl) userEmailEl.textContent = user.email;

                const userDisplayEl = document.getElementById('user-display');
                if (userDisplayEl) userDisplayEl.textContent = isAdmin ? 'Admin' : 'Kasir';

                // Hide admin menus if not admin
                if (!isAdmin) {
                    const adminMenus = document.querySelectorAll('li a[href="products.html"], li a[href="reports.html"]');
                    adminMenus.forEach(el => el.closest('li').style.display = 'none');
                    // Mobile
                    const mobileAdminMenus = document.querySelectorAll('.nav-item-mobile[href="products.html"], .nav-item-mobile[href="reports.html"]');
                    mobileAdminMenus.forEach(el => el.style.display = 'none');
                }
            }
        });
    }

    // Sidebar logic removed
});



