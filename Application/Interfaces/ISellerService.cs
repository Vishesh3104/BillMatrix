using BILLMATRIX1.Application.DTOs;

namespace BILLMATRIX1.Application.Interfaces
{
    public interface ISellerService
    {
        SellerDashboardDto GetDashboardStats(int sellerId);
        List<SimpleProductDto> GetSellerProducts(int sellerId);
        List<InventoryDto> GetSellerInventory(int sellerId);
        List<ShopkeeperDto> GetSellerShopkeepers(int sellerId);
        void AddShopkeeper(AddShopkeeperRequest req);
        void SavePurchaseBill(PurchaseBillRequest req);
        void SaveSalesInvoice(SalesInvoiceRequest req);
        List<PurchaseBillDto> GetPurchaseBills(int sellerId);
        List<SalesInvoiceDto> GetSalesInvoices(int sellerId);
        SellerReportDto GetReports(int sellerId);
        List<SellerRequestDto> GetRequests(int sellerId);
        Task<bool> RespondRequest(int requestId, int sellerId, string action);
        List<PaymentDto> GetPayments(int sellerId);
        List<SimpleSellerDto> GetAllSellers();
        List<SimpleProductDto> GetProductsBySeller(int sellerId);
        List<ShopkeeperDto> GetAllShopkeepers();
        List<ShopkeeperDto> GetMyShopkeepers(int sellerId);
        List<CompanyDto> GetCompanies();
List<CompanyProductDto> GetProductsByCompany(int companyId);
    }
}