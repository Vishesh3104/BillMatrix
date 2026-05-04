public class SellerDashboardDto
{
    public decimal SalesThisMonth    { get; set; }
    public decimal ProfitThisMonth   { get; set; }
    public decimal PurchaseThisMonth { get; set; }
    public decimal GSTThisMonth      { get; set; }
    public int     LowStockItems     { get; set; }
    public decimal PendingPayments   { get; set; }
}