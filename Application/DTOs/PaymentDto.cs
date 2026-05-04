// PaymentDto.cs
namespace BILLMATRIX1.Application.DTOs
{
    public class PaymentDto
    {
        public int PaymentID    { get; set; }
        public decimal Amount   { get; set; }
        public string Mode      { get; set; } = "";
        public DateTime Date    { get; set; }
    }
}