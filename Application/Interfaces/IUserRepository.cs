// Domain/Interfaces/IUserRepository.cs
using BILLMATRIX1.Domain.Entities;

namespace BILLMATRIX1.Application.Interfaces
{
    public interface IUserRepository
    {
        void Register(User user);          // ✅ was: AddUser(User user)
        User Login(string emailOrPhone, string password);
        User GetUserByEmailOrPhone(string emailOrPhone);
    }
}