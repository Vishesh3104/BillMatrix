// AddCompanyRequest.cs
namespace BILLMATRIX1.Application.DTOs
{
    public class AddCompanyRequest
    {
        public string CompanyName { get; set; } = "";
        public string GstNumber   { get; set; } = "";
        public string Address     { get; set; } = "";
    }
}