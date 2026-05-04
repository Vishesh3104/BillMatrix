public class NotificationDto
{
    public int NotificationID { get; set; }
    public string? Title { get; set; }
    public string? Message { get; set; }
    public string? Type { get; set; }
    public int? RequestID { get; set; }
    public bool IsRead { get; set; }
    public string? CreatedAt { get; set; }
    public int SenderID { get; set; }      // for messages
    public string? SenderRole { get; set; } // for messages
}