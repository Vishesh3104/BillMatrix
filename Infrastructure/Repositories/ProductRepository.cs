using System.Data;
using Microsoft.Data.SqlClient;
using BILLMATRIX1.Application.Interfaces;
using BILLMATRIX1.Application.DTOs;
using BILLMATRIX1.Domain.Entities;

namespace BILLMATRIX1.Infrastructure.Repositories
{
    public class ProductRepository : IProductRepository
    {
        private readonly string _connectionString;

        public ProductRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection")!;
        }

        public List<Product> GetProducts()
        {
            var list = new List<Product>();
            using SqlConnection con = new(_connectionString);
            SqlCommand cmd = new("GetProducts", con);
            cmd.CommandType = CommandType.StoredProcedure;
            con.Open();
            var dr = cmd.ExecuteReader();
            while (dr.Read())
            {
                list.Add(new Product
                {
                    ProductID = Convert.ToInt32(dr["ProductID"]),
                    ProductName = dr["ProductName"].ToString() ?? "",
                    MRP = Convert.ToDecimal(dr["MRP"])
                });
            }
            return list;
        }

        public void AddProduct(Product product)
        {
            using SqlConnection con = new(_connectionString);
            SqlCommand cmd = new("AddProduct", con);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@ProductName", product.ProductName);
            cmd.Parameters.AddWithValue("@Price", product.MRP);
            con.Open();
            cmd.ExecuteNonQuery();
        }

        public List<int> SaveQuickBill(QuickBillRequest bill)
        {
            var invoiceIds = new List<int>();

            foreach (var item in bill.Items)
            {
                using SqlConnection con = new(_connectionString);
                SqlCommand cmd = new("sp_SaveQuickBill", con);
                cmd.CommandType = CommandType.StoredProcedure;

                cmd.Parameters.AddWithValue("@ShopkeeperID", bill.ShopkeeperID);
                cmd.Parameters.AddWithValue("@PaymentMode", bill.PaymentMode ?? "Cash");
                cmd.Parameters.AddWithValue("@ProductID", item.ProductID);
                cmd.Parameters.AddWithValue("@SellerID", item.SellerID);
                cmd.Parameters.AddWithValue("@Quantity", item.Quantity);
                cmd.Parameters.AddWithValue("@MRP", item.MRP);
                cmd.Parameters.AddWithValue("@SellingPrice", item.SellingPrice);
                cmd.Parameters.AddWithValue("@PurchasePrice", item.PurchasePrice);
                cmd.Parameters.AddWithValue("@GSTPercent", item.GSTPercent);

                con.Open();
                var result = cmd.ExecuteScalar();
                if (result != null)
                    invoiceIds.Add(Convert.ToInt32(result));
            }

            return invoiceIds;
        }
    }
}
