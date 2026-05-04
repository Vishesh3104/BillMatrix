// Domain/Entities/PurchaseBill.cs
namespace BILLMATRIX1.Domain.Entities
{
    public class PurchaseBill
    {
        public int BillID           { get; set; }
        public string ProductName   { get; set; } = "";
        public int Quantity         { get; set; }
        public decimal TotalAmount  { get; set; }
        public DateTime BillDate    { get; set; }
        public string CompanyName   { get; set; } = "";
        public decimal PurchasePrice { get; set; }
        public decimal CGST          { get; set; }
        public decimal SGST          { get; set; }
        public decimal IGST          { get; set; }
    }
}