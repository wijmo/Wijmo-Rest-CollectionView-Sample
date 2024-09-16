namespace Mescius.Wijmo.Sample.Core
{
    public class SortDescription
    {
        public string Property { get; }
        public SortOrder SortOrder { get; }

        public SortDescription(string property, SortOrder sortOrder)
        {
            Property = property;
            SortOrder = sortOrder;
        }
    }
}
