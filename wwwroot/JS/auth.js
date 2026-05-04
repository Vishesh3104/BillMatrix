// ============================================================
// auth.js — Shared auth helpers for all BillMatrix pages
// ============================================================

const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:5147'   // ← your new project port
    : '';                        // empty = same origin in production

// 🔐 Check session + role — call at top of every protected page
function requireAuth(requiredRole) {
    const key   = requiredRole ? requiredRole.toLowerCase() : 'user';
    const token = sessionStorage.getItem(`${key}_token`);
    const user  = JSON.parse(sessionStorage.getItem(`${key}_user`) || 'null');

    if (!token || !user) { redirectToLogin(); return null; }
    if (requiredRole && user.role.toLowerCase() !== requiredRole.toLowerCase()) {
        redirectToLogin(); return null;
    }
    document.body.style.display = 'block';
    return user;
}

// 🔐 Validate token with backend (call after requireAuth)
async function checkTokenValidity(requiredRole) {
    const key   = requiredRole ? requiredRole.toLowerCase() : 'user';
    const token = sessionStorage.getItem(`${key}_token`);
    if (!token) { redirectToLogin(); return; }

    try {
        const res = await fetch(`${API_BASE}/api/Auth/validate`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) throw new Error('Invalid token');
        console.log('✅ Token valid');
    } catch (err) {
        console.warn('❌ Token expired → logging out');
        logout();
    }
}

// 🔑 Get token for the current role (use in all API calls)
function getToken(role) {
    return sessionStorage.getItem(`${role}_token`);
}

// 👤 Get current user object
function getUser(role) {
    return JSON.parse(sessionStorage.getItem(`${role}_user`) || 'null');
}

// 🚪 Logout — clears all sessions
function logout() {
    ['admin', 'seller', 'shopkeeper'].forEach(role => {
        sessionStorage.removeItem(`${role}_token`);
        sessionStorage.removeItem(`${role}_user`);
    });
    window.location.href = '/pages/index.html';
}

function redirectToLogin() {
    window.location.href = '/pages/index.html';
}

// ============================================================
// Shared API helper — auto-attaches Bearer token
// ============================================================
async function apiFetch(url, options = {}, role = null) {
    const key   = role ? role.toLowerCase() : detectCurrentRole();
    const token = sessionStorage.getItem(`${key}_token`);

    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
    };

    const res = await fetch(`${API_BASE}${url}`, { ...options, headers });

    if (res.status === 401) { logout(); return null; }

    return res;
}

// Detects which role is currently logged in (for pages that serve one role)
function detectCurrentRole() {
    if (sessionStorage.getItem('admin_token'))      return 'admin';
    if (sessionStorage.getItem('seller_token'))     return 'seller';
    if (sessionStorage.getItem('shopkeeper_token')) return 'shopkeeper';
    return 'user';
}

// ============================================================
// Shared toast notification
// ============================================================
function showToast(msg, isError = false) {
    let toast = document.getElementById('bm-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'bm-toast';
        toast.style.cssText = `
            position:fixed;bottom:32px;left:50%;transform:translateX(-50%) translateY(80px);
            background:#182033;border-radius:12px;padding:14px 24px;
            display:flex;align-items:center;gap:12px;font-size:14px;font-weight:500;
            color:#F1F5F9;box-shadow:0 16px 48px rgba(0,0,0,0.4);z-index:9999;
            transition:transform .4s cubic-bezier(.34,1.56,.64,1);white-space:nowrap;
            border:1px solid rgba(16,185,129,0.3);font-family:'DM Sans',sans-serif;`;
        document.body.appendChild(toast);
    }
    toast.style.borderColor = isError ? 'rgba(244,63,94,0.3)' : 'rgba(16,185,129,0.3)';
    toast.textContent = msg;
    toast.style.transform = 'translateX(-50%) translateY(0)';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(80px)';
    }, 3500);
}
