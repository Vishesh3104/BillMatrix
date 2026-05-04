using System.Data;
using Microsoft.Data.SqlClient;
using BILLMATRIX1.Application.Interfaces;
using BILLMATRIX1.Domain.Entities;

namespace BILLMATRIX1.Infrastructure.Repositories
{
    public class CustomerRepository : ICustomerRepository
    {
        private readonly string? _connectionString;

        public CustomerRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection");
        }

        public List<Customer> GetCustomers()
        {
            var list = new List<Customer>();
            using SqlConnection con = new(_connectionString!);
            SqlCommand cmd = new("GetCustomers", con);
            cmd.CommandType = CommandType.StoredProcedure;
            con.Open();
            var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                list.Add(new Customer
                {
                    CustomerID   = Convert.ToInt32(reader["CustomerID"]),
                    CustomerName = reader["CustomerName"]?.ToString() ?? "",
                    Phone        = reader["Phone"]?.ToString() ?? "",
                    Address      = reader["Address"]?.ToString() ?? ""
                });
            }
            return list;
        }

        public void AddCustomer(Customer c)
        {
            using SqlConnection con = new(_connectionString!);
            SqlCommand cmd = new("AddCustomer", con);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@CustomerName", c.CustomerName);
            cmd.Parameters.AddWithValue("@Phone",        c.Phone);
            cmd.Parameters.AddWithValue("@Address",      c.Address);
            con.Open();
            cmd.ExecuteNonQuery();
        }

        public void SendRequest(RequestDetail r)
        {
            using SqlConnection con = new(_connectionString!);
            SqlCommand cmd = new("dbo.sp_AddShopkeeperRequest", con);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@ShopkeeperID", r.ShopkeeperID);
            cmd.Parameters.AddWithValue("@SellerID",     r.SellerID);
            cmd.Parameters.AddWithValue("@ProductID",    r.ProductID);
            cmd.Parameters.AddWithValue("@Quantity",     r.Quantity);
            con.Open();
            cmd.ExecuteNonQuery();
        }

    
      public List<Invoice> GetMyInvoices(int shopkeeperID)
{
    var list = new List<Invoice>();
    using SqlConnection con = new(_connectionString);
    // ✅ Use correct SP name
    SqlCommand cmd = new("sp_GetShopkeeperInvoices", con);
    cmd.CommandType = CommandType.StoredProcedure;
    cmd.Parameters.AddWithValue("@ShopkeeperID", shopkeeperID);
    con.Open();
    var r = cmd.ExecuteReader();
    while (r.Read())
        list.Add(new Invoice
        {
            Id          = Convert.ToInt32(r["InvoiceID"]),
            CustomerId  = Convert.ToInt32(r["CustomerId"]),
            Date        = Convert.ToDateTime(r["Date"]),
            TotalAmount = Convert.ToDecimal(r["TotalAmount"]),
            CGST        = Convert.ToDecimal(r["CGST"]),
            SGST        = Convert.ToDecimal(r["SGST"]),
            Status      = r["Status"]?.ToString() ?? "",
            ProductName = r["ProductName"]?.ToString() ?? "",
            SellerName  = r["SellerName"]?.ToString() ?? ""
        });
    return list;
}

public List<RequestDetail> GetMyRequests(int shopkeeperID)
{
    var list = new List<RequestDetail>();
    using SqlConnection con = new(_connectionString);
    // ✅ Use correct SP name
    SqlCommand cmd = new("sp_GetShopkeeperRequests", con);
    cmd.CommandType = CommandType.StoredProcedure;
    cmd.Parameters.AddWithValue("@ShopkeeperID", shopkeeperID);
    con.Open();
    var r = cmd.ExecuteReader();
    while (r.Read())
        list.Add(new RequestDetail
        {
            RequestID    = Convert.ToInt32(r["RequestID"]),
            ShopkeeperID = Convert.ToInt32(r["ShopkeeperID"]),
            SellerID     = Convert.ToInt32(r["SellerID"]),
            ProductID    = Convert.ToInt32(r["ProductID"]),
            Quantity     = Convert.ToInt32(r["Quantity"]),
            GSTPercent   = Convert.ToDecimal(r["GSTPercent"]),
            EstAmount    = Convert.ToDecimal(r["EstAmount"]),
            SellerState  = r["SellerState"]?.ToString() ?? "",
            RequestDate  = Convert.ToDateTime(r["RequestDate"]),
            ProductName  = r["ProductName"]?.ToString() ?? "",
            SellerName   = r["SellerName"]?.ToString() ?? ""
        });
    return list;
}

public List<Product> GetMyInventory(int shopkeeperID)
{
    var list = new List<Product>();
    using SqlConnection con = new(_connectionString);
    // ✅ Use correct SP name
    SqlCommand cmd = new("sp_GetShopkeeperInventory", con);
    cmd.CommandType = CommandType.StoredProcedure;
    cmd.Parameters.AddWithValue("@ShopkeeperID", shopkeeperID);
    con.Open();
    var r = cmd.ExecuteReader();
    while (r.Read())
        list.Add(new Product
        {
            ProductName  = r["ProductName"]?.ToString() ?? "",
            ProductCode  = r["ProductCode"]?.ToString() ?? "",
            HsnCode      = r["HsnCode"]?.ToString() ?? "",
            Category     = r["Category"]?.ToString() ?? "",
            MRP          = Convert.ToDecimal(r["MRP"]),
            GstPercent   = Convert.ToDecimal(r["GSTPercent"]),
            Quantity     = Convert.ToInt32(r["Quantity"])
        });
    return list;
}
    }
}