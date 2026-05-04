using BILLMATRIX1.Domain.Entities;
using BILLMATRIX1.Application.Interfaces;
using BILLMATRIX1.Application.DTOs;

namespace BILLMATRIX1.Application.DTOs
{
    public class QuickBillRequest
    {
        public int ShopkeeperID { get; set; }
        public string? PaymentMode { get; set; }
        public List<QuickBillItem> Items { get; set; } = new();
    }

    public class QuickBillItem
    {
        public int ProductID { get; set; }
        public string? ProductName { get; set; }
        public int SellerID { get; set; }
        public int Quantity { get; set; }
        public decimal MRP { get; set; }
        public decimal SellingPrice { get; set; }
        public decimal PurchasePrice { get; set; }
        public decimal GSTPercent { get; set; }
    }
}