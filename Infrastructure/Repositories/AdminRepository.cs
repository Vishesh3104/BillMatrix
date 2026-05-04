using System.Data;
using Microsoft.Data.SqlClient;
using BILLMATRIX1.Application.Interfaces;
using BILLMATRIX1.Domain.Entities;

namespace BILLMATRIX1.Infrastructure.Repositories
{
    public class AdminRepository : IAdminRepository
    {
        private readonly string? _connectionString;

        public AdminRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection");
        }

        public List<User> GetAllUsers()
        {
            var list = new List<User>();
            using SqlConnection con = new(_connectionString!);
            SqlCommand cmd = new("sp_GetAllUsers", con);
            cmd.CommandType = CommandType.StoredProcedure;
            con.Open();
            var r = cmd.ExecuteReader();
            while (r.Read())
                list.Add(new User
                {
                    UserId   = Convert.ToInt32(r["UserID"]),
                    FullName = r["FullName"]?.ToString() ?? "",
                    Email    = r["Email"]?.ToString() ?? "",
                    Phone    = r["Phone"]?.ToString() ?? "",
                    Role     = r["Role"]?.ToString() ?? ""
                });
            return list;
        }

        public void DeleteProduct(int productId)
        {
            using SqlConnection con = new(_connectionString!);
            SqlCommand cmd = new("sp_DeleteProduct", con);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@ProductID", productId);
            con.Open();
            cmd.ExecuteNonQuery();
        }

        public List<Product> GetAllProducts()
        {
            var list = new List<Product>();
            using SqlConnection con = new(_connectionString!);
            SqlCommand cmd = new("sp_GetAllProducts", con);
            cmd.CommandType = CommandType.StoredProcedure;
            con.Open();
            var r = cmd.ExecuteReader();
            while (r.Read())
                list.Add(new Product
                {
                    ProductID   = Convert.ToInt32(r["ProductID"]),
                    ProductName = r["ProductName"]?.ToString() ?? "",
                    MRP         = Convert.ToDecimal(r["MRP"])
                });
            return list;
        }

        public void AddProduct(Product product)
        {
            using SqlConnection con = new(_connectionString!);
            SqlCommand cmd = new("sp_AddProduct", con);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@ProductName", product.ProductName);
            cmd.Parameters.AddWithValue("@ProductCode", product.ProductCode ?? "");
            cmd.Parameters.AddWithValue("@HSNCode",     product.HsnCode ?? "");
            cmd.Parameters.AddWithValue("@CompanyName", product.CompanyName ?? "");
            cmd.Parameters.AddWithValue("@Category",    product.Category ?? "");
            cmd.Parameters.AddWithValue("@Unit",        product.Unit ?? "");
            cmd.Parameters.AddWithValue("@MRP",         product.MRP);
            cmd.Parameters.AddWithValue("@GSTPercent",  product.GstPercent);
            con.Open();
            cmd.ExecuteNonQuery();
        }

        public List<ProductStock> GetProductStock(int productId)
        {
            var list = new List<ProductStock>();
            using SqlConnection con = new(_connectionString!);
            SqlCommand cmd = new("sp_GetProductStock", con);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@ProductID", productId);
            con.Open();
            var r = cmd.ExecuteReader();
            while (r.Read())
                list.Add(new ProductStock
                {
                    SellerName = r["SellerName"]?.ToString() ?? "",
                    Quantity   = Convert.ToInt32(r["Quantity"])
                });
            return list;
        }

        public void UpdateProduct(int productId, string name, decimal mrp, string hsn)
        {
            using SqlConnection con = new(_connectionString!);
            SqlCommand cmd = new("sp_UpdateProduct", con);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@ProductID",   productId);
            cmd.Parameters.AddWithValue("@ProductName", name);
            cmd.Parameters.AddWithValue("@MRP",         mrp);
            cmd.Parameters.AddWithValue("@HSNCode",     hsn ?? "");
            con.Open();
            cmd.ExecuteNonQuery();
        }

        public List<Business> GetAllBusinesses()
        {
            var list = new List<Business>();
            using SqlConnection con = new(_connectionString!);
            SqlCommand cmd = new("sp_GetAllBusinesses", con);
            cmd.CommandType = CommandType.StoredProcedure;
            con.Open();
            var r = cmd.ExecuteReader();
            while (r.Read())
                list.Add(new Business
                {
                    BusinessName = r["BusinessName"]?.ToString() ?? "",
                    OwnerName    = r["OwnerName"]?.ToString() ?? "",
                    Role         = r["Role"]?.ToString() ?? "",
                    GstNumber    = r["GSTNumber"]?.ToString() ?? "Pending",
                    State        = r["State"]?.ToString() ?? ""
                });
            return list;
        }

        public AdminStats GetDashboardStats()
        {
            using SqlConnection con = new(_connectionString!);
            SqlCommand cmd = new("sp_GetDashboardStats", con);
            cmd.CommandType = CommandType.StoredProcedure;
            con.Open();
            var r = cmd.ExecuteReader();
            if (r.Read())
                return new AdminStats
                {
                    TotalUsers       = Convert.ToInt32(r["TotalUsers"]),
                    TotalSellers     = Convert.ToInt32(r["TotalSellers"]),
                    TotalShopkeepers = Convert.ToInt32(r["TotalShopkeepers"]),
                    TotalProducts    = Convert.ToInt32(r["TotalProducts"]),
                    TotalCompanies   = Convert.ToInt32(r["TotalCompanies"]),
                    TotalInvoices    = Convert.ToInt32(r["TotalInvoices"]),
                    TotalRevenue     = Convert.ToDecimal(r["TotalRevenue"])
                };
            return new AdminStats();
        }

        public void AddUser(User user)
        {
            using SqlConnection con = new(_connectionString!);
            SqlCommand cmd = new("usp_AddUser", con);
            cmd.CommandType = System.Data.CommandType.StoredProcedure; 
            cmd.Parameters.AddWithValue("@FullName", user.FullName);
cmd.Parameters.AddWithValue("@Phone", user.Phone);
cmd.Parameters.AddWithValue("@Email", user.Email);
cmd.Parameters.AddWithValue("@Password", user.Password);
cmd.Parameters.AddWithValue("@BusinessName", user.BusinessName);
cmd.Parameters.AddWithValue("@GstNumber", user.GstNumber);
cmd.Parameters.AddWithValue("@Address", user.Address);
cmd.Parameters.AddWithValue("@City", user.City);
cmd.Parameters.AddWithValue("@State", user.State);
cmd.Parameters.AddWithValue("@Pincode", user.Pincode);
cmd.Parameters.AddWithValue("@Role", user.Role);
// ❌ Make sure no extra params are added beyond what SP accepts
            con.Open();
            cmd.ExecuteNonQuery();
        }

        public void DeleteUser(int userId)
        {
            using SqlConnection con = new(_connectionString!);
            SqlCommand cmd = new("sp_DeleteUser", con);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@UserID", userId);
            con.Open();
            cmd.ExecuteNonQuery();
        }

        public List<Company> GetAllCompanies()
        {
            var list = new List<Company>();
            using SqlConnection con = new(_connectionString!);
            SqlCommand cmd = new("sp_GetAllCompanies", con);
            cmd.CommandType = CommandType.StoredProcedure;
            con.Open();
            var r = cmd.ExecuteReader();
            while (r.Read())
                list.Add(new Company
                {
                    CompanyID   = Convert.ToInt32(r["CompanyID"]),
                    CompanyName = r["CompanyName"]?.ToString() ?? "",
                    GSTNumber   = r["GSTNumber"]?.ToString(),
                    Address     = r["Address"]?.ToString(),
                    IsActive    = Convert.ToBoolean(r["IsActive"])
                });
            return list;
        }

        public void AddCompany(Company company)
        {
            using SqlConnection con = new(_connectionString!);
            SqlCommand cmd = new("sp_AddCompany", con);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@CompanyName", company.CompanyName);
            cmd.Parameters.AddWithValue("@GSTNumber",   company.GSTNumber ?? "");
            cmd.Parameters.AddWithValue("@Address",     company.Address ?? "");
            con.Open();
            cmd.ExecuteNonQuery();
        }

        public void DeleteCompany(int companyId)
        {
            using SqlConnection con = new(_connectionString!);
            SqlCommand cmd = new("sp_DeleteCompany", con);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@CompanyID", companyId);
            con.Open();
            cmd.ExecuteNonQuery();
        }

        public List<RecentRegistration> GetRecentRegistrations()
        {
            var list = new List<RecentRegistration>();
            using SqlConnection con = new(_connectionString!);
            SqlCommand cmd = new("sp_GetRecentRegistrations", con);
            cmd.CommandType = CommandType.StoredProcedure;
            con.Open();
            var r = cmd.ExecuteReader();
            while (r.Read())
                list.Add(new RecentRegistration
                {
                    BusinessName = r["BusinessName"]?.ToString() ?? "",
                    FullName     = r["FullName"]?.ToString() ?? "",
                    Role         = r["Role"]?.ToString() ?? "",
                    JoinDate     = r["CreatedAt"]?.ToString() ?? ""
                });
            return list;
        }

        public List<RecentActivity> GetRecentActivity()
        {
            var list = new List<RecentActivity>();
            using SqlConnection con = new(_connectionString!);
            SqlCommand cmd = new("sp_GetRecentActivity", con);
            cmd.CommandType = CommandType.StoredProcedure;
            con.Open();
            var r = cmd.ExecuteReader();
            while (r.Read())
                list.Add(new RecentActivity
                {
                    Message   = r["Message"]?.ToString() ?? "",
                    LogType   = r["LogType"]?.ToString() ?? "",
                    CreatedAt = r["CreatedAt"]?.ToString() ?? ""
                });
            return list;
        }


        public List<GstReportItem> GetGstReport()
{
    var list = new List<GstReportItem>();
    using SqlConnection con = new(_connectionString!);
    SqlCommand cmd = new("sp_GetGstReport", con);
    cmd.CommandType = CommandType.StoredProcedure;
    con.Open();
    var r = cmd.ExecuteReader();
    while (r.Read())
        list.Add(new GstReportItem
        {
            Month  = r["Month"]?.ToString() ?? "",
            Amount = Convert.ToDecimal(r["Amount"])
        });
    return list;
}

public List<SalesReportItem> GetSalesReport()
{
    var list = new List<SalesReportItem>();
    using SqlConnection con = new(_connectionString!);
    SqlCommand cmd = new("sp_GetSalesReport", con);
    cmd.CommandType = CommandType.StoredProcedure;
    con.Open();
    var r = cmd.ExecuteReader();
    while (r.Read())
        list.Add(new SalesReportItem
        {
            Month  = r["Month"]?.ToString() ?? "",
            Amount = Convert.ToDecimal(r["Amount"])
        });
    return list;
}

public InvoiceReport GetInvoiceReport()
{
    using SqlConnection con = new(_connectionString!);
    SqlCommand cmd = new("sp_GetInvoiceReport", con);
    cmd.CommandType = CommandType.StoredProcedure;
    con.Open();
    var r = cmd.ExecuteReader();
    if (r.Read())
        return new InvoiceReport
        {
            Total   = Convert.ToInt32(r["Total"]),
            Paid    = Convert.ToInt32(r["Paid"]),
            Pending = Convert.ToInt32(r["Pending"])
        };
    return new InvoiceReport();
}
    }
}