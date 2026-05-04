using BILLMATRIX1.Application.DTOs;
using BILLMATRIX1.Application.Interfaces;
using BILLMATRIX1.Hubs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace BILLMATRIX1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CustomerController : ControllerBase
    {
        private readonly ICustomerService _service;
        private readonly IHubContext<NotificationHub> _hub;

        public CustomerController(ICustomerService service,
                                  IHubContext<NotificationHub> hub)
        {
            _service = service;
            _hub     = hub;
        }

        // ✅ Returns List<ShopkeeperDto>
        [HttpGet]
        public IActionResult GetCustomers()
            => Ok(_service.GetCustomers());

        // ✅ Accepts AddShopkeeperRequest DTO (not entity!)
        [HttpPost]
        public IActionResult AddCustomer(AddShopkeeperRequest request)
        {
            _service.AddCustomer(request);
            return Ok("Customer Added");
        }

        // ✅ Accepts ShopkeeperRequest DTO
        [HttpPost("send-request")]
        public async Task<IActionResult> SendRequest(ShopkeeperRequest model)
        {
            _service.SendRequest(model);
            await _hub.Clients.Group($"user_{model.SellerID}")
                .SendAsync("NewNotification", new
                {
                    message = "New request from shopkeeper"
                });
            return Ok("Request Sent");
        }

        // ✅ Returns List<InvoiceDto>
        [HttpGet("my-invoices")]
        public IActionResult GetMyInvoices(int shopkeeperId)
            => Ok(_service.GetMyInvoices(shopkeeperId));

        // ✅ Returns List<RequestDto>
        [HttpGet("my-requests")]
        public IActionResult GetMyRequests(int shopkeeperId)
            => Ok(_service.GetMyRequests(shopkeeperId));

        // ✅ Returns List<InventoryDto>
        [HttpGet("my-inventory")]
        public IActionResult GetMyInventory(int shopkeeperId)
            => Ok(_service.GetMyInventory(shopkeeperId));
    }
}