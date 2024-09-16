using Mescius.Wijmo.Sample.Model;
using Newtonsoft.Json;

namespace Mescius.Wijmo.Sample.Data
{
    public class DataContext
    {
        private IQueryable<Order> _orders;

        public IQueryable<Order> GetAllOrders()
        {
            if(_orders == null)
            {
                LoadOrders();
            }

            return _orders;
        }

        public void LoadOrders()
        {
            List<Order> orders = JsonConvert.DeserializeObject<List<Order>>(File.ReadAllText("Data\\data.json"));
            _orders = orders.AsQueryable();
        }
    }
}
