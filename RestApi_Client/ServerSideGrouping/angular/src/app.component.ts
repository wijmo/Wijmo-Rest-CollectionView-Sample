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
import { RestGroupCollectionView } from './rest-group-collection-view';
import {FlexGrid} from '@mescius/wijmo.grid';
import {createElement} from '@mescius/wijmo';
// field info for PurchaseOrders table
const fields = 'OrderId,StockItem,Color,State,City,Quantity,UnitPrice,Date,IsChillerStock'.split(',');

@Component({
    standalone: true,
    imports: [WjGridModule, WjGridFilterModule, WjInputModule, BrowserModule],
    selector: 'app-component',
    templateUrl: 'src/app.component.html'
})
export class AppComponent {
    isReadOnly = true;
    private _firstLoad = true;
    cvSettings={
        virtualization:false,
        groupLazyLoading:false,
        fields: fields,
        groupDescriptions: ['State', 'City'],
        loading:()=>{this.toggleSpinner(this._flexGrid,true);},
        loaded: (s: RestGroupCollectionView, e: any) => {
            this.toggleSpinner(this._flexGrid,false);
            if (this._firstLoad) {
                this._firstLoad = false;
                // select first group row 
                setTimeout(() => {
                    this._flexGrid.select(0, 0);
                })
            }
        }
    };
    //create RestGroupCollectionView instance 
    //with settings for default server grouping on first load
    view = new RestGroupCollectionView('purchaseorders', this.cvSettings);
    @ViewChild('theGrid', { static: true }) private _flexGrid: FlexGrid;
    constructor(private readonly _chDetector: ChangeDetectorRef) {
    }
    //show gif loader while data loading
    toggleSpinner(grid:FlexGrid, show:boolean){
        let _rect = grid.controlRect;
        let elem:HTMLElement = grid.hostElement.querySelector('.spinner');
        if(!elem)
            elem = createElement(`<div class='spinner' style="left:${_rect.left}px;top:${_rect.top}px;width:${_rect.width}px;height:${_rect.height}px;"><img src="resources/Rounded%20blocks.gif"></div>`,grid.hostElement);
        elem.style.display = show ? 'block':'none';
    }

    toggleFeature(feature: string) {
        this._firstLoad = true;
        //default server grouping
        if(feature== 'groupServer'){
            this.cvSettings.virtualization = false;
            this.cvSettings.groupLazyLoading = false;
        }
        // enable virtualization
        if (feature == "virtual") {
            this.cvSettings.virtualization = true;
            this.cvSettings.groupLazyLoading = false;
        }
        //enable group lazy loading
        if (feature == "lazyload") {
            this.cvSettings.virtualization = false;
            this.cvSettings.groupLazyLoading = true;
        }
        // reset itemsSource
        this._flexGrid.itemsSource = new RestGroupCollectionView('purchaseorders', this.cvSettings);
    }

}

enableProdMode();

// Resolve resources (templateUrl, styleUrls etc), After resolution all URLs have been converted into `template` strings.
ɵresolveComponentResources(fetch).then(() => {
    // Bootstrap application 
    bootstrapApplication(AppComponent).catch(err => console.error(err));
});