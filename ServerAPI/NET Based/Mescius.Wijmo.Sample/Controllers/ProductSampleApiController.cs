using Mescius.Wijmo.Sample.Core;
using Mescius.Wijmo.Sample.Services;
using Microsoft.AspNetCore.Mvc;

namespace Mescius.Wijmo.Sample.Controllers
{
    [Route("wwi/api/v1/")]
    [ApiController]
    public class ProductSampleApiController : ControllerBase
    {
        private readonly IDataService _dataService;

        public ProductSampleApiController(IDataService wijmoSamplesService)
        {
            _dataService = wijmoSamplesService;
        }

        [HttpGet("purchaseorders")]
        public dynamic GetOrders([FromQuery] string filterBy = null, [FromQuery] string groupBy = null, [FromQuery] string sortBy = null, [FromQuery] string aggregates = null, [FromQuery] string select = null,[FromQuery] int skip = 0, [FromQuery] int top = 100)
        {
            try
            {
                QueryOptions queryOptions = new QueryOptions(filterBy, groupBy, sortBy, aggregates,select)
                {
                    Skip = skip,
                    Top = top
                };

                return _dataService.GetOrders(queryOptions);
            }
            catch (Exception ex)
            {
                return new
                {
                    error = ex.Message
                };
            }
        }
    }
}
