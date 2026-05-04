using BILLMATRIX1.Application.DTOs;
using BILLMATRIX1.Domain.Entities;

// Domain/Interfaces/IInvoiceRepository.cs
public interface IInvoiceRepository
{
    IEnumerable<Invoice> GetAll();
    IEnumerable<Invoice> GetBySellerId(int sellerId);
    Invoice GetById(int id);
    int Create(Invoice invoice);
    bool Update(Invoice invoice);
}