namespace BILLMATRIX1.Application.DTOs
{
    public class CompanyDto
    {
        public int    CompanyID   { get; set; }
        public string CompanyName { get; set; } = "";
        public string State       { get; set; } = "";
    }

    public class CompanyProductDto
    {
        public int     CompanyProductID { get; set; }
        public int     ProductID        { get; set; }
        public string  ProductName      { get; set; } = "";
        public string  ProductCode      { get; set; } = "";
        public decimal MRP              { get; set; }
        public decimal GstPercent       { get; set; }
        public decimal PurchasePrice    { get; set; }
    }
}