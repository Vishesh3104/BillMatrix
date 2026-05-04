using BILLMATRIX1.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace BILLMATRIX1.WebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InvoiceController : ControllerBase
    {
        private readonly ISellerService _sellerService;

        public InvoiceController(ISellerService sellerService)
        {
            _sellerService = sellerService;
        }

        [HttpGet("export")]
        public IActionResult ExportInvoices([FromQuery] int sellerId = 0)
        {
            if (sellerId > 0)
                return Ok(_sellerService.GetSalesInvoices(sellerId));

            return Ok(new { message = "Provide sellerId as query param" });
        }
    }
}
