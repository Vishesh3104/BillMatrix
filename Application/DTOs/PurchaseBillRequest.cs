namespace BILLMATRIX1.Application.DTOs
{
    public class PurchaseBillRequest
    {
        public int SellerID { get; set; }
        public int CompanyProductID { get; set; }
        public int Quantity { get; set; }
        public decimal PurchasePrice { get; set; }
        public decimal GstPercent { get; set; }
        public decimal CGST { get; set; }
        public decimal SGST { get; set; }
        public decimal IGST { get; set; }
        public decimal TotalAmount { get; set; }
        public string PaymentMode { get; set; } = "";
        public DateTime BillDate { get; set; }
    }
}
