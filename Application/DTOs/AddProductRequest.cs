// AddProductRequest.cs
namespace BILLMATRIX1.Application.DTOs
{
    public class AddProductRequest
    {
        public string ProductName { get; set; } = "";
        public string? ProductCode { get; set; }
        public string? HsnCode    { get; set; }
        public string? CompanyName { get; set; }
        public string? Category   { get; set; }
        public string? Unit       { get; set; }
        public decimal MRP        { get; set; }
        public decimal GstPercent { get; set; }
    }
}