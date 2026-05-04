// AdminDashboardDto.cs
namespace BILLMATRIX1.Application.DTOs
{
    public class AdminDashboardDto
    {
        public int TotalUsers       { get; set; }
        public int TotalSellers     { get; set; }
        public int TotalShopkeepers { get; set; }
        public int TotalProducts    { get; set; }
        public int TotalCompanies   { get; set; }
        public int TotalInvoices    { get; set; }
        public decimal TotalRevenue { get; set; }
    }
}