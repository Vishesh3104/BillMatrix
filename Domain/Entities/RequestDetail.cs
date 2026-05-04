namespace BILLMATRIX1.Domain.Entities
{
    public class RequestDetail
    {
        public int RequestID { get; set; }
        public int ShopkeeperID { get; set; }
        public int SellerID { get; set; }
        public int ProductID { get; set; }
        public int Quantity { get; set; }
        public decimal GSTPercent { get; set; }
        public decimal EstAmount { get; set; }
        public string? SellerState { get; set; }
        public string? ShopkeeperState { get; set; }

        public string? ProductName  { get; set; }
public string? SellerName   { get; set; }
public DateTime RequestDate { get; set; }
public string? ShopkeeperName { get; set; }
    }
}