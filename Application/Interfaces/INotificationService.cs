using BILLMATRIX1.Application.DTOs;

public interface INotificationService
{
    List<NotificationDto> GetNotifications(int userId);   // ✅
    int GetUnreadCount(int userId);
    void MarkAllRead(int userId);
    List<NotificationDto> GetMessages(int requestId);     // ✅
    Task<object> SendMessage(SendMessageRequest req);
}