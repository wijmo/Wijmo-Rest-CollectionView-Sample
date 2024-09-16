using System.Text.Json.Serialization;

namespace Mescius.Wijmo.Sample.Model
{
    public class Order
    {
        [JsonPropertyName("OrderId")]
        public long OrderId { get; set; }
        [JsonPropertyName("StockItem")]
        public string StockItem { get; set; }
        [JsonPropertyName("Quantity")]
        public int Quantity { get; set; }
        [JsonPropertyName("TaxAmount")]
        public decimal TaxAmount { get; set; }
        [JsonPropertyName("TaxRate")]
        public decimal TaxRate { get; set; }
        [JsonPropertyName("Color")]
        public string Color { get; set; }
        [JsonPropertyName("IsChillerStock")]
        public bool IsChillerStock { get; set; }
        [JsonPropertyName("UnitPrice")]
        public decimal UnitPrice { get; set; }
        [JsonPropertyName("State")]
        public string State { get; set; }
        [JsonPropertyName("City")]
        public string City { get; set; }
        [JsonPropertyName("Country")]
        public string Country { get; set; }
        [JsonPropertyName("Date")]
        public DateTime Date { get; set; }
    }
}
