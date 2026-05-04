using BILLMATRIX1.Domain.Entities;
using BILLMATRIX1.Application.Interfaces;
using BILLMATRIX1.Application.DTOs;

namespace BILLMATRIX1.Application.DTOs
{
    public class SendMessageRequest
    {
        public int RequestID { get; set; }
        public int SenderID { get; set; }
        public string SenderRole { get; set; } = "";
        public string Message { get; set; } = "";
        public int SellerID { get; set; }
        public int ShopkeeperID { get; set; }
    }
}