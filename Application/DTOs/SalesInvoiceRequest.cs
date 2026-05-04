namespace BILLMATRIX1.Application.DTOs
{
    public class SalesInvoiceRequest
    {
        public int SellerID { get; set; }
        public int ShopkeeperID { get; set; }
        public int ProductID { get; set; }
        public int Quantity { get; set; }
        public decimal MRP { get; set; }
        public decimal SellingPrice { get; set; }
        public decimal PurchasePrice { get; set; }
        public decimal GstPercent { get; set; }
        public decimal CGST { get; set; }
        public decimal SGST { get; set; }
        public decimal IGST { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal Profit { get; set; }
        public string PaymentMode { get; set; } = "";
        public string GstType { get; set; } = "CGST+SGST";
        public DateTime InvoiceDate { get; set; }
    }
}
