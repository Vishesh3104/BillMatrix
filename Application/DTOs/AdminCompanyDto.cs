// AdminCompanyDto.cs
namespace BILLMATRIX1.Application.DTOs
{
    public class AdminCompanyDto
    {
        public int CompanyId      { get; set; }
        public string CompanyName { get; set; } = "";
        public string GstNumber   { get; set; } = "";
        public string Address     { get; set; } = "";
        public bool IsActive      { get; set; }
    }
}