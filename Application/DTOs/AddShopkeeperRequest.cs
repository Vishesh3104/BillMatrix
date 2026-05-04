namespace BILLMATRIX1.Application.DTOs
{
    public class AddShopkeeperRequest
    {
        public int SellerID { get; set; }
        public string? Name { get; set; }
        public string? Address { get; set; }
        public string? Pincode { get; set; }
        public string? Phone { get; set; }
        public string? GstNumber { get; set; }
    }
}
