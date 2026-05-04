namespace BILLMATRIX1.Application.DTOs
{
    public class UpdateProductRequest
    {
        public int ProductID { get; set; }
        public string? ProductName { get; set; }
        public decimal MRP { get; set; }
        public string HsnCode { get; set; } = "";
    }
}
