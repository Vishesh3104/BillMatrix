using BILLMATRIX1.Domain.Entities;
using BILLMATRIX1.Application.Interfaces;
using BILLMATRIX1.Application.DTOs;

namespace BILLMATRIX1.Application.DTOs
{
    public class ShopkeeperRequest
    {
        public int ShopkeeperID { get; set; }
        public int SellerID { get; set; }
        public int ProductID { get; set; }
        public int Quantity { get; set; }
    }
}