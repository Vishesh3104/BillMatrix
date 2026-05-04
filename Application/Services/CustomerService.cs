using BILLMATRIX1.Application.DTOs;
using BILLMATRIX1.Application.Interfaces;
using BILLMATRIX1.Domain.Entities;

namespace BILLMATRIX1.Application.Services
{
    public class CustomerService : ICustomerService
    {
        private readonly ICustomerRepository _repo;

        public CustomerService(ICustomerRepository repo)
        {
            _repo = repo;
        }

        // ✅ Entity → ShopkeeperDto
        public List<ShopkeeperDto> GetCustomers()
        {
            return _repo.GetCustomers().Select(c => new ShopkeeperDto
            {
                ShopkeeperID = c.CustomerID,
                Name         = c.CustomerName,
                Phone        = c.Phone,
                Address      = c.Address
            }).ToList();
        }

        // ✅ AddShopkeeperRequest DTO → Customer Entity
        public void AddCustomer(AddShopkeeperRequest request)
        {
            var entity = new Customer
            {
                CustomerName = request.Name ?? "",      // ✅ correct field
                Phone        = request.Phone ?? "",
                Address      = request.Address ?? ""
            };
            _repo.AddCustomer(entity);
        }

        // ✅ ShopkeeperRequest DTO → RequestDetail Entity
        public void SendRequest(ShopkeeperRequest request)
        {
            var entity = new RequestDetail
            {
                ShopkeeperID = request.ShopkeeperID,
                SellerID     = request.SellerID,
                ProductID    = request.ProductID,
                Quantity     = request.Quantity
            };
            _repo.SendRequest(entity);
        }

        // ✅ Invoice Entity → InvoiceDto
        // NOTE: Invoice entity has no ProductName/SellerName
        // Those come from SP join — add them to entity or use DTO from repo for this case
        public List<InvoiceDto> GetMyInvoices(int shopkeeperID)
        {
            return _repo.GetMyInvoices(shopkeeperID).Select(i => new InvoiceDto
            {
                InvoiceID   = i.Id,
                InvoiceDate = i.Date.ToString("yyyy-MM-dd"),
                TotalAmount = i.TotalAmount,
                CGST        = i.CGST,
                SGST        = i.SGST,
                Status      = i.Status
                // ProductName & SellerName not in Invoice entity
                // → add them to Invoice entity OR keep this from SP
            }).ToList();
        }

        // ✅ RequestDetail Entity → RequestDto
public List<RequestDto> GetMyRequests(int shopkeeperID)
{
    return _repo.GetMyRequests(shopkeeperID).Select(r => new RequestDto
    {
        RequestID   = r.RequestID,
        Quantity    = r.Quantity,
        Status      = r.SellerState ?? "",      // ✅ was empty string
        ProductName = r.ProductName ?? "",       // ✅ now populated
        SellerName  = r.SellerName  ?? "",       // ✅ now populated
        RequestDate = r.RequestDate,
        EstAmount   = r.EstAmount
    }).ToList();
}

        // ✅ Product Entity → InventoryDto
        public List<InventoryDto> GetMyInventory(int shopkeeperID)
        {
            return _repo.GetMyInventory(shopkeeperID).Select(p => new InventoryDto
            {
                ProductName  = p.ProductName,
                HSNCode      = p.HsnCode ?? "",    // ✅ HsnCode not HSNCode
                Category     = p.Category ?? "",
                SellingPrice = p.MRP,
                GstRate      = p.GstPercent,       // ✅ GstPercent not GSTPercent
                Stock        = p.Quantity                   // Product has no Quantity field!
            }).ToList();
        }
    }
}