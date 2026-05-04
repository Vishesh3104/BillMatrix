using BILLMATRIX1.Application.Interfaces;
using BILLMATRIX1.Application.DTOs;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class SellerController : ControllerBase
{
    private readonly ISellerService _service;

    public SellerController(ISellerService service)
    {
        _service = service;
    }

    [HttpGet("dashboard-stats")]
    public IActionResult GetDashboardStats(int sellerId) => Ok(_service.GetDashboardStats(sellerId));

    [HttpGet("products")]
    public IActionResult GetProducts(int sellerId) => Ok(_service.GetSellerProducts(sellerId));

    [HttpGet("inventory")]
    public IActionResult GetInventory(int sellerId) => Ok(_service.GetSellerInventory(sellerId));

    [HttpGet("shopkeepers")]
    public IActionResult GetShopkeepers(int sellerId) => Ok(_service.GetSellerShopkeepers(sellerId));

   [HttpPost("add-shopkeeper")]
public IActionResult AddShopkeeper(AddShopkeeperRequest req)
{
    _service.AddShopkeeper(req);
    return Ok("Shopkeeper added");
}

    [HttpPost("purchase-bill")]
public IActionResult SavePurchaseBill(PurchaseBillRequest req)
{
    _service.SavePurchaseBill(req);
    return Ok("Purchase bill saved");
}

    [HttpPost("sales-invoice")]
public IActionResult SaveSalesInvoice(SalesInvoiceRequest req)
{
    _service.SaveSalesInvoice(req);
    return Ok("Sales invoice saved");
}

    [HttpGet("purchase-bills")]
    public IActionResult GetPurchaseBills(int sellerId) => Ok(_service.GetPurchaseBills(sellerId));

    [HttpGet("sales-invoices")]
    public IActionResult GetSalesInvoices(int sellerId) => Ok(_service.GetSalesInvoices(sellerId));

    [HttpGet("reports")]
    public IActionResult GetReports(int sellerId) => Ok(_service.GetReports(sellerId));

    [HttpGet("requests")]
    public IActionResult GetRequests(int sellerId) => Ok(_service.GetRequests(sellerId));

    [HttpGet("payments")]
    public IActionResult GetPayments(int sellerId) => Ok(_service.GetPayments(sellerId));

    [HttpGet("all")]
    public IActionResult GetAllSellers() => Ok(_service.GetAllSellers());

    [HttpGet("products-by-seller")]
    public IActionResult GetProductsBySeller(int sellerId) => Ok(_service.GetProductsBySeller(sellerId));

    [HttpGet("all-shopkeepers")]
    public IActionResult GetAllShopkeepers() => Ok(_service.GetAllShopkeepers());

    [HttpGet("my-shopkeepers")]
    public IActionResult GetMyShopkeepers(int sellerId) => Ok(_service.GetMyShopkeepers(sellerId));

    [HttpPost("respond-request")]
    public async Task<IActionResult> RespondRequest(int requestId, int sellerId, string action)
        => Ok(await _service.RespondRequest(requestId, sellerId, action));

        [HttpGet("companies")]
public IActionResult GetCompanies()
    => Ok(_service.GetCompanies());

[HttpGet("products-by-company")]
public IActionResult GetProductsByCompany(int companyId)
    => Ok(_service.GetProductsByCompany(companyId));
}
