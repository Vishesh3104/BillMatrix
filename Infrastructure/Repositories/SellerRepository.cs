using System.Data;
using Microsoft.Data.SqlClient;
using BILLMATRIX1.Application.Interfaces;

using BILLMATRIX1.Domain.Entities;

namespace BILLMATRIX1.Infrastructure.Repositories
{
    public class SellerRepository : ISellerRepository
    {
        private readonly string _connectionString;

        public SellerRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection")!;
        }
public SellerDashboardStats GetDashboardStats(int sellerId)
{
    using SqlConnection con = new(_connectionString);
    SqlCommand cmd = new("sp_GetSellerDashboardStats", con);
    cmd.CommandType = CommandType.StoredProcedure;
    cmd.Parameters.AddWithValue("@SellerID", sellerId);
    con.Open();
    var r = cmd.ExecuteReader();
    if (r.Read())
        return new SellerDashboardStats
        {
            SalesThisMonth    = Convert.ToDecimal(r["SalesThisMonth"]),
            ProfitThisMonth   = Convert.ToDecimal(r["ProfitThisMonth"]),
            PurchaseThisMonth = Convert.ToDecimal(r["PurchaseThisMonth"]),
            GSTThisMonth      = Convert.ToDecimal(r["GSTThisMonth"]),
            LowStockItems     = Convert.ToInt32(r["LowStockItems"]),
            PendingPayments   = Convert.ToDecimal(r["PendingPayments"])
        };
    return new SellerDashboardStats();
}

        public List<Product> GetSellerProducts(int sellerId)
{
    var list = new List<Product>();
    using SqlConnection con = new(_connectionString);
    SqlCommand cmd = new("sp_GetSellerProducts", con);
    cmd.CommandType = CommandType.StoredProcedure;
    cmd.Parameters.AddWithValue("@SellerID", sellerId);
    con.Open();
    var r = cmd.ExecuteReader();
    while (r.Read())
        list.Add(new Product
        {
            ProductID           = Convert.ToInt32(r["ProductID"]),
            ProductName         = r["ProductName"]?.ToString() ?? "",
            ProductCode         = r["ProductCode"]?.ToString() ?? "",
            Category            = r["Category"]?.ToString() ?? "",
            Unit                = r["Unit"]?.ToString() ?? "",
            MRP                 = Convert.ToDecimal(r["MRP"]),
            GstPercent          = Convert.ToDecimal(r["GSTPercent"]),
            PurchasePrice       = Convert.ToDecimal(r["PurchasePrice"]),
            Quantity            = Convert.ToInt32(r["StockQty"])    // ✅ SP returns "StockQty"
        });
    return list;
}

        public List<Product> GetSellerInventory(int sellerId)
        {
            var list = new List<Product>();
            using SqlConnection con = new(_connectionString);
            SqlCommand cmd = new("sp_GetSellerInventory", con);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@SellerID", sellerId);
            con.Open();
            var r = cmd.ExecuteReader();
            while (r.Read())
                list.Add(new Product
                {
                    ProductName = r["ProductName"]?.ToString() ?? "",
                    Quantity    = Convert.ToInt32(r["Quantity"]),
                    MRP         = Convert.ToDecimal(r["MRP"])
                });
            return list;
        }

        public List<User> GetSellerShopkeepers(int sellerId)
{
    var list = new List<User>();
    using SqlConnection con = new(_connectionString);
    SqlCommand cmd = new("sp_GetSellerShopkeepers", con);
    cmd.CommandType = CommandType.StoredProcedure;
    cmd.Parameters.AddWithValue("@SellerID", sellerId);
    con.Open();
    var r = cmd.ExecuteReader();
    while (r.Read())
        list.Add(new User
        {
            UserId   = Convert.ToInt32(r["ShopkeeperID"]),
            FullName = r["Name"]?.ToString() ?? "",       // ✅ was "FullName", SP returns "Name"
            Phone    = r["Phone"]?.ToString() ?? ""
        });
    return list;
}

        public void AddShopkeeper(int sellerId, string name, string address,
                                  string pincode, string phone, string gst)
        {
            using SqlConnection con = new(_connectionString);
            SqlCommand cmd = new("sp_AddShopkeeper", con);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@SellerID",   sellerId);
            cmd.Parameters.AddWithValue("@Name",       name);
            cmd.Parameters.AddWithValue("@Address",    address);
            cmd.Parameters.AddWithValue("@Pincode",    pincode);
            cmd.Parameters.AddWithValue("@Phone",      phone);
            cmd.Parameters.AddWithValue("@GSTNumber",  gst ?? "");
            con.Open();
            cmd.ExecuteNonQuery();
        }

       public void SavePurchaseBill(int sellerId, int companyProductId, int quantity,
    decimal purchasePrice, decimal gstPercent, decimal cgst, decimal sgst,
    decimal igst, decimal totalAmount, string paymentMode, DateTime billDate)
{
    using SqlConnection con = new(_connectionString);
    SqlCommand cmd = new("sp_SavePurchaseBill", con);
    cmd.CommandType = CommandType.StoredProcedure;
    cmd.Parameters.AddWithValue("@SellerID",         sellerId);
    cmd.Parameters.AddWithValue("@CompanyProductID", companyProductId);
    cmd.Parameters.AddWithValue("@Quantity",         quantity);
    cmd.Parameters.AddWithValue("@PurchasePrice",    purchasePrice);
    cmd.Parameters.AddWithValue("@GSTPercent",       gstPercent);
    cmd.Parameters.AddWithValue("@CGST",             cgst);
    cmd.Parameters.AddWithValue("@SGST",             sgst);
    cmd.Parameters.AddWithValue("@IGST",             igst);
    cmd.Parameters.AddWithValue("@TotalAmount",      totalAmount);
    cmd.Parameters.AddWithValue("@PaymentMode",      paymentMode);
    cmd.Parameters.AddWithValue("@BillDate",         billDate);
    con.Open();
    cmd.ExecuteNonQuery();
}

       public void SaveSalesInvoice(int sellerId, int shopkeeperId, int productId,
    int quantity, decimal mrp, decimal sellingPrice, decimal purchasePrice,
    decimal gstPercent, decimal cgst, decimal sgst, decimal igst,
    decimal totalAmount, decimal profit, string paymentMode,
    string gstType, DateTime invoiceDate)
{
    using SqlConnection con = new(_connectionString);
    SqlCommand cmd = new("sp_SaveSalesInvoice", con);
    cmd.CommandType = CommandType.StoredProcedure;
    cmd.Parameters.AddWithValue("@SellerID",      sellerId);
    cmd.Parameters.AddWithValue("@ShopkeeperID",  shopkeeperId);
    cmd.Parameters.AddWithValue("@ProductID",     productId);
    cmd.Parameters.AddWithValue("@Quantity",      quantity);
    cmd.Parameters.AddWithValue("@MRP",           mrp);
    cmd.Parameters.AddWithValue("@SellingPrice",  sellingPrice);
    cmd.Parameters.AddWithValue("@PurchasePrice", purchasePrice);
    cmd.Parameters.AddWithValue("@GSTPercent",    gstPercent);
    cmd.Parameters.AddWithValue("@CGST",          cgst);
    cmd.Parameters.AddWithValue("@SGST",          sgst);
    cmd.Parameters.AddWithValue("@IGST",          igst);
    cmd.Parameters.AddWithValue("@TotalAmount",   totalAmount);
    cmd.Parameters.AddWithValue("@Profit",        profit);
    cmd.Parameters.AddWithValue("@PaymentMode",   paymentMode);
    cmd.Parameters.AddWithValue("@GSTType",       gstType);
    cmd.Parameters.AddWithValue("@InvoiceDate",   invoiceDate);
    con.Open();
    cmd.ExecuteNonQuery();
}

       public List<PurchaseBill> GetPurchaseBills(int sellerId)
{
    var list = new List<PurchaseBill>();
    using SqlConnection con = new(_connectionString);
    SqlCommand cmd = new("sp_GetPurchaseBills", con);
    cmd.CommandType = CommandType.StoredProcedure;
    cmd.Parameters.AddWithValue("@SellerID", sellerId);
    con.Open();
    var r = cmd.ExecuteReader();
    while (r.Read())
        list.Add(new PurchaseBill
        {
            BillID        = Convert.ToInt32(r["BillID"]),
            ProductName   = r["ProductName"]?.ToString()  ?? "",
            CompanyName   = r["CompanyName"]?.ToString()  ?? "",  // ADD
            Quantity      = Convert.ToInt32(r["Quantity"]),
            PurchasePrice = Convert.ToDecimal(r["PurchasePrice"]), // ADD
            TotalAmount   = Convert.ToDecimal(r["TotalAmount"]),
            CGST          = Convert.ToDecimal(r["CGST"]),          // ADD
            SGST          = Convert.ToDecimal(r["SGST"]),          // ADD
            IGST          = Convert.ToDecimal(r["IGST"]),          // ADD
            BillDate      = Convert.ToDateTime(r["BillDate"])
        });
    return list;
}

        public List<Invoice> GetSalesInvoices(int sellerId)
        {
            var list = new List<Invoice>();
            using SqlConnection con = new(_connectionString);
            SqlCommand cmd = new("sp_GetSalesInvoices", con);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@SellerID", sellerId);
            con.Open();
            var r = cmd.ExecuteReader();
            while (r.Read())
                list.Add(new Invoice
                {
                    Id          = Convert.ToInt32(r["InvoiceID"]),
                    TotalAmount = Convert.ToDecimal(r["TotalAmount"]),
                    Date        = Convert.ToDateTime(r["InvoiceDate"]),
                    SellerName  = r["ShopkeeperName"]?.ToString() ?? "",
                    ProductName = r["ProductName"]?.ToString() ?? "",
                    Status      = r["Status"]?.ToString() ?? ""
                });
            return list;
        }

public SellerDashboardStats GetSellerReports(int sellerId)
{
    using SqlConnection con = new(_connectionString);
    SqlCommand cmd = new("sp_GetSellerReports", con);
    cmd.CommandType = CommandType.StoredProcedure;
    cmd.Parameters.AddWithValue("@SellerID", sellerId);
    con.Open();
    var r = cmd.ExecuteReader();

    var stats = new SellerDashboardStats();

    // First result set = Weekly
    if (r.Read())
    {
        stats.SalesThisMonth    = Convert.ToDecimal(r["WeeklySales"]);
        stats.ProfitThisMonth   = Convert.ToDecimal(r["WeeklyProfit"]);
    }

    // Second result set = Monthly
    if (r.NextResult() && r.Read())
    {
        stats.SalesThisMonth    = Convert.ToDecimal(r["MonthlySales"]);
        stats.ProfitThisMonth   = Convert.ToDecimal(r["MonthlyProfit"]);
    }

    // Third result set = Top 5 products (skip for now)

    return stats;
}

        public List<RequestDetail> GetRequests(int sellerId)
        {
            var list = new List<RequestDetail>();
            using SqlConnection con = new(_connectionString);
            SqlCommand cmd = new("sp_GetSellerRequests", con);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@SellerID", sellerId);
            con.Open();
            var r = cmd.ExecuteReader();
            while (r.Read())
                list.Add(new RequestDetail
                {
                    RequestID   = Convert.ToInt32(r["RequestID"]),
                    Quantity    = Convert.ToInt32(r["Quantity"]),
                    EstAmount   = Convert.ToDecimal(r["EstAmount"]),
                    ShopkeeperName = r["ShopkeeperName"]?.ToString() ?? "",
                    ProductName    = r["ProductName"]?.ToString() ?? "",
                    SellerState    = r["Status"]?.ToString() ?? "",
                    RequestDate    = Convert.ToDateTime(r["RequestDate"])
                });
            return list;
        }

        public void RespondRequest(int requestId, int sellerId, string action)
        {
            using SqlConnection con = new(_connectionString);
            SqlCommand cmd = new("sp_RespondToRequest", con);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@RequestID", requestId);
            cmd.Parameters.AddWithValue("@SellerID",  sellerId);
            cmd.Parameters.AddWithValue("@Action",    action);
            con.Open();
            cmd.ExecuteNonQuery();
        }

        public int GetShopkeeperIdByRequest(int requestId)
        {
            using SqlConnection con = new(_connectionString);
            SqlCommand cmd = new(
                "SELECT ShopkeeperID FROM ShopkeeperRequests WHERE RequestID=@RequestID", con);
            cmd.Parameters.AddWithValue("@RequestID", requestId);
            con.Open();
            return (int)cmd.ExecuteScalar();
        }

      public RequestDetail GetRequestById(int requestId)
{
    using SqlConnection con = new(_connectionString);
    SqlCommand cmd = new(
        "SELECT * FROM ShopkeeperRequests WHERE RequestID=@RequestID", con);
    cmd.Parameters.AddWithValue("@RequestID", requestId);
    con.Open();
    var r = cmd.ExecuteReader();
    if (r.Read())
        return new RequestDetail
        {
            RequestID    = Convert.ToInt32(r["RequestID"]),
            ShopkeeperID = Convert.ToInt32(r["ShopkeeperID"]),
            SellerID     = Convert.ToInt32(r["SellerID"]),
            ProductID    = Convert.ToInt32(r["ProductID"]),
            Quantity     = Convert.ToInt32(r["Quantity"]),
            // ✅ These columns don't exist — use defaults
            EstAmount    = 0,
            GSTPercent   = 0
        };
    return new RequestDetail();
}

        public int GetSellerStock(int sellerId, int productId)
        {
            using SqlConnection con = new(_connectionString);
            SqlCommand cmd = new(@"
                SELECT ISNULL(si.Quantity,0)
                FROM SellerInventory si
                JOIN CompanyProducts cp ON cp.CompanyProductID = si.CompanyProductID
                WHERE si.SellerID=@SellerID AND cp.ProductID=@ProductID", con);
            cmd.Parameters.AddWithValue("@SellerID",  sellerId);
            cmd.Parameters.AddWithValue("@ProductID", productId);
            con.Open();
            return (int)cmd.ExecuteScalar();
        }

        public List<User> GetAllSellers()
        {
            var list = new List<User>();
            using SqlConnection con = new(_connectionString);
            SqlCommand cmd = new(
                "SELECT UserID, FullName FROM Users WHERE Role='seller'", con);
            con.Open();
            var r = cmd.ExecuteReader();
            while (r.Read())
                list.Add(new User
                {
                    UserId   = Convert.ToInt32(r["UserID"]),
                    FullName = r["FullName"]?.ToString() ?? ""
                });
            return list;
        }

        public List<Product> GetProductsBySeller(int sellerId)
        {
            var list = new List<Product>();
            using SqlConnection con = new(_connectionString);
            SqlCommand cmd = new("sp_GetProductsBySeller", con);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@SellerID", sellerId);
            con.Open();
            var r = cmd.ExecuteReader();
            while (r.Read())
                list.Add(new Product
                {
                    ProductID   = Convert.ToInt32(r["ProductID"]),
                    ProductName = r["ProductName"]?.ToString() ?? ""
                });
            return list;
        }

        public List<User> GetAllShopkeepers()
        {
            var list = new List<User>();
            using SqlConnection con = new(_connectionString);
            SqlCommand cmd = new(
                "SELECT UserID, FullName, Phone FROM Users WHERE Role='shopkeeper'", con);
            con.Open();
            var r = cmd.ExecuteReader();
            while (r.Read())
                list.Add(new User
                {
                    UserId   = Convert.ToInt32(r["UserID"]),
                    FullName = r["FullName"]?.ToString() ?? "",
                    Phone    = r["Phone"]?.ToString() ?? ""
                });
            return list;
        }

public List<User> GetMyShopkeepers(int sellerId)
{
    var list = new List<User>();
    using SqlConnection con = new(_connectionString);
    SqlCommand cmd = new("sp_GetSellerShopkeepers", con); // ✅ correct SP name
    cmd.CommandType = CommandType.StoredProcedure;
    cmd.Parameters.AddWithValue("@SellerID", sellerId);
    con.Open();
    var r = cmd.ExecuteReader();
    while (r.Read())
        list.Add(new User
        {
            UserId   = Convert.ToInt32(r["ShopkeeperID"]),
            FullName = r["Name"]?.ToString() ?? "",       // ✅ SP returns "Name" not "FullName"
            Phone    = r["Phone"]?.ToString() ?? ""
        });
    return list;
}

        public List<Payment> GetPayments(int sellerId)
        {
            var list = new List<Payment>();
            using SqlConnection con = new(_connectionString);
            SqlCommand cmd = new("sp_GetSellerPayments", con);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@SellerID", sellerId);
            con.Open();
            var r = cmd.ExecuteReader();
            while (r.Read())
               list.Add(new Payment
{
    Id          = Convert.ToInt32(r["PaymentID"]),
    Amount      = Convert.ToDecimal(r["Amount"]),
    Mode        = r["PaymentMode"]?.ToString() ?? "",
    Date        = Convert.ToDateTime(r["PaymentDate"]),
    // add these to your Payment entity too:
    PartyName   = r["PartyName"]?.ToString() ?? "",
    RefNumber   = r["RefNumber"]?.ToString() ?? "",
    PaymentType = r["PaymentType"]?.ToString() ?? "",
    Status      = r["Status"]?.ToString() ?? ""
});
            return list;
        }

        public List<Company> GetCompanies()
{
    var list = new List<Company>();
    using SqlConnection con = new(_connectionString);
    SqlCommand cmd = new("SELECT CompanyID, CompanyName FROM Companies", con);
    con.Open();
    var r = cmd.ExecuteReader();
    while (r.Read())
        list.Add(new Company
        {
            CompanyID   = Convert.ToInt32(r["CompanyID"]),
            CompanyName = r["CompanyName"]?.ToString() ?? ""
        });
    return list;
}

public List<CompanyProduct> GetProductsByCompany(int companyId)
{
    var list = new List<CompanyProduct>();
    using SqlConnection con = new(_connectionString);
    SqlCommand cmd = new(@"
        SELECT cp.CompanyProductID, cp.CompanyID, p.ProductID,
               p.ProductName, p.ProductCode, p.MRP, p.GSTPercent
        FROM CompanyProducts cp
        JOIN Products p ON p.ProductID = cp.ProductID
        WHERE cp.CompanyID = @CompanyID", con);
    cmd.Parameters.AddWithValue("@CompanyID", companyId);
    con.Open();
    var r = cmd.ExecuteReader();
    while (r.Read())
        list.Add(new CompanyProduct
        {
            CompanyProductID = Convert.ToInt32(r["CompanyProductID"]),
            CompanyID        = Convert.ToInt32(r["CompanyID"]),
            ProductID        = Convert.ToInt32(r["ProductID"]),
            ProductName      = r["ProductName"]?.ToString() ?? "",
            ProductCode      = r["ProductCode"]?.ToString() ?? "",
            MRP              = Convert.ToDecimal(r["MRP"]),
            GstPercent       = Convert.ToDecimal(r["GSTPercent"]),
            PurchasePrice    = 0  // not in Products table
        });
    return list;
}
    }
}