using BILLMATRIX1.Application.DTOs;
using BILLMATRIX1.Application.Interfaces;

using BILLMATRIX1.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace BILLMATRIX1.Application.Services
{
    public class SellerService : ISellerService
    {
        private readonly ISellerRepository _repo;
        private readonly IHubContext<NotificationHub> _hub;

        public SellerService(ISellerRepository repo, IHubContext<NotificationHub> hub)
        {
            _repo = repo;
            _hub  = hub;
        }

       public SellerDashboardDto GetDashboardStats(int sellerId)
{
    var s = _repo.GetDashboardStats(sellerId);
    return new SellerDashboardDto
    {
        SalesThisMonth    = s.SalesThisMonth,
        ProfitThisMonth   = s.ProfitThisMonth,
        PurchaseThisMonth = s.PurchaseThisMonth,
        GSTThisMonth      = s.GSTThisMonth,
        LowStockItems     = s.LowStockItems,
        PendingPayments   = s.PendingPayments
    };
}

        public List<SimpleProductDto> GetSellerProducts(int sellerId)
            => _repo.GetSellerProducts(sellerId)
                    .Select(p => new SimpleProductDto
{
    Id = p.ProductID,          // ✅
    Name = p.ProductName,      // ✅
    Price = p.MRP              // ✅ add this
}).ToList();

        public List<InventoryDto> GetSellerInventory(int sellerId)
            => _repo.GetSellerInventory(sellerId)
                    .Select(p => new InventoryDto
                    {
                        ProductName  = p.ProductName,
                        Stock        = p.Quantity,
                        SellingPrice = p.MRP
                    }).ToList();

        public List<ShopkeeperDto> GetSellerShopkeepers(int sellerId)
            => _repo.GetSellerShopkeepers(sellerId)
                    .Select(u => new ShopkeeperDto
                    {
                        ShopkeeperID = u.UserId,
                        Name         = u.FullName,
                        Phone        = u.Phone
                    }).ToList();

        public void AddShopkeeper(AddShopkeeperRequest req)
            => _repo.AddShopkeeper(req.SellerID, req.Name ?? "", req.Address ?? "",
                                   req.Pincode ?? "", req.Phone ?? "", req.GstNumber ?? "");

       public void SavePurchaseBill(PurchaseBillRequest req)
    => _repo.SavePurchaseBill(req.SellerID, req.CompanyProductID, req.Quantity,
        req.PurchasePrice, req.GstPercent, req.CGST, req.SGST, req.IGST,
        req.TotalAmount, req.PaymentMode ?? "", req.BillDate);

public void SaveSalesInvoice(SalesInvoiceRequest req)
    => _repo.SaveSalesInvoice(req.SellerID, req.ShopkeeperID, req.ProductID,
        req.Quantity, req.MRP, req.SellingPrice, req.PurchasePrice,
        req.GstPercent, req.CGST, req.SGST, req.IGST, req.TotalAmount,
        req.Profit, req.PaymentMode ?? "", req.GstType ?? "", req.InvoiceDate);

       public List<PurchaseBillDto> GetPurchaseBills(int sellerId)
    => _repo.GetPurchaseBills(sellerId)
            .Select(b => new PurchaseBillDto
            {
                BillID        = b.BillID,
                ProductName   = b.ProductName,
                CompanyName   = b.CompanyName,    // ADD
                Quantity      = b.Quantity,
                PurchasePrice = b.PurchasePrice,  // ADD
                TotalAmount   = b.TotalAmount,
                CGST          = b.CGST,           // ADD
                SGST          = b.SGST,           // ADD
                IGST          = b.IGST,           // ADD
                BillDate      = b.BillDate
            }).ToList();

        public List<SalesInvoiceDto> GetSalesInvoices(int sellerId)
            => _repo.GetSalesInvoices(sellerId)
                    .Select(i => new SalesInvoiceDto
                    {
                        InvoiceID       = i.Id,
                        ShopkeeperName  = i.SellerName ?? "",
                        ProductName     = i.ProductName ?? "",
                        TotalAmount     = i.TotalAmount,
                        InvoiceDate     = i.Date
                    }).ToList();

        public SellerReportDto GetReports(int sellerId)
        {
            var s = _repo.GetSellerReports(sellerId);
            return new SellerReportDto
{
    TotalSales    = s.SalesThisMonth,      // ✅ correct property
    TotalPurchase = s.PurchaseThisMonth,   // ✅ correct property
    TotalProfit   = s.ProfitThisMonth      // ✅ use actual value, not 0
};
        }

        public List<SellerRequestDto> GetRequests(int sellerId)
            => _repo.GetRequests(sellerId)
                    .Select(r => new SellerRequestDto
                    {
                        RequestID   = r.RequestID,
                       // Shopkeeper  = r.ShopkeeperName ?? "",
                        Product     = r.ProductName ?? "",
                        Quantity    = r.Quantity,
                        Status      = r.SellerState ?? "",
                        RequestDate = r.RequestDate,
                        EstAmount   = r.EstAmount
                    }).ToList();

        public List<PaymentDto> GetPayments(int sellerId)
            => _repo.GetPayments(sellerId)
                    .Select(p => new PaymentDto
                    {
                        PaymentID = p.Id,
                        Amount    = p.Amount,
                        Mode      = p.Mode ?? "",
                        Date      = p.Date
                    }).ToList();

        public List<SimpleSellerDto> GetAllSellers()
            => _repo.GetAllSellers()
                    .Select(u => new SimpleSellerDto
                    {
                        SellerID = u.UserId,
                        Name     = u.FullName
                    }).ToList();

        public List<SimpleProductDto> GetProductsBySeller(int sellerId)
            => _repo.GetProductsBySeller(sellerId)
                    .Select(p => new SimpleProductDto
                    {
                        Id    = p.ProductID,
Name  = p.ProductName,
Price = p.MRP
                    }).ToList();

        public List<ShopkeeperDto> GetAllShopkeepers()
            => _repo.GetAllShopkeepers()
                    .Select(u => new ShopkeeperDto
                    {
                        ShopkeeperID = u.UserId,
                        Name         = u.FullName,
                        Phone        = u.Phone
                    }).ToList();

        public List<ShopkeeperDto> GetMyShopkeepers(int sellerId)
            => _repo.GetMyShopkeepers(sellerId)
                    .Select(u => new ShopkeeperDto
                    {
                        ShopkeeperID = u.UserId,
                        Name         = u.FullName,
                        Phone        = u.Phone
                    }).ToList();

       public async Task<bool> RespondRequest(int requestId, int sellerId, string action)
{
    if (action == "accept")
    {
        var req = _repo.GetRequestById(requestId);
        if (req == null) return false;

        int stock = _repo.GetSellerStock(sellerId, req.ProductID);
        if (stock < req.Quantity) return false;

        _repo.RespondRequest(requestId, sellerId, action);

        // ✅ Get product MRP since EstAmount not in table
        // Use 0 for now — invoice will be created by shopkeeper separately
        _repo.SaveSalesInvoice(
            sellerId,
            req.ShopkeeperID,
            req.ProductID,
            req.Quantity,
            0,           // mrp — unknown without product lookup
            0,           // sellingPrice
            0,           // purchasePrice
            0,           // gstPercent
            0,           // cgst
            0,           // sgst
            0,           // igst
            0,           // totalAmount
            0,           // profit
            "Credit",
            "CGST+SGST",
            DateTime.Now
        );
    }
    else
    {
        _repo.RespondRequest(requestId, sellerId, action);
    }

    int shopkeeperId = _repo.GetShopkeeperIdByRequest(requestId);
    await _hub.Clients.Group($"user_{shopkeeperId}")
        .SendAsync("RequestStatusChanged", new
        {
            requestID = requestId,
            message   = action == "accept" ? "Accepted" : "Rejected"
        });

    return true;
}

        public List<CompanyDto> GetCompanies()
    => _repo.GetCompanies()
            .Select(c => new CompanyDto
            {
                CompanyID   = c.CompanyID,
                CompanyName = c.CompanyName
            }).ToList();

public List<CompanyProductDto> GetProductsByCompany(int companyId)
    => _repo.GetProductsByCompany(companyId)
            .Select(p => new CompanyProductDto
            {
                CompanyProductID = p.CompanyProductID,
                ProductID        = p.ProductID,
                ProductName      = p.ProductName,
                ProductCode      = p.ProductCode,
                MRP              = p.MRP,
                GstPercent       = p.GstPercent,
                PurchasePrice    = p.PurchasePrice
            }).ToList();
    }
}