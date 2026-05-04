using BILLMATRIX1.Domain.Entities;
using BILLMATRIX1.Application.DTOs;

namespace BILLMATRIX1.Application.Interfaces
{
    public interface IProductRepository
    {
        List<Product> GetProducts();
        void AddProduct(Product product);
        List<int> SaveQuickBill(QuickBillRequest bill);
    }
}
