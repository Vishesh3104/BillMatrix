using BILLMATRIX1.Application.Interfaces;
using BILLMATRIX1.Application.DTOs;
using BILLMATRIX1.Domain.Entities;

namespace BILLMATRIX1.Application.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _repo;

        public UserService(IUserRepository repo)
        {
            _repo = repo;
        }

        // ✅ Receives DTO → maps to Entity → passes to Repository
        public void Register(AddUserRequest request)
        {
            var user = new User
            {
                FullName     = request.FullName,
                Email        = request.Email,
                Phone        = request.Phone,
                Password     = request.Password,
                Role         = request.Role,
                BusinessName = request.BusinessName,
                GstNumber    = request.GstNumber,  // ✅ GSTNumber not GstNumber
                Address      = request.Address,
                City         = request.City,
                State        = request.State,
                Pincode      = request.Pincode
            };
            _repo.Register(user);  // ✅ Register not AddUser
        }

        public User Login(string emailOrPhone, string password)
            => _repo.Login(emailOrPhone, password);

        public User GetUserByEmailOrPhone(string emailOrPhone)
            => _repo.GetUserByEmailOrPhone(emailOrPhone);
    }
}