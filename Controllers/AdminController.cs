using BILLMATRIX1.Application.DTOs;
using BILLMATRIX1.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _service;

    public AdminController(IAdminService service)
    {
        _service = service;
    }

    [HttpGet("users")]
    public IActionResult GetAllUsers()
        => Ok(_service.GetAllUsers());

    [HttpDelete("delete-product/{productId}")]
    public IActionResult DeleteProduct(int productId)
    {
        _service.DeleteProduct(productId);
       return Ok(new { success = true, message = "Product deleted" });
    }

    [HttpGet("products")]
    public IActionResult GetProducts()
        => Ok(_service.GetAllProducts());

    [HttpPost("add-product")]
    public IActionResult AddProduct(AddProductRequest request)  // ✅ DTO not Entity
    {
        _service.AddProduct(request);
       return Ok(new { success = true, message = "Product added" });
    }

    [HttpGet("product-stock/{productId}")]
    public IActionResult GetProductStock(int productId)
        => Ok(_service.GetProductStock(productId));

    [HttpPut("update-product")]
    public IActionResult UpdateProduct([FromBody] UpdateProductRequest req)
    {
        _service.UpdateProduct(req.ProductID, req.ProductName ?? "", req.MRP, req.HsnCode ?? "");
        return Ok(new { success = true, message = "Product updated" });
    }

    [HttpGet("businesses")]
    public IActionResult GetAllBusinesses()
        => Ok(_service.GetAllBusinesses());

    [HttpGet("dashboard-stats")]
    public IActionResult GetDashboardStats()
        => Ok(_service.GetDashboardStats());


[HttpPost("add-user")]
public IActionResult AddUser(AddUserRequest request)
{
    try
    {
        _service.AddUser(request);  // ← was _adminService, should be _service
        return Ok(new { success = true, message = "User added successfully" });
    }
    catch (Exception ex)
    {
        return BadRequest(new { success = false, message = ex.Message });
    }
}

 [HttpDelete("delete-user/{userId}")]
public IActionResult DeleteUser(int userId)
{
    _service.DeleteUser(userId);
    return Ok(new { success = true, message = "User deleted" }); // ← JSON not plain text
}

    [HttpGet("companies")]
    public IActionResult GetAllCompanies()
        => Ok(_service.GetAllCompanies());

    // ✅ Return JSON instead
[HttpPost("add-company")]
public IActionResult AddCompany(AddCompanyRequest request)
{
    try
    {
        _service.AddCompany(request);
        return Ok(new { success = true, message = "Company added successfully" });
    }
    catch (Exception ex)
    {
        return BadRequest(new { success = false, message = ex.Message });
    }
}

    [HttpDelete("delete-company/{companyId}")]
    public IActionResult DeleteCompany(int companyId)
    {
        _service.DeleteCompany(companyId);
        return Ok(new { success = true, message = "Company deleted" });
    }

    [HttpGet("recent-registrations")]
    public IActionResult GetRecentRegistrations()
        => Ok(_service.GetRecentRegistrations());

    [HttpGet("recent-activity")]
    public IActionResult GetRecentActivity()
        => Ok(_service.GetRecentActivity());

        [HttpGet("report-gst")]
public IActionResult GetGstReport()
    => Ok(_service.GetGstReport());

[HttpGet("report-sales")]
public IActionResult GetSalesReport()
    => Ok(_service.GetSalesReport());

[HttpGet("report-invoices")]
public IActionResult GetInvoiceReport()
    => Ok(_service.GetInvoiceReport());
}