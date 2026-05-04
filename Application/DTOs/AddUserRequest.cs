// AddUserRequest.cs
namespace BILLMATRIX1.Application.DTOs
{
    public class AddUserRequest
    {
        public string FullName     { get; set; } = "";
        public string Email        { get; set; } = "";
        public string Phone        { get; set; } = "";
        public string Password     { get; set; } = "";
        public string Role         { get; set; } = "";
        public string BusinessName { get; set; } = "";
        public string GstNumber    { get; set; } = "";
        public string Address      { get; set; } = "";
        public string City         { get; set; } = "";
        public string State        { get; set; } = "";
        public string Pincode      { get; set; } = "";
    }
}