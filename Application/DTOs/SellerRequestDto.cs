namespace BILLMATRIX1.Application.DTOs
{
    public class SellerRequestDto
    {
        public int RequestID { get; set; }
        public string Shopkeeper { get; set; }="";

        public string Product { get; set; }="";
        public int Quantity { get; set; }
        public string Status { get; set; }= "";
        public DateTime RequestDate { get; set; }
        public int StockAvailable { get; set; }
        public decimal EstAmount { get; set; }
    }
}