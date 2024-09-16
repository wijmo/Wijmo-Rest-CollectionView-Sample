import 'bootstrap.css';
import '@mescius/wijmo.styles/wijmo.css';
import './styles.css';
//
import '@angular/compiler';
import { Component, enableProdMode, ChangeDetectorRef, ɵresolveComponentResources, ViewChild } from '@angular/core';


import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { WjGridModule } from '@mescius/wijmo.angular2.grid';
import { WjGridFilterModule } from '@mescius/wijmo.angular2.grid.filter';
import { WjInputModule } from '@mescius/wijmo.angular2.input';
import { RestCollectionViewExt } from "./rest-collection-view-ext";
import {FlexGrid} from '@mescius/wijmo.grid';
import {createElement} from '@mescius/wijmo';

// field info for PurchaseOrders table
const fields = 'OrderId,StockItem,Color,State,City,Quantity,UnitPrice,Date,IsChillerStock'.split(',');
//
@Component({
    standalone: true,
    imports: [WjGridModule, WjGridFilterModule, WjInputModule, BrowserModule],
    selector: 'app-component',
    templateUrl: 'src/app.component.html'
})
export class AppComponent {
    enablePaging = true;
    pageSize = 100;
    isReadOnly = true;
    //create RestCollectionViewExt instance
    view = new RestCollectionViewExt('purchaseorders', {
        fields: fields,
        pageSize: this.pageSize,
        loading: () => { this.toggleSpinner(this._flexGrid, true); },
        loaded: () => { this.toggleSpinner(this._flexGrid, false); }
    })
    @ViewChild('theGrid', { static: true }) private _flexGrid: FlexGrid;
    constructor(private readonly _chDetector: ChangeDetectorRef) {
    }
    //toggle b/w paging and virtualization
    toggleFeature(feature: string) {
        let view = this.view;
        if (feature == 'paging') {
            this.enablePaging = true;
            view.pageSize = this.pageSize;
            view.virtualization = false;
        } else {
            this.enablePaging = false;
            view.pageSize = 0;
            view.virtualization = true;
        }
    }
    //show gif loader while data loading
    toggleSpinner(grid:FlexGrid, show:boolean){
        let _rect = grid.controlRect;
        let elem:HTMLElement = grid.hostElement.querySelector('.spinner');
        if(!elem)
            elem = createElement(`<div class='spinner' style="left:${_rect.left}px;top:${_rect.top}px;width:${_rect.width}px;height:${_rect.height}px;"><img src="resources/Rounded%20blocks.gif"></div>`,grid.hostElement);
        elem.style.display = show ? 'block':'none';
    }

}
enableProdMode();

// Resolve resources (templateUrl, styleUrls etc), After resolution all URLs have been converted into `template` strings.
ɵresolveComponentResources(fetch).then(() => {
    // Bootstrap application 
    bootstrapApplication(AppComponent).catch(err => console.error(err));
});