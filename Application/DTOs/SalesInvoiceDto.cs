// SalesInvoiceDto.cs
namespace BILLMATRIX1.Application.DTOs
{
    public class SalesInvoiceDto
    {
        public int InvoiceID            { get; set; }
        public string ShopkeeperName    { get; set; } = "";
        public string ProductName       { get; set; } = "";
        public int Quantity             { get; set; }
        public decimal TotalAmount      { get; set; }
        public DateTime InvoiceDate     { get; set; }
    }
}