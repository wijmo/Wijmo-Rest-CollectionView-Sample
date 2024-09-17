const express = require('express');
const cors = require('cors');
const { GetPurchaseOrdersData } = require('./data');
const app = express();
const port = 4000;

// Enable CORS for all domains
app.use(cors());

app.use(express.json());

// Pre-generate the data as in your C# example
const ProductTransactions = GetPurchaseOrdersData(1000);

// Function to parse and evaluate filter expressions
function applyFilter(query, filterBy) {
    const decodedFilter = decodeURIComponent(filterBy);
    var jsFilter = decodedFilter
        .replace(/\b(eq|ne|gt|lt|ge|le)\b/g, match => {
            switch (match) {
                case 'eq': return '===';
                case 'ne': return '!==';
                case 'gt': return '>';
                case 'lt': return '<';
                case 'ge': return '>=';
                case 'le': return '<=';
                default: return match;
            }
        })
        .replace(/\band\b/g, '&&')
        .replace(/\bor\b/g, '||')
        .replace(/\bnot\b/g,'!');
    
    jsFilter=(jsFilter.replace(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z)/g, "'$1'"));
    const filterFunction = new Function('item', substringof.name,startswith.name,endswith.name, `
        var {OrderId,StockItem,Quantity,TaxAmount,TaxRate,Color,IsChillerStock,UnitPrice,State,City,Country,Date}=item;        
        Date=JSON.stringify(Date).slice(1, -1);
        return ${jsFilter};
    `);
    return query.filter(item => filterFunction(item,substringof,startswith,endswith));
}
function substringof(fullString, substring) {
    return fullString.includes(substring);
}
function startswith(fullString,prefix) {
    return fullString.startsWith(prefix);
}
function endswith(fullString,suffix) {
    return fullString.endsWith(suffix);
}
// Function to calculate aggregates
function calculateAggregates(items, aggregates) {
    const result = {};
    aggregates.forEach(aggregate => {
        const match = aggregate.match(/(\w+)\(([\w\d]+)\)/);
        const func = match[1];
        const field = match[2];

        switch (func) {
            case 'Avg':
                result[`${field}`] = items.reduce((acc, item) => acc + item[field], 0) / items.length;
                break;
            case 'Cnt':
                result[`${field}`] = items.length;
                break;
            case 'CntAll':
                result['count'] = items.length;
                break;
            case 'First':
                result[`${field}`] = items[0][field];
                break;
            case 'Last':
                result[`${field}`] = items[items.length - 1][field];
                break;
            case 'Max':
                result[`${field}`] = Math.max(...items.map(item => item[field]));
                break;
            case 'Min':
                result[`${field}`] = Math.min(...items.map(item => item[field]));
                break;
            case 'Rng':
                result[`${field}`] = Math.max(...items.map(item => item[field])) - Math.min(...items.map(item => item[field]));
                break;
            case 'Std':
                const mean = items.reduce((acc, item) => acc + item[field], 0) / items.length;
                result[`${field}`] = Math.sqrt(items.reduce((acc, item) => acc + Math.pow(item[field] - mean, 2), 0) / (items.length - 1));
                break;
            case 'StdPop':
                const meanPop = items.reduce((acc, item) => acc + item[field], 0) / items.length;
                result[`${field}`] = Math.sqrt(items.reduce((acc, item) => acc + Math.pow(item[field] - meanPop, 2), 0) / items.length);
                break;
            case 'Sum':
                result[`${field}`] = items.reduce((acc, item) => acc + item[field], 0);
                break;
            case 'Var':
                const meanVar = items.reduce((acc, item) => acc + item[field], 0) / items.length;
                result[`${field}`] = items.reduce((acc, item) => acc + Math.pow(item[field] - meanVar, 2), 0) / (items.length - 1);
                break;
            case 'VarPop':
                const meanVarPop = items.reduce((acc, item) => acc + item[field], 0) / items.length;
                result[`${field}`] = items.reduce((acc, item) => acc + Math.pow(item[field] - meanVarPop, 2), 0) / items.length;
                break;
            case 'None':
                result[`${field}`] = items[0][field];
                break;
            default:
                result[`${field}`] = items[0][field];
                break;
        }
    });
    return result;
}
// Function to group items
function GroupBy(items, groupByFields, aggregates) {
    const grouped = items.reduce((acc, item) => {
        const key = groupByFields.map(field => item[field]).join('|');
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(item);
        return acc;
    }, {});

    const result = Object.entries(grouped).map(([key, items]) => {
        const groupKey = key.split('|').reduce((acc, value, index) => {
            acc[groupByFields[index]] = value;
            return acc;
        }, {});

        return {
            groupKey,
            count: items.length,
            aggregates: calculateAggregates(items, aggregates)
        };
    });

    return result;
}

app.get('/wwi/api/v1/purchaseorders', (req, res) => {
    const { groupBy, filterBy, sortBy, skip, top, aggregates, select} = req.query;

    let query = ProductTransactions;

    // Apply filtering
    if (filterBy) {
        query = applyFilter(query, filterBy);
    }

    // Apply grouping
    let groupedItems = [];
    if (groupBy) {
        const groupByFields = groupBy.split(',');
        const aggregateFuncs = aggregates ? aggregates.split(',').map(a => a.trim()) : [];
        groupedItems = GroupBy(query, groupByFields, aggregateFuncs);
    } else {
        groupedItems = query;
    }

    // Apply sorting
    const itemsToSort = groupBy ? Array.from(groupedItems) : Array.from(query);
    if (sortBy) {
        const sortByFields = sortBy.split(',').map(o => o.trim());
        itemsToSort.sort((a, b) => {
            for (const field of sortByFields) {
                const [key, direction] = field.split(' ');
                const aValue = groupBy ? a.groupKey[key] : a[key];
                const bValue = groupBy ? b.groupKey[key] : b[key];

                // Convert string values to lowercase for case-insensitive comparison
                const aLower = typeof aValue === 'string' ? aValue.toLowerCase() : aValue;
                const bLower = typeof bValue === 'string' ? bValue.toLowerCase() : bValue;

                const comparison = aLower < bLower ? -1 : (aLower > bLower ? 1 : 0);
                if (comparison !== 0) {
                    return direction === 'DESC' ? -comparison : comparison;
                }
            }   
            return 0;
        }); 
    }

    // Apply pagination
    const totalItemCount = itemsToSort.length;
    let items = itemsToSort;
    if (skip !== undefined && top !== undefined) {
        items = itemsToSort.slice(parseInt(skip, 10), parseInt(skip, 10) + parseInt(top, 10));
    }
    // Apply select
    if (select) {
        const selectFields = select.split(',').map(field => field.trim());
        if (selectFields.length > 0) {
            items = items.map(item => {
                const selectedItem = {};
                selectFields.forEach(field => {
                    if (item[field] !== undefined) {
                        selectedItem[field] = item[field];
                    }
                });
                return selectedItem;
            });
        }
    }
    if (groupBy) {
        let _totalItemCount = 0;
        for (var i = 0; i < groupedItems.length; i++) {
            _totalItemCount += groupedItems[i].count;
        }
        res.json({ groupItems: items, totalGroupCount: items.length, totalItemCount: _totalItemCount });
    } else {
        res.json({ items, totalItemCount });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`Swagger Doc at http://localhost:${port}/api-docs/`)
});
const swaggerUIPath= require("swagger-ui-express");
const swaggerjsonFilePath = require("./docs/swagger.json");
app.use("/api-docs", swaggerUIPath.serve, swaggerUIPath.setup(swaggerjsonFilePath));