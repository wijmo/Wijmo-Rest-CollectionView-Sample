import 'bootstrap.css';
import '@mescius/wijmo.styles/wijmo.css';
import './styles.css';
//
import { RestCollectionViewExt } from "./rest-collection-view-ext";
import { CollectionViewNavigator } from '@mescius/wijmo.input';
import { createElement } from '@mescius/wijmo';
import { FlexGrid } from '@mescius/wijmo.grid';
import { FlexGridFilter } from '@mescius/wijmo.grid.filter';
// field info for PurchaseOrders table
const fields = 'OrderId,StockItem,Color,State,City,Quantity,UnitPrice,Date,IsChillerStock'.split(',');
document.readyState === 'complete' ? init() : window.onload = init;
//
function init() {
    // initialize PageSize
    const pageSize = 100;
    // create the grid to show the data
    let theGrid = new FlexGrid('#theGrid', {
        isReadOnly: true,
        // create RestCollectionViewExt
        itemsSource: new RestCollectionViewExt('purchaseorders', {
            fields: fields,
            pageSize: pageSize,
            loading: () => { toggleSpinner(theGrid, true); },
            loaded: () => { toggleSpinner(theGrid, false); }
        })
    });
    // add the filter
    new FlexGridFilter(theGrid);
    // add the navigator
    let nav = new CollectionViewNavigator('#theNavigator', {
        cv: theGrid.collectionView,
        byPage: true
    });
    // toggle b/w pagination and virtualization
    document.body.addEventListener('click', e => {
        let radio = e.target, view = theGrid.collectionView;
        if (radio.name == "viewtype" && radio.id === 'paging') {
            view.virtualization = false;
            view.pageSize = pageSize;
            nav.hostElement.style.display = 'inline-flex';
        }
        if (radio.name == "viewtype" && radio.id !== 'paging') {
            let view = theGrid.collectionView;
            view.virtualization = true;
            view.pageSize = 0;
            nav.hostElement.style.display = 'none';
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
