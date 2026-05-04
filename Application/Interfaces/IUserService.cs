using BILLMATRIX1.Domain.Entities;
using BILLMATRIX1.Application.DTOs;

namespace BILLMATRIX1.Application.Interfaces
{
    public interface IUserService
    {
        void Register(AddUserRequest request);
        User Login(string emailOrPhone, string password);
        User GetUserByEmailOrPhone(string emailOrPhone);
    }
}