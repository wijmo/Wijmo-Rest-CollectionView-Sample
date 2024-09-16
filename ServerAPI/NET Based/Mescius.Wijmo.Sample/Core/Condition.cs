namespace Mescius.Wijmo.Sample.Core
{
    public class Condition
    {
        private string _raw;

        public string Property { get; }
        public FilterOperator Operator { get; }
        public object Value { get; }

        public Condition(string property, FilterOperator @operator, object value, string raw = null)
        {
            Property = property;
            Operator = @operator;
            Value = value;
            _raw = raw;
        }

        public override string ToString()
        {
            return _raw != null ? _raw : base.ToString();
        }
    }
}
