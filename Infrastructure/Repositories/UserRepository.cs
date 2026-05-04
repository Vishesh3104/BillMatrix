using System.Data;
using Microsoft.Data.SqlClient;
using BILLMATRIX1.Application.Interfaces;
using BILLMATRIX1.Domain.Entities;

namespace BILLMATRIX1.Infrastructure.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly string _connectionString;

        public UserRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection")!;
        }

        public void Register(User user)
        {
            using SqlConnection con = new(_connectionString);
            SqlCommand cmd = new("sp_RegisterUser", con);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@FullName",     user.FullName);
            cmd.Parameters.AddWithValue("@Email",        user.Email);
            cmd.Parameters.AddWithValue("@Phone",        user.Phone);
            cmd.Parameters.AddWithValue("@Password",     user.Password);
            cmd.Parameters.AddWithValue("@Role",         user.Role);
            cmd.Parameters.AddWithValue("@BusinessName", user.BusinessName);
            cmd.Parameters.AddWithValue("@GSTNumber",    user.GstNumber);
            cmd.Parameters.AddWithValue("@Address",      user.Address);
            cmd.Parameters.AddWithValue("@City",         user.City);
            cmd.Parameters.AddWithValue("@State",        user.State);
            cmd.Parameters.AddWithValue("@Pincode",      user.Pincode);
            con.Open();
            cmd.ExecuteNonQuery();
        }

        public User Login(string emailOrPhone, string password)
        {
            User? user = null;
            using SqlConnection con = new(_connectionString);
            SqlCommand cmd = new("sp_LoginUser", con);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@EmailOrPhone", emailOrPhone);
            cmd.Parameters.AddWithValue("@Password",     password);
            con.Open();
            var dr = cmd.ExecuteReader();
            if (dr.Read())
                user = new User
                {
                    UserId   = Convert.ToInt32(dr["UserID"]),
                    FullName = dr["FullName"]?.ToString() ?? "",   // ✅ null safe
                    Email    = dr["Email"]?.ToString() ?? "",
                    Phone    = dr["Phone"]?.ToString() ?? "",
                    Role     = dr["Role"]?.ToString() ?? ""
                };
            return user!;
        }

        public User GetUserByEmailOrPhone(string emailOrPhone)
        {
            User? user = null;
            using SqlConnection con = new(_connectionString);
            SqlCommand cmd = new(@"
                SELECT TOP 1 * FROM Users
                WHERE Email = @val OR Phone = @val
                ORDER BY UserID DESC", con);
            cmd.Parameters.AddWithValue("@val", emailOrPhone);
            con.Open();
            var dr = cmd.ExecuteReader();
            if (dr.Read())
                user = new User
                {
                    UserId   = Convert.ToInt32(dr["UserID"]),
                    FullName = dr["FullName"]?.ToString() ?? "",   // ✅ null safe
                    Email    = dr["Email"]?.ToString() ?? "",
                    Phone    = dr["Phone"]?.ToString() ?? "",
                    Role     = dr["Role"]?.ToString() ?? ""
                };
            return user!;
        }
    }
}