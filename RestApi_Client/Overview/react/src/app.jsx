import 'bootstrap.css';
import '@mescius/wijmo.styles/wijmo.css';
import ReactDOM from 'react-dom/client';
import React, { useRef, useState } from 'react';
import { CollectionViewNavigator } from '@mescius/wijmo.react.input';
import { FlexGrid } from '@mescius/wijmo.react.grid';
import { FlexGridFilter } from '@mescius/wijmo.react.grid.filter';
import { RestCollectionViewExt } from "./rest-collection-view-ext";
import { createElement } from '@mescius/wijmo';
import './app.css';
// field info for PurchaseOrders table
const fields = 'OrderId,StockItem,Color,State,City,Quantity,UnitPrice,Date,IsChillerStock'.split(',');
function App() {
    //collectionView settings
    const settings = {
        fields: fields,
        pageSize: 100,
        virtualization: false,
        loading: () => { toggleSpinner(gridRef.current.control, true); },
        loaded: () => { toggleSpinner(gridRef.current.control, false); }
    };
    const [enablePaging, setEnablePaging] = useState(true);
    const [isReadOnly] = useState(true);
    //create RestCollectionViewExt instance
    const [view] = useState(new RestCollectionViewExt('purchaseorders', settings));
    const gridRef = useRef(null);
    const navRef = useRef(null);
    //toggle b/w paging and virtualization
    const toggleFeature = (feature) => {
        if (feature === 'paging') {
            setEnablePaging(true);
            view.pageSize = 100;
            view.virtualization = false;
        }
        else {
            setEnablePaging(false);
            view.pageSize = 0;
            view.virtualization = true;
        }
    };
    return (<div className="container-fluid">
      <label>

        <input id="paging" type="radio" name="viewtype" value="paging" checked={enablePaging} onChange={() => toggleFeature('paging')}/>Paging
      </label>

      <label>

        <input id="virtualization" type="radio" name="viewtype" value="virtualization" checked={!enablePaging} onChange={() => toggleFeature('virtualization')}/>Virtualization
      </label>

      <br />

      {enablePaging && (<CollectionViewNavigator ref={navRef} cv={view} byPage={true}/>)}

      <FlexGrid ref={gridRef} isReadOnly={isReadOnly} itemsSource={view}>
        <FlexGridFilter />
      </FlexGrid>
    </div>);
}
//show gif loader while data loading
function toggleSpinner(grid, show) {
    let _rect = grid.controlRect;
    let elem = grid.hostElement.querySelector('.spinner');
    if (!elem)
        elem = createElement(`<div class='spinner' style="left:${_rect.left}px;top:${_rect.top}px;width:${_rect.width}px;height:${_rect.height}px;"><img src="resources/Rounded%20blocks.gif"></div>`, grid.hostElement);
    elem.style.display = show ? 'block' : 'none';
}
const container = document.getElementById('app');
if (container) {
    const root = ReactDOM.createRoot(container);
    root.render(<App />);
}
