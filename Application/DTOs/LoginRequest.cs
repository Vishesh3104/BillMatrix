namespace BILLMATRIX1.Application.DTOs
{
    public class LoginRequest
    {
        public string EmailOrPhone { get; set; }="";
        public string Password { get; set; }="";
    }
}