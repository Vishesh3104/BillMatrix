// AdminProductDto.cs
namespace BILLMATRIX1.Application.DTOs
{
    public class AdminProductDto
    {
        public int ProductId    { get; set; }
        public string ProductName { get; set; } = "";
        public decimal MRP      { get; set; }
    }
}