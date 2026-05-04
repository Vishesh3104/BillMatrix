namespace BILLMATRIX1.Application.DTOs
{
    public class SimpleProductDto
{
    public int Id { get; set; }          // not ProductID
    public string? Name { get; set; }    // not ProductName
    public decimal Price { get; set; }   // not MRP
}
}