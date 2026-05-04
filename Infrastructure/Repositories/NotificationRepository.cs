using Microsoft.Data.SqlClient;
using BILLMATRIX1.Application.Interfaces;
using BILLMATRIX1.Application.DTOs;

public class NotificationRepository : INotificationRepository
{
    private readonly string _connectionString;

    public NotificationRepository(IConfiguration config)
    {
        _connectionString = config.GetConnectionString("DefaultConnection")!;
    }

    public void CreateNotification(int userID, string title, string message, string type, int? requestID)
    {
        using SqlConnection con = new(_connectionString);
        SqlCommand cmd = new(@"
            INSERT INTO Notifications (UserID, Title, Message, Type, RequestID, IsRead, CreatedAt)
            VALUES (@UserID, @Title, @Message, @Type, @RequestID, 0, GETDATE())", con);
        cmd.Parameters.AddWithValue("@UserID",    userID);
        cmd.Parameters.AddWithValue("@Title",     title);
        cmd.Parameters.AddWithValue("@Message",   message);
        cmd.Parameters.AddWithValue("@Type",      type);
        cmd.Parameters.AddWithValue("@RequestID", (object?)requestID ?? DBNull.Value);
        con.Open();
        cmd.ExecuteNonQuery();
    }

    // ✅ Returns NotificationDto instead of object
    public List<NotificationDto> GetNotifications(int userID)
    {
        var list = new List<NotificationDto>();
        using SqlConnection con = new(_connectionString);
        SqlCommand cmd = new(@"
            SELECT TOP 20 * FROM Notifications
            WHERE UserID = @UserID ORDER BY CreatedAt DESC", con);
        cmd.Parameters.AddWithValue("@UserID", userID);
        con.Open();
        var r = cmd.ExecuteReader();
        while (r.Read())
            list.Add(new NotificationDto
            {
                NotificationID = Convert.ToInt32(r["NotificationID"]),
                Title          = r["Title"]?.ToString() ?? "",
                Message        = r["Message"]?.ToString() ?? "",
                Type           = r["Type"]?.ToString() ?? "",
                RequestID      = r["RequestID"] == DBNull.Value ? null : Convert.ToInt32(r["RequestID"]),
                IsRead         = Convert.ToBoolean(r["IsRead"]),
                CreatedAt      = r["CreatedAt"]?.ToString() ?? ""
            });
        return list;
    }

    public int GetUnreadCount(int userID)
    {
        using SqlConnection con = new(_connectionString);
        SqlCommand cmd = new("SELECT COUNT(*) FROM Notifications WHERE UserID=@UserID AND IsRead=0", con);
        cmd.Parameters.AddWithValue("@UserID", userID);
        con.Open();
        return (int)cmd.ExecuteScalar();
    }

    public void MarkAllRead(int userID)
    {
        using SqlConnection con = new(_connectionString);
        SqlCommand cmd = new("UPDATE Notifications SET IsRead=1 WHERE UserID=@UserID", con);
        cmd.Parameters.AddWithValue("@UserID", userID);
        con.Open();
        cmd.ExecuteNonQuery();
    }

    public void AddRequestMessage(int requestID, int senderID, string senderRole, string message)
    {
        using SqlConnection con = new(_connectionString);
        SqlCommand cmd = new(@"
            INSERT INTO RequestMessages VALUES (@RequestID,@SenderID,@SenderRole,@Message,GETDATE())", con);
        cmd.Parameters.AddWithValue("@RequestID",   requestID);
        cmd.Parameters.AddWithValue("@SenderID",    senderID);
        cmd.Parameters.AddWithValue("@SenderRole",  senderRole);
        cmd.Parameters.AddWithValue("@Message",     message);
        con.Open();
        cmd.ExecuteNonQuery();
    }

    // ✅ Returns NotificationDto instead of object
    public List<NotificationDto> GetRequestMessages(int requestID)
    {
        var list = new List<NotificationDto>();
        using SqlConnection con = new(_connectionString);
        SqlCommand cmd = new("SELECT * FROM RequestMessages WHERE RequestID=@RequestID", con);
        cmd.Parameters.AddWithValue("@RequestID", requestID);
        con.Open();
        var r = cmd.ExecuteReader();
        while (r.Read())
            list.Add(new NotificationDto
            {
                Message    = r["Message"]?.ToString() ?? "",
                SenderID   = Convert.ToInt32(r["SenderID"]),
                SenderRole = r["SenderRole"]?.ToString() ?? ""
            });
        return list;
    }
}