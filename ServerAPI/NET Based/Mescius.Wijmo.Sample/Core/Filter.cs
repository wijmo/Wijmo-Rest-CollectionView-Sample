namespace Mescius.Wijmo.Sample.Core
{
    public class Filter
    {
        public LogicalOperator Operator { get; set; }
        public List<Condition> Conditions { get; }
        public List<Filter> SubFilters { get; }

        public Filter()
        {
            Conditions = new List<Condition>();
            SubFilters = new List<Filter>();
            Operator = LogicalOperator.And;
        }
    }
}
