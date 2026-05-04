using BILLMATRIX1.Application.DTOs;

public interface INotificationRepository
{
    void CreateNotification(int userId, string title, string message, string type, int? requestId);
    List<NotificationDto> GetNotifications(int userId);   // ✅ not List<object>
    int GetUnreadCount(int userId);
    void MarkAllRead(int userId);
    void AddRequestMessage(int requestId, int senderId, string senderRole, string message);
    List<NotificationDto> GetRequestMessages(int requestId); // ✅ not List<object>
}