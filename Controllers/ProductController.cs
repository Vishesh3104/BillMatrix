using BILLMATRIX1.Application.Interfaces;
using BILLMATRIX1.Application.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace BILLMATRIX1.WebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductController : ControllerBase
    {
        private readonly IProductService _service;

        public ProductController(IProductService service)
        {
            _service = service;
        }

        // ✅ Returns DTO, not Entity
        [HttpGet("get-all")]
        public IActionResult GetProducts()
        {
            var products = _service.GetProducts(); // List<SimpleProductDto>
            return Ok(products);
        }

        // ✅ Receives DTO (AddProductRequest), not Entity (Product)
        [HttpPost("add")]
        public IActionResult AddProduct([FromBody] AddProductRequest request)
        {
            _service.AddProduct(request);
            return Ok(new { success = true });
        }

        // ✅ QuickBillRequest is already a DTO — correct
        [HttpPost("save-quick-bill")]
        public async Task<IActionResult> SaveQuickBill([FromBody] QuickBillRequest bill)
        {
            if (bill == null || !bill.Items.Any())
                return BadRequest("Bill must have at least one item.");

            try
            {
                var ids = await _service.SaveQuickBill(bill);
                return Ok(new
                {
                    success = true,
                    invoiceIds = ids,
                    invoiceId = ids.FirstOrDefault(),
                    message = $"{ids.Count} invoice(s) saved"
                });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // ✅ Returns DTO, not Entity
        [HttpGet("export")]
        public IActionResult ExportProducts()
        {
            var products = _service.GetProducts(); // List<SimpleProductDto>
            return Ok(products);
        }
    }
}