public class PurchaseBillDto
{
    public int      BillID        { get; set; }
    public string   ProductName   { get; set; } = "";
    public string   CompanyName   { get; set; } = "";  // ADD
    public int      Quantity      { get; set; }
    public decimal  PurchasePrice { get; set; }         // ADD
    public decimal  TotalAmount   { get; set; }
    public decimal  CGST          { get; set; }         // ADD
    public decimal  SGST          { get; set; }         // ADD
    public decimal  IGST          { get; set; }         // ADD
    public DateTime BillDate      { get; set; }
}