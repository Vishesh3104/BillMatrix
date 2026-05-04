namespace BILLMATRIX1.Application.DTOs
{
    public class InvoiceDto
    {
        public int InvoiceID { get; set; }
        public string? InvoiceDate { get; set; }
        public string ProductName { get; set; }="";
        public string SellerName { get; set; }="";
        public int Quantity { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal CGST { get; set; }
        public decimal SGST { get; set; }
        public string? Status { get; set; }
    }
}