using System.Collections.Generic;

using System.Text.RegularExpressions;

namespace Mescius.Wijmo.Sample.Core
{


    public class QueryOptions
    {
        #region Data
        private static Dictionary<string, FilterOperator> _operatorMap = new Dictionary<string, FilterOperator>()
        {
            { "eq", FilterOperator.Equal },
            { "ne", FilterOperator.DoesNotEqual },
            { "gt", FilterOperator.GreaterThan },
            { "lt", FilterOperator.LessThan },
            { "ge", FilterOperator.GreaterThanEqual },
            { "le", FilterOperator.LessThanEqual },
            { "contains", FilterOperator.Contains },
            { "not-contains", FilterOperator.DoesNotContains },
            { "starts-with", FilterOperator.StartsWith },
            { "not-starts-with", FilterOperator.DoesNotStartsWith },
            { "ends-with", FilterOperator.EndsWith },
            { "not-ends-with", FilterOperator.DoesNotEndsWith }
        };
        private static Regex _conditionRegex = new Regex(@"^\(?(\w+)\s(" + string.Join("|", _operatorMap.Keys) + @"|\w+)\s('[^']*'|\d+\.?\d+)\)?$", RegexOptions.IgnoreCase | RegexOptions.Compiled);
        #endregion

        public Filter FilterBy { get; private set; }
        public List<Select> SelectedProperties { get; }
        public List<SortDescription> SortBy { get; }
        public List<string> GroupBy { get; }
        public List<Aggregate> Aggregates { get; }

        public int Skip { get; set; }
        public int Top { get; set; }

        public QueryOptions(string filterBy, string groupBy, string sortBy, string aggregates, string select)
        {
            Skip = 0;
            Top = 100;
            SortBy = new List<SortDescription>();
            GroupBy = new List<string>();
            Aggregates = new List<Aggregate>();
            SelectedProperties = new List<Select>();

            LoadFilterConditions(filterBy);
            LoadGroups(groupBy);
            LoadSortDescriptions(sortBy);
            LoadAggregates(aggregates);
            LoadSelectedProperties(select);
        }

        private void LoadSelectedProperties(string select)
        {
            if (string.IsNullOrEmpty(select))
            {
                return;
            }

            try
            {
                SelectedProperties.AddRange(SelectParser.Parse(select));
            }
            catch (ArgumentException ex)
            {
                throw ex;
            }
            catch
            {
                throw new ArgumentException("Invalid select expression provided.");
            }
        }

        private void LoadAggregates(string aggregates)
        {
            if (string.IsNullOrEmpty(aggregates))
            {
                return;
            }

            try
            {
                Aggregates.AddRange(AggregateParser.Parse(aggregates));
            }
            catch (ArgumentException ex)
            {
                throw ex;
            }
            catch
            {
                throw new ArgumentException("Invalid aggregates expression provided.");
            }
        }

        private void LoadSortDescriptions(string sortBy)
        {
            if (string.IsNullOrEmpty(sortBy))
            {
                return;
            }

            try
            {
                SortBy.AddRange(SortDescriptionParser.Parse(sortBy));
            }
            catch
            {
                throw new ArgumentException("Invalid sortBy expression provided.");
            }
        }

        private void LoadGroups(string groupBy)
        {
            if (string.IsNullOrEmpty(groupBy))
            {
                return;
            }

            try
            {
                foreach (string group in groupBy.Split(',', StringSplitOptions.RemoveEmptyEntries))
                {
                    if (string.IsNullOrEmpty(group))
                    {
                        continue;
                    }

                    GroupBy.Add(group.Trim());
                }
            }
            catch
            {
                throw new ArgumentException("Invalid groupBy expression provided.");
            }
        }

        private void LoadFilterConditions(string filterBy)
        {
            if (string.IsNullOrEmpty(filterBy))
            {
                return;
            }

            try
            {
                FilterBy = FilterParser.Parse(filterBy);
            }
            catch (ArgumentException ex)
            {
                throw;
            }
            catch
            {
                throw new ArgumentException("Invalid filterBy expression provided.");
            }
        }

        #region Filter parser
        public class FilterParser
        {
            public static Filter Parse(string input)
            {
                return ParseInternal(input, 0);
            }

            private static Filter ParseInternal(string input, int depth)
            {
                // Expression nesting limit
                if (depth == 16)
                {
                    throw new ArgumentException($"Invalid filter expression '{input}'");
                }

                // Trim outer parentheses if they exist
                input = input.Trim();

                var filter = new Filter();

                // Handle cases where there is a single condition or sub-filter
                if (_conditionRegex.IsMatch(input))
                {
                    filter.Conditions.Add(ParseCondition(input));
                    return filter;
                }

                // Split input by top-level 'and'/'or', respecting parentheses
                var splitResult = SplitByLogicalOperator(input);

                filter.Operator = splitResult.Operator;

                foreach (var part in splitResult.Parts)
                {
                    if (_conditionRegex.IsMatch(part))
                    {
                        filter.Conditions.Add(ParseCondition(part));
                    }
                    else
                    {
                        filter.SubFilters.Add(ParseInternal(Trim(part), ++depth));
                    }
                }

                return filter;
            }

            private static string Trim(string part)
            {
                if (part.StartsWith("(") && part.EndsWith(")"))
                {
                    return part.Substring(1, part.Length - 2);
                }

                return part;
            }

            private static (LogicalOperator Operator, List<string> Parts) SplitByLogicalOperator(string input)
            {
                int parenthesesLevel = 0;
                var parts = new List<string>();
                var currentPart = string.Empty;
                LogicalOperator? detectedOperator = null;

                for (int i = 0; i < input.Length; i++)
                {
                    char expressionCharacter = input[i];

                    if (expressionCharacter == '(')
                    {
                        parenthesesLevel++;
                    }

                    if (expressionCharacter == ')')
                    {
                        parenthesesLevel--;
                    }

                    if (parenthesesLevel == 0 && i < input.Length - 3)
                    {
                        if (input.Substring(i, 4).ToLower() == " and")
                        {
                            if (!detectedOperator.HasValue) detectedOperator = LogicalOperator.And;
                            parts.Add(currentPart.Trim());
                            currentPart = string.Empty;
                            i += 3;
                            continue;
                        }
                        if (input.Substring(i, 3).ToLower() == " or")
                        {
                            if (!detectedOperator.HasValue) detectedOperator = LogicalOperator.Or;
                            parts.Add(currentPart.Trim());
                            currentPart = string.Empty;
                            i += 2;
                            continue;
                        }
                    }

                    currentPart += expressionCharacter;
                }

                parts.Add(currentPart.Trim());

                return (detectedOperator ?? LogicalOperator.And, parts);
            }

            private static Condition ParseCondition(string input)
            {
                var match = _conditionRegex.Match(input);

                if (match.Success)
                {
                    var property = match.Groups[1].Value;
                    var operatorString = match.Groups[2].Value;
                    var valueString = match.Groups[3].Success ? match.Groups[3].Value : match.Groups[4].Value;

                    var op = ParseOperator(operatorString);
                    var value = ParseValue(valueString, op);
                    return new Condition(property, op, value, input);
                }

                throw new ArgumentException($"Invalid condition format: '{input}'");
            }

            private static FilterOperator ParseOperator(string input)
            {
                if (_operatorMap.TryGetValue(input.ToLower(), out var filterOperator))
                {
                    return filterOperator;
                }

                throw new ArgumentException($"Invalid filter operator: {input}");
            }

            private static object ParseValue(string valueString, FilterOperator @operator)
            {
                object value = null;

                if (DateTime.TryParse(valueString, out DateTime date))
                {
                    value = date;
                }

                if (value == null && decimal.TryParse(valueString, out decimal number))
                {
                    value = number;
                }

                if (value == null && bool.TryParse(valueString, out bool flag))
                {
                    value = flag;
                }

                switch (@operator)
                {
                    case FilterOperator.Contains:
                    case FilterOperator.DoesNotContains:
                    case FilterOperator.StartsWith:
                    case FilterOperator.DoesNotStartsWith:
                    case FilterOperator.EndsWith:
                    case FilterOperator.DoesNotEndsWith:
                        return valueString.Trim('\'');

                    default:
                        return value != null ? value : valueString.Trim('\'');

                }

                throw new ArgumentException($"Invalid value: {valueString}");
            }
        }
        #endregion

        #region Aggregate parser
        class AggregateParser
        {
            public static List<Aggregate> Parse(string input)
            {
                var aggregates = new List<Aggregate>();

                // Split by comma to handle multiple aggregate definitions
                var parts = input.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries);

                foreach (var part in parts)
                {
                    var trimmedPart = part.Trim();

                    // Use regex to match the pattern "AggregateType(Property)" optionally followed by "as Alias"
                    var match = Regex.Match(trimmedPart, @"(\w+)\((\w+)\)(?:\s+as\s+(\w+))?", RegexOptions.IgnoreCase);

                    if (match.Success)
                    {
                        var typeString = match.Groups[1].Value;
                        var property = match.Groups[2].Value;
                        var alias = match.Groups[3].Success ? match.Groups[3].Value : null;

                        // Convert the aggregate type string to the corresponding enum value
                        var aggregateType = ParseAggregateType(typeString);

                        // Create and add the Aggregate object to the list
                        aggregates.Add(new Aggregate(property, aggregateType, alias, match.Value));
                    }
                }

                return aggregates;
            }

            private static AggregateType ParseAggregateType(string input)
            {
                if (Enum.TryParse(input, true, out AggregateType type))
                {
                    return type;
                }

                throw new ArgumentException($"Invalid aggregate function: {input}");
            }
        }
        #endregion

        #region Sort description parser
        class SortDescriptionParser
        {
            public static List<SortDescription> Parse(string input)
            {
                List<SortDescription> sortDescriptions = new List<SortDescription>();

                foreach (string sort in input.Split(',', StringSplitOptions.RemoveEmptyEntries))
                {
                    if (string.IsNullOrEmpty(sort))
                    {
                        continue;
                    }

                    string[] sortInfo = sort.Trim().Split(' ');
                    string property = string.Empty;
                    SortOrder? sortOrder = null;

                    if (sortInfo.Length == 1)
                    {
                        property = sortInfo[0].Trim();

                        if (property.Length == 0)
                        {
                            continue;
                        }

                        sortOrder = SortOrder.Ascending;
                    }
                    else if (sortInfo.Length == 2)
                    {
                        property = sortInfo[0].Trim();

                        if (property.Length == 0)
                        {
                            continue;
                        }

                        switch (sortInfo[1].Trim().ToLower())
                        {
                            case "asc":
                                sortOrder = SortOrder.Ascending;
                                break;

                            case "desc":
                                sortOrder = SortOrder.Descending;
                                break;
                        }
                    }

                    if (!string.IsNullOrEmpty(property) && sortOrder.HasValue)
                    {
                        sortDescriptions.Add(new SortDescription(property, sortOrder.Value));
                    }
                }

                return sortDescriptions;
            }
        }
        #endregion

        #region Select parser
        class SelectParser
        {
            public static List<Select> Parse(string input)
            {
                var selects = new List<Select>();

                // Split by comma to handle multiple aggregate definitions
                var parts = input.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries);

                foreach (var part in parts)
                {
                    var trimmedPart = part.Trim();

                    // Use regex to match the pattern "AggregateType(Property)" optionally followed by "as Alias"
                    var match = Regex.Match(trimmedPart, @"(\w+)(?:\s+as\s+(\w+))?", RegexOptions.IgnoreCase);

                    if (match.Success)
                    {
                        var property = match.Groups[1].Value;
                        var alias = match.Groups[2].Success ? match.Groups[2].Value : null;

                        if (!selects.Any(x => x.Property.ToLower() == property.ToLower()))
                        {
                            selects.Add(new Select(property, alias, match.Value));
                        }
                    }
                }

                return selects;
            }

            private static AggregateType ParseAggregateType(string input)
            {
                if (Enum.TryParse(input, true, out AggregateType type))
                {
                    return type;
                }

                throw new ArgumentException($"Invalid aggregate function: {input}");
            }
        }
        #endregion
    }

}
