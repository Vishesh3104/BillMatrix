using BILLMATRIX1.Application.DTOs;

namespace BILLMATRIX1.Application.Interfaces
{
    public interface ICustomerService
    {
        List<ShopkeeperDto> GetCustomers();
        void AddCustomer(AddShopkeeperRequest request); // accepts Request DTO
        void SendRequest(ShopkeeperRequest request);    // Request DTO
        List<InvoiceDto> GetMyInvoices(int shopkeeperID);
        List<RequestDto> GetMyRequests(int shopkeeperID);
        List<InventoryDto> GetMyInventory(int shopkeeperID);
    }
}