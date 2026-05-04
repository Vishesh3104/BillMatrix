using BILLMATRIX1.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using BILLMATRIX1.Application.DTOs;

[ApiController]
[Route("api/[controller]")]
public class NotificationController : ControllerBase
{
    private readonly INotificationService _service;

    public NotificationController(INotificationService service)
    {
        _service = service;
    }

    [HttpGet("list")]
    public IActionResult GetNotifications(int userId)
        => Ok(_service.GetNotifications(userId));

    [HttpGet("unread-count")]
    public IActionResult GetUnreadCount(int userId)
        => Ok(new { count = _service.GetUnreadCount(userId) });

    [HttpPost("mark-read")]
    public IActionResult MarkRead(int userId)
    {
        _service.MarkAllRead(userId);
        return Ok();
    }

    [HttpGet("messages")]
    public IActionResult GetMessages(int requestId)
        => Ok(_service.GetMessages(requestId));

    [HttpPost("send-message")]
    public async Task<IActionResult> SendMessage(SendMessageRequest req)
        => Ok(await _service.SendMessage(req));
}
