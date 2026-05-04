// ============================================================
// dashboard.js — Admin Panel JS
// API_BASE is defined in /js/auth.js
// ============================================================

// ===== AUTH CHECK =====
const token     = sessionStorage.getItem("admin_token");
const adminUser = JSON.parse(sessionStorage.getItem("admin_user") || "{}");
if (!token || adminUser.role !== "admin") {
    window.location.href = "/pages/index.html";
}

const headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + token
};

// Show admin name in sidebar
const nameEl = document.getElementById("adminName");
const avatarEl = document.getElementById("adminAvatar");
if (nameEl && adminUser.fullName) {
    nameEl.textContent = adminUser.fullName;
    avatarEl.textContent = adminUser.fullName.charAt(0).toUpperCase();
}

// ===== PAGE NAVIGATION =====
const pages  = ['dashboard','users','businesses','companies','products','transactions','reports','settings'];
const titles = {
    dashboard: 'Admin Dashboard', users: 'User Management',
    businesses: 'Business Management', companies: 'Company Management',
    products: 'Product Management', transactions: 'Transactions',
    reports: 'Platform Reports', settings: 'Settings'
};

function showPage(name) {
    pages.forEach(p => {
        document.getElementById('page-' + p)?.classList.toggle('active', p === name);
    });
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.toggle('active', el.dataset.page === name);
    });
    document.getElementById('headerTitle').textContent = titles[name] || name;

    if (name === 'dashboard')  { loadDashboardStats(); loadRecentRegistrations(); loadRecentActivity(); }
    if (name === 'users')      loadUsers();
    if (name === 'businesses') loadBusinesses();
    if (name === 'companies')  loadCompanies();
    if (name === 'products')   { loadProducts(); loadCompanyDropdown(); }
    //if (name === 'reports')    loadReports();
    if (name === 'reports') {
    reportsLoaded = false;}   // ← ADD THIS so fresh data loads next visit}
    if (name === 'settings')   {}

}

// ===== LOGOUT =====
function logout() {
    sessionStorage.removeItem("admin_token");
    sessionStorage.removeItem("admin_user");
    window.location.href = "/pages/index.html";
}

function toggleLogoutPopup() {
    const popup = document.getElementById('logoutPopup');
    popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
}

document.addEventListener('click', e => {
    if (!e.target.closest('.user-card')) {
        const popup = document.getElementById('logoutPopup');
        if (popup) popup.style.display = 'none';
    }
});

// ===== TOAST =====
function showToast(type, icon, title, message, duration = 4000) {
    const container = document.getElementById('toastContainer');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `
        <div style="font-size:18px">${icon}</div>
        <div>
            <div class="toast-title">${title}</div>
            ${message ? `<div class="toast-msg">${message}</div>` : ''}
        </div>`;
    container.appendChild(t);
    if (duration > 0) setTimeout(() => { t.style.opacity='0'; setTimeout(() => t.remove(), 300); }, duration);
    return t;
}
const toast = {
    success: (title, msg) => showToast('success', '✅', title, msg),
    error:   (title, msg) => showToast('error',   '❌', title, msg, 6000),
    warning: (title, msg) => showToast('warning', '⚠️', title, msg, 5000),
    info:    (title, msg) => showToast('info',    'ℹ️', title, msg),
};

// ===== CHART OPTIONS =====
const opts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#94A3B8', font: { family: 'DM Sans', size: 11 } } } },
    scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748B', font: { family: 'DM Sans', size: 11 } } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748B', font: { family: 'DM Sans', size: 11 } } }
    }
};

// ===== REPORT TABS =====
// ===== REPORT TABS =====
let reportsLoaded = false;          // ← ADD THIS LINE

function setAdminReportTab(el, section) {
    document.querySelectorAll('.report-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    ['rpt-gst','rpt-sales','rpt-invoice'].forEach(id => {
        const s = document.getElementById(id);
        if (s) s.style.display = id === section ? 'block' : 'none';
    });
    if (!reportsLoaded) {           // ← REPLACES your old setAdminReportTab
        loadReports();
        reportsLoaded = true;
    }
}

// ===== LOAD DASHBOARD STATS =====
async function loadDashboardStats() {
    try {
        const res = await fetch(`${API_BASE}/api/Admin/dashboard-stats`, { headers });
        if (res.status === 401) { toast.error("Session Expired", "Please login again"); logout(); return; }
        const data = await res.json();

        document.querySelector('[data-stat="totalUsers"]').textContent       = (data.totalUsers || 0).toLocaleString();
        document.querySelector('[data-stat="totalSellers"]').textContent     = (data.totalSellers || 0).toLocaleString();
        document.querySelector('[data-stat="totalShopkeepers"]').textContent = (data.totalShopkeepers || 0).toLocaleString();
        document.querySelector('[data-stat="totalProducts"]').textContent    = (data.totalProducts || 0).toLocaleString();
        document.querySelector('[data-stat="totalCompanies"]').textContent   = (data.totalCompanies || 0).toLocaleString();
        document.querySelector('[data-stat="totalInvoices"]').textContent    = (data.totalInvoices || 0).toLocaleString();

        // Update role chart
        if (window.roleChartInstance) {
            window.roleChartInstance.data.datasets[0].data = [
                data.totalShopkeepers || 0,
                data.totalSellers || 0,
                1
            ];
            window.roleChartInstance.update();
        }
    } catch (err) { console.error("Dashboard stats error:", err); }
}

// ===== LOAD USERS =====
async function loadUsers() {
    try {
        const res   = await fetch(`${API_BASE}/api/Admin/users`, { headers });
        const users = await res.json();
        const tbody = document.getElementById('usersTbody');
        tbody.innerHTML = '';

        if (!users.length) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:30px;">No users found</td></tr>`;
            return;
        }

        users.forEach(u => {
            const roleClass = u.role?.toLowerCase() === 'seller' ? 'seller' :
                              u.role?.toLowerCase() === 'admin'  ? 'admin'  : 'shopkeeper';
            tbody.innerHTML += `
            <tr>
                <td>${u.fullName}</td>
                <td>${u.email}</td>
                <td>${u.phone || '—'}</td>
                <td><span class="role-tag ${roleClass}">${u.role}</span></td>
                <td>${u.businessName || '—'}</td>
                <td>${u.gstNumber || '—'}</td>
                <td><span class="badge green">Active</span></td>
                <td>
                    <button onclick="confirmDeleteUser(${u.userId}, '${u.fullName}')"
                        style="background:var(--red-dim);color:var(--red);border:none;
                        padding:4px 10px;border-radius:6px;cursor:pointer;font-size:12px;">
                        🗑 Delete
                    </button>
                </td>
            </tr>`;
        });

        document.querySelector('[data-stat="usersTotal"]').textContent     = users.length;
        document.querySelector('[data-stat="usersActive"]').textContent    = users.length;
        document.querySelector('[data-stat="usersPending"]').textContent   = '—';
        document.querySelector('[data-stat="usersSuspended"]').textContent = '—';

        const badge = document.getElementById('usersBadge');
        if (badge) badge.textContent = users.length;

    } catch (err) { console.error("Users error:", err); }
}

async function deleteUser(userId) {
    // No confirm() - use your own toast confirm instead (see Fix 2)
    try {
        const res = await fetch(`${API_BASE}/api/Admin/delete-user/${userId}`, { method: "DELETE", headers });
        if (res.ok) { 
            toast.success("Deleted", "User deleted successfully"); 
            loadUsers();  // ← auto refresh
        } else { 
            toast.error("Delete Failed", "Failed to delete user"); 
        }
    } catch (err) { toast.error("Server Error", err.message); }
}
// ===== LOAD BUSINESSES =====
async function loadBusinesses() {
    try {
        const res        = await fetch(`${API_BASE}/api/Admin/businesses`, { headers });
        const businesses = await res.json();
        const tbody      = document.getElementById('businesses-tbody');
        tbody.innerHTML  = '';

        if (!businesses.length) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:30px;">No businesses found</td></tr>`;
            return;
        }

        businesses.forEach(b => {
            const roleClass  = b.role?.toLowerCase() === 'seller' ? 'seller' : 'shopkeeper';
            const isPending  = b.gstNumber === 'Pending' || !b.gstNumber;
            tbody.innerHTML += `
            <tr>
                <td>${b.businessName}</td>
                <td>${b.ownerName || b.fullName || '—'}</td>
                <td>${b.gstNumber || 'Pending'}</td>
                <td><span class="role-tag ${roleClass}">${b.role}</span></td>
                <td>${b.state || '—'}</td>
                <td><span class="badge ${isPending ? 'yellow' : 'green'}">${isPending ? 'Pending KYC' : 'Verified'}</span></td>
            </tr>`;
        });

        document.querySelector('#page-businesses [data-stat="totalBusinesses"]').textContent = businesses.length;
        document.querySelector('#page-businesses [data-stat="verified"]').textContent        = businesses.filter(b => b.gstNumber && b.gstNumber !== 'Pending').length;
        document.querySelector('#page-businesses [data-stat="pending"]').textContent         = businesses.filter(b => !b.gstNumber || b.gstNumber === 'Pending').length;

    } catch (err) { console.error("Businesses error:", err); }
}

// ===== LOAD PRODUCTS =====
async function loadProducts() {
    try {
        const res      = await fetch(`${API_BASE}/api/Admin/products`, { headers });
        const products = await res.json();
        const tbody    = document.getElementById('products-tbody');
        tbody.innerHTML = '';

        if (!products.length) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:30px;">No products found</td></tr>`;
            return;
        }

        products.forEach(p => {
            const gstClass = p.gstPercent == 0 ? 'green' : p.gstPercent <= 5 ? 'teal' :
                             p.gstPercent <= 12 ? 'blue' : p.gstPercent <= 18 ? 'orange' : 'red';
            tbody.innerHTML += `
            <tr style="cursor:pointer" onclick="showProductDetail(${JSON.stringify(p).replace(/"/g,'&quot;')})">
                <td>${p.productName}</td>
                <td>${p.productCode || '—'}</td>
                <td>${p.hsnCode || '—'}</td>
                <td>${p.companyName || '—'}</td>
                <td>${p.category || '—'}</td>
                <td>${p.unit || '—'}</td>
                <td>₹${p.mrp}</td>
                <td><span class="badge ${gstClass}">${p.gstPercent}%</span></td>
            </tr>`;
        });

        const countEl = document.getElementById('productsCount');
        if (countEl) countEl.textContent = `(${products.length})`;

    } catch (err) { console.error("Products error:", err); }
}

async function saveProduct() {
    const product = {
        productName: document.getElementById('pName').value.trim(),
        productCode: document.getElementById('pCode').value.trim(),
        hsnCode:     document.getElementById('pHSN').value.trim(),
        companyName: document.getElementById('productCompany').value,
        category:    document.getElementById('pCategory').value,
        unit:        document.getElementById('pUnit').value,
        mrp:         parseFloat(document.getElementById('pMRP').value) || 0,
        gstPercent:  parseFloat(document.getElementById('pGST').value.replace('%','')) || 0
    };

    if (!product.productName) { toast.warning("Missing Name", "Product name is required"); return; }
    if (!product.companyName) { toast.warning("Missing Company", "Please select a company"); return; }

    try {
        const res  = await fetch(`${API_BASE}/api/Admin/add-product`, { method: "POST", headers, body: JSON.stringify(product) });
        const data = await res.json();
        if (data.success) { toast.success("Saved", "Product saved successfully"); loadProducts(); }
        else toast.error("Save Failed", data.message);
    } catch (err) { toast.error("Server Error", err.message); }
}

function showProductDetail(p) {
    document.getElementById('product-side-panel')?.remove();
    document.getElementById('popup-overlay')?.remove();

    const panel = document.createElement('div');
    panel.id = 'product-side-panel';
    panel.style.cssText = `
        position:fixed;top:0;right:-420px;width:400px;height:100vh;
        background:linear-gradient(180deg,#0a0f1e 0%,#0d1529 50%,#0a0f1e 100%);
        border-left:2px solid #c0392b;z-index:9999;display:flex;flex-direction:column;
        box-shadow:-8px 0 40px rgba(192,57,43,0.12);
        transition:right 0.3s cubic-bezier(0.4,0,0.2,1);font-family:inherit;`;

    panel.innerHTML = `
        <div style="padding:20px 24px;border-bottom:1px solid rgba(192,57,43,0.3);display:flex;justify-content:space-between;align-items:center;">
            <div>
                <div style="font-size:10px;color:#e57373;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;">⬡ Product Details</div>
                <div style="font-size:20px;font-weight:800;color:#fff;">${p.productName}</div>
            </div>
            <button onclick="closeSidePanel()" style="background:rgba(192,57,43,0.1);border:1px solid rgba(192,57,43,0.3);color:#e57373;width:34px;height:34px;border-radius:8px;cursor:pointer;font-size:16px;">✕</button>
        </div>
        <div style="flex:1;overflow-y:auto;padding:20px 24px;">
            <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:16px;margin-bottom:16px;">
                <div style="font-size:10px;color:#e57373;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;">Basic Info</div>
                ${[['Product Code',p.productCode||'—'],['HSN Code',p.hsnCode||'—'],['Company',p.companyName||'—'],['Category',p.category||'—'],['Unit',p.unit||'—'],['GST',p.gstPercent+'%']].map(([l,v])=>`
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
                    <span style="color:#7aa3cc;font-size:12px;">${l}</span>
                    <span style="color:#e2e8f0;font-size:13px;font-weight:500;">${v}</span>
                </div>`).join('')}
            </div>
            <div style="background:rgba(192,57,43,0.08);border:1px solid rgba(192,57,43,0.25);border-radius:12px;padding:20px;margin-bottom:16px;">
                <div style="font-size:10px;color:#e57373;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">MRP (Fixed)</div>
                <div style="font-size:36px;font-weight:900;color:#e57373;">₹${p.mrp}</div>
                <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:6px;">🔒 Cannot be changed by sellers</div>
            </div>
            <div style="background:rgba(139,92,246,0.05);border:1px solid rgba(139,92,246,0.2);border-radius:12px;padding:16px;margin-bottom:16px;">
                <div style="font-size:10px;color:#a78bfa;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;">✏ Edit Product</div>
                <div style="display:grid;gap:10px;">
                    <div><label style="font-size:11px;color:#7aa3cc;display:block;margin-bottom:5px;">Product Name</label>
                        <input id="edit-name" value="${p.productName}" style="width:100%;background:rgba(0,0,0,0.3);border:1px solid rgba(139,92,246,0.3);border-radius:8px;padding:9px 12px;color:#e2e8f0;font-size:13px;box-sizing:border-box;outline:none;"></div>
                    <div><label style="font-size:11px;color:#7aa3cc;display:block;margin-bottom:5px;">MRP (₹)</label>
                        <input id="edit-mrp" type="number" value="${p.mrp}" style="width:100%;background:rgba(0,0,0,0.3);border:1px solid rgba(139,92,246,0.3);border-radius:8px;padding:9px 12px;color:#e2e8f0;font-size:13px;box-sizing:border-box;outline:none;"></div>
                    <div><label style="font-size:11px;color:#7aa3cc;display:block;margin-bottom:5px;">HSN Code</label>
                        <input id="edit-hsn" value="${p.hsnCode||''}" style="width:100%;background:rgba(0,0,0,0.3);border:1px solid rgba(139,92,246,0.3);border-radius:8px;padding:9px 12px;color:#e2e8f0;font-size:13px;box-sizing:border-box;outline:none;"></div>
                    <button onclick="saveProductEdit(${p.productId})" style="background:linear-gradient(135deg,#7c3aed,#a78bfa);color:white;border:none;padding:10px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;width:100%;">💾 Save Changes</button>
                </div>
            </div>
            <div style="background:rgba(16,185,129,0.04);border:1px solid rgba(16,185,129,0.2);border-radius:12px;padding:16px;">
                <div style="font-size:10px;color:#34d399;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;">📦 Stock Across Sellers</div>
                <div id="stock-across-sellers" style="font-size:13px;color:#7aa3cc;">Loading...</div>
            </div>
        </div>
        <div style="padding:16px 24px;border-top:1px solid rgba(255,255,255,0.08);display:flex;gap:10px;">
            <button onclick="deleteProduct(${p.productId})" style="flex:1;background:var(--red);color:white;border:none;padding:11px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;">🗑 Delete</button>
            <button onclick="closeSidePanel()" style="flex:1;background:rgba(255,255,255,0.05);color:var(--muted);border:1px solid var(--border);padding:11px;border-radius:8px;cursor:pointer;font-size:13px;">Close</button>
        </div>`;

    const overlay = document.createElement('div');
    overlay.id = 'popup-overlay';
    overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:9998;`;
    overlay.onclick = closeSidePanel;

    document.body.appendChild(overlay);
    document.body.appendChild(panel);
    requestAnimationFrame(() => { panel.style.right = '0'; });
    loadStockAcrossSellers(p.productId);
}

function closeSidePanel() {
    const panel = document.getElementById('product-side-panel');
    if (panel) { panel.style.right = '-420px'; setTimeout(() => panel.remove(), 300); }
    document.getElementById('popup-overlay')?.remove();
}

async function loadStockAcrossSellers(productId) {
    const el = document.getElementById('stock-across-sellers');
    try {
        const res  = await fetch(`${API_BASE}/api/Admin/product-stock/${productId}`, { headers });
        const data = await res.json();
        if (!data.length) { el.innerHTML = '<span style="color:rgba(52,211,153,0.4);font-size:12px;">No stock held by any seller yet</span>'; return; }
        el.innerHTML = data.map(s => `
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(52,211,153,0.1);">
                <span style="color:#cbd5e1;font-size:13px;">${s.sellerName}</span>
                <span style="background:rgba(52,211,153,0.12);color:#34d399;padding:3px 12px;border-radius:20px;font-size:12px;font-weight:700;">${s.quantity} units</span>
            </div>`).join('');
    } catch { el.innerHTML = '<span style="color:rgba(239,68,68,0.6);font-size:12px;">Could not load stock data</span>'; }
}

async function saveProductEdit(productId) {
    const name = document.getElementById('edit-name').value;
    const mrp  = parseFloat(document.getElementById('edit-mrp').value) || 0;
    const hsn  = document.getElementById('edit-hsn').value;
    try {
        const res  = await fetch(`${API_BASE}/api/Admin/update-product`, {
            method: 'PUT', headers,
            body: JSON.stringify({ productID: productId, productName: name, mrp, hsnCode: hsn })
        });
        const data = await res.json();
        if (data.success) { toast.success("Updated", "Product updated successfully"); closeSidePanel(); loadProducts(); }
        else toast.error("Update Failed", data.message);
    } catch (err) { toast.error("Server Error", err.message); }
}

async function deleteProduct(productId) {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
        const res  = await fetch(`${API_BASE}/api/Admin/delete-product/${productId}`, { method: 'DELETE', headers });
        const data = await res.json();
        if (data.success) { closeSidePanel(); toast.success("Deleted", "Product deleted"); loadProducts(); }
        else toast.error("Delete Failed", data.message);
    } catch (err) { toast.error("Server Error", err.message); }
}

// ===== LOAD COMPANIES =====
async function loadCompanies() {
    try {
        const res       = await fetch(`${API_BASE}/api/Admin/companies`, { headers });
        const companies = await res.json();
        const tbody     = document.getElementById('companies-tbody');
        tbody.innerHTML = '';

        if (!companies.length) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:30px;">No companies found</td></tr>`;
            return;
        }

        companies.forEach(c => {
            tbody.innerHTML += `
            <tr>
                <td>${c.companyName}</td>
                <td>${c.gstNumber || '—'}</td>
                <td>${c.address || '—'}</td>
                <td><span class="badge ${c.isActive ? 'green' : 'red'}">${c.isActive ? 'Active' : 'Inactive'}</span></td>
                <td>
                    <button onclick="deleteCompany(${c.companyId})"
                        style="background:var(--red-dim);color:var(--red);border:none;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:12px;">
                        🗑 Delete
                    </button>
                </td>
            </tr>`;
        });

        const countEl = document.getElementById('companiesCount');
        if (countEl) countEl.textContent = `(${companies.length})`;

    } catch (err) { console.error("Companies error:", err); }
}

async function saveCompany() {
    const company = {
        companyName: document.getElementById('companyName').value.trim(),
        gstNumber:   document.getElementById('companyGST').value.trim(),
        address:     document.getElementById('companyAddress').value.trim()
    };
    if (!company.companyName) { toast.warning("Missing Name", "Company name is required"); return; }
    try {
        const res  = await fetch(`${API_BASE}/api/Admin/add-company`, { method: "POST", headers, body: JSON.stringify(company) });
        const data = await res.json();
        if (data.success) {
            toast.success("Saved", "Company saved successfully");
            document.getElementById('companyName').value = '';
            document.getElementById('companyGST').value = '';
            document.getElementById('companyAddress').value = '';
            loadCompanies();
        } else toast.error("Save Failed", data.message);
    } catch (err) { toast.error("Server Error", err.message); }
}

async function deleteCompany(companyId) {
    if (!confirm("Delete this company?")) return;
    try {
        const res  = await fetch(`${API_BASE}/api/Admin/delete-company/${companyId}`, { method: "DELETE", headers });
        const data = await res.json();
        if (data.success) { toast.success("Deleted", "Company deleted"); loadCompanies(); }
        else toast.error("Delete Failed", "Failed to delete company");
    } catch (err) { toast.error("Server Error", err.message); }
}

async function loadCompanyDropdown() {
    try {
        const res       = await fetch(`${API_BASE}/api/Admin/companies`, { headers });
        const companies = await res.json();
        const select    = document.getElementById('productCompany');
        select.innerHTML = '<option value="">Select Company</option>';
        companies.forEach(c => {
            select.innerHTML += `<option value="${c.companyName}">${c.companyName}</option>`;
        });
    } catch (err) { console.error("Company dropdown error:", err); }
}

// ===== RECENT REGISTRATIONS =====
async function loadRecentRegistrations() {
    try {
        const res  = await fetch(`${API_BASE}/api/Admin/recent-registrations`, { headers });
        const regs = await res.json();
        const tbody = document.getElementById('recentRegTbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!regs.length) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:20px;">No registrations yet</td></tr>`;
            return;
        }

        regs.forEach(r => {
            const roleClass = r.role?.toLowerCase() === 'seller' ? 'seller' : 'shopkeeper';
            tbody.innerHTML += `
            <tr>
                <td>${r.businessName || '—'}</td>
                <td>${r.fullName}</td>
                <td><span class="role-tag ${roleClass}">${r.role}</span></td>
                <td>${r.joinDate || '—'}</td>
                <td><span class="badge green">Active</span></td>
            </tr>`;
        });
    } catch (err) { console.error("Recent registrations error:", err); }
}

// ===== RECENT ACTIVITY =====
async function loadRecentActivity() {
    try {
        const res        = await fetch(`${API_BASE}/api/Admin/recent-activity`, { headers });
        const activities = await res.json();
        const container  = document.getElementById('activity-container');
        if (!container) return;
        container.innerHTML = '';

        if (!activities.length) {
            container.innerHTML = `<div class="activity-item"><div style="color:var(--muted);padding:10px;">No activity yet</div></div>`;
            return;
        }

        activities.forEach(a => {
            const dotClass = a.logType === 'success' ? 'green' : a.logType === 'warning' ? 'yellow' : a.logType === 'error' ? 'red' : 'blue';
            container.innerHTML += `
            <div class="activity-item">
                <div class="activity-dot ${dotClass}"></div>
                <div>
                    <div class="activity-text">${a.message}</div>
                    <div class="activity-time">${a.createdAt}</div>
                </div>
            </div>`;
        });
    } catch (err) { console.error("Activity error:", err); }
}

// ===== ADD USER MODAL =====
let selectedRole = "shopkeeper";

function setUserRole(role) {
    selectedRole = role;
    document.getElementById("rtab-shopkeeper").classList.remove("active");
    document.getElementById("rtab-seller").classList.remove("active");
    document.getElementById("rtab-" + role).classList.add("active");
}

function closeAddUserModal() {
    document.getElementById("addUserModal").style.display = "none";
    resetAddUserForm();   // ← add this
    setUserRole("shopkeeper");  // ← reset role tab too
}

function resetAddUserForm() {
    document.querySelectorAll("#addUserModal input").forEach(i => i.value = "");
}

function toggleModalPass() {
    const input = document.getElementById("mu_password");
    input.type = input.type === "password" ? "text" : "password";
}

async function submitAddUser() {
    const name     = document.getElementById("mu_fullName").value.trim();
    const phone    = document.getElementById("mu_phone").value.trim();
    const email    = document.getElementById("mu_email").value.trim();
    const password = document.getElementById("mu_password").value.trim();

    if (!name || !phone || !email || !password) {
        toast.warning("Missing Fields", "Please fill all required fields");
        return;
    }

    const user = {
        fullName:     name, phone, email, password,
        role:         selectedRole,
        businessName: document.getElementById("mu_businessName").value.trim(),
        gstNumber:    document.getElementById("mu_gstNumber").value.trim(),
        address:      document.getElementById("mu_address").value.trim(),
        city:         document.getElementById("mu_city").value.trim(),
        state:        document.getElementById("mu_state").value,
        pincode:      document.getElementById("mu_pincode").value.trim()
    };

    const btn     = document.getElementById("muSubmitBtn");
    const spinner = document.getElementById("muSpinner");
    const btnText = document.getElementById("muBtnText");
    btn.disabled  = true;
    spinner.style.display = "block";
    btnText.textContent   = "Creating...";

    try {
        const res  = await fetch(`${API_BASE}/api/Admin/add-user`, { method: "POST", headers, body: JSON.stringify(user) });
        const data = await res.json();
        if (res.ok) {
    toast.success("User Created", `${name} added as ${selectedRole}`);
    closeAddUserModal(); resetAddUserForm(); loadUsers();
} else toast.error("Failed", data.message || "Could not create user");
    } catch (err) { toast.error("Server Error", err.message); }
    finally {
        btn.disabled = false;
        spinner.style.display = "none";
        btnText.textContent   = "Create User";
    }
}

// ===== SEARCH =====
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('usersSearch')?.addEventListener('input', function () {
        const q = this.value.toLowerCase();
        document.querySelectorAll('#usersTbody tr').forEach(r => { r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none'; });
    });
    document.getElementById('companiesSearch')?.addEventListener('input', function () {
        const q = this.value.toLowerCase();
        document.querySelectorAll('#companies-tbody tr').forEach(r => { r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none'; });
    });
    document.getElementById('productsSearch')?.addEventListener('input', function () {
        const q = this.value.toLowerCase();
        document.querySelectorAll('#products-tbody tr').forEach(r => { r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none'; });
    });
    document.getElementById('businessesSearch')?.addEventListener('input', function () {
        const q = this.value.toLowerCase();
        document.querySelectorAll('#businesses-tbody tr').forEach(r => { r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none'; });
    });
});

// ===== INIT CHARTS =====
/*
window.roleChartInstance = new Chart(document.getElementById('roleChart'), {
    type: 'doughnut',
    data: {
        labels: ['Shopkeepers','Sellers','Admin'],
        datasets: [{ data: [0,0,1], backgroundColor: ['#3B82F6','#8B5CF6','#F43F5E'], borderWidth: 0 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#94A3B8', font: { family: 'DM Sans', size: 11 } } } } }
});

new Chart(document.getElementById('growthChart'), {
    type: 'line',
    data: { labels: ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'], datasets: [{ label: 'New Signups', data: [680,720,810,840,920,980,1020,1100,1060,1180,1120,842], borderColor: '#F43F5E', backgroundColor: 'rgba(244,63,94,0.08)', fill: true, tension: 0.4, pointBackgroundColor: '#F43F5E', pointRadius: 4 }] },
    options: { ...opts }
});

new Chart(document.getElementById('txnChart'), {
    type: 'bar',
    data: { labels: ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'], datasets: [{ label: 'Volume (₹ Cr)', data: [82,98,88,110,105,122,118,138,130,152,142,148], backgroundColor: 'rgba(59,130,246,0.7)', borderRadius: 6, borderSkipped: false }] },
    options: { ...opts }
});

new Chart(document.getElementById('gstTrendChart'), {
    type: 'line',
    data: { labels: ['Oct','Nov','Dec','Jan','Feb','Mar'], datasets: [{ label: 'GST Collected (₹L)', data: [18.4,21.2,19.8,23.4,22.1,17.6], borderColor: '#F43F5E', backgroundColor: 'rgba(244,63,94,0.08)', fill: true, tension: 0.4, pointBackgroundColor: '#F43F5E', pointRadius: 4 }] },
    options: { ...opts }
});

new Chart(document.getElementById('gstTypeChart'), {
    type: 'doughnut',
    data: { labels: ['CGST','SGST','IGST 18%','IGST 12%','Exempt'], datasets: [{ data: [28,28,35,7,2], backgroundColor: ['#3B82F6','#10B981','#8B5CF6','#F59E0B','#94A3B8'], borderWidth: 0 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#94A3B8', font: { family: 'DM Sans', size: 11 } } } } }
});

new Chart(document.getElementById('adminSalesChart'), {
    type: 'bar',
    data: { labels: ['Oct','Nov','Dec','Jan','Feb','Mar'], datasets: [{ label: 'Sales (₹ Cr)', data: [11.8,13.4,12.6,14.8,14.2,14.84], backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 6, borderSkipped: false }] },
    options: { ...opts }
});

new Chart(document.getElementById('bizTypeChart'), {
    type: 'doughnut',
    data: { labels: ['Shopkeeper Sales','Seller Sales'], datasets: [{ data: [38,62], backgroundColor: ['#3B82F6','#8B5CF6'], borderWidth: 0 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#94A3B8', font: { family: 'DM Sans', size: 11 } } } } }
});

*/

async function loadReports() {
    try {
        // Destroy old charts if they exist
        ['gstTrendChart','adminSalesChart','gstTypeChart','bizTypeChart'].forEach(id => {
            const existing = Chart.getChart(id);
            if (existing) existing.destroy();
        });
         const activeTab = document.querySelector('.report-tab.active');

        // GST Trend Chart
        const gstRes  = await fetch(`${API_BASE}/api/Admin/report-gst`, { headers });
        const gstData = await gstRes.json();
        new Chart(document.getElementById('gstTrendChart'), {
            type: 'line',
            data: {
                labels: gstData.map(d => d.month),
                datasets: [{ label: 'GST Collected (₹L)', data: gstData.map(d => d.amount),
                    borderColor: '#F43F5E', backgroundColor: 'rgba(244,63,94,0.08)',
                    fill: true, tension: 0.4, pointBackgroundColor: '#F43F5E', pointRadius: 4 }]
            },
            options: { ...opts }
        });

        // GST Type Chart (CGST vs SGST from real data)
        const cgst = gstData.reduce((s, d) => s + (d.cgst || 0), 0);
        const sgst = gstData.reduce((s, d) => s + (d.sgst || 0), 0);
        new Chart(document.getElementById('gstTypeChart'), {
            type: 'doughnut',
            data: { labels: ['CGST','SGST'],
                datasets: [{ data: [cgst || 28, sgst || 28],
                backgroundColor: ['#3B82F6','#10B981'], borderWidth: 0 }] },
            options: { responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: 'right', labels: { color: '#94A3B8', font: { family: 'DM Sans', size: 11 } } } } }
        });

        // Sales Trend Chart
        const salesRes  = await fetch(`${API_BASE}/api/Admin/report-sales`, { headers });
        const salesData = await salesRes.json();
        new Chart(document.getElementById('adminSalesChart'), {
            type: 'bar',
            data: { labels: salesData.map(d => d.month),
                datasets: [{ label: 'Sales (₹ Cr)', data: salesData.map(d => d.amount),
                backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 6 }] },
            options: { ...opts }
        });

        // Biz Type Chart
        new Chart(document.getElementById('bizTypeChart'), {
            type: 'doughnut',
            data: { labels: ['Shopkeeper Sales','Seller Sales'],
                datasets: [{ data: [38,62], backgroundColor: ['#3B82F6','#8B5CF6'], borderWidth: 0 }] },
            options: { responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: 'right', labels: { color: '#94A3B8', font: { family: 'DM Sans', size: 11 } } } } }
        });

        // Invoice Stats
        const invRes  = await fetch(`${API_BASE}/api/Admin/report-invoices`, { headers });
        const invData = await invRes.json();
       const invTotal   = document.querySelector('[data-stat="totalInvoicesMonth"]');
const invPaid    = document.querySelector('[data-stat="paidInvoices"]');
const invPending = document.querySelector('[data-stat="pendingInvoices"]');
if (invTotal)   invTotal.textContent   = invData.total.toLocaleString();
if (invPaid)    invPaid.textContent    = invData.paid.toLocaleString();
if (invPending) invPending.textContent = invData.pending.toLocaleString();

    } catch (err) { console.error("Reports error:", err); }
}


function confirmDeleteUser(userId, userName) {
    // Create custom confirm toast
    const container = document.getElementById('toastContainer');
    const t = document.createElement('div');
    t.className = 'toast warning';
    t.style.minWidth = '320px';
    t.innerHTML = `
        <div style="font-size:18px">⚠️</div>
        <div style="flex:1">
            <div class="toast-title">Delete "${userName}"?</div>
            <div class="toast-msg">This action cannot be undone</div>
            <div style="display:flex;gap:8px;margin-top:10px;">
                <button onclick="deleteUser(${userId}); this.closest('.toast').remove();"
                    style="background:#ef4444;color:white;border:none;padding:6px 16px;
                    border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">
                    🗑 Delete
                </button>
                <button onclick="this.closest('.toast').remove();"
                    style="background:rgba(255,255,255,0.1);color:#94a3b8;border:none;
                    padding:6px 16px;border-radius:6px;cursor:pointer;font-size:12px;">
                    Cancel
                </button>
            </div>
        </div>`;
    container.appendChild(t);
    setTimeout(() => { t.style.opacity='0'; setTimeout(() => t.remove(), 300); }, 8000);
}


// ===== FILTER DROPDOWN TOGGLE =====
function toggleDropdown(id) {
    const dd = document.getElementById(id);
    const allDDs = document.querySelectorAll('.filter-dropdown');
    allDDs.forEach(d => { if (d.id !== id) d.style.display = 'none'; });
    dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
}

document.addEventListener('click', e => {
    if (!e.target.closest('.filter-btn') && !e.target.closest('.filter-dropdown')) {
        document.querySelectorAll('.filter-dropdown').forEach(d => d.style.display = 'none');
    }
});

// ===== ROLE + STATUS FILTER =====
function applyUserFilters() {
    const checkedRoles    = [...document.querySelectorAll('#roleDD input:checked')].map(i => i.value);
    const checkedStatuses = [...document.querySelectorAll('#statusDD input:checked')].map(i => i.value);
    const search          = document.getElementById('usersSearch')?.value.toLowerCase() || '';

    document.querySelectorAll('#usersTbody tr').forEach(row => {
        const roleTag   = row.querySelector('.role-tag');
        const badgeEl   = row.querySelector('.badge');
        const rowText   = row.textContent.toLowerCase();

        const rowRole   = roleTag?.classList[1] || '';          // shopkeeper / seller / admin
        const rowStatus = badgeEl?.textContent.trim().toLowerCase() || '';

        const matchRole   = checkedRoles.includes(rowRole);
        const matchStatus = checkedStatuses.some(s => rowStatus.includes(s));
        const matchSearch = !search || rowText.includes(search);

        row.style.display = matchRole && matchStatus && matchSearch ? '' : 'none';
    });
}
/*
// ===== EXPORT EXCEL =====
function exportUsersExcel() {
    const rows = [...document.querySelectorAll('#usersTbody tr')]
        .filter(r => r.style.display !== 'none' && r.cells.length > 2);

    const data = [['Name','Email','Phone','Role','Business','GSTIN','Status']];
    rows.forEach(r => {
        const cells = r.querySelectorAll('td');
        data.push([
            cells[0]?.textContent.trim(),
            cells[1]?.textContent.trim(),
            cells[2]?.textContent.trim(),
            cells[3]?.textContent.trim(),
            cells[4]?.textContent.trim(),
            cells[5]?.textContent.trim(),
            cells[6]?.textContent.trim(),
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{wch:20},{wch:28},{wch:14},{wch:12},{wch:22},{wch:18},{wch:12}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, 'Users', ws);
    XLSX.writeFile(wb, 'users.xlsx');
}*/

// ===== UNIVERSAL EXCEL EXPORT =====

// Reports page has a static table — export it directly
function exportTableExcel(tbodyId, headers, filename, customRows) {
    let rows;
    if (customRows) {
        rows = [...customRows];
    } else {
        rows = [...document.querySelectorAll('#' + tbodyId + ' tr')]
            .filter(r => r.style.display !== 'none' && r.cells.length > 1);
    }

    const data = [headers];
    rows.forEach(r => {
        const cells = [...r.querySelectorAll('td')];
        if (cells.length > 1) {
            data.push(cells.map(td => td.innerText.trim()));
        }
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = headers.map(() => ({ wch: 22 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');  // ← ORDER: wb, ws, name
    XLSX.writeFile(wb, filename);
}

// ===== START =====
showPage('dashboard');