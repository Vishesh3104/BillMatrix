public class RequestDto
{
    public int RequestID { get; set; }
    public string ProductName { get; set; }="";
    public string SellerName { get; set; }="";
    public int Quantity { get; set; }
    public string Status { get; set; }="";
    //public string RequestDate { get; set; }="";
    public string? ShopkeeperName { get; set; }
    public decimal  EstAmount   { get; set; }
    public DateTime RequestDate { get; set; }


}