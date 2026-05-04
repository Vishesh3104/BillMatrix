public class InventoryDto
{
    public string ProductName { get; set; }="";
    public string HSNCode { get; set; }="";
    public string Category { get; set; }="";
    public decimal SellingPrice { get; set; }
    public decimal GstRate { get; set; }
    public int Stock { get; set; }
}