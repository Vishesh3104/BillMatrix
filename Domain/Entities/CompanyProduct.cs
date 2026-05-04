public class CompanyProduct
{
    public int     CompanyProductID { get; set; }
    public int     CompanyID        { get; set; }
    public int     ProductID        { get; set; }
    public string  ProductName      { get; set; } = "";
    public string  ProductCode      { get; set; } = "";
    public decimal MRP              { get; set; }
    public decimal GstPercent       { get; set; }
    public decimal PurchasePrice    { get; set; }
}