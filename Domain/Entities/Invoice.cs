namespace BILLMATRIX1.Domain.Entities
{
    public class Invoice
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public DateTime Date { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal CGST { get; set; }
        public decimal SGST { get; set; }
        public string? Status { get; set; }
        public string? ProductName { get; set; }
public string? SellerName  { get; set; }
    }
}