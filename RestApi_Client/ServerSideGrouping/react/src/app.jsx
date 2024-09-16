import 'bootstrap.css';
import '@mescius/wijmo.styles/wijmo.css';
import ReactDOM from 'react-dom/client';
import React, { useRef, useState } from 'react';
import { FlexGrid, FlexGridColumn } from '@mescius/wijmo.react.grid';
import { FlexGridFilter } from '@mescius/wijmo.react.grid.filter';
import { RestGroupCollectionView } from './rest-group-collection-view';
import { createElement } from '@mescius/wijmo';
import './app.css';
// field info for PurchaseOrders table
const fields = 'OrderId,StockItem,Color,State,City,Quantity,UnitPrice,Date,IsChillerStock'.split(',');
function App() {
    const [selectedFeature, setSelectedFeature] = useState('groupServer');
    const [isReadOnly, setIsReadOnly] = useState(true);
    const _isFirstLoad = useRef(true);
    const flexRef = useRef(null);
    const flexInitialized = (flexgrid) => {
        flexRef.current = flexgrid;
        //create RestGroupCollectionView instance 
        //with settings for default server grouping on first load
        flexRef.current.itemsSource = new RestGroupCollectionView('purchaseorders', settings);
    };
    const settings = {
        fields: fields,
        virtualization: false,
        groupLazyLoading: false,
        groupDescriptions: ['State', 'City'],
        loading: () => { toggleSpinner(flexRef.current, true); },
        loaded: (s, e) => {
            toggleSpinner(flexRef.current, false);
            if (_isFirstLoad.current) {
                _isFirstLoad.current = false;
                // select first group row 
                setTimeout(() => {
                    flexRef.current.select(0, 0);
                });
            }
        }
    };
    const toggleFeature = (feature) => {
        setSelectedFeature(feature);
        _isFirstLoad.current = true;
        //default server group
        if (feature == "groupServer") {
            settings.virtualization = false;
            settings.groupLazyLoading = false;
        }
        // enable virtualization
        if (feature == "virtual") {
            settings.virtualization = true;
            settings.groupLazyLoading = false;
        }
        //enable group lazy loading
        if (feature == "lazyload") {
            settings.virtualization = false;
            settings.groupLazyLoading = true;
        }
        // reset itemsSource    
        flexRef.current.itemsSource = new RestGroupCollectionView('purchaseorders', settings);
    };
    return (<div className="container-fluid">
      <div id="feature-options">
        <label htmlFor="groupServer">
          <input id="groupServer" type="radio" name="feature" value="groupOnServer" checked={selectedFeature === 'groupServer'} onChange={() => toggleFeature('groupServer')}/>{' '}
          Server Side Grouping
        </label>
        <br />
        <label htmlFor="virtual">
          <input id="virtual" type="radio" name="feature" value="virtualGrouping" onChange={() => toggleFeature('virtual')}/>{' '}
          Server Side Grouping with virtualization
        </label>
        <br />
        <label htmlFor="lazyload">
          <input id="lazyload" type="radio" name="feature" value="lazyLoadGrouping" onChange={() => toggleFeature('lazyload')}/>{' '}
          Server Side Grouping with group lazy-loading
        </label>
      </div>

      <br />

      <FlexGrid initialized={flexInitialized} isReadOnly={isReadOnly} autoGenerateColumns={false}>
        <FlexGridFilter defaultFilterType="Condition"/>
        <FlexGridColumn binding="OrderId" header="Order ID"/>
        <FlexGridColumn binding="StockItem" header="Stock Item" width="*" minWidth={200}/>
        <FlexGridColumn binding="Color" header="Color"/>
        <FlexGridColumn binding="Quantity" header="Quantity" dataType="Number" format="n0"/>
        <FlexGridColumn binding="UnitPrice" header="Unit Price" dataType="Number" format="n2"/>
        <FlexGridColumn binding="Date" header="Date" dataType="Date" format="d"/>
        <FlexGridColumn binding="IsChillerStock" header="Is Chiller Stock" dataType="Boolean"/>
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
