namespace Mescius.Wijmo.Sample.Core
{
    public class Select
    {
        private string _raw;

        public string Property { get; }
        public string Alias { get; }

        public Select(string property, string alias = null, string raw = null)
        {
            Property = property;
            Alias = alias;
            _raw = raw;
        }

        public override string ToString()
        {
            return _raw != null ? _raw : base.ToString();
        }
    }
}
