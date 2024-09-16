using Mescius.Wijmo.Sample.Core;
using Mescius.Wijmo.Sample.Data;
using Mescius.Wijmo.Sample.Model;
using Newtonsoft.Json;
using System.Linq;
using System.Reflection;

namespace Mescius.Wijmo.Sample.Services
{
    public interface IDataService
    {
        dynamic GetOrders(QueryOptions queryOptions);
    }

    public class DataService : IDataService
    {
        private readonly DataContext _context;

        public DataService(DataContext context)
        {
            _context = context;
        }

        public dynamic GetOrders(QueryOptions queryOptions)
        {
            ValidateQuery(queryOptions);

            var orders = _context.GetAllOrders().OrderBy(x=>x.OrderId).AsQueryable();

            if (queryOptions.FilterBy != null)
            {
                orders = orders
                    .Where(queryOptions.FilterBy.ToPredicate<Order>())
                    .AsQueryable();
            }

            if (queryOptions.GroupBy.Count > 0)
            {
                return PrepareGroupedData(orders, orders.Count(), queryOptions);
            }
            else
            {
                return PrepareUngroupedData(orders, orders.Count(), queryOptions);
            }
        }

        private dynamic PrepareGroupedData(IQueryable<Order> orders, int totalItems, QueryOptions queryOptions)
        {
            try
            {
                var grouped = orders.GroupByProperties(queryOptions.GroupBy);
                int totalGroups = grouped.Count();
                IEnumerable<dynamic> groupedItems = grouped.Select(x =>
                {
                    Dictionary<string, object> aggregateValues = null;

                    if (queryOptions.Aggregates.Count > 0)
                    {
                        aggregateValues = new Dictionary<string, object>();

                        try
                        {
                            queryOptions.Aggregates.ForEach(aggregate =>
                            {
                                aggregateValues[aggregate.Alias != null ? aggregate.Alias : aggregate.Property] = CalculateAggregate(aggregate, x);
                            });
                        }
                        catch
                        {
                            throw new ArgumentException("Invalid aggregate info provided.");
                        }
                    }

                    return new
                    {
                        groupKey = JsonConvert.DeserializeObject<Dictionary<string, object>>(x.Key.ToString()),
                        count = x.Count(),
                        aggregates = aggregateValues
                    };
                });

                if (queryOptions.SortBy.Count > 0)
                {
                    IOrderedEnumerable<dynamic> orderedGroups = null;

                    try
                    {
                        queryOptions.SortBy.ForEach(sortDescription =>
                        {
                            if (orderedGroups == null)
                            {
                                orderedGroups = sortDescription.SortOrder == SortOrder.Ascending ?
                                            groupedItems.OrderBy(x => x.groupKey[sortDescription.Property]) :
                                            groupedItems.OrderByDescending(x => x.groupKey[sortDescription.Property]);
                            }
                            else
                            {
                                orderedGroups = sortDescription.SortOrder == SortOrder.Ascending ?
                                            orderedGroups.ThenBy(x => x.groupKey[sortDescription.Property]) :
                                            orderedGroups.ThenByDescending(x => x.groupKey[sortDescription.Property]);
                            }
                        });
                    }
                    catch
                    {
                        throw new ArgumentException("Invalid sort info provided.");
                    }

                    groupedItems = orderedGroups;
                }

                groupedItems = groupedItems.Skip(queryOptions.Skip)
                    .Take(queryOptions.Top);

                return new
                {
                    groupItems = groupedItems,
                    totalGroupCount = totalGroups,
                    totalItemCount = totalItems
                };
            }
            catch
            {
                throw new ArgumentException("Invalid grouping info.");
            }
        }

        private dynamic PrepareUngroupedData(IQueryable<Order> orders, int totalItems, QueryOptions queryOptions)
        {
            if (queryOptions.SortBy.Count > 0)
            {
                IOrderedQueryable<Order> orderedGroups = null;

                try
                {
                    queryOptions.SortBy.ForEach(sortDescription =>
                    {
                        PropertyInfo propertyInfo = typeof(Order).GetProperty(sortDescription.Property);

                        if (orderedGroups == null)
                        {
                            orderedGroups = sortDescription.SortOrder == SortOrder.Ascending ?
                                        orders.OrderBy(x => propertyInfo.GetValue(x)) :
                                        orders.OrderByDescending(x => propertyInfo.GetValue(x));
                        }
                        else
                        {
                            orderedGroups = sortDescription.SortOrder == SortOrder.Ascending ?
                                        orderedGroups.ThenBy(x => propertyInfo.GetValue(x)) :
                                        orderedGroups.ThenByDescending(x => propertyInfo.GetValue(x));
                        }
                    });
                }
                catch
                {
                    throw new ArgumentException("Invalid sort info provided.");
                }

                orders = orderedGroups;
            }

            orders = orders.Skip(queryOptions.Skip)
            .Take(queryOptions.Top);

            return new
            {
                items = queryOptions.SelectedProperties.Count > 0 ? SelectFields(queryOptions.SelectedProperties, orders) :
                        orders.AsQueryable(),
                totalItemCount = totalItems
            };
        }

        private IQueryable<dynamic> SelectFields(List<Select> selectedFields, IQueryable<Order> orders)
        {
            Dictionary<string, PropertyInfo> properties = typeof(Order).GetProperties().ToDictionary(x => x.Name, x => x);

            return orders.AsEnumerable().Select(x =>
            {
                Dictionary<string, object> record = new Dictionary<string, object>();

                foreach (var field in selectedFields)
                {
                    record[field.Alias != null ? field.Alias : field.Property] = properties[field.Property].GetValue(x);
                }

                return record;

            }).AsQueryable();
        }

        private void ValidateQuery(QueryOptions queryOptions)
        {
            HashSet<string> validProperties = typeof(Order).GetProperties().Select(x => x.Name).ToHashSet();

            if (queryOptions.Skip < 0)
            {
                queryOptions.Skip = 0;
            }

            if (queryOptions.Top < 0)
            {
                queryOptions.Top = 100;
            }

            if (queryOptions.FilterBy != null)
            {
                // Validate filters and subfilters
                ValidateFilter(queryOptions.FilterBy, validProperties);
            }

            if (queryOptions.SelectedProperties.Count > 0)
            {
                queryOptions.SelectedProperties.ForEach(select =>
                {
                    if (!validProperties.Contains(select.Property))
                    {
                        throw new ArgumentException($"Invalid select '{select}'. Field name is not correct.");
                    }
                });
            }

            if (queryOptions.Aggregates.Count > 0)
            {
                // Validate aggregate fields
                queryOptions.Aggregates.ForEach(aggregate =>
                {
                    if (!validProperties.Contains(aggregate.Property))
                    {
                        throw new ArgumentException($"Invalid aggregate '{aggregate}'. Field name is not correct.");
                    }
                });
            }

            if (queryOptions.SortBy.Count > 0)
            {
                queryOptions.SortBy.ForEach(sort =>
                {
                    // Validate sortBy values
                    if (!validProperties.Contains(sort.Property))
                    {
                        throw new ArgumentException($"Invalid sortBy '{sort.Property}'");
                    }

                    // Validate if sorting is done on grouped keys
                    if (queryOptions.GroupBy.Count > 0 && !queryOptions.GroupBy.Contains(sort.Property))
                    {
                        throw new ArgumentException($"Invalid sortBy '{sort.Property}'. Grouped data can only be sorted on grouped keys.");
                    }
                });
            }

            if (queryOptions.GroupBy.Count > 0)
            {
                queryOptions.GroupBy.ForEach(groupBy =>
                {
                    // Validate groupBy values
                    if (!validProperties.Contains(groupBy))
                    {
                        throw new ArgumentException($"Invalid groupBy '{groupBy}'. Field name is not correct.");
                    }
                });
            }
        }

        private void ValidateFilter(Filter filterBy, HashSet<string> validProperties)
        {
            foreach (Condition condition in filterBy.Conditions)
            {
                if (!validProperties.Contains(condition.Property))
                {
                    throw new ArgumentException($"Invalid filterBy condition '{condition}'. Field name is not correct.");
                }
            }

            foreach (Filter subFilter in filterBy.SubFilters)
            {
                ValidateFilter(subFilter, validProperties);
            }
        }

        private object CalculateAggregate(Aggregate aggregate, IEnumerable<Order> orders)
        {
            PropertyInfo info = typeof(Order).GetProperty(aggregate.Property);

            switch (aggregate.Type)
            {
                case AggregateType.Average:
                    if (info.PropertyType == typeof(decimal))
                    {
                        return orders.Average(x => (decimal)info.GetValue(x));
                    }
                    else if (info.PropertyType == typeof(int))
                    {
                        return orders.Average(x => (int)info.GetValue(x));
                    }
                    else if (info.PropertyType == typeof(long))
                    {
                        return orders.Average(x => (long)info.GetValue(x));
                    }
                    return 0;

                case AggregateType.Sum:
                    if (info.PropertyType == typeof(decimal))
                    {
                        return orders.Sum(x => (decimal)info.GetValue(x));
                    }
                    else if (info.PropertyType == typeof(int))
                    {
                        return orders.Sum(x => (int)info.GetValue(x));
                    }
                    else if (info.PropertyType == typeof(long))
                    {
                        return orders.Sum(x => (long)info.GetValue(x));
                    }
                    return 0;


                case AggregateType.Max:
                    if (info.PropertyType == typeof(decimal))
                    {
                        return orders.Max(x => (decimal)info.GetValue(x));
                    }
                    else if (info.PropertyType == typeof(int))
                    {
                        return orders.Max(x => (int)info.GetValue(x));
                    }
                    else if (info.PropertyType == typeof(long))
                    {
                        return orders.Max(x => (long)info.GetValue(x));
                    }
                    return 0;

                case AggregateType.Min:
                    if (info.PropertyType == typeof(decimal))
                    {
                        return orders.Min(x => (decimal)info.GetValue(x));
                    }
                    else if (info.PropertyType == typeof(int))
                    {
                        return orders.Min(x => (int)info.GetValue(x));
                    }
                    else if (info.PropertyType == typeof(long))
                    {
                        return orders.Min(x => (long)info.GetValue(x));
                    }
                    return 0;

                case AggregateType.First:
                    if (orders.Any())
                    {
                        return null;
                    }
                    return info.GetValue(orders.First());

                case AggregateType.Last:
                    if (orders.Any())
                    {
                        return null;
                    }
                    return info.GetValue(orders.Last());

                case AggregateType.Count:
                    return orders.Count();
            }

            return 0;
        }
    }

    internal static class QueryExtensions
    {
        /// <summary>
        /// Groups a collection by multiple properties.
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="source"></param>
        /// <param name="propertyNames"></param>
        /// <returns></returns>
        public static IEnumerable<IGrouping<object, T>> GroupByProperties<T>(
            this IEnumerable<T> source,
            List<string> propertyNames)
        {
            Type itemType = typeof(T);
            return source.GroupBy(item => CreateGroupKey(item, itemType, propertyNames));
        }

        private static object CreateGroupKey<T>(T item, Type type, List<string> propertyNames)
        {
            Dictionary<string, object> key = new Dictionary<string, object>();

            propertyNames.ForEach(propertyName =>
            {
                var property = type.GetProperty(propertyName);
                key[property.Name] = property.GetValue(item);
            });

            return JsonConvert.SerializeObject(key);
        }

        /// <summary>
        /// Creates a predicate for filter
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="filter"></param>
        /// <returns></returns>
        public static Func<T, bool> ToPredicate<T>(this Filter filter)
        {
            return BuildPredicate<T>(filter);
        }

        private static Func<T, bool> BuildPredicate<T>(Filter filter)
        {
            var conditions = filter.Conditions
                .Select(BuildConditionPredicate<T>)
                .ToList();

            var subFilters = filter.SubFilters
                .Select(BuildPredicate<T>)
                .ToList();

            return item =>
            {
                bool result = filter.Operator == LogicalOperator.And;

                // Evaluate all conditions
                foreach (var condition in conditions)
                {
                    bool conditionResult = condition(item);
                    if (filter.Operator == LogicalOperator.And)
                    {
                        result &= conditionResult;
                        if (!result) return false;
                    }
                    else
                    {
                        result |= conditionResult;
                        if (result) return true;
                    }
                }

                // Evaluate all subfilters
                foreach (var subFilter in subFilters)
                {
                    bool subFilterResult = subFilter(item);
                    if (filter.Operator == LogicalOperator.And)
                    {
                        result &= subFilterResult;
                        if (!result) return false;
                    }
                    else
                    {
                        result |= subFilterResult;
                        if (result) return true;
                    }
                }

                return result;
            };
        }

        private static Func<T, bool> BuildConditionPredicate<T>(Condition condition)
        {
            var propertyInfo = typeof(T).GetProperty(condition.Property);

            if (propertyInfo == null)
                throw new ArgumentException($"Property '{condition.Property}' is not valid.");

            int errorCount = 0;

            return item =>
            {
                try
                {
                    if (errorCount > 2)
                    {
                        return false;
                    }

                    var propertyValue = propertyInfo.GetValue(item);
                    var conditionValue = Convert.ChangeType(condition.Value, propertyInfo.PropertyType);

                    return condition.Operator switch
                    {
                        FilterOperator.Equal => Equals(propertyValue, conditionValue),
                        FilterOperator.DoesNotEqual => !Equals(propertyValue, conditionValue),
                        FilterOperator.GreaterThan => Comparer<object>.Default.Compare(propertyValue, conditionValue) > 0,
                        FilterOperator.LessThan => Comparer<object>.Default.Compare(propertyValue, conditionValue) < 0,
                        FilterOperator.GreaterThanEqual => Comparer<object>.Default.Compare(propertyValue, conditionValue) >= 0,
                        FilterOperator.LessThanEqual => Comparer<object>.Default.Compare(propertyValue, conditionValue) <= 0,

                        FilterOperator.Contains => propertyValue?.ToString()?.Contains(conditionValue.ToString()) == true,
                        FilterOperator.DoesNotContains => !(propertyValue?.ToString()?.Contains(conditionValue.ToString()) == true),
                        FilterOperator.StartsWith => propertyValue?.ToString()?.StartsWith(conditionValue.ToString()) == true,
                        FilterOperator.DoesNotStartsWith => !(propertyValue?.ToString()?.StartsWith(conditionValue.ToString()) == true),
                        FilterOperator.EndsWith => propertyValue?.ToString()?.EndsWith(conditionValue.ToString()) == true,
                        FilterOperator.DoesNotEndsWith => !(propertyValue?.ToString()?.EndsWith(conditionValue.ToString()) == true)
                    };
                }
                catch
                {
                    errorCount++;
                    return false;
                }
            };
        }
    }
}
