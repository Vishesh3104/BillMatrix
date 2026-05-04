namespace BILLMATRIX1.Domain.Entities
{
    public class Product
    {
        public int ProductID { get; set; }
        public string ProductName { get; set; } = "";
        public string? ProductCode { get; set; }
        public string? HsnCode { get; set; }
        public string? CompanyName { get; set; }
        public int CompanyID { get; set; }
        public string? Category { get; set; }
        public string? Unit { get; set; }
        public decimal MRP { get; set; }
        public decimal GstPercent { get; set; }
        public int Quantity { get; set; }
        public decimal PurchasePrice { get; set; }
    }
}