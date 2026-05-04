// Business.cs
namespace BILLMATRIX1.Domain.Entities
{
    public class Business
    {
        public string BusinessName { get; set; } = "";
        public string OwnerName   { get; set; } = "";
        public string Role        { get; set; } = "";
        public string GstNumber   { get; set; } = "";
        public string State       { get; set; } = "";
    }
}