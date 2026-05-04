using BILLMATRIX1.Domain.Entities;

namespace BILLMATRIX1.Application.Interfaces
{
    public interface ICustomerRepository
    {
        List<Customer> GetCustomers();
        void AddCustomer(Customer customer);
        void SendRequest(RequestDetail request);       // Entity, not DTO
        List<Invoice> GetMyInvoices(int shopkeeperID); // Entity
        List<RequestDetail> GetMyRequests(int shopkeeperID); // Entity
        List<Product> GetMyInventory(int shopkeeperID);      // Entity
    }
}