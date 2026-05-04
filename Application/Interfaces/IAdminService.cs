using BILLMATRIX1.Application.DTOs;
using BILLMATRIX1.Domain.Entities;  // ← add this line


namespace BILLMATRIX1.Application.Interfaces
{
    public interface IAdminService
    {
        List<AdminUserDto> GetAllUsers();
        void DeleteProduct(int productId);
        List<AdminProductDto> GetAllProducts();
        void AddProduct(AddProductRequest request);
        List<ProductStockDto> GetProductStock(int productId);
        void UpdateProduct(int productId, string name, decimal mrp, string hsn);
        List<BusinessDto> GetAllBusinesses();
        AdminDashboardDto GetDashboardStats();
        void AddUser(AddUserRequest request);
        void DeleteUser(int userId);
        List<AdminCompanyDto> GetAllCompanies();
        void AddCompany(AddCompanyRequest request);
        void DeleteCompany(int companyId);
        List<RecentRegistrationDto> GetRecentRegistrations();
        List<RecentActivityDto> GetRecentActivity();
        List<GstReportItem> GetGstReport();
        List<SalesReportItem> GetSalesReport();
        InvoiceReport GetInvoiceReport();
    }
}