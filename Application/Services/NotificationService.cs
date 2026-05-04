using BILLMATRIX1.Application.Interfaces;
using BILLMATRIX1.Hubs;
using Microsoft.AspNetCore.SignalR;
using BILLMATRIX1.Application.DTOs;  // ✅ make sure this is here

public class NotificationService : INotificationService
{
    private readonly INotificationRepository _repo;
    private readonly IHubContext<NotificationHub> _hub;

    public NotificationService(INotificationRepository repo, IHubContext<NotificationHub> hub)
    {
        _repo = repo;
        _hub  = hub;
    }

    // ✅ was List<object> — now List<NotificationDto>
    public List<NotificationDto> GetNotifications(int userId)
        => _repo.GetNotifications(userId);

    public int GetUnreadCount(int userId)
        => _repo.GetUnreadCount(userId);

    public void MarkAllRead(int userId)
        => _repo.MarkAllRead(userId);

    // ✅ was List<object> — now List<NotificationDto>
    public List<NotificationDto> GetMessages(int requestId)
        => _repo.GetRequestMessages(requestId);

    public async Task<object> SendMessage(SendMessageRequest req)
    {
        _repo.AddRequestMessage(req.RequestID, req.SenderID, req.SenderRole, req.Message);

        int recipientID = req.SenderRole == "shopkeeper"
            ? req.SellerID
            : req.ShopkeeperID;

        string title = req.SenderRole == "shopkeeper"
            ? "New message from Shopkeeper"
            : "Seller replied";

        _repo.CreateNotification(recipientID, title, req.Message, "request_message", req.RequestID);

        await _hub.Clients.Group($"user_{recipientID}")
            .SendAsync("NewNotification", new { title, message = req.Message });

        return new { success = true };
    }
}