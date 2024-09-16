namespace Mescius.Wijmo.Sample.Core
{
    public class Aggregate
    {
        private string _raw;

        public string Property { get; }
        public string Alias { get; }
        public AggregateType Type { get; }

        public Aggregate(string property, AggregateType type, string alias = null, string raw = null)
        {
            Property = property;
            Type = type;
            Alias = alias;
            _raw = raw;
        }

        public override string ToString()
        {
            return _raw != null ? _raw : base.ToString();
        }
    }
}
