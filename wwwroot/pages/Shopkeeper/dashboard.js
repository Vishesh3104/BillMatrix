/* ═══════════════════════════════════════════════
   CONFIG & AUTH
   Backend IDs: userId (from sessionStorage shopkeeper_user)
   API: Customer endpoints use shopkeeperId=SKID
        Seller endpoints use sellerId
═══════════════════════════════════════════════ */
const API = "http://localhost:5147";
const token = sessionStorage.getItem("shopkeeper_token");
const user  = JSON.parse(sessionStorage.getItem("shopkeeper_user") || "null");

if (!token || !user || user.role !== "shopkeeper") {
    window.location.href = "/pages/index.html";
}

// ✅ Fixed: match all possible casing from your JWT
const SKID = user?.userId || user?.userID || user?.shopkeeperID || user?.id || 1;

document.getElementById("userName").textContent =
    user?.fullName || user?.name || "Shopkeeper";
document.getElementById("userRole").textContent =
    user?.role || "shopkeeper";
document.getElementById("userAvatar").textContent =
    (user?.fullName || user?.name || "S").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

/* ═══════════════════════════════════════════════
   TOAST SYSTEM
═══════════════════════════════════════════════ */
function showToast(type, icon, title, message, duration = 4000) {
    const container = document.getElementById("toastContainer");
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-body">
            <div class="toast-title">${title}</div>
            ${message ? `<div class="toast-msg">${message}</div>` : ""}
        </div>
        <button class="toast-close" onclick="dismissToast(this.parentElement)">✕</button>`;
    container.appendChild(el);
    addNotif(type, icon, title, message || "", {});
    if (duration > 0) setTimeout(() => dismissToast(el), duration);
    return el;
}
function dismissToast(el) {
    if (!el || !el.parentElement) return;
    el.classList.add("hiding");
    setTimeout(() => el.remove(), 320);
}
const toast = {
    success: (t, m) => showToast("success", "✅", t, m),
    error:   (t, m) => showToast("error",   "❌", t, m, 6000),
    warning: (t, m) => showToast("warning", "⚠️", t, m, 5000),
    info:    (t, m) => showToast("info",    "ℹ️", t, m),
};

/* ═══════════════════════════════════════════════
   API HELPERS
═══════════════════════════════════════════════ */
async function apiGet(url) {
    try {
        const res = await fetch(API + url, {
            headers: { "Authorization": "Bearer " + token }
        });
        if (!res.ok) return null;
        return await res.json();
    } catch (e) { return null; }
}

async function apiPost(url, body) {
    const res = await fetch(API + url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`${res.status}: ${text || url}`);
    }
    // ✅ Fixed: never throw on plain string success response
    const text = await res.text();
    try { return JSON.parse(text); } catch { return text; }
}

async function apiPut(url, body) {
    const res = await fetch(API + url, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`${res.status}: ${url}`);
    return res.text();
}

/* ═══════════════════════════════════════════════
   SIGNALR
═══════════════════════════════════════════════ */
let signalrConnection = null;

function setLed(state, text) {
    document.getElementById("signalrLed").className = "status-led " + state;
    document.getElementById("signalrText").textContent = text;
}

async function initSignalR() {
    setLed("connecting", "Connecting…");
    try {
        signalrConnection = new signalR.HubConnectionBuilder()
            .withUrl(API + "/hubs/notificationHub", { accessTokenFactory: () => token })
            .withAutomaticReconnect([0, 3000, 10000, 30000])
            .configureLogging(signalR.LogLevel.None)
            .build();

        signalrConnection.on("RequestStatusChanged", (data) => {
            const status  = data.status  || data.Status  || "Updated";
            const product = data.productName || data.ProductName || "Product";
            const seller  = data.sellerName  || data.SellerName  || "Seller";
            if (status === "Accepted")
                toast.success("Request Accepted", `${product} from ${seller} accepted.`);
            else if (status === "Rejected")
                toast.error("Request Rejected", `${product} from ${seller} declined.`);
            else
                toast.info(`Request ${status}`, `${product} from ${seller}.`);

            pageLoaded["products"] = false;
            if (document.getElementById("page-products").classList.contains("active")) loadProducts();
            if (document.getElementById("page-requests").classList.contains("active")) {
                pageLoaded["requests"] = false; loadRequests();
            }
            updateDashboardReqKPI();
        });

        signalrConnection.on("NewInvoice", (data) => {
            toast.success("New Invoice", `Invoice created for ₹${data.totalAmount || 0}`);
            if (document.getElementById("page-invoices").classList.contains("active")) {
                pageLoaded["invoices"] = false; loadInvoices();
            }
        });

        signalrConnection.on("InventoryUpdated", (data) => {
            addNotif("info", "📦", "Inventory Updated",
                `${data.productName || "Product"} stock updated to ${data.newStock || 0} units`, data);
            if (document.getElementById("page-products").classList.contains("active")) {
                pageLoaded["products"] = false; loadProducts();
            }
        });

        signalrConnection.on("ReceiveMessage", (msg) => addNotif("info", "💬", "Message", msg, {}));
        signalrConnection.on("Notification", (data) => {
            const msg = typeof data === "string" ? data : (data.message || JSON.stringify(data));
            addNotif("info", "🔔", "Notification", msg, data);
        });

        signalrConnection.onreconnecting(() => setLed("connecting", "Reconnecting…"));
        signalrConnection.onreconnected(() => { setLed("connected", "Live"); toast.success("Reconnected", "Real-time connection restored."); });
        signalrConnection.onclose(() => setLed("error", "Offline"));

        await signalrConnection.start();
        setLed("connected", "Live");
        try { await signalrConnection.invoke("JoinUserGroup", SKID.toString()); } catch (e) { /* optional */ }
    } catch {
        setLed("error", "Offline");
        addNotif("warning", "⚡", "Offline Mode", "Real-time updates unavailable.", {});
    }
}

/* ═══════════════════════════════════════════════
   NOTIFICATION LOG
═══════════════════════════════════════════════ */
let _notifications = [], _unreadCount = 0;

function addNotif(type, icon, title, message, raw) {
    _notifications.unshift({ type, icon, title, message, raw, ts: new Date() });
    _unreadCount++;
    document.getElementById("notifBadge").style.display = "block";
    renderNotifPanel();
}

function renderNotifPanel() {
    const scroll = document.getElementById("notifScroll");
    if (!_notifications.length) {
        scroll.innerHTML = '<div class="notif-empty"><div class="ne-ic">🔕</div><p>No messages yet</p></div>';
        return;
    }
    scroll.innerHTML = _notifications.map(n => `
        <div class="notif-item ${n.type}">
            <div class="notif-icon">${n.icon}</div>
            <div class="notif-body">
                <div class="notif-title">${n.title}</div>
                <div class="notif-msg">${n.message}</div>
                <div class="notif-time">${n.ts.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
            </div>
        </div>`).join("");
}

function toggleNotifPanel() {
    const panel    = document.getElementById("notifPanel");
    const backdrop = document.getElementById("notifBackdrop");
    const open     = panel.classList.toggle("open");
    backdrop.classList.toggle("show", open);
    if (open) { _unreadCount = 0; document.getElementById("notifBadge").style.display = "none"; }
}

function clearNotifs() {
    _notifications = []; _unreadCount = 0;
    document.getElementById("notifBadge").style.display = "none";
    renderNotifPanel();
}

/* ═══════════════════════════════════════════════
   NAVIGATION
═══════════════════════════════════════════════ */
const pages = ["dashboard","products","customers","sales","invoices","payments","reports","billing","requests"];
const titles = {
    dashboard: "Dashboard", products: "Products", customers: "Sellers",
    sales: "Sales", invoices: "Invoices", payments: "Payments",
    reports: "Reports", billing: "⚡ Quick Billing", requests: "📋 My Requests"
};
const pageLoaded = {};

function showPage(name) {
    pages.forEach(p => {
        const el = document.getElementById("page-" + p);
        if (el) el.classList.toggle("active", p === name);
    });
    document.querySelectorAll(".nav-item").forEach(el => {
        if (name === "billing")  el.classList.toggle("active", el.id === "billingNavItem");
        else if (name === "requests") el.classList.toggle("active", el.id === "requestsNavItem");
        else el.classList.toggle("active",
            el.textContent.trim().toLowerCase().includes(name) &&
            el.id !== "billingNavItem" && el.id !== "requestsNavItem"
        );
    });
    document.getElementById("headerTitle").textContent = titles[name] || name;
    if (name === "billing") setTimeout(() => document.getElementById("posInput")?.focus(), 50);
    if (!pageLoaded[name]) {
        pageLoaded[name] = true;
        const loaders = {
            products: loadProducts, customers: loadCustomers,
            sales: loadSalesPage, invoices: loadInvoices,
            payments: loadPayments, reports: loadReports, requests: loadRequests
        };
        if (loaders[name]) loaders[name]();
    }
}

/* ═══════════════════════════════════════════════
   FORMATTERS
═══════════════════════════════════════════════ */
function fmtINR(val) {
    const n = parseFloat(val) || 0;
    return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
function fmtDate(d) {
    if (!d) return "—";
    try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
    catch { return d; }
}
function parseInvDate(inv) {
    const raw = inv.invoiceDate || inv.date || inv.createdAt || "";
    return raw ? new Date(raw) : new Date(0);
}
function statusBadge(s) {
    const m = {
        Paid: "paid", Received: "paid", paid: "paid", Full: "paid", Accepted: "paid", Completed: "paid",
        Overdue: "due", overdue: "due", Rejected: "due", due: "due",
        Draft: "draft", draft: "draft", Partial: "draft",
        Pending: "pending", pending: "pending"
    };
    return `<span class="badge ${m[s] || "pending"}">${s || "—"}</span>`;
}
function emptyRow(cols, msg)   { return `<tr><td colspan="${cols}" style="text-align:center;color:var(--muted);padding:24px 16px">${msg}</td></tr>`; }
function loadingRow(cols)      { return `<tr><td colspan="${cols}" style="text-align:center;color:var(--muted);padding:20px;font-style:italic">Loading...</td></tr>`; }

/* ═══════════════════════════════════════════════
   INLINE FIELD VALIDATION
═══════════════════════════════════════════════ */
function showFieldError(fieldId, errId) {
    document.getElementById(fieldId)?.classList.add("invalid");
    document.getElementById(errId)?.classList.add("show");
}
function clearFieldError(fieldId, errId) {
    document.getElementById(fieldId)?.classList.remove("invalid");
    document.getElementById(errId)?.classList.remove("show");
}
function clearAllReqErrors() {
    [["reqSeller","errSeller"],["reqProduct","errProduct"],["reqQty","errQty"]]
        .forEach(([f, e]) => clearFieldError(f, e));
}

/* ═══════════════════════════════════════════════
   CHART HELPERS
═══════════════════════════════════════════════ */
let _charts = {};
function destroyChart(id) { if (_charts[id]) { _charts[id].destroy(); delete _charts[id]; } }
function chartFont()      { return { family: "'DM Sans', sans-serif", size: 11 }; }
function chartGridColor() { return "rgba(255,255,255,0.05)"; }
function chartTickColor() { return "#64748B"; }
function axisINR(v) {
    if (Math.abs(v) >= 1e7) return "₹" + (v/1e7).toFixed(1) + "Cr";
    if (Math.abs(v) >= 1e5) return "₹" + (v/1e5).toFixed(1) + "L";
    if (Math.abs(v) >= 1e3) return "₹" + (v/1e3).toFixed(0) + "k";
    return "₹" + v;
}
function tipINR(v) { return "₹" + (parseFloat(v)||0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 }); }

const TOOLTIP_STYLE = {
    backgroundColor: "#1E293B", borderColor: "rgba(255,255,255,0.1)", borderWidth: 1,
    titleColor: "#F1F5F9", bodyColor: "#94A3B8", padding: 10, cornerRadius: 8,
    displayColors: true, boxWidth: 10, boxHeight: 10,
};
function makeScales(yCallback) {
    return {
        x: { grid: { color: chartGridColor(), drawBorder: false }, ticks: { color: chartTickColor(), font: chartFont(), maxRotation: 0 }, border: { display: false } },
        y: { grid: { color: chartGridColor(), drawBorder: false }, ticks: { color: chartTickColor(), font: chartFont(), callback: yCallback || axisINR }, border: { display: false }, beginAtZero: true }
    };
}

function spreadToWeek(invoices) {
    const days = [];
    for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(d); }
    const mapped = days.map(d =>
        invoices.filter(inv => parseInvDate(inv).toDateString() === d.toDateString())
                .reduce((s, inv) => s + (parseFloat(inv.totalAmount) || 0), 0)
    );
    const totalInLast7 = mapped.reduce((a, b) => a + b, 0);
    if (totalInLast7 === 0 && invoices.length > 0) {
        const total   = invoices.reduce((s, i) => s + (parseFloat(i.totalAmount) || 0), 0);
        const weights = [0.10, 0.12, 0.15, 0.14, 0.20, 0.18, 0.11];
        return {
            labels: days.map(d => d.toLocaleDateString("en-IN", { weekday: "short" })),
            values: weights.map(w => Math.round(total * w)),
            isSimulated: true,
        };
    }
    return {
        labels: days.map(d => d.toLocaleDateString("en-IN", { weekday: "short" })),
        values: mapped, isSimulated: false,
    };
}

/* ═══════════════════════════════════════════════
   DASHBOARD
   API: GET /api/Customer/my-invoices?shopkeeperId=SKID
        GET /api/Seller/all
        GET /api/Customer/my-requests?shopkeeperId=SKID
═══════════════════════════════════════════════ */
async function loadDashboard() {
    const [invoices, sellers, requests] = await Promise.all([
        apiGet(`/api/Customer/my-invoices?shopkeeperId=${SKID}`),
        apiGet(`/api/Seller/all`),
        apiGet(`/api/Customer/my-requests?shopkeeperId=${SKID}`)
    ]);

    // ── KPI: Today's Sales & Receivables ──
    if (invoices) {
        const today     = new Date().toDateString();
        const todaySales = invoices
            .filter(i => parseInvDate(i).toDateString() === today)
            .reduce((s, i) => s + (parseFloat(i.totalAmount) || 0), 0);
        const totalRec  = invoices.reduce((s, i) => s + (parseFloat(i.totalAmount) || 0), 0);
        const overdue   = invoices.filter(i => (i.status || "").toLowerCase() === "overdue")
                                  .reduce((s, i) => s + (parseFloat(i.totalAmount) || 0), 0);

        document.getElementById("kpiTodaySales").textContent    = fmtINR(todaySales);
        document.getElementById("kpiTodaySalesSub").innerHTML   = `<span style="color:var(--muted)">${invoices.length} total invoices</span>`;
        document.getElementById("kpiReceivables").textContent   = fmtINR(totalRec);
        document.getElementById("kpiReceivablesSub").innerHTML  = overdue > 0
            ? `<span class="kpi-badge down">${fmtINR(overdue)} overdue</span>`
            : `<span class="kpi-badge up">All clear</span>`;

        renderRecentInvoices(invoices.slice(0, 5));
        buildSalesChart(invoices);
        buildGSTDonut(invoices);
        buildMonthlyRevChart(invoices);
        buildPayStatusChart(invoices);
    } else {
        document.getElementById("kpiTodaySales").textContent  = "₹0";
        document.getElementById("kpiReceivables").textContent = "₹0";
        document.getElementById("recentInvoicesBody").innerHTML = emptyRow(7, "No invoices yet");
    }

    // ── KPI: Products & Stock ──
    if (sellers?.length) {
        let allProds = [];
        const prodResults = await Promise.all(sellers.map(s => apiGet(`/api/Seller/products?sellerId=${s.sellerID || s.userId || s.id}`)));
        prodResults.forEach(p => { if (p) allProds = [...allProds, ...p]; });
        const unique     = [...new Map(allProds.map(p => [(p.productID || p.id), p])).values()];
        const outOfStock = unique.filter(p => (p.stock ?? p.stockQuantity ?? p.quantity ?? 0) <= 0).length;
        document.getElementById("kpiProducts").textContent    = unique.length;
        document.getElementById("kpiProductsSub").innerHTML   = outOfStock > 0
            ? `<span class="kpi-badge down">${outOfStock} out of stock</span>`
            : `<span class="kpi-badge up">All in stock</span>`;
        renderLowStock(unique);
        buildStockHealthChart(unique);
        window._cachedProducts = unique;
        loadPosCatalogFromCache();
    } else {
        document.getElementById("kpiProducts").textContent = "0";
        document.getElementById("lowStockList").innerHTML  = '<div style="padding:16px;color:var(--muted);font-size:13px">No product data</div>';
    }

    // ── KPI: Pending Requests ──
    if (requests) {
        const pending  = requests.filter(r => (r.status || "").toLowerCase() === "pending").length;
        const accepted = requests.filter(r => (r.status || "").toLowerCase() === "accepted").length;
        document.getElementById("kpiPendingReqs").textContent   = pending;
        document.getElementById("kpiPendingReqsSub").innerHTML  = accepted > 0
            ? `<span class="kpi-badge up">${accepted} accepted</span>`
            : `<span style="color:var(--muted)">${requests.length} total</span>`;
        buildReqActivityChart(requests);
    } else {
        document.getElementById("kpiPendingReqs").textContent = "—";
    }
}

async function updateDashboardReqKPI() {
    const requests = await apiGet(`/api/Customer/my-requests?shopkeeperId=${SKID}`);
    if (!requests) return;
    document.getElementById("kpiPendingReqs").textContent =
        requests.filter(r => (r.status || "").toLowerCase() === "pending").length;
}

function renderRecentInvoices(data) {
    const tbody = document.getElementById("recentInvoicesBody");
    if (!data?.length) { tbody.innerHTML = emptyRow(7, "No invoices yet"); return; }
    tbody.innerHTML = data.map(i => `<tr>
        <td>INV-${i.invoiceID || i.invoiceId || "—"}</td>
        <td>${i.sellerName || "—"}</td>
        <td>${fmtDate(i.invoiceDate || i.date)}</td>
        <td>${fmtINR(i.totalAmount)}</td>
        <td>${fmtINR(i.cgst || 0)}</td>
        <td>${fmtINR(i.sgst || 0)}</td>
        <td>${statusBadge(i.status)}</td>
    </tr>`).join("");
}

function renderLowStock(products) {
    const container = document.getElementById("lowStockList");
    const LOW = 20;
    const low = products.filter(p => (p.stock ?? p.stockQuantity ?? p.quantity ?? 0) <= LOW);
    if (!low.length) { container.innerHTML = '<div style="padding:16px;color:var(--green);font-size:13px">✅ All products well stocked</div>'; return; }
    const maxS = Math.max(...low.map(p => p.stock ?? p.stockQuantity ?? p.quantity ?? 0), 1);
    container.innerHTML = low.map(p => {
        const stock = p.stock ?? p.stockQuantity ?? p.quantity ?? 0;
        const pct   = Math.min(100, Math.round((stock / maxS) * 100));
        return `<div class="low-stock-item">
            <span class="ls-name">${p.productName || p.name || "—"}</span>
            <div class="ls-bar-wrap"><div class="ls-bar" style="width:${pct}%"></div></div>
            <span class="ls-stock">${stock} pcs</span>
        </div>`;
    }).join("");
}

/* ── CHARTS ── */
function buildSalesChart(invoices) {
    destroyChart("salesChart");
    const { labels, values, isSimulated } = spreadToWeek(invoices);
    const maxVal = Math.max(...values, 1);
    const colors = values.map((v, i) =>
        i === values.length - 1 ? "#3B82F6" : `rgba(59,130,246,${(0.35 + 0.50*(v/maxVal)).toFixed(2)})`
    );
    _charts["salesChart"] = new Chart(document.getElementById("salesChart"), {
        type: "bar",
        data: { labels, datasets: [{ label: isSimulated ? "Sales (est.)" : "Sales", data: values, backgroundColor: colors, borderRadius: 6, borderSkipped: false, borderWidth: 0 }] },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { ...TOOLTIP_STYLE, callbacks: { title: i => i[0].label, label: i => " " + tipINR(i.raw) } } },
            scales: { ...makeScales(), x: { grid: { display: false }, ticks: { color: chartTickColor(), font: chartFont() }, border: { display: false } } },
            animation: { duration: 600, easing: "easeOutQuart" }
        }
    });
}

function buildGSTDonut(invoices) {
    destroyChart("gstDonutChart");
    const totalCGST  = invoices.reduce((s, i) => s + (parseFloat(i.cgst) || 0), 0);
    const totalSGST  = invoices.reduce((s, i) => s + (parseFloat(i.sgst) || 0), 0);
    const totalGross = invoices.reduce((s, i) => s + (parseFloat(i.totalAmount) || 0), 0);
    let taxable = totalGross - totalCGST - totalSGST;
    let cgst = totalCGST, sgst = totalSGST;
    if (cgst + sgst === 0 && taxable > 0) { cgst = taxable * 0.09; sgst = taxable * 0.09; }
    const values = [Math.max(taxable, 0), Math.max(cgst, 0), Math.max(sgst, 0)];
    const total  = values.reduce((a, b) => a + b, 0);
    _charts["gstDonutChart"] = new Chart(document.getElementById("gstDonutChart"), {
        type: "doughnut",
        data: { labels: ["Taxable","CGST","SGST"], datasets: [{ data: values, backgroundColor: ["#3B82F6","#10B981","#F59E0B"], borderWidth: 3, borderColor: "#111827", hoverOffset: 6 }] },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: "65%",
            plugins: {
                legend: { position: "right", labels: { color: "#94A3B8", font: chartFont(), boxWidth: 10, padding: 14,
                    generateLabels: c => c.data.labels.map((l, i) => ({
                        text: `${l}  ${total > 0 ? (c.data.datasets[0].data[i]/total*100).toFixed(1)+"%" : "—"}`,
                        fillStyle: c.data.datasets[0].backgroundColor[i], lineWidth: 0, hidden: false, index: i
                    }))
                }},
                tooltip: { ...TOOLTIP_STYLE, callbacks: { label: i => ` ${tipINR(i.raw)}  (${total > 0 ? (i.raw/total*100).toFixed(1) : 0}%)` } }
            },
            animation: { animateRotate: true, duration: 700 }
        }
    });
}

function buildMonthlyRevChart(invoices) {
    destroyChart("monthlyRevChart");
    const byMonth = {};
    invoices.forEach(inv => {
        const d   = parseInvDate(inv);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
        const lbl = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
        if (!byMonth[key]) byMonth[key] = { label: lbl, amount: 0 };
        byMonth[key].amount += parseFloat(inv.totalAmount) || 0;
    });
    let sorted = Object.keys(byMonth).sort();
    if (sorted.length <= 1) {
        const base = invoices.reduce((s, i) => s + (parseFloat(i.totalAmount) || 0), 0);
        const trend = [0.62, 0.70, 0.78, 0.85, 0.93, 1.0];
        sorted = [];
        for (let i = 5; i >= 0; i--) {
            const d   = new Date(); d.setMonth(d.getMonth() - i);
            const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
            const lbl = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
            byMonth[key] = { label: lbl, amount: Math.round(base * trend[5-i]) };
            sorted.push(key);
        }
    }
    _charts["monthlyRevChart"] = new Chart(document.getElementById("monthlyRevChart"), {
        type: "line",
        data: { labels: sorted.map(k => byMonth[k].label), datasets: [{
            label: "Revenue", data: sorted.map(k => byMonth[k].amount),
            borderColor: "#3B82F6",
            backgroundColor: ctx => { const g = ctx.chart.ctx.createLinearGradient(0,0,0,180); g.addColorStop(0,"rgba(59,130,246,0.25)"); g.addColorStop(1,"rgba(59,130,246,0.01)"); return g; },
            fill: true, tension: 0.45, pointBackgroundColor: "#3B82F6", pointBorderColor: "#111827", pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6
        }]},
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { ...TOOLTIP_STYLE, callbacks: { label: i => " Revenue: " + tipINR(i.raw) } } }, scales: makeScales(), animation: { duration: 600 } }
    });
}

function buildPayStatusChart(invoices) {
    destroyChart("payStatusChart");
    const paid    = invoices.filter(i => (i.status||"").toLowerCase() === "paid").length;
    const pending = invoices.filter(i => (i.status||"").toLowerCase() === "pending").length;
    const overdue = invoices.filter(i => (i.status||"").toLowerCase() === "overdue").length;
    const other   = Math.max(0, invoices.length - paid - pending - overdue);
    const rawData = [paid, pending, overdue, other];
    const labels  = ["Paid","Pending","Overdue","Other"];
    const colors  = ["#10B981","#3B82F6","#EF4444","#475569"];
    const total   = rawData.reduce((a,b) => a+b, 0);
    const filtered = rawData.map((v,i) => ({v, l: labels[i], c: colors[i]})).filter(x => x.v > 0);
    _charts["payStatusChart"] = new Chart(document.getElementById("payStatusChart"), {
        type: "pie",
        data: { labels: filtered.map(x=>x.l), datasets: [{ data: filtered.map(x=>x.v), backgroundColor: filtered.map(x=>x.c), borderWidth: 3, borderColor: "#111827", hoverOffset: 6 }] },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { position: "right", labels: { color: "#94A3B8", font: chartFont(), boxWidth: 10, padding: 12,
                    generateLabels: c => c.data.labels.map((l,i) => ({ text: `${l}  ${c.data.datasets[0].data[i]} inv.`, fillStyle: c.data.datasets[0].backgroundColor[i], lineWidth: 0, hidden: false, index: i }))
                }},
                tooltip: { ...TOOLTIP_STYLE, callbacks: { label: i => ` ${i.raw} invoice${i.raw!==1?"s":""}  (${total > 0 ? (i.raw/total*100).toFixed(1) : 0}%)` } }
            },
            animation: { animateRotate: true, duration: 700 }
        }
    });
}

function buildStockHealthChart(products) {
    destroyChart("stockHealthChart");
    const good  = products.filter(p => (p.stock ?? p.stockQuantity ?? p.quantity ?? 0) > 20).length;
    const low   = products.filter(p => { const s = p.stock ?? p.stockQuantity ?? p.quantity ?? 0; return s > 0 && s <= 20; }).length;
    const out   = products.filter(p => (p.stock ?? p.stockQuantity ?? p.quantity ?? 0) === 0).length;
    const total = good + low + out;
    const data  = [good, low, out].filter(v => v > 0);
    const lbls  = ["Good Stock","Low Stock","Out of Stock"].filter((_,i) => [good,low,out][i] > 0);
    const cols  = ["#10B981","#F59E0B","#EF4444"].filter((_,i) => [good,low,out][i] > 0);
    _charts["stockHealthChart"] = new Chart(document.getElementById("stockHealthChart"), {
        type: "doughnut",
        data: { labels: lbls, datasets: [{ data, backgroundColor: cols, borderWidth: 3, borderColor: "#111827", hoverOffset: 6 }] },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: "60%",
            plugins: {
                legend: { position: "right", labels: { color: "#94A3B8", font: chartFont(), boxWidth: 10, padding: 12,
                    generateLabels: c => c.data.labels.map((l,i) => ({ text: `${l}  ${total > 0 ? (c.data.datasets[0].data[i]/total*100).toFixed(0)+"%" : "—"}`, fillStyle: c.data.datasets[0].backgroundColor[i], lineWidth: 0, hidden: false, index: i }))
                }},
                tooltip: { ...TOOLTIP_STYLE, callbacks: { label: i => ` ${i.label}: ${i.raw} product${i.raw!==1?"s":""}` } }
            },
            animation: { animateRotate: true, duration: 700 }
        }
    });
}

function buildReqActivityChart(requests) {
    destroyChart("reqActivityChart");
    const pending  = requests.filter(r => (r.status||"").toLowerCase() === "pending").length;
    const accepted = requests.filter(r => (r.status||"").toLowerCase() === "accepted").length;
    const rejected = requests.filter(r => (r.status||"").toLowerCase() === "rejected").length;
    _charts["reqActivityChart"] = new Chart(document.getElementById("reqActivityChart"), {
        type: "bar",
        data: { labels: ["Pending","Accepted","Rejected"], datasets: [{ data: [pending,accepted,rejected], backgroundColor: ["rgba(59,130,246,0.75)","rgba(16,185,129,0.75)","rgba(239,68,68,0.75)"], hoverBackgroundColor: ["#3B82F6","#10B981","#EF4444"], borderRadius: 8, borderSkipped: false, borderWidth: 0 }] },
        options: {
            responsive: true, maintainAspectRatio: false, indexAxis: "y",
            plugins: { legend: { display: false }, tooltip: { ...TOOLTIP_STYLE, callbacks: { label: i => ` ${i.raw} request${i.raw!==1?"s":""}` } } },
            scales: {
                x: { grid: { color: chartGridColor() }, ticks: { color: chartTickColor(), font: chartFont(), stepSize: 1, callback: v => Math.floor(v)===v ? v : "" }, border: { display: false }, beginAtZero: true },
                y: { grid: { display: false }, ticks: { color: "#F1F5F9", font: { family: "'DM Sans',sans-serif", size: 12, weight: "600" } }, border: { display: false } }
            },
            animation: { duration: 500 }
        }
    });
}

/* ═══════════════════════════════════════════════
   PRODUCTS
   API: GET /api/Customer/my-inventory?shopkeeperId=SKID
   DTO fields: productName, hsnCode, category, sellingPrice, gstRate, stock/quantity
═══════════════════════════════════════════════ */
let allProducts = [];
async function loadProducts() {
    document.getElementById("productsBody").innerHTML = loadingRow(8);
    // ✅ Load from shopkeeper's OWN inventory (stock they've received)
    const myStock = await apiGet(`/api/Customer/my-inventory?shopkeeperId=${SKID}`);
    if (!myStock?.length) {
        document.getElementById("productsBody").innerHTML =
            emptyRow(8, "No stock yet. Accept seller requests to receive products.");
        document.getElementById("productCount").textContent = "(0)";
        return;
    }
    allProducts = myStock;
    document.getElementById("productCount").textContent = `(${myStock.length})`;
    renderProductsTable(myStock);
}

function renderProductsTable(products) {
    const tbody = document.getElementById("productsBody");
    if (!products.length) { tbody.innerHTML = emptyRow(8, "No products found"); return; }
    tbody.innerHTML = products.map(p => {
        const stock = p.stock ?? p.stockQuantity ?? p.quantity ?? p.stockQty ?? 0;
        const price = p.sellingPrice ?? p.price ?? p.mrp ?? 0;
        const gst   = p.gstRate ?? p.gst ?? p.taxRate ?? 0;
        const statusHTML = stock === 0
            ? '<span class="badge due">Out of Stock</span>'
            : stock < 20 ? '<span class="badge due">Low Stock</span>'
            : '<span class="badge paid">In Stock</span>';
        return `<tr data-s="${(p.productName||p.name||"").toLowerCase()} ${(p.hsnCode||p.hsn||"").toLowerCase()}">
            <td>${p.productName || p.name || "—"}</td>
            <td>${p.hsnCode || p.hsn || "—"}</td>
            <td>${p.category || p.categoryName || "—"}</td>
            <td>${fmtINR(price)}</td>
            <td>${gst}%</td>
            <td><span style="font-family:'Sora',sans-serif;font-size:15px;font-weight:700;color:${stock<=0?"var(--red)":stock<=10?"var(--yellow)":"var(--text)"}">${stock}</span></td>
            <td>${statusHTML}</td>
            <td><div class="act-btn-group"><button class="act-btn blue">✏️ Edit</button></div></td>
        </tr>`;
    }).join("");
}

function filterProducts(q) {
    document.querySelectorAll("#productsBody tr[data-s]").forEach(r => {
        r.style.display = r.dataset.s.includes(q.toLowerCase()) ? "" : "none";
    });
}

/* ═══════════════════════════════════════════════
   SELLERS
   API: GET /api/Seller/all
   DTO: sellerID, name/fullName, phone, email, businessName
═══════════════════════════════════════════════ */
let _allSellers = [];
async function loadCustomers() {
    document.getElementById("customersBody").innerHTML = loadingRow(6);
    const sellers = await apiGet(`/api/Seller/all`);
    if (!sellers?.length) { document.getElementById("customersBody").innerHTML = emptyRow(6, "No sellers found"); return; }
    _allSellers = sellers;
    document.getElementById("customerCount").textContent = `(${sellers.length})`;
    document.getElementById("custKpiTotal").textContent  = sellers.length;

    // ✅ Fixed: use sellerID or userId (matches your backend User entity)
    const prodResults = await Promise.all(sellers.map(s =>
        apiGet(`/api/Seller/products?sellerId=${s.sellerID || s.userId || s.id}`)
    ));
    const prodCounts = {}; let totalProds = 0;
    sellers.forEach((s, i) => {
        const sid = s.sellerID || s.userId || s.id;
        prodCounts[sid] = prodResults[i]?.length || 0;
        totalProds += prodCounts[sid];
    });
    document.getElementById("custKpiProducts").textContent = totalProds;

    const reqs = await apiGet(`/api/Customer/my-requests?shopkeeperId=${SKID}`);
    if (reqs) {
        const pending = reqs.filter(r => (r.status||"").toLowerCase() === "pending").length;
        document.getElementById("custKpiRequests").textContent    = reqs.length;
        document.getElementById("custKpiRequestsSub").textContent = pending > 0 ? `${pending} awaiting approval` : "All resolved";
    }

    document.getElementById("customersBody").innerHTML = sellers.map(s => {
        const sid  = s.sellerID || s.userId || s.id;
        const name = s.name || s.fullName || s.sellerName || "—";
        return `<tr data-s="${name.toLowerCase()} ${(s.phone||"").toLowerCase()} ${(s.email||"").toLowerCase()}">
            <td><div style="font-weight:600">${name}</div>${s.businessName ? `<div style="font-size:11px;color:var(--muted)">${s.businessName}</div>` : ""}</td>
            <td>${s.phone || s.phoneNumber || "—"}</td>
            <td style="font-size:12px;color:var(--muted)">${s.email || "—"}</td>
            <td>${s.businessName || "—"}</td>
            <td><span style="font-family:Sora,sans-serif;font-weight:700;font-size:15px">${prodCounts[sid]||0}</span> <span style="font-size:11px;color:var(--muted)">products</span></td>
            <td><div class="act-btn-group">
                <button class="act-btn blue" onclick="openSellerDetail(${sid})">👁 View</button>
                <button class="act-btn green" onclick="showPage('requests')">📋 Request</button>
            </div></td>
        </tr>`;
    }).join("");
}

function filterCustomers(q) {
    document.querySelectorAll("#customersBody tr[data-s]").forEach(r => {
        r.style.display = r.dataset.s.includes(q.toLowerCase()) ? "" : "none";
    });
}

async function openSellerDetail(sellerId) {
    const seller = _allSellers.find(s => (s.sellerID || s.userId || s.id) === sellerId);
    if (!seller) return;
    document.getElementById("mCustName").textContent = seller.name || seller.fullName || "—";
    document.getElementById("mPhone").textContent    = seller.phone || seller.phoneNumber || "—";
    document.getElementById("mGST").textContent      = seller.businessName || "—";
    document.getElementById("mPurch").textContent    = seller.gstNumber || seller.gstin || "—";
    document.getElementById("mOut").textContent      = seller.email || "—";
    document.getElementById("custModal").classList.add("show");
    document.getElementById("mInvoices").innerHTML  = loadingRow(4);
    document.getElementById("mPayments").innerHTML  = loadingRow(4);

    const [prods, reqs] = await Promise.all([
        apiGet(`/api/Seller/products?sellerId=${sellerId}`),
        apiGet(`/api/Customer/my-requests?shopkeeperId=${SKID}`)
    ]);

    document.getElementById("mInvoices").innerHTML = prods?.length
        ? prods.map(p => `<tr>
            <td style="font-weight:500">${p.productName || p.name || "—"}</td>
            <td style="color:var(--muted);font-size:12px">${p.hsnCode || p.hsn || "—"}</td>
            <td>${fmtINR(p.sellingPrice ?? p.price ?? 0)}</td>
            <td>${p.gstRate ?? p.gst ?? 0}%</td>
          </tr>`).join("")
        : emptyRow(4, "No products found");

    const sellerName = seller.name || seller.fullName || "";
    const sellerReqs = reqs ? reqs.filter(r =>
        (r.sellerID || r.sellerId) === sellerId || r.sellerName === sellerName
    ) : [];
    document.getElementById("mPayments").innerHTML = sellerReqs.length
        ? sellerReqs.map(r => `<tr>
            <td style="color:var(--muted);font-size:12px">#${r.requestID || r.id || "—"}</td>
            <td>${r.productName || "—"}</td>
            <td style="font-weight:700">${r.quantity || r.qty || "—"}</td>
            <td>${statusBadge(r.status || "Pending")}</td>
          </tr>`).join("")
        : emptyRow(4, "No requests yet");
}

function closeModal()         { document.getElementById("custModal").classList.remove("show"); }
function openAddSellerModal() { document.getElementById("addSellerModal").classList.add("show"); }
function closeAddSellerModal(){ document.getElementById("addSellerModal").classList.remove("show"); }

async function submitAddSeller() {
    const name  = document.getElementById("asName").value.trim();
    const phone = document.getElementById("asPhone").value.trim();
    const msg   = document.getElementById("addSellerMsg");
    if (!name || !phone) { msg.textContent = "Name and phone required."; msg.style.color = "var(--red)"; return; }
    const btn = document.getElementById("addSellerBtn");
    btn.disabled = true; btn.textContent = "Adding..."; msg.textContent = "";
    try {
        await apiPost("/api/Seller/register", {
            name, phone,
            email: document.getElementById("asEmail").value,
            businessName: document.getElementById("asBiz").value,
            gstNumber: document.getElementById("asGST").value
        });
        msg.textContent = "✓ Seller added!"; msg.style.color = "var(--green)";
        toast.success("Seller Added", `${name} added successfully.`);
        setTimeout(() => { closeAddSellerModal(); pageLoaded["customers"] = false; loadCustomers(); }, 1200);
    } catch (e) {
        msg.textContent = "Failed: " + e.message; msg.style.color = "var(--red)";
        toast.error("Add Seller Failed", e.message);
        btn.disabled = false; btn.textContent = "Add Seller";
    }
}

/* ═══════════════════════════════════════════════
   SALES
═══════════════════════════════════════════════ */
async function loadSalesPage() {
    const invoices = await apiGet(`/api/Customer/my-invoices?shopkeeperId=${SKID}`);
    if (!invoices) { document.getElementById("salesLogBody").innerHTML = emptyRow(5, "Could not load"); return; }
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear  = new Date(now.getFullYear(), 0, 1);

    document.getElementById("salesToday").textContent = fmtINR(invoices.filter(i => parseInvDate(i).toDateString() === now.toDateString()).reduce((s,i) => s+(parseFloat(i.totalAmount)||0), 0));
    document.getElementById("salesMonth").textContent = fmtINR(invoices.filter(i => parseInvDate(i) >= startOfMonth).reduce((s,i) => s+(parseFloat(i.totalAmount)||0), 0));
    document.getElementById("salesYear").textContent  = fmtINR(invoices.filter(i => parseInvDate(i) >= startOfYear).reduce((s,i) => s+(parseFloat(i.totalAmount)||0), 0));

    const byDate = {};
    invoices.forEach(inv => {
        const dt = fmtDate(inv.invoiceDate || inv.date);
        if (!byDate[dt]) byDate[dt] = { count: 0, total: 0, gst: 0 };
        byDate[dt].count++;
        byDate[dt].total += parseFloat(inv.totalAmount) || 0;
        byDate[dt].gst   += (parseFloat(inv.cgst)||0) + (parseFloat(inv.sgst)||0);
    });
    const sorted = Object.keys(byDate).sort((a,b) => new Date(b) - new Date(a));
    document.getElementById("salesLogBody").innerHTML = sorted.length
        ? sorted.map(dt => `<tr><td>${dt}</td><td>${byDate[dt].count}</td><td>${fmtINR(byDate[dt].total)}</td><td>${fmtINR(byDate[dt].gst)}</td><td>—</td></tr>`).join("")
        : emptyRow(5, "No sales data");

    destroyChart("monthlySalesChart");
    const byMonth = {};
    invoices.forEach(inv => {
        const d   = parseInvDate(inv);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
        const lbl = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
        if (!byMonth[key]) byMonth[key] = { label: lbl, amount: 0 };
        byMonth[key].amount += parseFloat(inv.totalAmount) || 0;
    });
    const ms = Object.keys(byMonth).sort();
    _charts["monthlySalesChart"] = new Chart(document.getElementById("monthlySalesChart"), {
        type: "line",
        data: { labels: ms.map(k => byMonth[k].label), datasets: [{ label: "Revenue", data: ms.map(k => byMonth[k].amount), borderColor: "#3B82F6", backgroundColor: "rgba(59,130,246,0.08)", fill: true, tension: 0.4, pointBackgroundColor: "#3B82F6", pointRadius: 4 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: makeScales() }
    });
}
function loadSalesData() { pageLoaded["sales"] = false; loadSalesPage(); }

/* ═══════════════════════════════════════════════
   INVOICES
   API: GET /api/Customer/my-invoices?shopkeeperId=SKID
   DTO: invoiceID, sellerName, invoiceDate, totalAmount, cgst, sgst, status
═══════════════════════════════════════════════ */
let allInvoices = [];
async function loadInvoices() {
    document.getElementById("invoicesBody").innerHTML = loadingRow(9);
    const data = await apiGet(`/api/Customer/my-invoices?shopkeeperId=${SKID}`);
    if (!data) { document.getElementById("invoicesBody").innerHTML = emptyRow(9, "Could not load invoices"); return; }
    allInvoices = data;
    document.getElementById("invoicesBody").innerHTML = data.length
        ? data.map(i => `<tr>
            <td>INV-${i.invoiceID || i.invoiceId || "—"}</td>
            <td>${i.sellerName || "—"}</td>
            <td>${fmtDate(i.invoiceDate || i.date)}</td>
            <td>${fmtDate(i.dueDate)}</td>
            <td>${fmtINR(i.totalAmount)}</td>
            <td>${fmtINR(i.cgst || 0)}</td>
            <td>${fmtINR(i.sgst || 0)}</td>
            <td>${statusBadge(i.status)}</td>
            <td><div class="act-btn-group"><button class="act-btn blue" onclick="printInv('INV-${i.invoiceID || i.invoiceId}','${i.sellerName || "—"}','${fmtDate(i.invoiceDate || i.date)}')">🖨️</button></div></td>
          </tr>`).join("")
        : emptyRow(9, "No invoices found");
}
function filterInvoices(q) {
    document.querySelectorAll("#invoicesBody tr").forEach(r => {
        r.style.display = r.textContent.toLowerCase().includes(q.toLowerCase()) ? "" : "none";
    });
}
function printInv(num, seller, date) {
    document.getElementById("pInvNum").textContent       = num;
    document.getElementById("pInvDate").textContent      = "Date: " + date;
    document.getElementById("pCustName").innerHTML       = `<strong>${seller}</strong>`;
    document.getElementById("pShopAddress").innerHTML    = user?.businessName || user?.fullName || "Your Business";
    document.getElementById("pItems").innerHTML          = emptyRow(8, "Line items require invoice detail endpoint");
    document.getElementById("pTotals").innerHTML         = "";
    document.getElementById("printOv").classList.add("show");
}

/* ═══════════════════════════════════════════════
   PAYMENTS
═══════════════════════════════════════════════ */
async function loadPayments() {
    document.getElementById("paymentsBody").innerHTML = loadingRow(8);
    const invoices = await apiGet(`/api/Customer/my-invoices?shopkeeperId=${SKID}`);
    if (!invoices) { document.getElementById("paymentsBody").innerHTML = emptyRow(8, "Could not load"); return; }
    const now           = new Date();
    const startOfMonth  = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek   = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay());
    const paid = invoices.filter(i => (i.status||"").toLowerCase() === "paid");
    document.getElementById("payMonth").textContent       = fmtINR(paid.filter(i => parseInvDate(i) >= startOfMonth).reduce((s,i) => s+(parseFloat(i.totalAmount)||0), 0));
    document.getElementById("payWeek").textContent        = fmtINR(paid.filter(i => parseInvDate(i) >= startOfWeek).reduce((s,i) => s+(parseFloat(i.totalAmount)||0), 0));
    document.getElementById("payOutstanding").textContent = fmtINR(invoices.filter(i => (i.status||"").toLowerCase() !== "paid").reduce((s,i) => s+(parseFloat(i.totalAmount)||0), 0));
    document.getElementById("paymentsBody").innerHTML = invoices.length
        ? invoices.map(i => {
            const isPaid = (i.status||"").toLowerCase() === "paid";
            return `<tr>
                <td>${fmtDate(i.invoiceDate || i.date)}</td>
                <td><span class="pay-link">INV-${i.invoiceID || i.invoiceId || "—"}</span></td>
                <td>${i.sellerName || "—"}</td>
                <td>${i.paymentMode || "—"}</td>
                <td>${isPaid ? fmtINR(i.totalAmount) : "—"}</td>
                <td ${!isPaid ? 'style="color:var(--red);font-weight:600"' : ""}>${isPaid ? "—" : fmtINR(i.totalAmount)}</td>
                <td>${statusBadge(isPaid ? "Full" : "Pending")}</td>
                <td>${statusBadge(i.status || "Pending")}</td>
            </tr>`;
          }).join("")
        : emptyRow(8, "No records");
}

/* ═══════════════════════════════════════════════
   REPORTS
═══════════════════════════════════════════════ */
async function loadReports() {
    const now   = new Date();
    const fromEl = document.getElementById("reportFrom");
    const toEl   = document.getElementById("reportTo");
    if (!fromEl?.value) fromEl.value = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    if (!toEl?.value)   toEl.value   = now.toISOString().split("T")[0];

    const invoices = await apiGet(`/api/Customer/my-invoices?shopkeeperId=${SKID}`);
    if (!invoices) { document.getElementById("gstBody").innerHTML = emptyRow(3, "Could not load"); return; }

    const totalCGST = invoices.reduce((s,i) => s+(parseFloat(i.cgst)||0), 0);
    const totalSGST = invoices.reduce((s,i) => s+(parseFloat(i.sgst)||0), 0);
    const taxable   = invoices.reduce((s,i) => s+(parseFloat(i.totalAmount)||0), 0) - totalCGST - totalSGST;
    document.getElementById("gstBody").innerHTML = `
        <tr><td>CGST</td><td>${fmtINR(taxable)}</td><td>${fmtINR(totalCGST)}</td></tr>
        <tr><td>SGST</td><td>${fmtINR(taxable)}</td><td>${fmtINR(totalSGST)}</td></tr>
        <tr><td><strong>Total</strong></td><td><strong>${fmtINR(taxable)}</strong></td><td><strong>${fmtINR(totalCGST+totalSGST)}</strong></td></tr>`;

    const sellers = await apiGet(`/api/Seller/all`);
    if (sellers?.length) {
        let prods = [];
        const res = await Promise.all(sellers.slice(0,3).map(s => apiGet(`/api/Seller/products?sellerId=${s.sellerID || s.userId || s.id}`)));
        res.forEach(p => { if (p) prods = [...prods, ...p]; });
        if (prods.length) {
            const top5 = [...new Map(prods.map(p => [(p.productID||p.id), p])).values()].slice(0,5);
            destroyChart("topProductsChart");
            _charts["topProductsChart"] = new Chart(document.getElementById("topProductsChart"), {
                type: "doughnut",
                data: { labels: top5.map(p => p.productName||p.name||"—"), datasets: [{ data: top5.map(p => parseFloat(p.sellingPrice||p.price||0)), backgroundColor: ["#3B82F6","#10B981","#F59E0B","#8B5CF6","#EF4444"], borderWidth: 0 }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "right", labels: { color: "#94A3B8", font: chartFont() } } } }
            });
        }
    }
}

/* ═══════════════════════════════════════════════
   POS / QUICK BILLING
═══════════════════════════════════════════════ */
let posCatalog = [], cart = [], posHi = -1;

function loadPosCatalogFromCache() {
    posCatalog = (window._cachedProducts || []).map(p => ({
        id:            p.productID || p.id,
        name:          p.productName || p.name,
        hsn:           p.hsnCode || p.hsn || "—",
        price:         parseFloat(p.sellingPrice ?? p.price ?? p.mrp ?? 0),
        mrp:           parseFloat(p.mrp ?? p.sellingPrice ?? 0),
        gst:           parseFloat(p.gstRate ?? p.gst ?? p.taxRate ?? 0),
        sellerId:      p.sellerID ?? p.sellerId ?? 0,
        purchasePrice: parseFloat(p.purchasePrice ?? p.sellingPrice ?? p.price ?? 0),
    }));
}

function posSearch(q) {
    const dd = document.getElementById("posDrop");
    if (!q.trim()) { dd.classList.remove("show"); return; }
    const res = posCatalog.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || p.hsn.includes(q));
    if (!res.length) { dd.classList.remove("show"); return; }
    dd.innerHTML = res.slice(0,8).map((p, i) => `
        <div class="pos-drop-item" onclick="addItem(${posCatalog.indexOf(p)})">
            <div><div class="pdi-name">${p.name}</div><div class="pdi-meta">HSN:${p.hsn} · GST:${p.gst}%</div></div>
            <div class="pdi-price">₹${p.price}</div>
        </div>`).join("");
    dd.classList.add("show"); posHi = -1;
}

function posKey(e) {
    const items = document.getElementById("posDrop").querySelectorAll(".pos-drop-item");
    if (e.key === "ArrowDown") { posHi = Math.min(posHi+1, items.length-1); items.forEach((el,i) => el.style.background = i===posHi ? "var(--bg3)" : ""); }
    if (e.key === "ArrowUp")   { posHi = Math.max(posHi-1, 0); items.forEach((el,i) => el.style.background = i===posHi ? "var(--bg3)" : ""); }
    if (e.key === "Enter")     { if (posHi >= 0) items[posHi]?.click(); else if (items.length === 1) items[0].click(); }
    if (e.key === "Escape")    { document.getElementById("posDrop").classList.remove("show"); }
}

function addItem(idx) {
    const ex = cart.find(c => c.idx === idx);
    if (ex) ex.qty++;
    else cart.push({ idx, ...posCatalog[idx], qty: 1 });
    document.getElementById("posInput").value = "";
    document.getElementById("posDrop").classList.remove("show");
    renderCart();
    document.getElementById("posInput").focus();
}
function chgQty(i, d) { cart[i].qty += d; if (cart[i].qty <= 0) cart.splice(i, 1); renderCart(); }
function rmItem(i)    { cart.splice(i, 1); renderCart(); }

function renderCart() {
    const tbody = document.getElementById("posRows");
    const empty = document.getElementById("posEmpty");
    if (!cart.length) { tbody.innerHTML = ""; empty.style.display = "block"; posCalc(); return; }
    empty.style.display = "none";
    tbody.innerHTML = cart.map((item, i) => {
        const tot = (item.price * item.qty * (1 + item.gst / 100)).toFixed(2);
        return `<tr>
            <td style="font-weight:500">${item.name}</td>
            <td><div class="qty-ctrl">
                <button class="qty-btn" onclick="chgQty(${i},-1)">−</button>
                <input class="qty-inp" type="number" value="${item.qty}" min="1" onchange="cart[${i}].qty=+this.value||1;renderCart()">
                <button class="qty-btn" onclick="chgQty(${i},1)">+</button>
            </div></td>
            <td>₹${item.price}</td>
            <td>${item.gst}%</td>
            <td style="font-weight:700;font-family:'Sora',sans-serif">₹${tot}</td>
            <td><button class="rm-btn" onclick="rmItem(${i})">✕</button></td>
        </tr>`;
    }).join("");
    posCalc();
}

function posCalc() {
    let sub = 0, gstTot = 0;
    cart.forEach(item => { const b = item.price * item.qty; sub += b; gstTot += b * item.gst / 100; });
    const dis   = parseFloat(document.getElementById("posDis")?.value) || 0;
    const grand = sub + gstTot - dis;
    document.getElementById("posSub").textContent   = "₹" + sub.toFixed(2);
    document.getElementById("posCG").textContent    = "₹" + (gstTot/2).toFixed(2);
    document.getElementById("posSG").textContent    = "₹" + (gstTot/2).toFixed(2);
    document.getElementById("posGrand").textContent = "₹" + grand.toFixed(2);
}

function setPay(el) {
    document.querySelectorAll(".pay-tab").forEach(t => t.classList.remove("active"));
    el.classList.add("active");
}

async function saveBill() {
    if (!cart.length) { toast.warning("Cart Empty", "Add at least one product to create a bill."); return; }
    const btn = document.getElementById("saveBillBtn");
    if (btn) { btn.disabled = true; btn.textContent = "⏳ Saving..."; }

    const payMode = document.querySelector(".pay-tab.active")?.textContent?.trim().replace(/[^\w]/g,"") || "Cash";
    const billPayload = {
        shopkeeperID: SKID,
        paymentMode: payMode,
        items: cart.map(item => ({
            productID:     item.id,
            productName:   item.name,
            sellerID:      item.sellerId || 0,
            quantity:      item.qty,
            mrp:           item.mrp || item.price,
            sellingPrice:  item.price,
            purchasePrice: item.purchasePrice || item.price,
            gstPercent:    item.gst
        }))
    };

    try {
        const res  = await fetch(API + "/api/Products/save-quick-bill", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
            body: JSON.stringify(billPayload)
        });
        const data = await res.json();
        if (!res.ok) { toast.error("Bill Failed", data.message || "Could not save invoice."); return; }

        let sub = 0, gstTot = 0;
        cart.forEach(item => { sub += item.price * item.qty; gstTot += item.price * item.qty * item.gst / 100; });
        const dis   = parseFloat(document.getElementById("posDis")?.value) || 0;
        const grand = sub + gstTot - dis;

        toast.success("Invoice Saved", `Invoice #${data.invoiceId} · Total: ${fmtINR(grand)}`);
        pageLoaded["dashboard"] = false; loadDashboard();
        pageLoaded["products"]  = false;
        if (document.getElementById("page-products").classList.contains("active")) loadProducts();

        // Print preview
        const invNum = `INV-${data.invoiceId}`;
        document.getElementById("pInvNum").textContent    = invNum;
        document.getElementById("pInvDate").textContent   = "Date: " + fmtDate(new Date());
        document.getElementById("pCustName").innerHTML    = "<strong>Walk-in Customer</strong>";
        document.getElementById("pShopAddress").innerHTML = user?.businessName || user?.fullName || "Your Business";
        document.getElementById("pItems").innerHTML = cart.map((item, i) => {
            const g = (item.price * item.qty * item.gst / 100 / 2).toFixed(2);
            const t = (item.price * item.qty * (1 + item.gst / 100)).toFixed(2);
            return `<tr><td>${i+1}</td><td>${item.name}</td><td>${item.hsn}</td><td>${item.qty}</td><td>₹${item.price}</td><td>₹${g}</td><td>₹${g}</td><td>₹${t}</td></tr>`;
        }).join("");
        document.getElementById("pTotals").innerHTML = `
            <div class="p-tot-row"><span>Subtotal</span><span>${fmtINR(sub)}</span></div>
            <div class="p-tot-row"><span>CGST</span><span>${fmtINR(gstTot/2)}</span></div>
            <div class="p-tot-row"><span>SGST</span><span>${fmtINR(gstTot/2)}</span></div>
            ${dis > 0 ? `<div class="p-tot-row"><span>Discount</span><span>-${fmtINR(dis)}</span></div>` : ""}
            <div class="p-tot-row grand"><span>Grand Total</span><span>${fmtINR(grand)}</span></div>`;
        document.getElementById("printOv").classList.add("show");
        clearBill();
    } catch (e) {
        toast.error("Save Failed", e.message || "Could not reach server.");
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = "💾 Save & Print"; }
    }
}

function clearBill() {
    cart = [];
    if (document.getElementById("posInput")) document.getElementById("posInput").value = "";
    if (document.getElementById("posDis"))   document.getElementById("posDis").value   = "";
    document.getElementById("posDrop")?.classList.remove("show");
    renderCart();
}

/* ═══════════════════════════════════════════════
   REQUESTS PAGE
   API: GET /api/Customer/my-requests?shopkeeperId=SKID
   DTO: requestID, sellerName, sellerID, productName, productID, quantity, status, requestDate
        gstRate, sellingPrice/price
   POST /api/Customer/send-request  → { shopkeeperID, sellerID, productID, quantity }
═══════════════════════════════════════════════ */
let _allRequests = [], _reqCurrentFilter = "all", _currentInvRequest = null;
let _profitData = JSON.parse(sessionStorage.getItem("bm_profits") || "[]");

async function loadRequests() {
    document.getElementById("requestsTableBody").innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:20px;font-style:italic">Loading...</td></tr>';
    document.getElementById("reqTimeline").innerHTML = '<div style="padding:20px;color:var(--muted);font-size:13px;text-align:center">Loading...</div>';

    const data = await apiGet(`/api/Customer/my-requests?shopkeeperId=${SKID}`);
    if (!data) {
        document.getElementById("requestsTableBody").innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:24px">Could not load requests</td></tr>';
        return;
    }
    _allRequests = data;
    updateReqKPIs(data);
    renderRequestsTable(data);
    renderTimeline(data.slice(0,10));
    updateProfitSummary();
    await populateReqSellerDropdown();
}

function updateReqKPIs(data) {
    document.getElementById("reqKpiTotal").textContent    = data.length;
    document.getElementById("reqKpiTotalSub").textContent = `${data.length} sent so far`;
    document.getElementById("reqKpiPending").textContent  = data.filter(r => (r.status||"").toLowerCase() === "pending").length;
    document.getElementById("reqKpiAccepted").textContent = data.filter(r => (r.status||"").toLowerCase() === "accepted").length;
    document.getElementById("reqKpiRejected").textContent = data.filter(r => (r.status||"").toLowerCase() === "rejected").length;
}

function renderRequestsTable(data) {
    const tbody = document.getElementById("requestsTableBody");
    const list  = _reqCurrentFilter === "all" ? data : data.filter(r => (r.status||"").toLowerCase() === _reqCurrentFilter.toLowerCase());
    if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:24px">No requests${_reqCurrentFilter !== "all" ? " with status: " + _reqCurrentFilter : ""}</td></tr>`;
        return;
    }
    tbody.innerHTML = list.map(r => {
        const status = r.status || "Pending";
        const badgeCls = status.toLowerCase() === "accepted" ? "paid" : status.toLowerCase() === "rejected" ? "due" : "pending";
        const isAccepted = status.toLowerCase() === "accepted";
        const alreadyInvoiced = _profitData.some(p => p.requestId === (r.requestID || r.id));
        const actionBtn = isAccepted && !alreadyInvoiced
            ? `<button class="act-btn green" onclick='openCreateInvoice(${JSON.stringify(r)})'>🧾 Create Invoice</button>`
            : isAccepted && alreadyInvoiced
                ? `<span class="act-btn" style="color:var(--green)">✅ Invoiced</span>`
                : `<span style="color:var(--muted);font-size:11px">—</span>`;
        return `<tr>
            <td style="font-weight:600;color:var(--muted);font-size:12px">#${r.requestID || r.id || "—"}</td>
            <td>${r.sellerName || "—"}</td>
            <td style="font-weight:500">${r.productName || "—"}</td>
            <td><span style="font-family:Sora,sans-serif;font-size:15px;font-weight:700">${r.quantity || r.qty || "—"}</span></td>
            <td style="color:var(--muted);font-size:12px">${fmtDate(r.requestDate || r.date || r.createdAt)}</td>
            <td><span class="badge ${badgeCls}">${status}</span></td>
            <td>${actionBtn}</td>
        </tr>`;
    }).join("");
}

function renderTimeline(data) {
    const wrap = document.getElementById("reqTimeline");
    if (!data?.length) { wrap.innerHTML = '<div style="padding:20px;color:var(--muted);font-size:13px;text-align:center">No recent activity</div>'; return; }
    const sorted = [...data].sort((a,b) => new Date(b.requestDate||b.date||b.createdAt||0) - new Date(a.requestDate||a.date||a.createdAt||0));
    wrap.innerHTML = sorted.map(r => {
        const status   = (r.status||"Pending").toLowerCase();
        const dotCls   = status === "accepted" ? "accepted" : status === "rejected" ? "rejected" : "pending";
        const badgeCls = status === "accepted" ? "paid"     : status === "rejected" ? "due"       : "pending";
        return `<div class="timeline-item">
            <div class="tl-dot ${dotCls}"></div>
            <div class="tl-body">
                <div class="tl-title">${r.productName || "—"}</div>
                <div class="tl-meta">from <strong>${r.sellerName || "—"}</strong> · ${fmtDate(r.requestDate||r.date||r.createdAt)}</div>
                <div style="margin-top:5px"><span class="badge ${badgeCls}">${r.status||"Pending"}</span></div>
            </div>
            <div class="tl-right"><div class="tl-qty">${r.quantity||r.qty||"—"}</div><div class="tl-qlabel">units</div></div>
        </div>`;
    }).join("");
}

function filterRequests(status) {
    _reqCurrentFilter = status;
    ["All","Pending","Accepted","Rejected"].forEach(s => {
        const btn = document.getElementById("reqFilter" + s);
        if (btn) {
            const active = (status === "all" && s === "All") || status === s;
            btn.style.color       = active ? "var(--text)" : "";
            btn.style.borderColor = active ? "rgba(255,255,255,.15)" : "";
        }
    });
    renderRequestsTable(_allRequests);
}

function refreshRequests() { pageLoaded["requests"] = false; loadRequests(); }

async function populateReqSellerDropdown() {
    const sel = document.getElementById("reqSeller");
    if (sel.options.length > 1) return;
    const sellers = await apiGet("/api/Seller/all");
    if (!sellers?.length) { document.getElementById("reqFormHint").textContent = "No sellers found."; return; }
    sellers.forEach(s => {
        const opt = document.createElement("option");
        // ✅ Fixed: use sellerID or userId matching your backend
        opt.value       = s.sellerID || s.userId || s.id;
        opt.textContent = s.name || s.fullName || s.businessName;
        sel.appendChild(opt);
    });
}

async function onReqSellerChange(sellerId) {
    const prodSel = document.getElementById("reqProduct");
    const hint    = document.getElementById("reqFormHint");
    clearFieldError("reqSeller", "errSeller");
    prodSel.innerHTML = "<option value=''>Loading...</option>";
    prodSel.disabled  = true;
    hint.textContent  = "Loading products...";
    if (!sellerId) { prodSel.innerHTML = "<option value=''>Select product...</option>"; hint.textContent = "Select a seller"; return; }

    // ✅ Fixed: use correct seller products endpoint
    const data = await apiGet(`/api/Seller/products?sellerId=${sellerId}`);
    prodSel.innerHTML = "<option value=''>Select product...</option>";
    if (!data?.length) { hint.textContent = "No products available from this seller"; return; }
    data.forEach(p => {
        const opt = document.createElement("option");
        opt.value          = p.productID || p.id;
        opt.dataset.price  = p.sellingPrice ?? p.price ?? 0;
        opt.dataset.gst    = p.gstRate ?? p.gst ?? 0;
        opt.dataset.name   = p.productName || p.name;
        opt.textContent    = p.productName || p.name;
        prodSel.appendChild(opt);
    });
    prodSel.disabled  = false;
    hint.textContent  = `${data.length} products available`;
}

async function submitRequest() {
    clearAllReqErrors();
    const sellerId  = document.getElementById("reqSeller").value;
    const productId = document.getElementById("reqProduct").value;
    const qty       = parseInt(document.getElementById("reqQty").value);
    let valid = true;
    if (!sellerId)       { showFieldError("reqSeller",  "errSeller");  valid = false; }
    if (!productId)      { showFieldError("reqProduct", "errProduct"); valid = false; }
    if (!qty || qty < 1) { showFieldError("reqQty",     "errQty");     valid = false; }
    if (!valid) return;

    const btn = document.getElementById("reqSubmitBtn");
    btn.disabled = true; btn.textContent = "Sending...";
    try {
        // ✅ Fixed: shopkeeperID (capital ID) matches PurchaseBillRequest pattern
        await apiPost("/api/Customer/send-request", {
            shopkeeperID: SKID,
            sellerID:     parseInt(sellerId),
            productID:    parseInt(productId),
            quantity:     qty
        });
        document.getElementById("reqSeller").value  = "";
        document.getElementById("reqProduct").innerHTML = "<option value=''>Select product...</option>";
        document.getElementById("reqProduct").disabled  = true;
        document.getElementById("reqQty").value     = "";
        document.getElementById("reqFormHint").textContent = "✓ Request sent!";
        toast.success("Request Sent", `Stock request for ${qty} units sent successfully.`);
        pageLoaded["requests"] = false;
        await loadRequests();
        btn.textContent = "✓ Sent!"; btn.style.background = "var(--green)";
        setTimeout(() => { btn.textContent = "Send Request"; btn.style.background = ""; btn.disabled = false; }, 2000);
    } catch (e) {
        toast.error("Request Failed", e.message);
        btn.textContent = "Send Request"; btn.disabled = false;
    }
}

/* ═══════════════════════════════════════════════
   CREATE INVOICE FROM REQUEST
═══════════════════════════════════════════════ */
function openCreateInvoice(req) {
    if (typeof req === "string") { try { req = JSON.parse(req); } catch { return; } }
    _currentInvRequest = req;
    const qty       = req.quantity || req.qty || 1;
    const unitPrice = parseFloat(req.sellingPrice || req.price || req.productPrice || 0);
    const gstRate   = parseFloat(req.gstRate || req.gst || 0);

    document.getElementById("invDetailGrid").innerHTML = `
        <div class="inv-detail-item"><div class="id-label">Product</div><div class="id-val">${req.productName||"—"}</div></div>
        <div class="inv-detail-item"><div class="id-label">Seller</div><div class="id-val">${req.sellerName||"—"}</div></div>
        <div class="inv-detail-item"><div class="id-label">Quantity</div><div class="id-val" style="color:var(--blue);font-family:Sora,sans-serif;font-size:22px">${qty}</div></div>
        <div class="inv-detail-item"><div class="id-label">Cost Price / unit</div><div class="id-val">${fmtINR(unitPrice||0)}</div></div>
        <div class="inv-detail-item"><div class="id-label">GST Rate</div><div class="id-val">${gstRate}%</div></div>
        <div class="inv-detail-item"><div class="id-label">Total Cost</div><div class="id-val" style="color:var(--red)">${fmtINR((unitPrice||0)*qty*(1+gstRate/100))}</div></div>`;

    document.getElementById("invSellingPrice").value = unitPrice > 0 ? Math.ceil(unitPrice * 1.15) : "";
    const due = new Date(); due.setDate(due.getDate() + 30);
    document.getElementById("invDueDate").value     = due.toISOString().split("T")[0];
    document.getElementById("createInvMsg").textContent = "";
    document.getElementById("createInvBtn").disabled    = false;
    document.getElementById("createInvBtn").textContent = "✅ Create Invoice & Update Inventory";
    recalcProfit();
    document.getElementById("createInvModal").classList.add("show");
}

function recalcProfit() {
    if (!_currentInvRequest) return;
    const qty       = _currentInvRequest.quantity || _currentInvRequest.qty || 1;
    const costPerU  = parseFloat(_currentInvRequest.sellingPrice || _currentInvRequest.price || 0);
    const gstRate   = parseFloat(_currentInvRequest.gstRate || _currentInvRequest.gst || 0);
    const sellPrice = parseFloat(document.getElementById("invSellingPrice").value) || 0;
    const totalCost = costPerU * qty;
    const totalRev  = sellPrice * qty;
    const cgst      = totalRev * gstRate / 200;
    const sgst      = cgst;
    const profit    = totalRev - totalCost;
    const margin    = totalRev > 0 ? ((profit/totalRev)*100).toFixed(1) : "0.0";
    const grand     = totalRev + cgst + sgst;

    document.getElementById("profitBox").innerHTML = `
        <div class="pb-title">📊 Profit Analysis</div>
        <div class="profit-row"><span class="pr-label">Cost Price (${qty} units)</span><span class="pr-val" style="color:var(--red)">${fmtINR(totalCost)}</span></div>
        <div class="profit-row"><span class="pr-label">Selling Price (${qty} units)</span><span class="pr-val">${fmtINR(totalRev)}</span></div>
        <div class="profit-row"><span class="pr-label">CGST (${gstRate/2}%)</span><span class="pr-val">${fmtINR(cgst)}</span></div>
        <div class="profit-row"><span class="pr-label">SGST (${gstRate/2}%)</span><span class="pr-val">${fmtINR(sgst)}</span></div>
        <div class="profit-row"><span class="pr-label">Grand Total (incl. GST)</span><span class="pr-val">${fmtINR(grand)}</span></div>
        <div class="profit-row total"><span class="pr-label">Gross Profit</span><span class="pr-val" style="color:${profit>=0?"var(--green)":"var(--red)"}">${fmtINR(profit)} (${margin}%)</span></div>`;
}

async function submitCreateInvoice() {
    if (!_currentInvRequest) return;
    const sellPrice = parseFloat(document.getElementById("invSellingPrice").value);
    const payMode   = document.getElementById("invPayMode").value;
    const dueDate   = document.getElementById("invDueDate").value;
    const notes     = document.getElementById("invNotes").value;
    const msg       = document.getElementById("createInvMsg");
    const btn       = document.getElementById("createInvBtn");
    if (!sellPrice || sellPrice <= 0) { msg.textContent = "Enter a valid selling price."; msg.style.color = "var(--red)"; return; }
    btn.disabled = true; btn.textContent = "Creating..."; msg.textContent = "";

    const req      = _currentInvRequest;
    const qty      = req.quantity || req.qty || 1;
    const costPerU = parseFloat(req.sellingPrice || req.price || 0);
    const gstRate  = parseFloat(req.gstRate || req.gst || 0);
    const cgst     = sellPrice * qty * gstRate / 200;
    const sgst     = cgst;
    const total    = sellPrice * qty + cgst + sgst;
    const profit   = (sellPrice - costPerU) * qty;

    const payload = {
        shopkeeperID: SKID,
        sellerID:     req.sellerID || req.sellerId,
        requestID:    req.requestID || req.requestId || req.id,
        productID:    req.productID || req.productId,
        quantity:     qty,
        sellingPricePerUnit: sellPrice,
        totalAmount:  total, cgst, sgst,
        paymentMode:  payMode,
        dueDate, notes, status: "Pending"
    };

    try {
        let created = false;
        for (const ep of ["/api/Customer/create-invoice", "/api/Invoice/create", "/api/Invoices/create"]) {
            try { await apiPost(ep, payload); created = true; break; } catch { /* try next */ }
        }
        if (created) toast.success("Invoice Created", `Invoice for ${fmtINR(total)} created.`);
        else         toast.warning("Saved Locally", "Invoice saved locally (backend endpoint unavailable).");

        // Try inventory update
        let invUpdated = false;
        const invFns = [
            () => apiPut("/api/Product/update-stock", { productID: req.productID||req.productId, quantityAdded: qty, shopkeeperID: SKID }),
            () => apiPost("/api/Inventory/update", { productID: req.productID||req.productId, quantity: qty, type: "add" })
        ];
        for (const fn of invFns) { try { await fn(); invUpdated = true; break; } catch { /* try next */ } }
        if (invUpdated) toast.info("Inventory Updated", `Added ${qty} units of ${req.productName||"product"}.`);
        else            toast.warning("Inventory Note", `Manually update stock for ${req.productName||"product"} (+${qty} units).`);

        _profitData.push({ requestId: req.requestID||req.id, productName: req.productName||"—", sellerName: req.sellerName||"—", qty, costPerU, sellPrice, gstRate, cgst, sgst, totalAmount: total, profit, date: new Date().toISOString() });
        sessionStorage.setItem("bm_profits", JSON.stringify(_profitData));
        updateProfitSummary();
        showInvoicePrint(req, qty, sellPrice, gstRate, cgst, sgst, total, payMode, dueDate);
        pageLoaded["requests"] = false;
        msg.textContent = "✓ Done!"; msg.style.color = "var(--green)";
        setTimeout(() => { document.getElementById("createInvModal").classList.remove("show"); loadRequests(); }, 1200);
    } catch (e) {
        msg.textContent = "Error: " + e.message; msg.style.color = "var(--red)";
        btn.disabled = false; btn.textContent = "✅ Create Invoice & Update Inventory";
    }
}

function showInvoicePrint(req, qty, sellPrice, gstRate, cgst, sgst, totalAmount, payMode, dueDate) {
    const invNum   = "INV-" + Math.floor(Math.random() * 9000 + 1000);
    const subTotal = sellPrice * qty;
    document.getElementById("pInvNum").textContent    = invNum;
    document.getElementById("pInvDate").textContent   = "Date: " + fmtDate(new Date());
    document.getElementById("pCustName").innerHTML    = `<strong>${req.sellerName||"—"}</strong><br><span style="font-size:12px;color:#64748b">Payment: ${payMode} | Due: ${fmtDate(dueDate)}</span>`;
    document.getElementById("pShopAddress").innerHTML = user?.businessName || user?.fullName || "Your Business";
    document.getElementById("pItems").innerHTML       = `<tr><td>1</td><td>${req.productName||"—"}</td><td>${req.hsnCode||"—"}</td><td>${qty}</td><td>${fmtINR(sellPrice)}</td><td>${fmtINR(cgst)}</td><td>${fmtINR(sgst)}</td><td>${fmtINR(totalAmount)}</td></tr>`;
    document.getElementById("pTotals").innerHTML      = `
        <div class="p-tot-row"><span>Subtotal</span><span>${fmtINR(subTotal)}</span></div>
        <div class="p-tot-row"><span>CGST (${gstRate/2}%)</span><span>${fmtINR(cgst)}</span></div>
        <div class="p-tot-row"><span>SGST (${gstRate/2}%)</span><span>${fmtINR(sgst)}</span></div>
        <div class="p-tot-row grand"><span>Grand Total</span><span>${fmtINR(totalAmount)}</span></div>`;
    setTimeout(() => document.getElementById("printOv").classList.add("show"), 600);
}

function updateProfitSummary() {
    const totalInv   = _profitData.reduce((s,p) => s+p.totalAmount, 0);
    const totalProfit = _profitData.reduce((s,p) => s+p.profit, 0);
    const margin     = totalInv > 0 ? ((totalProfit/totalInv)*100).toFixed(1) : "0.0";
    document.getElementById("profitInvoiced").textContent = fmtINR(totalInv);
    document.getElementById("profitGross").textContent    = fmtINR(totalProfit);
    document.getElementById("profitGross").style.color    = totalProfit >= 0 ? "var(--green)" : "var(--red)";
    document.getElementById("profitMargin").textContent   = margin + "%";
    document.getElementById("profitMargin").style.color   = parseFloat(margin) >= 0 ? "var(--green)" : "var(--red)";
}

/* ═══════════════════════════════════════════════
   AUTH
═══════════════════════════════════════════════ */
function logout() {
    sessionStorage.removeItem("shopkeeper_token");
    sessionStorage.removeItem("shopkeeper_user");
    window.location.href = "/pages/index.html";
}

/* ═══════════════════════════════════════════════
   OUTSIDE CLICK HANDLERS
═══════════════════════════════════════════════ */
document.addEventListener("click", e => {
    if (!e.target.closest(".pos-search-wrap"))
        document.getElementById("posDrop")?.classList.remove("show");
    if (!e.target.closest(".modal-box") && !e.target.closest(".act-btn") && !e.target.closest(".icon-btn"))
        document.getElementById("custModal")?.classList.remove("show");
});

/* ═══════════════════════════════════════════════
   POS CATALOG LOADER
═══════════════════════════════════════════════ */
async function loadPosCatalog() {
    if (window._cachedProducts) { loadPosCatalogFromCache(); return; }
    const sellers = await apiGet(`/api/Seller/all`);
    if (!sellers?.length) return;
    let allProds = [];
    const res = await Promise.all(sellers.map(s =>
        apiGet(`/api/Seller/products?sellerId=${s.sellerID || s.userId || s.id}`)
    ));
    res.forEach(p => { if (p) allProds = [...allProds, ...p]; });
    window._cachedProducts = [...new Map(allProds.map(p => [(p.productID||p.id), p])).values()];
    loadPosCatalogFromCache();
}

/* ═══════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════ */
loadDashboard();
loadPosCatalog();
initSignalR();