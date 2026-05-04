namespace BILLMATRIX1.Domain.Entities
{
    public class Company
    {
        public int CompanyID { get; set; }
        public string CompanyName { get; set; }="";
        public string? GSTNumber { get; set; }
        public string? Address { get; set; }
        public bool IsActive { get; set; }
        public string State { get; set; } = "";
    }
}