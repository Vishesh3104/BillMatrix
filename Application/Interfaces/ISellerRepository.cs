using BILLMATRIX1.Domain.Entities;

namespace BILLMATRIX1.Application.Interfaces
{
    public interface ISellerRepository
    {
        SellerDashboardStats GetDashboardStats(int sellerId);
        List<Product> GetSellerProducts(int sellerId);
        List<Product> GetSellerInventory(int sellerId);
        List<User> GetSellerShopkeepers(int sellerId);
        void AddShopkeeper(int sellerId, string name, string address,
                           string pincode, string phone, string gst);

        // ✅ No DTOs here — pass individual params
        void SavePurchaseBill(int sellerId, int companyProductId, int quantity,
            decimal purchasePrice, decimal gstPercent, decimal cgst, decimal sgst,
            decimal igst, decimal totalAmount, string paymentMode, DateTime billDate);

        void SaveSalesInvoice(int sellerId, int shopkeeperId, int productId,
            int quantity, decimal mrp, decimal sellingPrice, decimal purchasePrice,
            decimal gstPercent, decimal cgst, decimal sgst, decimal igst,
            decimal totalAmount, decimal profit, string paymentMode,
            string gstType, DateTime invoiceDate);

        List<PurchaseBill> GetPurchaseBills(int sellerId);
        List<Invoice> GetSalesInvoices(int sellerId);
        SellerDashboardStats GetSellerReports(int sellerId);
        List<RequestDetail> GetRequests(int sellerId);
        void RespondRequest(int requestId, int sellerId, string action);
        int GetShopkeeperIdByRequest(int requestId);
        RequestDetail GetRequestById(int requestId);
        int GetSellerStock(int sellerId, int productId);
        List<User> GetAllSellers();
        List<Product> GetProductsBySeller(int sellerId);
        List<User> GetAllShopkeepers();
        List<User> GetMyShopkeepers(int sellerId);
        List<Payment> GetPayments(int sellerId);
        // Add these two lines to the interface:
List<Company> GetCompanies();
List<CompanyProduct> GetProductsByCompany(int companyId);
        
    }
}