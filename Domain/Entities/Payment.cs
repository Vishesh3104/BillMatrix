public class Payment
{
    public int     Id          { get; set; }
    public decimal Amount      { get; set; }
    public string  Mode        { get; set; } = "";
    public DateTime Date       { get; set; }
    public string  PartyName   { get; set; } = "";
    public string  RefNumber   { get; set; } = "";
    public string  PaymentType { get; set; } = "";
    public string  Status      { get; set; } = "";
}