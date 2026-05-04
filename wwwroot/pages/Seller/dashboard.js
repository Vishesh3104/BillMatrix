/* ──────────────────────────────────────────
   CONFIG & AUTH
────────────────────────────────────────── */
const API    = "http://localhost:5147";
const token  = sessionStorage.getItem("seller_token");
const user   = JSON.parse(sessionStorage.getItem("seller_user") || "null");
const SID    = user?.userId || user?.userID || 0;
const SSTATE = user?.state || "Gujarat";

document.body.style.display = "none";
if (!user || user.role !== "seller" || !token) {
    window.location.href = "/pages/index.html";
} else {
    window.addEventListener("load", initApp);
}

if (user) {
    document.getElementById("userName").textContent   = user.fullName || "Seller";
    document.getElementById("userAvatar").textContent = (user.fullName || "S")[0].toUpperCase();
    document.getElementById("userRole").textContent   = (user.role || "seller")[0].toUpperCase() + (user.role || "seller").slice(1);
    document.getElementById("prev-seller").textContent = user.fullName || "Seller";
}

/* ──────────────────────────────────────────
   HTTP HELPERS
────────────────────────────────────────── */
function getToken() { return sessionStorage.getItem("seller_token") || ""; }

async function get(url) {
    const r = await fetch(API + url, { headers: { "Authorization": "Bearer " + getToken() } });
    if (r.status === 401) { logout(); return null; }
    const text = await r.text();
    try { return JSON.parse(text); } catch { throw new Error(text); }
}

// REPLACE WITH:
async function post(url, body) {
    const r = await fetch(API + url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + getToken() },
        body: JSON.stringify(body)
    });
    const text = await r.text();
    if (!r.ok) throw new Error(text); // only throw on HTTP error
    try { return JSON.parse(text); } catch { return text; } // return plain text as-is
}

/* ──────────────────────────────────────────
   FORMATTERS
────────────────────────────────────────── */
function fmt(n) {
    return '₹' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function today() { return new Date().toISOString().split('T')[0]; }

/* ──────────────────────────────────────────
   TOAST
────────────────────────────────────────── */
let toastTimer = null;
function showToast(msg, type = "info") {
    const el = document.getElementById("seller-toast");
    el.textContent = msg;
    const colors = { success: "var(--green)", error: "var(--red)", warning: "var(--yellow)", info: "var(--purple)" };
    el.style.borderLeftColor = colors[type] || colors.info;
    el.style.display = "block";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.style.display = "none"; }, 3000);
}
function showMessage(type, text) { showToast(text, type); }

/* ──────────────────────────────────────────
   CONFIRM MODAL
────────────────────────────────────────── */
function showConfirm(icon, title, msg, okColor, okText) {
    return new Promise(resolve => {
        document.getElementById("confirm-icon").textContent  = icon;
        document.getElementById("confirm-title").textContent = title;
        document.getElementById("confirm-msg").textContent   = msg;
        const okBtn = document.getElementById("confirm-ok");
        okBtn.textContent      = okText;
        okBtn.style.background = okColor;
        document.getElementById("confirm-modal").classList.add("open");
        const close = (val) => {
            document.getElementById("confirm-modal").classList.remove("open");
            okBtn.onclick     = null;
            cancelBtn.onclick = null;
            resolve(val);
        };
        okBtn.onclick = () => close(true);
        const cancelBtn = document.getElementById("confirm-cancel");
        cancelBtn.onclick = () => close(false);
    });
}

/* ──────────────────────────────────────────
   SIGNALR
   FIX: changed /notificationHub → /hubs/notification to match Program.cs
────────────────────────────────────────── */
let connection = null;
async function startSignalR() {
    try {
        connection = new signalR.HubConnectionBuilder()
            .withUrl(API + "/hubs/notification")
            .withAutomaticReconnect()
            .build();
        await connection.start();
        await connection.invoke("JoinUserGroup", SID.toString());

        connection.on("NewNotification", () => {
            loadRequests();
            loadDashboard();
            loadSidebarRequests();
        });
        connection.on("RequestStatusChanged", () => {
            loadRequests();
            loadSidebarRequests();
        });
        connection.on("ReceiveMessage", (data) => {
            if (window.currentRequestId === data.requestID) loadMessages(data.requestID);
        });
    } catch (e) {
        console.warn("SignalR:", e);
    }
}

/* ──────────────────────────────────────────
   STATE CACHE
────────────────────────────────────────── */
let products    = [];
let companies   = [];
let inventory   = [];
let shopkeepers = [];
let pbListenersAdded  = false;
let profitChartInstance = null;

/* ──────────────────────────────────────────
   INIT
────────────────────────────────────────── */
function initApp() {
    document.body.style.display = "flex";
    Chart.defaults.color       = "#64748B";
    Chart.defaults.borderColor = "rgba(255,255,255,0.05)";
    showPage("dashboard");
    loadSidebarRequests();
    startSignalR();
    initDashboardCharts();
}

/* ──────────────────────────────────────────
   STATIC DASHBOARD CHARTS
────────────────────────────────────────── */
function initDashboardCharts() {
    new Chart(document.getElementById("dashSalesChart"), {
        type: "bar",
        data: {
            labels: ["Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar"],
            datasets: [{
                label: "Sales (₹L)",
                data: [12,14,13,16,15,17,16,20,20,21,20,18],
                backgroundColor: "rgba(139,92,246,0.65)",
                borderRadius: 5,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { labels: { color:"#94A3B8", font:{ size:12 } } } },
            scales: {
                x: { grid: { color:"rgba(255,255,255,0.04)" }, ticks: { color:"#64748B" } },
                y: { grid: { color:"rgba(255,255,255,0.04)" }, ticks: { color:"#64748B" } }
            }
        }
    });
    new Chart(document.getElementById("dashCatChart"), {
        type: "doughnut",
        data: {
            labels: ["FMCG","Food","Personal Care","Household","Others"],
            datasets: [{
                data: [35,25,20,12,8],
                backgroundColor: ["#3B82F6","#10B981","#8B5CF6","#F59E0B","#64748B"],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position:"right", labels:{ color:"#94A3B8", font:{size:11}, boxWidth:12 } } }
        }
    });
}

/* ──────────────────────────────────────────
   PAGE NAVIGATION
────────────────────────────────────────── */
const PAGE_LIST = [
    "dashboard","products","inventory","bills","requests",
    "shopkeepers","invoices","payments","reports",
    "purchase-bill","sales-invoice"
];
const PAGE_TITLES = {
    dashboard:"Dashboard", products:"Products", inventory:"Inventory",
    bills:"Bills", requests:"Requests", shopkeepers:"Shopkeepers",
    invoices:"Invoices", payments:"Payments", reports:"Reports",
    "purchase-bill":"New Purchase Bill", "sales-invoice":"New Sales Invoice"
};

function showPage(name) {
    PAGE_LIST.forEach(p => {
        const el = document.getElementById("page-" + p);
        if (el) el.classList.toggle("active", p === name);
    });
    document.querySelectorAll(".nav-item").forEach(el =>
        el.classList.toggle("active", el.dataset.page === name)
    );
    document.getElementById("headerTitle").textContent = PAGE_TITLES[name] || name;

    const hdrPurchase = document.getElementById("hdr-purchase");
    const hdrSales    = document.getElementById("hdr-sales");
    if (hdrPurchase) hdrPurchase.style.display = (name === "dashboard") ? "" : "none";
    if (hdrSales)    hdrSales.style.display    = (name === "dashboard") ? "" : "none";

    if (name === "dashboard")     loadDashboard();
    if (name === "products")      loadProducts();
    if (name === "inventory")     loadInventory();
    if (name === "bills")         { loadAllBills(); loadRequests(); }
    if (name === "requests")      loadRequests();
    if (name === "shopkeepers")   loadShopkeepers();
    if (name === "invoices")      loadInvoices();
    if (name === "payments")      loadPayments();
    if (name === "purchase-bill") initPurchasePage();
    if (name === "sales-invoice") initSalesPage();
    if (name === "reports")       loadReports();
}

/* ──────────────────────────────────────────
   TAB HELPERS
────────────────────────────────────────── */
function setBillTab(el, section) {
    document.querySelectorAll("#page-bills .report-tab").forEach(t => t.classList.remove("active"));
    el.classList.add("active");
    ["tab-allbills","tab-requests"].forEach(id => {
        const e = document.getElementById(id);
        if (e) e.style.display = id === section ? "block" : "none";
    });
}

function setRptTab(el, section) {
    document.querySelectorAll("#page-reports .report-tab").forEach(t => t.classList.remove("active"));
    el.classList.add("active");
    ["rpt-pb","rpt-sales","rpt-profit","rpt-gst"].forEach(id => {
        const e = document.getElementById(id);
        if (e) e.style.display = id === section ? "block" : "none";
    });
}

/* ──────────────────────────────────────────
   LOGOUT
────────────────────────────────────────── */
function logout() {
    sessionStorage.removeItem("seller_token");
    sessionStorage.removeItem("seller_user");
    window.location.href = "/pages/index.html";
}

/* ──────────────────────────────────────────
   USER POPUP
────────────────────────────────────────── */
function toggleUserPopup() {
    document.getElementById("userPopup").classList.toggle("show");
}
document.addEventListener("click", (e) => {
    const popup = document.getElementById("userPopup");
    const card  = document.querySelector(".user-card");
    if (card && !card.contains(e.target) && !popup.contains(e.target))
        popup.classList.remove("show");
});

/* ──────────────────────────────────────────
   NOTIFICATION
────────────────────────────────────────── */
function toggleNotif() {
    const p = document.getElementById("seller-notif-panel");
    p.style.display = p.style.display === "none" ? "block" : "none";
}
function clearNotifs() {
    document.getElementById("seller-notif-list").innerHTML =
        `<div style="text-align:center;color:var(--muted);padding:22px;font-size:13px;">No notifications yet</div>`;
    document.getElementById("seller-notif-count").style.display = "none";
}
document.addEventListener("click", (e) => {
    const wrap  = document.getElementById("seller-notif-wrap");
    const panel = document.getElementById("seller-notif-panel");
    if (wrap && !wrap.contains(e.target)) panel.style.display = "none";
});

/* ──────────────────────────────────────────
   DASHBOARD
   DTO: SellerDashboardDto → totalProducts, totalShopkeepers, totalSales, totalRevenue
────────────────────────────────────────── */
async function loadDashboard() {
    try {
        const d = await get(`/api/Seller/dashboard-stats?sellerId=${SID}`);
        if (!d) return;
        // Map SellerDashboardDto fields to dashboard KPIs
        document.getElementById("d-purchase").textContent = fmt(d.purchaseThisMonth || 0);
    document.getElementById("d-sales").textContent    = fmt(d.salesThisMonth    || 0);
        document.getElementById("d-profit").textContent    = fmt(d.profitThisMonth    || d.ProfitThisMonth    || 0);
        document.getElementById("d-pending").textContent   = fmt(d.pendingPayments|| d.PendingPayments|| 0);
        document.getElementById("d-gst").textContent       = fmt(d.gstThisMonth       || d.GSTThisMonth       || 0);
        document.getElementById("d-lowstock").textContent  = d.lowStockItems || d.LowStockItems || d.totalProducts || d.TotalProducts || 0;
    } catch(e) { console.error("Dashboard stats:", e); }

    try {
        // PurchaseBillDto: billID, productName, quantity, totalAmount, billDate
        const bills = await get(`/api/Seller/purchase-bills?sellerId=${SID}`);
        if (!bills) return;
        const tbody = document.getElementById("d-recent-bills");
        tbody.innerHTML = "";
        if (!bills.length) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:20px;">No bills yet</td></tr>`;
        } else {
            bills.slice(0, 5).forEach(b => {
                const billId     = b.billID     || b.BillID     || "—";
                const product    = b.productName|| b.ProductName|| "—";
                const company    = b.companyName|| b.CompanyName|| "—";
                const date       = b.billDate   || b.BillDate   || "—";
                const total      = b.totalAmount|| b.TotalAmount|| 0;
                const cgst       = parseFloat(b.cgst ||b.CGST ||0);
                const sgst       = parseFloat(b.sgst ||b.SGST ||0);
                const igst       = parseFloat(b.igst ||b.IGST ||0);
                const gst        = (cgst + sgst + igst).toFixed(2);
                const status     = b.status     || b.Status     || "Paid";
                tbody.innerHTML += `<tr>
                    <td style="font-weight:600;">BILL-${billId}</td>
                    <td><span class="badge purple">Purchase</span></td>
                    <td>${company || product}</td>
                    <td>${date}</td>
                    <td>${fmt(total)}</td>
                    <td>₹${gst}</td>
                    <td><span class="badge green">${status}</span></td>
                </tr>`;
            });
        }
    } catch(e) { console.error("Dashboard bills:", e); }

    try {
        // SellerRequestDto: requestID, product, quantity, status, requestDate, estAmount
        const reqs = await get(`/api/Seller/requests?sellerId=${SID}`);
        if (!reqs) return;
        const pending = reqs.filter(r => (r.status || r.Status) === "Pending");
        document.getElementById("badge-req").textContent = pending.length;
        const c = document.getElementById("d-requests");
        if (!pending.length) {
            c.innerHTML = `<div style="text-align:center;color:var(--muted);padding:20px;">No pending requests ✅</div>`;
        } else {
            c.innerHTML = pending.slice(0, 3).map(r => {
                const productName  = r.product      || r.Product      || r.productName || "—";
                const shopName     = r.shopkeeper   || r.Shopkeeper   || r.shopkeeperName || "Shopkeeper";
                const qty          = r.quantity     || r.Quantity     || 0;
                const stockAvail   = r.stockAvailable !== undefined ? r.stockAvailable : "—";
                const ok           = stockAvail !== "—" ? stockAvail >= qty : true;
                const reqId        = r.requestID    || r.RequestID    || "";
                return `<div class="req-card" style="margin-bottom:8px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                        <div style="font-weight:600;font-size:13.5px;">${shopName}</div>
                        <span class="badge yellow">Pending</span>
                    </div>
                    <div style="font-size:13px;margin-bottom:4px;">
                        Wants <strong>${qty} units</strong> of <strong>${productName}</strong>
                    </div>
                    ${stockAvail !== "—" ? `<div style="font-size:12px;color:${ok?'var(--green)':'var(--red)'};margin-bottom:10px;">
                        ${ok?'✅':'❌'} Stock: ${stockAvail} units
                    </div>` : ""}
                    <div style="display:flex;gap:8px;">
                        <button onclick="respondReq(${reqId},'accept')" class="action-btn accept" style="font-size:11px;padding:5px 12px;">✓ Accept</button>
                        <button onclick="respondReq(${reqId},'reject')" class="action-btn reject" style="font-size:11px;padding:5px 12px;">✕ Reject</button>
                    </div>
                </div>`;
            }).join("");
        }
    } catch(e) { console.error("Dashboard requests:", e); }
}

/* ──────────────────────────────────────────
   PRODUCTS
   DTO: SimpleProductDto → id, name, price
   Entity: ProductID, ProductName, ProductCode, HsnCode, CompanyName,
           CompanyID, Category, Unit, MRP, GstPercent, Quantity
────────────────────────────────────────── */
async function loadProducts() {
    try {
        const items = await get(`/api/Seller/products?sellerId=${SID}`);
        if (!items) return;
        products = items;
        document.getElementById("prod-count").textContent = `(${items.length})`;
        const tbody = document.getElementById("products-tbody");
        tbody.innerHTML = "";
        if (!items.length) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:24px;">No products found</td></tr>`;
            return;
        }
        items.forEach(p => {
            // SimpleProductDto returns: id, name, price (camelCase)
            const name     = p.productName || p.name  || p.Name  || "—";
            const code     = p.productCode || p.code  || p.Code  || "—";
            const category = p.category   || p.Category || "—";
            const unit     = p.unit       || p.Unit     || "—";
            const mrp      = p.mrp        || p.price    || p.Price || p.MRP || 0;
            const gst      = p.gstPercent || p.gst      || p.GstPercent || 0;
            const purchase = p.purchasePrice || 0;
            const stock    = p.stockQty   || p.stock    || p.quantity || p.Quantity || 0;
            const sc       = stock === 0 ? "red" : stock <= 10 ? "yellow" : "green";
            tbody.innerHTML += `<tr>
                <td style="font-weight:500;">${name}</td>
                <td style="color:var(--muted);font-size:12px;">${code}</td>
                <td>${category}</td>
                <td>${unit}</td>
                <td>₹${mrp}</td>
                <td><span class="badge blue">${gst}%</span></td>
                <td>₹${purchase}</td>
                <td><span class="badge ${sc}">${stock}</span></td>
            </tr>`;
        });
    } catch(e) { console.error("Products:", e); }
}

/* ──────────────────────────────────────────
   INVENTORY
   DTO: InventoryDto → productName, hSNCode, category, sellingPrice, gstRate, stock
────────────────────────────────────────── */
async function loadInventory() {
    try {
        const items = await get(`/api/Seller/inventory?sellerId=${SID}`);
        if (!items) return;
        inventory = items;
        let total = 0, low = 0, out = 0, val = 0;
        const tbody = document.getElementById("inventory-tbody");
        tbody.innerHTML = "";
        if (!items.length) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:24px;">No inventory found</td></tr>`;
        } else {
            items.forEach(i => {
                // InventoryDto: productName, hSNCode, category, sellingPrice, gstRate, stock
                const name     = i.productName  || i.ProductName  || "—";
                const code     = i.hSNCode      || i.hsnCode      || i.productCode || "—";
                const qty      = i.stock        || i.Stock        || i.quantity    || i.Quantity || 0;
                const price    = i.sellingPrice || i.SellingPrice || i.purchasePrice || 0;
                const unit     = i.unit         || i.Unit         || "";

                total++;
                val += parseFloat(qty) * parseFloat(price);
                if (qty === 0) out++; else if (qty <= 10) low++;

                const pct = Math.min(100, (qty / 500) * 100);
                const col = qty === 0 ? "var(--red)" : qty <= 10 ? "var(--yellow)" : "var(--green)";
                const sc  = qty === 0 ? "red"        : qty <= 10 ? "yellow"        : "green";
                const st  = qty === 0 ? "Out of Stock": qty <= 10 ? "Low Stock"    : "Good";

                tbody.innerHTML += `<tr>
                    <td style="font-weight:500;">${name}</td>
                    <td style="color:var(--muted);font-size:12px;">${code}</td>
                    <td><strong>${qty} ${unit}</strong></td>
                    <td>${fmt(price)}</td>
                    <td><div class="stock-bar-wrap"><div class="stock-bar"><div class="stock-bar-fill" style="width:${pct}%;background:${col};"></div></div></div></td>
                    <td><span class="badge ${sc}">${st}</span></td>
                </tr>`;
            });
        }
        document.getElementById("inv-total").textContent = total;
        document.getElementById("inv-low").textContent   = low;
        document.getElementById("inv-out").textContent   = out;
        document.getElementById("inv-val").textContent   = "₹" + (val / 100000).toFixed(1) + "L";
    } catch(e) { console.error("Inventory:", e); }
}

/* ──────────────────────────────────────────
   ALL BILLS
   PurchaseBillDto: billID, productName, quantity, totalAmount, billDate
   SalesInvoiceDto: invoiceID, shopkeeperName, productName, totalAmount, invoiceDate
────────────────────────────────────────── */
async function loadAllBills() {
    try {
        const [pbs, sis] = await Promise.all([
            get(`/api/Seller/purchase-bills?sellerId=${SID}`),
            get(`/api/Seller/sales-invoices?sellerId=${SID}`)
        ]);
        const all = [
            ...(pbs || []).map(b => ({
                type:   "Purchase",
                party:  b.companyName  || b.CompanyName  || b.productName || b.ProductName || "—",
                no:     `BILL-${b.billID || b.BillID}`,
                date:   b.billDate     || b.BillDate     || "—",
                taxable:(parseFloat(b.purchasePrice || 0) * parseFloat(b.quantity || b.Quantity || 0)).toFixed(2),
                totalAmount: b.totalAmount || b.TotalAmount || 0,
                cgst:   b.cgst || b.CGST || 0,
                sgst:   b.sgst || b.SGST || 0,
                igst:   b.igst || b.IGST || 0,
                status: b.status || b.Status || "Paid"
            })),
            ...(sis || []).map(s => ({
                type:   "Sale",
                party:  s.shopkeeperName || s.ShopkeeperName || "—",
                no:     `INV-${s.invoiceID || s.InvoiceID}`,
                date:   s.invoiceDate    || s.InvoiceDate    || "—",
                taxable:(parseFloat(s.sellingPrice || 0) * parseFloat(s.quantity || s.Quantity || 0)).toFixed(2),
                totalAmount: s.totalAmount || s.TotalAmount || 0,
                cgst:   s.cgst || s.CGST || 0,
                sgst:   s.sgst || s.SGST || 0,
                igst:   s.igst || s.IGST || 0,
                status: s.status || s.Status || "Paid"
            }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date));

        const tbody = document.getElementById("all-bills-tbody");
        tbody.innerHTML = "";
        if (!all.length) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:30px;">No bills yet</td></tr>`;
            return;
        }
        all.forEach(b => {
            const tc  = b.type === "Purchase" ? "purple" : "green";
            const gst = (parseFloat(b.cgst || 0) + parseFloat(b.sgst || 0) + parseFloat(b.igst || 0)).toFixed(2);
            tbody.innerHTML += `<tr>
                <td style="font-weight:600;">${b.no}</td>
                <td><span class="badge ${tc}">${b.type}</span></td>
                <td>${b.party}</td>
                <td>${b.date}</td>
                <td>₹${b.taxable}</td>
                <td>₹${gst}</td>
                <td>${fmt(b.totalAmount)}</td>
                <td><span class="badge green">${b.status}</span></td>
                <td><button style="background:var(--blue-dim);color:var(--blue);border:none;padding:3px 8px;border-radius:5px;cursor:pointer;font-size:11px;">🖨️</button></td>
            </tr>`;
        });
    } catch(e) { console.error("Bills:", e); }
}

/* ──────────────────────────────────────────
   REQUESTS
   DTO: SellerRequestDto → requestID, product, quantity, status, requestDate, estAmount
   NOTE: 'status' maps to SellerState in repo — check if this is correct
────────────────────────────────────────── */
async function loadRequests() {
    try {
        const data = await get(`/api/Seller/requests?sellerId=${SID}`);
        if (!data) return;

        const pending  = data.filter(r => (r.status || r.Status) === "Pending").length;
        const accepted = data.filter(r => (r.status || r.Status) === "Accepted").length;
        const rejected = data.filter(r => (r.status || r.Status) === "Rejected").length;

        setInnerText("badge-req",    pending);
        setInnerText("req-badge",    pending);
        setInnerText("req-total",    data.length);
        setInnerText("req-pending",  pending);
        setInnerText("req-accepted", accepted);
        setInnerText("req-rejected", rejected);

        ["requestList", "requests-container"].forEach(id => {
            const container = document.getElementById(id);
            if (!container) return;
            container.innerHTML = "";
            if (!data.length) {
                container.innerHTML = `<div style="text-align:center;color:var(--muted);padding:40px;">No requests yet</div>`;
                return;
            }
            data.forEach(r => {
                // SellerRequestDto: requestID, product, quantity, status, requestDate, estAmount
                const productName   = r.product       || r.Product       || r.productName  || "Unknown Product";
                const qty           = r.quantity      || r.Quantity      || 0;
                const amount        = r.estAmount     || r.EstAmount     || 0;
                const date          = r.requestDate   || r.RequestDate   || "";
                const formattedDate = date
                    ? new Date(date).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })
                    : "—";
                const shopName      = r.shopkeeper    || r.Shopkeeper    || r.shopkeeperName || "Shopkeeper";
                const shopLocation  = r.location      || r.address       || r.city           || "";
                const reqId         = r.requestID     || r.RequestID     || "";
                const status        = r.status        || r.Status        || "Pending";
                const statusClass   = status === "Pending" ? "pending" : status === "Accepted" ? "accepted" : "rejected";
                const initials      = shopName.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
                const stockAvail    = r.stockAvailable !== undefined ? r.stockAvailable : null;
                const ok            = stockAvail !== null ? stockAvail >= qty : true;
                const disabled      = status !== "Pending" ? 'disabled style="opacity:.4"' : "";

                container.innerHTML += `
                <div class="req-card">
                    <div class="req-header">
                        <div class="req-shop">
                            <div class="shop-avatar">${initials}</div>
                            <div>
                                <div class="shop-name">${shopName}</div>
                                <div class="shop-meta">${shopLocation}${shopLocation && reqId ? ' · ' : ''}${reqId ? 'REQ-' + reqId : ''}</div>
                            </div>
                        </div>
                        <span class="status-badge ${statusClass}">${status}</span>
                    </div>
                    <div class="req-products">
                        <div class="product-pill">${productName}&nbsp;<span>× ${qty}</span></div>
                    </div>
                    <div class="req-footer">
                        <div class="req-meta">
                            <div class="meta-item">Requested on<strong>${formattedDate}</strong></div>
                            <div class="meta-item">Est. Amount<strong>${fmt(amount)}</strong></div>
                            ${stockAvail !== null
                                ? `<div class="meta-item">Stock<strong style="color:${ok ? 'var(--green)' : 'var(--red)'}">${stockAvail} units</strong></div>`
                                : ""}
                        </div>
                        <div class="req-actions">
                            <button class="action-btn message" onclick="messageShopkeeper('${reqId}')">💬</button>
                            <button class="action-btn partial" onclick="respondReq('${reqId}','partial')" ${disabled}>~ Partial</button>
                            <button class="action-btn reject"  onclick="respondReq('${reqId}','reject')"  ${disabled}>✕ Reject</button>
                            <button class="action-btn accept"  onclick="respondReq('${reqId}','accept')"  ${disabled}>✓ Accept & Invoice</button>
                        </div>
                    </div>
                </div>`;
            });
        });
    } catch(e) { console.error("Requests:", e); }
}

function setInnerText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

async function loadSidebarRequests() {
    try {
        const data = await get(`/api/Seller/requests?sellerId=${SID}`);
        if (!data) return;
        const pending = data.filter(r => (r.status || r.Status) === "Pending").length;
        setInnerText("badge-req", pending);
    } catch(e) { console.warn("Sidebar requests:", e); }
}

/* ──────────────────────────────────────────
   RESPOND TO REQUEST
────────────────────────────────────────── */
async function respondReq(rid, action) {
    if (action === "partial") {
        const newQty = prompt("Enter the quantity you can supply:");
        if (!newQty || isNaN(newQty) || parseInt(newQty) <= 0) return;
        action = "accept";
    }
    if (action === "reject") {
        const ok = await showConfirm("❌","Reject Request?","This will decline the shopkeeper's request.","var(--red)","Yes, Reject");
        if (!ok) return;
    }
    if (action === "accept") {
        const ok = await showConfirm("✅","Accept & Create Invoice?","This will accept the request and open the Sales Invoice page.","var(--green)","Yes, Accept");
        if (!ok) return;
    }
    try {
        // REPLACE WITH:
const res = await fetch(`${API}/api/Seller/respond-request?requestId=${parseInt(rid)}&action=${action}&sellerId=${SID}`, {
    method: "POST",
    headers: { "Authorization": "Bearer " + getToken() }
});

const rawText = await res.text();
let d;
try { d = JSON.parse(rawText); } catch { d = { message: rawText }; }

        if (d === false || d?.success === false) {
            showToast(d?.message || "Cannot process request", "error");
            return;
        }

        showToast(d?.message || (action === "accept" ? "Request accepted!" : "Request rejected."), action === "accept" ? "success" : "info");
        loadRequests();
        loadDashboard();
        loadSidebarRequests();
        if (action === "accept") showPage("sales-invoice");
    } catch(e) {
        console.error("respondReq:", e);
        showToast("Error processing request", "error");
    }
}

function messageShopkeeper(reqId) {
    showToast("💬 Messaging feature coming soon! REQ-" + reqId, "info");
}

/* ──────────────────────────────────────────
   SHOPKEEPERS
   DTO: ShopkeeperDto → shopkeeperID, name, phone
────────────────────────────────────────── */
async function loadShopkeepers() {
    try {
        const requests = await get(`/api/Seller/requests?sellerId=${SID}`);
        if (!requests) return;

        const seen = new Set();
        const mySks = [];
        requests.forEach(r => {
            // SellerRequestDto has shopkeeper / shopkeeperName
            const key = r.shopkeeper || r.shopkeeperName || r.Shopkeeper;
            if (key && !seen.has(key)) {
                seen.add(key);
                mySks.push({
                    shopkeeperID: r.shopkeeperID || r.ShopkeeperID || 0,
                    name:     key,
                    shopName: key,
                    phone:    r.phone    || r.Phone    || "",
                    address:  r.address  || r.Address  || "",
                    gstNumber:r.gstNumber|| r.GstNumber|| ""
                });
            }
        });
        shopkeepers = mySks;

        const dropdown = document.getElementById("si-sk");
        if (dropdown) {
            dropdown.innerHTML = `<option value="">Select Shopkeeper</option>`;
            mySks.forEach(s => dropdown.innerHTML += `<option value="${s.shopkeeperID}">${s.name}</option>`);
        }

        setInnerText("sk-count", `(${mySks.length})`);

        const tbody = document.getElementById("shopkeepers-tbody");
        tbody.innerHTML = "";
        if (!mySks.length) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:30px;">No shopkeepers yet. They'll appear once they send you a request.</td></tr>`;
        } else {
            mySks.forEach(s => {
                tbody.innerHTML += `<tr>
                    <td><strong>${s.name}</strong></td>
                    <td>${s.address || '—'}</td>
                    <td>${s.phone || '—'}</td>
                    <td style="font-size:12px;">${s.gstNumber || '—'}</td>
                    <td>—</td><td>—</td>
                    <td><span class="badge green">Active</span></td>
                </tr>`;
            });
        }

        try {
            // ShopkeeperDto: shopkeeperID, name, phone
            const allSks = await get(`/api/Seller/all-shopkeepers`);
            if (!allSks) return;
            const addPanel = document.getElementById("all-shopkeepers-list");
            if (addPanel) {
                addPanel.innerHTML = "";
                if (!allSks.length) {
                    addPanel.innerHTML = `<div style="text-align:center;color:var(--muted);padding:20px;">No shopkeepers found</div>`;
                    return;
                }
                allSks.forEach(s => {
                    const skId   = s.shopkeeperID || s.ShopkeeperID || 0;
                    const skName = s.name         || s.Name         || s.shopName || "—";
                    const skPhone= s.phone        || s.Phone        || "";
                    const already = mySks.some(m => m.shopkeeperID == skId);
                    addPanel.innerHTML += `
                    <div style="display:flex;align-items:center;justify-content:space-between;padding:11px 16px;border-bottom:1px solid var(--border);">
                        <div>
                            <div style="font-weight:600;font-size:13.5px;">${skName}</div>
                            <div style="font-size:12px;color:var(--muted);">${skPhone}</div>
                        </div>
                        ${already
                            ? `<span class="badge green">Already trading</span>`
                            : `<button class="header-btn" style="font-size:12px;padding:6px 12px;" onclick="addShopkeeperToMyList(${skId})">+ Add</button>`}
                    </div>`;
                });
            }
        } catch(e) { console.warn("All shopkeepers:", e); }
    } catch(e) { console.error("Shopkeepers:", e); }
}

function toggleAddSK() {
    const p = document.getElementById("add-sk-panel");
    p.style.display = p.style.display === "none" ? "block" : "none";
}

async function addShopkeeperToMyList(shopkeeperID) {
    showToast("✅ Shopkeeper will appear once they send you a request or you create an invoice for them.", "info");
}

/* ──────────────────────────────────────────
   INVOICES
   SalesInvoiceDto: invoiceID, shopkeeperName, productName, totalAmount, invoiceDate
────────────────────────────────────────── */
async function loadInvoices() {
    try {
        const invs = await get(`/api/Seller/sales-invoices?sellerId=${SID}`);
        if (!invs) return;
        const tbody = document.getElementById("invoices-tbody");
        tbody.innerHTML = "";
        let tgst = 0, tcs = 0, ti = 0;
        if (!invs.length) {
            tbody.innerHTML = `<tr><td colspan="12" style="text-align:center;color:var(--muted);padding:30px;">No invoices yet</td></tr>`;
        } else {
            invs.forEach(i => {
                const invId    = i.invoiceID    || i.InvoiceID    || "—";
                const skName   = i.shopkeeperName||i.ShopkeeperName||"—";
                const prodName = i.productName  || i.ProductName  || "—";
                const invDate  = i.invoiceDate  || i.InvoiceDate  || "—";
                const qty      = i.quantity     || i.Quantity     || 0;
                const price    = i.sellingPrice || i.SellingPrice || 0;
                const total    = i.totalAmount  || i.TotalAmount  || 0;
                const profit   = i.profit       || i.Profit       || 0;
                const status   = i.status       || i.Status       || "Paid";
                const cgst     = parseFloat(i.cgst || i.CGST || 0);
                const sgst     = parseFloat(i.sgst || i.SGST || 0);
                const igst     = parseFloat(i.igst || i.IGST || 0);
                const gstType  = i.gstType      || i.GstType      || "CGST+SGST";
                const taxable  = (parseFloat(price) * parseFloat(qty)).toFixed(2);

                tgst += cgst + sgst + igst;
                tcs  += cgst + sgst;
                ti   += igst;

                tbody.innerHTML += `<tr>
                    <td style="font-weight:600;">INV-${invId}</td>
                    <td>${skName}</td>
                    <td>${prodName}</td>
                    <td>${invDate}</td>
                    <td>₹${taxable}</td>
                    <td>${cgst > 0 ? '₹' + cgst.toFixed(2) : '—'}</td>
                    <td>${sgst > 0 ? '₹' + sgst.toFixed(2) : '—'}</td>
                    <td>${igst > 0 ? '₹' + igst.toFixed(2) : '—'}</td>
                    <td>${fmt(total)}</td>
                    <td class="profit-positive">${fmt(profit)}</td>
                    <td><span class="badge green">${status}</span></td>
                    <td><button style="background:var(--blue-dim);color:var(--blue);border:none;padding:3px 8px;border-radius:5px;cursor:pointer;font-size:11px;">🖨️</button></td>
                </tr>`;
            });
        }
        setInnerText("gst-total", fmt(tgst));
        setInnerText("gst-cs",    fmt(tcs));
        setInnerText("gst-igst",  fmt(ti));

        const gt = document.getElementById("gst-tbody");
        if (gt && invs.length) {
            gt.innerHTML = "";
            invs.forEach(i => {
                const invId   = i.invoiceID    || i.InvoiceID    || "—";
                const skName  = i.shopkeeperName||i.ShopkeeperName||"—";
                const invDate = i.invoiceDate  || i.InvoiceDate  || "—";
                const qty     = i.quantity     || i.Quantity     || 0;
                const price   = i.sellingPrice || i.SellingPrice || 0;
                const taxable = (parseFloat(price) * parseFloat(qty)).toFixed(2);
                const cgst    = parseFloat(i.cgst || i.CGST || 0);
                const sgst    = parseFloat(i.sgst || i.SGST || 0);
                const igst    = parseFloat(i.igst || i.IGST || 0);
                const gstType = i.gstType || i.GstType || "CGST+SGST";
                gt.innerHTML += `<tr>
                    <td>INV-${invId}</td>
                    <td>${skName}</td>
                    <td>${invDate}</td>
                    <td>₹${taxable}</td>
                    <td>${cgst > 0 ? '₹' + cgst.toFixed(2) : '—'}</td>
                    <td>${sgst > 0 ? '₹' + sgst.toFixed(2) : '—'}</td>
                    <td>${igst > 0 ? '₹' + igst.toFixed(2) : '—'}</td>
                    <td><span class="badge ${gstType === 'CGST+SGST' ? 'blue' : 'orange'}">${gstType}</span></td>
                </tr>`;
            });
        }
    } catch(e) { console.error("Invoices:", e); }
}

/* ──────────────────────────────────────────
   PAYMENTS
   DTO: PaymentDto → paymentID, amount, mode, date
────────────────────────────────────────── */
async function loadPayments() {
    try {
        const pays = await get(`/api/Seller/payments?sellerId=${SID}`);
        if (!pays) return;
        const tbody = document.getElementById("payments-tbody");
        tbody.innerHTML = "";
        let rec = 0, pend = 0;
        if (!pays.length) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:30px;">No payments recorded yet</td></tr>`;
        } else {
            pays.forEach(p => {
                // PaymentDto: paymentID, amount, mode, date
                const amount  = p.amount      || p.Amount      || 0;
                const mode    = p.mode        || p.Mode        || p.paymentMode || "—";
                const date    = p.date        || p.Date        || p.paymentDate || "—";
                const refNum  = p.refNumber   || p.RefNumber   || p.paymentID || p.PaymentID || "—";
                const party   = p.partyName   || p.PartyName   || p.name || "—";
                const type    = p.paymentType || p.PaymentType || mode;
                const status  = p.status      || p.Status      || "Received";
                const sc      = status === "Received" ? "green" : "yellow";

                if (status === "Received") rec += parseFloat(amount);
                else pend += parseFloat(amount);

                tbody.innerHTML += `<tr>
                    <td>${date}</td>
                    <td style="font-weight:600;">${refNum}</td>
                    <td>${party}</td>
                    <td>${mode}</td>
                    <td><span class="badge blue">${type}</span></td>
                    <td>${fmt(amount)}</td>
                    <td><span class="badge ${sc}">${status}</span></td>
                </tr>`;
            });
        }
        setInnerText("pay-received", fmt(rec));
        setInnerText("pay-pending",  fmt(pend));
        setInnerText("pay-count",    pays.length);
    } catch(e) { console.error("Payments:", e); }
}

/* ──────────────────────────────────────────
   PURCHASE BILL
────────────────────────────────────────── */
async function initPurchasePage() {
    document.getElementById("pb-date").value = today();

    try {
        // Load real companies from DB
        const comps = await get(`/api/Seller/companies`) || [];
        companies = comps;

        const companySelect = document.getElementById("pb-company");
        companySelect.innerHTML = `<option value="">Select Company</option>`;
        comps.forEach(c => {
            companySelect.innerHTML +=
                `<option value="${c.companyID}">${c.companyName}</option>`;
        });

        if (!pbListenersAdded) {
            pbListenersAdded = true;

            // When company selected → fetch only that company's products
            companySelect.addEventListener("change", async function () {
                const companyId = this.value;
                const productSelect = document.getElementById("pb-product");

                if (!companyId) {
                    productSelect.innerHTML = `<option value="">Select Product</option>`;
                    return;
                }

                productSelect.innerHTML = `<option value="">Loading...</option>`;

                try {
                    const prods = await get(
                        `/api/Seller/products-by-company?companyId=${companyId}`
                    ) || [];
                    productSelect.innerHTML = `<option value="">Select Product</option>`;
                    prods.forEach(p => {
                        productSelect.innerHTML +=
                            `<option value="${p.productID}"
                                data-cpid="${p.companyProductID}"
                                data-code="${p.productCode}"
                                data-gst="${p.gstPercent}"
                                data-mrp="${p.mrp}">${p.productName}</option>`;
                    });
                } catch(e) {
                    console.error("products-by-company:", e);
                    productSelect.innerHTML = `<option value="">Error loading products</option>`;
                }
            });

            // When product selected → auto-fill GST, code, price
            document.getElementById("pb-product").addEventListener("change", function () {
                const opt = this.options[this.selectedIndex];
                document.getElementById("pb-gst").value   = opt.dataset.gst  || "";
                document.getElementById("pb-code").value  = opt.dataset.code || "";
                document.getElementById("pb-price").value = opt.dataset.mrp  || "";
                calcPB();
            });

            document.getElementById("pb-qty").addEventListener("input",  calcPB);
            document.getElementById("pb-price").addEventListener("input", calcPB);
        }

        loadPBRecent();

    } catch(e) { console.error("initPurchasePage:", e); }
}

async function loadPBRecent() {
    try {
        const bills = await get(`/api/Seller/purchase-bills?sellerId=${SID}`);
        if (!bills) return;
        const tbody = document.getElementById("pb-recent");
        tbody.innerHTML = "";
        if (!bills.length) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:20px;">No bills yet</td></tr>`;
            return;
        }
        bills.slice(0, 5).forEach(b => {
            const billId  = b.billID     || b.BillID     || "—";
            const product = b.productName|| b.ProductName|| "—";
            const company = b.companyName|| b.CompanyName|| "—";
            const qty     = b.quantity   || b.Quantity   || 0;
            const total   = b.totalAmount|| b.TotalAmount|| 0;
            const date    = b.billDate   || b.BillDate   || "—";
            tbody.innerHTML += `<tr>
                <td style="font-weight:600;">BILL-${billId}</td>
                <td>${product}</td>
                <td>${company}</td>
                <td>${qty}</td>
                <td>${fmt(total)}</td>
                <td>${date}</td>
            </tr>`;
        });
    } catch(e) { console.warn("PB recent:", e); }
}

function calcPB() {
    const qty    = parseFloat(document.getElementById("pb-qty").value)   || 0;
    const price  = parseFloat(document.getElementById("pb-price").value) || 0;
    const gst    = parseFloat(document.getElementById("pb-gst").value)   || 0;
    const sub    = qty * price;
    const gstAmt = sub * gst / 100;
    document.getElementById("pb-sub").textContent     = fmt(sub);
    document.getElementById("pb-gst-amt").textContent = fmt(gstAmt);
    document.getElementById("pb-total").textContent   = fmt(sub + gstAmt);
}

async function savePurchaseBill() {
    const companyVal       = document.getElementById("pb-company").value;
    const productSel       = document.getElementById("pb-product");
    const productID        = parseInt(productSel.value);
    const selectedOpt      = productSel.options[productSel.selectedIndex];
    const companyProductID = parseInt(selectedOpt?.dataset?.cpid || 0);
    const qty              = parseFloat(document.getElementById("pb-qty").value);
    const price            = parseFloat(document.getElementById("pb-price").value);
    const gstPercent       = parseFloat(document.getElementById("pb-gst").value) || 0;
    const paymentMode      = document.getElementById("pb-mode").value;
    const billDate         = document.getElementById("pb-date").value;

    if (!companyVal || !productID || isNaN(qty) || isNaN(price) || qty <= 0 || price <= 0) {
        showToast("❌ Please fill all required fields correctly.", "error"); return;
    }

    const sub    = qty * price;
    const gstAmt = sub * gstPercent / 100;
    const isSameState = true; // default same state
    const cgst   = isSameState ? gstAmt / 2 : 0;
    const sgst   = isSameState ? gstAmt / 2 : 0;
    const igst   = isSameState ? 0 : gstAmt;

    const data = {
        sellerID: SID,
        companyProductID,
        quantity: qty,
        purchasePrice: price,
        gstPercent,
        cgst,
        sgst,
        igst,
        totalAmount: sub + gstAmt,
        paymentMode,
        billDate: new Date(billDate).toISOString(),
        sellerState: SSTATE,
        companyState: SSTATE
    };

    try {
        const d = await post(`/api/Seller/purchase-bill`, data);
        // REPLACE WITH:
if (d && (
    d.success === true ||
    typeof d === "string" ||
    (typeof d === "object" && !d.error)
)) {
    showToast(`✅ Purchase Bill saved!`, "success");
    clearPB();
    loadPBRecent();
    inventory = [];
} else {
    showToast("❌ " + (d?.message || d?.error || "Save failed"), "error");
}
    } catch(e) {
        console.error("savePurchaseBill:", e);
        showToast("❌ Error: " + e.message, "error");
    }
}

function clearPB() {
    ["pb-company","pb-product","pb-code","pb-gst","pb-qty","pb-price"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
    ["pb-sub","pb-gst-amt","pb-total"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = "₹0.00";
    });
}

/* ──────────────────────────────────────────
   SALES INVOICE
   ShopkeeperDto: shopkeeperID, name, phone
   InventoryDto: productName, hSNCode, category, sellingPrice, gstRate, stock
────────────────────────────────────────── */
async function initSalesPage() {
    document.getElementById("si-date").value = today();

    try {
        // ShopkeeperDto: shopkeeperID, name, phone
        //const sks = await get(`/api/Seller/my-shopkeepers?sellerId=${SID}`) || [];
        const sks = await get(`/api/Seller/all-shopkeepers`) || [];
        shopkeepers = sks;
        const ssel = document.getElementById("si-sk");
        ssel.innerHTML = `<option value="">Select Shopkeeper</option>`;
        sks.forEach(s => {
            const skId   = s.shopkeeperID || s.ShopkeeperID || 0;
            const skName = s.name         || s.Name         || "—";
            ssel.innerHTML += `<option value="${skId}">${skName}</option>`;
        });
    } catch(e) { console.warn("SI shopkeepers:", e); }

    try {
        // InventoryDto: productName, hSNCode, category, sellingPrice, gstRate, stock
        const inv = await get(`/api/Seller/inventory?sellerId=${SID}`) || [];
        inventory = inv;
        const psel = document.getElementById("si-product");
        psel.innerHTML = `<option value="">Select Product</option>`;
        inv.forEach((i, idx) => {
            const invId   = i.sellerInventoryId || i.inventoryId || i.id || idx;
            const pid     = i.companyProductID  || i.productID   || 0;
            const mrp     = i.mrp      || i.MRP      || i.sellingPrice || i.SellingPrice || 0;
            const gst     = i.gstRate  || i.gstPercent|| i.GstRate || 0;
            const purchase= i.purchasePrice || i.sellingPrice || 0;
            const name    = i.productName || i.ProductName || "—";
            const stock   = i.stock    || i.Stock    || i.quantity || 0;
            psel.innerHTML +=
                `<option value="${invId}"
                    data-pid="${pid}"
                    data-mrp="${mrp}"
                    data-gst="${gst}"
                    data-purchase="${purchase}"
                    data-name="${name}"
                    data-stock="${stock}">
                    ${name} (Stock: ${stock})
                </option>`;
        });
    } catch(e) { console.error("SI inventory:", e); }
}

function onSIProduct() {
    const sel = document.getElementById("si-product");
    const opt = sel.options[sel.selectedIndex];
    document.getElementById("si-mrp").value = opt.dataset.mrp || "";
    document.getElementById("si-gst").value = opt.dataset.gst ? opt.dataset.gst + "%" : "";
    document.getElementById("prev-prod").textContent = opt.dataset.name || "—";
    calcSI();
}

function updatePreview() {
    const sel = document.getElementById("si-sk");
    document.getElementById("prev-sk").textContent = sel.options[sel.selectedIndex]?.text || "—";
    calcSI();
}

function calcSI() {
    const sel      = document.getElementById("si-product");
    const opt      = sel.options[sel.selectedIndex];
    const qty      = parseFloat(document.getElementById("si-qty").value) || 0;
    const mrp      = parseFloat(opt?.dataset?.mrp      || 0);
    const gst      = parseFloat(opt?.dataset?.gst      || 0);
    const purchase = parseFloat(opt?.dataset?.purchase || 0);
    const sub      = qty * mrp;
    const gstAmt   = sub * gst / 100;
    const total    = sub + gstAmt;
    const profit   = (mrp - purchase) * qty;

    document.getElementById("si-sub").textContent     = fmt(sub);
    document.getElementById("si-gst-amt").textContent = fmt(gstAmt);
    document.getElementById("si-total").textContent   = fmt(total);

    document.getElementById("prev-date").textContent    = document.getElementById("si-date").value || "—";
    document.getElementById("prev-qty").textContent     = qty || "—";
    document.getElementById("prev-mrp").textContent     = mrp ? "₹" + mrp : "—";
    document.getElementById("prev-sub").textContent     = sub ? fmt(sub) : "—";
    document.getElementById("prev-sub2").textContent    = sub ? fmt(sub) : "—";
    document.getElementById("prev-gst-lbl").textContent = `GST (${gst}%)`;
    document.getElementById("prev-gst-amt").textContent = gstAmt ? fmt(gstAmt) : "—";
    document.getElementById("prev-total").textContent   = total ? fmt(total) : "—";
    const profitEl = document.getElementById("prev-profit");
    profitEl.textContent = profit ? fmt(profit) : "—";
    profitEl.className   = profit >= 0 ? "profit-positive" : "profit-negative";
}

async function saveSI() {
    const ssel = document.getElementById("si-sk");
    const psel = document.getElementById("si-product");
    const popt = psel.options[psel.selectedIndex];

    const shopkeeperID = parseInt(ssel.value);
    const productID    = parseInt(popt?.dataset?.pid      || 0);
    const qty          = parseInt(document.getElementById("si-qty").value);
    const mrp          = parseFloat(popt?.dataset?.mrp      || 0);
    const purchase     = parseFloat(popt?.dataset?.purchase || 0);
    const gstPercent   = parseFloat(popt?.dataset?.gst      || 0);
    const stock        = parseInt(popt?.dataset?.stock       || 0);

    if (!shopkeeperID || !productID || !qty || qty <= 0) {
        showToast("❌ Please fill all required fields!", "error"); return;
    }
    if (qty > stock) {
        showToast(`❌ Insufficient stock! Available: ${stock} units`, "error"); return;
    }

    const sub    = qty * mrp;
    const gstAmt = sub * gstPercent / 100;
    const cgst   = gstAmt / 2;
    const sgst   = gstAmt / 2;

    const data = {
        sellerID: SID,
        shopkeeperID,
        productID,
        quantity: qty,
        mrp,
        sellingPrice: mrp,
        purchasePrice: purchase,
        gstPercent,
        cgst,
        sgst,
        igst: 0,
        totalAmount: sub + gstAmt,
        profit: (mrp - purchase) * qty,
        paymentMode: document.getElementById("si-mode").value,
        gstType: "CGST+SGST",
        invoiceDate: new Date(document.getElementById("si-date").value).toISOString(),
        sellerState: SSTATE,
        shopkeeperState: SSTATE
    };

    try {
        const d = await post(`/api/Seller/sales-invoice`, data);
        if (d && (d.success || typeof d === "string")) {
            showToast(`✅ Sales Invoice saved!`, "success");
            clearSI();
            inventory = [];
        } else {
            showToast("❌ " + (d?.message || "Save failed"), "error");
        }
    } catch(e) {
        console.error("saveSI:", e);
        showToast("❌ Error: " + e.message, "error");
    }
}

function clearSI() {
    ["si-sk","si-product","si-mrp","si-gst","si-qty"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
    ["si-sub","si-gst-amt","si-total"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = "₹0.00";
    });
    ["prev-prod","prev-qty","prev-mrp","prev-sub","prev-sub2","prev-gst-amt","prev-total","prev-profit","prev-sk"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = "—";
    });
}

/* ──────────────────────────────────────────
   REPORTS
   SellerReportDto: totalSales, totalPurchase, totalProfit
────────────────────────────────────────── */
async function loadReports() {
    try {
        const d = await get(`/api/Seller/reports?sellerId=${SID}`);
        if (!d) return;
        // SellerReportDto: totalSales, totalPurchase, totalProfit
        setInnerText("rpt-ms", fmt(d.totalSales    || d.TotalSales    || 0));
        setInnerText("rpt-mp", fmt(d.totalProfit   || d.TotalProfit   || 0));
        setInnerText("rpt-mo", d.monthlyOrders      || d.MonthlyOrders || 0);

        const tbody = document.getElementById("profit-tbody");
        tbody.innerHTML = "";
        if (d.productRows && d.productRows.length) {
            d.productRows.forEach(p => {
                tbody.innerHTML += `<tr>
                    <td>${p.productName || p.ProductName || "—"}</td>
                    <td>${p.unitsSold   || p.UnitsSold   || 0}</td>
                    <td>${fmt(p.revenue || p.Revenue || 0)}</td>
                    <td class="profit-positive">${fmt(p.totalProfit || p.TotalProfit || 0)}</td>
                    <td><span class="badge green">${p.marginPercent || p.MarginPercent || 0}%</span></td>
                </tr>`;
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:24px;">No sales data yet</td></tr>`;
        }

        if (d.productLabels && d.productLabels.length) {
            if (profitChartInstance) profitChartInstance.destroy();
            profitChartInstance = new Chart(document.getElementById("profitChart"), {
                type: "doughnut",
                data: {
                    labels: d.productLabels,
                    datasets: [{
                        data: d.productProfits,
                        backgroundColor: ["#10B981","#3B82F6","#F59E0B","#8B5CF6","#F43F5E"],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position:"right", labels:{ color:"#94A3B8", font:{size:11}, boxWidth:12 } } }
                }
            });
        }
    } catch(e) { console.error("Reports:", e); }

    try {
        const bills = await get(`/api/Seller/purchase-bills?sellerId=${SID}`);
        if (!bills) return;
        const tbody = document.getElementById("rpt-pb-tbody");
        tbody.innerHTML = "";
        if (!bills.length) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:24px;">No purchase bills yet</td></tr>`;
        } else {
            bills.forEach(b => {
                const billId  = b.billID      || b.BillID      || "—";
                const company = b.companyName || b.CompanyName || "—";
                const product = b.productName || b.ProductName || "—";
                const date    = b.billDate    || b.BillDate    || "—";
                const qty     = b.quantity    || b.Quantity    || 0;
                const price   = b.purchasePrice || b.PurchasePrice || 0;
                const total   = b.totalAmount || b.TotalAmount || 0;
                const cgst    = parseFloat(b.cgst || b.CGST || 0);
                const sgst    = parseFloat(b.sgst || b.SGST || 0);
                const igst    = parseFloat(b.igst || b.IGST || 0);
                const gst     = (cgst + sgst + igst).toFixed(2);
                const taxable = (parseFloat(price) * parseFloat(qty)).toFixed(2);
                tbody.innerHTML += `<tr>
                    <td style="font-weight:600;">BILL-${billId}</td>
                    <td>${company}</td>
                    <td>${product}</td>
                    <td>${date}</td>
                    <td>${qty}</td>
                    <td>₹${taxable}</td>
                    <td>₹${gst}</td>
                    <td>${fmt(total)}</td>
                </tr>`;
            });
        }
    } catch(e) { console.warn("Reports PB:", e); }

    try {
        const invs = await get(`/api/Seller/sales-invoices?sellerId=${SID}`);
        if (!invs) return;
        const st = document.getElementById("rpt-si-tbody");
        st.innerHTML = "";
        if (!invs.length) {
            st.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:24px;">No invoices yet</td></tr>`;
        } else {
            invs.forEach(i => {
                const invId   = i.invoiceID    || i.InvoiceID    || "—";
                const skName  = i.shopkeeperName||i.ShopkeeperName||"—";
                const product = i.productName  || i.ProductName  || "—";
                const qty     = i.quantity     || i.Quantity     || 0;
                const price   = i.sellingPrice || i.SellingPrice || 0;
                const total   = i.totalAmount  || i.TotalAmount  || 0;
                const profit  = i.profit       || i.Profit       || 0;
                const date    = i.invoiceDate  || i.InvoiceDate  || "—";
                st.innerHTML += `<tr>
                    <td style="font-weight:600;">INV-${invId}</td>
                    <td>${skName}</td>
                    <td>${product}</td>
                    <td>${qty}</td>
                    <td>${fmt(price)}</td>
                    <td>${fmt(total)}</td>
                    <td class="profit-positive">${fmt(profit)}</td>
                    <td>${date}</td>
                </tr>`;
            });
        }
    } catch(e) { console.warn("Reports SI:", e); }
}

/* ──────────────────────────────────────────
   LIVE SEARCH
────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
    [
        ["prod-search",  "#products-tbody tr"],
        ["inv-search",   "#inventory-tbody tr"],
        ["sk-search",    "#shopkeepers-tbody tr"],
        ["bills-search", "#all-bills-tbody tr"],
        ["inv-search2",  "#invoices-tbody tr"]
    ].forEach(([id, sel]) => {
        document.getElementById(id)?.addEventListener("input", function () {
            const q = this.value.toLowerCase();
            document.querySelectorAll(sel).forEach(r => {
                r.style.display = r.textContent.toLowerCase().includes(q) ? "" : "none";
            });
        });
    });
});

/* ──────────────────────────────────────────
   EXPORT HELPERS
────────────────────────────────────────── */
function downloadFile(url, filename) {
    fetch(url, { headers: { 'Authorization': 'Bearer ' + getToken() } })
        .then(res => res.blob())
        .then(blob => {
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = filename;
            link.click();
        });
}

function exportInvoices()       { downloadFile('/api/invoice/export',  'Invoices.xlsx'); }
function exportProducts()       { downloadFile('/api/product/export',  'Products.xlsx'); }
function exportPurchaseReport() { downloadFile('/api/report/purchase', 'PurchaseReport.xlsx'); }
function exportGST()            { downloadFile('/api/report/gst',      'GSTR1.xlsx'); }
function exportBills()          { downloadFile('/api/bill/export',     'Bills.xlsx'); }