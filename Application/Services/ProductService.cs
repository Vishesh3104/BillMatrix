using BILLMATRIX1.Application.Interfaces;
using BILLMATRIX1.Application.DTOs;
using BILLMATRIX1.Domain.Entities;
using BILLMATRIX1.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace BILLMATRIX1.Application.Services
{
    public class ProductService : IProductService
    {
        private readonly IProductRepository _repo;
        private readonly IHubContext<NotificationHub> _hub;

        public ProductService(IProductRepository repo, IHubContext<NotificationHub> hub)
        {
            _repo = repo;
            _hub = hub;
        }

        // ✅ Repository returns Entity → Service maps to DTOpublic List<SimpleProductDto> GetProducts()
// ✅ Repository returns Entity → Service maps to DTO
public List<SimpleProductDto> GetProducts()   // ← this line is missing!
{
    var products = _repo.GetProducts();
    return products.Select(p => new SimpleProductDto
    {
        Id = p.ProductID,
        Name = p.ProductName,
        Price = p.MRP
    }).ToList();
}

        // ✅ Service receives DTO → maps to Entity → passes to Repository
        public void AddProduct(AddProductRequest request)
        {
            var product = new Product
            {
                ProductName = request.ProductName,
                MRP = request.MRP
            };
            _repo.AddProduct(product);
        }

        // ✅ QuickBillRequest is already a DTO — no change needed
        public async Task<List<int>> SaveQuickBill(QuickBillRequest bill)
        {
            var invoiceIds = _repo.SaveQuickBill(bill);

            decimal total = bill.Items.Sum(i =>
                (i.SellingPrice * i.Quantity) * (1 + i.GSTPercent / 100m));

            await _hub.Clients
                .Group($"shopkeeper_{bill.ShopkeeperID}")
                .SendAsync("NewInvoice", new
                {
                    invoiceId = invoiceIds.FirstOrDefault(),
                    totalAmount = Math.Round(total, 2),
                    message = $"Invoice saved. Total: ₹{Math.Round(total, 2)}"
                });

            foreach (var item in bill.Items)
            {
                await _hub.Clients
                    .Group($"shopkeeper_{bill.ShopkeeperID}")
                    .SendAsync("InventoryUpdated", new
                    {
                        productName = item.ProductName,
                        quantitySold = item.Quantity
                    });
            }

            return invoiceIds;
        }
    }
}