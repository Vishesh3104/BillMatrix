namespace BILLMATRIX1.Domain.Entities
{
    public class GstReportItem
    {
        public string Month   { get; set; } = "";
        public decimal Amount { get; set; }
    }

    public class SalesReportItem
    {
        public string Month   { get; set; } = "";
        public decimal Amount { get; set; }
    }

    public class InvoiceReport
    {
        public int Total   { get; set; }
        public int Paid    { get; set; }
        public int Pending { get; set; }
    }
}