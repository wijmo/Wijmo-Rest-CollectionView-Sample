import 'bootstrap.css';
import '@mescius/wijmo.styles/wijmo.css';
import './styles.css';
//
import { RestGroupCollectionView } from "./rest-group-collection-view";
import { DataType, createElement } from '@mescius/wijmo';
import { FlexGrid } from '@mescius/wijmo.grid';
import { FlexGridFilter } from '@mescius/wijmo.grid.filter';
// field info for PurchaseOrders table
const fields = 'OrderId,StockItem,Color,State,City,Quantity,UnitPrice,Date,IsChillerStock'.split(',');
document.readyState === 'complete' ? init() : window.onload = init;
//
function init() {
    let _firstLoad = true;
    let cvSettings = {
        virtualization: false,
        groupLazyLoading: false,
        fields: fields,
        groupDescriptions: ['State', 'City'],
        loading: () => { toggleSpinner(theGrid, true); },
        loaded: (s, e) => {
            toggleSpinner(theGrid, false);
            if (_firstLoad) {
                _firstLoad = false;
                // select first group row 
                setTimeout(() => {
                    theGrid.select(0, 0);
                });
            }
        }
    };
    // create the grid to show the data
    let theGrid = new FlexGrid('#theGrid', {
        isReadOnly: true,
        autoGenerateColumns: false,
        columns: [
            { binding: "OrderId", header: "Order ID" },
            { binding: "StockItem", header: "Stock Item", width: "*", minWidth: 200 },
            { binding: "Color", header: "Color" },
            { binding: "Quantity", header: "Quantity", dataType: DataType.Number, format: 'n0' },
            { binding: "UnitPrice", header: "Unit Price", dataType: DataType.Number, format: 'n2' },
            { binding: "Date", header: "Date", dataType: DataType.Date },
            { binding: "IsChillerStock", header: "Is Chiller Stock", dataType: DataType }
        ],
        //create RestGroupCollectionView instance 
        //with settings for default server grouping on first load
        itemsSource: new RestGroupCollectionView('purchaseorders', cvSettings)
    });
    // add the filter with Condition filter as default 
    new FlexGridFilter(theGrid, {
        defaultFilterType: 'Condition'
    });
    document.getElementById("feature-options").addEventListener('click', (e) => {
        let element = e.target;
        // to avoid click for label
        switch (element && element.id) {
            case 'groupServer':
                cvSettings.virtualization = false;
                cvSettings.groupLazyLoading = false;
                break;
            case 'virtual':
                cvSettings.virtualization = true;
                cvSettings.groupLazyLoading = false;
                break;
            case 'lazyload':
                cvSettings.virtualization = false;
                cvSettings.groupLazyLoading = true;
                break;
        }
        if (element.tagName == "INPUT") {
            _firstLoad = true; //reset _firstLoad before CV change
            theGrid.itemsSource = new RestGroupCollectionView('purchaseorders', cvSettings);
        }
    });
}
//show gif loader while data loading
function toggleSpinner(grid, show) {
    let _rect = grid.controlRect;
    let elem = grid.hostElement.querySelector('.spinner');
    if (!elem)
        elem = createElement(`<div class='spinner' style="left:${_rect.left}px;top:${_rect.top}px;width:${_rect.width}px;height:${_rect.height}px;"><img src="resources/Rounded%20blocks.gif"></div>`, grid.hostElement);
    elem.style.display = show ? 'block' : 'none';
}
