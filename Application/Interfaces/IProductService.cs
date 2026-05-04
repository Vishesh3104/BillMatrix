using BILLMATRIX1.Domain.Entities;
using BILLMATRIX1.Application.DTOs;

namespace BILLMATRIX1.Application.Interfaces
{
    public interface IProductService
{
    List<SimpleProductDto> GetProducts();         // ✅ DTO return
    void AddProduct(AddProductRequest request);   // ✅ DTO input
    Task<List<int>> SaveQuickBill(QuickBillRequest bill);
}
}
