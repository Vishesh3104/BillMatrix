using BILLMATRIX1.Domain.Entities;

namespace BILLMATRIX1.Application.Interfaces
{
    public interface IAdminRepository
    {
        List<User> GetAllUsers();
        void DeleteProduct(int productId);
        List<Product> GetAllProducts();
        void AddProduct(Product product);
        List<ProductStock> GetProductStock(int productId);
        void UpdateProduct(int productId, string name, decimal mrp, string hsn);
        List<Business> GetAllBusinesses();
        AdminStats GetDashboardStats();
        void AddUser(User user);
        void DeleteUser(int userId);
        List<Company> GetAllCompanies();
        void AddCompany(Company company);
        void DeleteCompany(int companyId);
        List<RecentRegistration> GetRecentRegistrations();
        List<RecentActivity> GetRecentActivity();

        List<GstReportItem> GetGstReport();
List<SalesReportItem> GetSalesReport();
InvoiceReport GetInvoiceReport();
    }
}