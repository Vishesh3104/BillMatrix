// AdminUserDto.cs
namespace BILLMATRIX1.Application.DTOs
{
    public class AdminUserDto
    {
        public int UserId       { get; set; }
        public string FullName  { get; set; } = "";
        public string Email     { get; set; } = "";
        public string Phone     { get; set; } = "";
        public string Role      { get; set; } = "";
    }
}