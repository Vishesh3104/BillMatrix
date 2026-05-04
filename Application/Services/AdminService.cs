using BILLMATRIX1.Application.DTOs;
using BILLMATRIX1.Application.Interfaces;
using BILLMATRIX1.Domain.Entities;

namespace BILLMATRIX1.Application.Services
{
    public class AdminService : IAdminService
    {
        private readonly IAdminRepository _repo;

        public AdminService(IAdminRepository repo)
        {
            _repo = repo;
        }

        public List<AdminUserDto> GetAllUsers()
            => _repo.GetAllUsers().Select(u => new AdminUserDto
            {
                UserId   = u.UserId,
                FullName = u.FullName,
                Email    = u.Email,
                Phone    = u.Phone,
                Role     = u.Role
            }).ToList();

        public void DeleteProduct(int productId)
            => _repo.DeleteProduct(productId);

        public List<AdminProductDto> GetAllProducts()
            => _repo.GetAllProducts().Select(p => new AdminProductDto
            {
                ProductId   = p.ProductID,
                ProductName = p.ProductName,
                MRP         = p.MRP
            }).ToList();

        public void AddProduct(AddProductRequest request)
            => _repo.AddProduct(new Product
            {
                ProductName = request.ProductName,
                ProductCode = request.ProductCode,
                HsnCode     = request.HsnCode,
                CompanyName = request.CompanyName,
                Category    = request.Category,
                Unit        = request.Unit,
                MRP         = request.MRP,
                GstPercent  = request.GstPercent
            });

        public List<ProductStockDto> GetProductStock(int productId)
            => _repo.GetProductStock(productId).Select(s => new ProductStockDto
            {
                SellerName = s.SellerName,
                Quantity   = s.Quantity
            }).ToList();

        public void UpdateProduct(int productId, string name, decimal mrp, string hsn)
            => _repo.UpdateProduct(productId, name, mrp, hsn);

        public List<BusinessDto> GetAllBusinesses()
            => _repo.GetAllBusinesses().Select(b => new BusinessDto
            {
                BusinessName = b.BusinessName,
                OwnerName    = b.OwnerName,
                Role         = b.Role,
                GstNumber    = b.GstNumber,
                State        = b.State
            }).ToList();

        public AdminDashboardDto GetDashboardStats()
        {
            var s = _repo.GetDashboardStats();
            return new AdminDashboardDto
            {
                TotalUsers       = s.TotalUsers,
                TotalSellers     = s.TotalSellers,
                TotalShopkeepers = s.TotalShopkeepers,
                TotalProducts    = s.TotalProducts,
                TotalCompanies   = s.TotalCompanies,
                TotalInvoices    = s.TotalInvoices,
                TotalRevenue     = s.TotalRevenue
            };
        }

        public void AddUser(AddUserRequest request)
            => _repo.AddUser(new User
            {
                FullName     = request.FullName,
                Email        = request.Email,
                Phone        = request.Phone,
                Password     = request.Password,
                Role         = request.Role,
                BusinessName = request.BusinessName,
                GstNumber    = request.GstNumber,
                Address      = request.Address,
                City         = request.City,
                State        = request.State,
                Pincode      = request.Pincode
            });

        public void DeleteUser(int userId)
            => _repo.DeleteUser(userId);

        public List<AdminCompanyDto> GetAllCompanies()
            => _repo.GetAllCompanies().Select(c => new AdminCompanyDto
            {
                CompanyId   = c.CompanyID,
                CompanyName = c.CompanyName,
                GstNumber   = c.GSTNumber ?? "",
                Address     = c.Address ?? "",
                IsActive    = c.IsActive
            }).ToList();

        public void AddCompany(AddCompanyRequest request)
            => _repo.AddCompany(new Company
            {
                CompanyName = request.CompanyName,
                GSTNumber   = request.GstNumber,
                Address     = request.Address
            });

        public void DeleteCompany(int companyId)
            => _repo.DeleteCompany(companyId);

        public List<RecentRegistrationDto> GetRecentRegistrations()
            => _repo.GetRecentRegistrations().Select(r => new RecentRegistrationDto
            {
                BusinessName = r.BusinessName,
                FullName     = r.FullName,
                Role         = r.Role,
                JoinDate     = r.JoinDate
            }).ToList();

        public List<RecentActivityDto> GetRecentActivity()
            => _repo.GetRecentActivity().Select(r => new RecentActivityDto
            {
                Message   = r.Message,
                LogType   = r.LogType,
                CreatedAt = r.CreatedAt
     
            }).ToList();

           public List<GstReportItem> GetGstReport()
    => _repo.GetGstReport();

public List<SalesReportItem> GetSalesReport()
    => _repo.GetSalesReport();

public InvoiceReport GetInvoiceReport()
    => _repo.GetInvoiceReport();
    }
}