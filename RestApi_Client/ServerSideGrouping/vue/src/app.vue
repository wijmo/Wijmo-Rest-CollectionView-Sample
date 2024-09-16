<template>
    <div class="container-fluid">
        <div id="feature-options">
            <label for="groupServer">
                <input id="groupServer" type="radio" name="feature" value="groupOnServer" checked
                    v-model="selectedFeature" @change="toggleFeature('groupServer')" />
                Server Side Grouping
            </label>
            <br />
            <label for="virtual">
                <input id="virtual" type="radio" name="feature" value="virtualGrouping"
                    @change="toggleFeature('virtual')" />
                Server Side Grouping with virtualization
            </label>
            <br />
            <label for="lazyload">
                <input id="lazyload" type="radio" name="feature" value="lazyLoadGrouping"
                    @change="toggleFeature('lazyload')" />
                Server Side Grouping with group lazy-loading
            </label>
        </div>

        <br />

        <wj-flex-grid :initialized="flexInitialized" :itemsSource="view" :isReadOnly="isReadOnly"
            :autoGenerateColumns="false">
            <wj-flex-grid-filter :defaultFilterType="'Condition'" />
            <wj-flex-grid-column binding="OrderId" header="Order ID" />
            <wj-flex-grid-column binding="StockItem" header="Stock Item" :width="'*'" :minWidth="200" />
            <wj-flex-grid-column binding="Color" header="Color" />
            <wj-flex-grid-column binding="Quantity" header="Quantity" :dataType="'Number'" format="n0" />
            <wj-flex-grid-column binding="UnitPrice" header="Unit Price" :dataType="'Number'" format="n2" />
            <wj-flex-grid-column binding="Date" header="Date" :dataType="'Date'" format="d" />
            <wj-flex-grid-column binding="IsChillerStock" header="Is Chiller Stock" :dataType="'Boolean'" />
        </wj-flex-grid>
    </div>
</template>
<script>
import 'bootstrap.css';
import '@mescius/wijmo.styles/wijmo.css';
//
import { createApp } from "vue"
import { registerGrid } from "@mescius/wijmo.vue2.grid";
import { registerGridFilter } from "@mescius/wijmo.vue2.grid.filter";
import { registerInput } from "@mescius/wijmo.vue2.input";
import { RestGroupCollectionView } from './rest-group-collection-view';
// field info for PurchaseOrders table
const fields = 'OrderId,StockItem,Color,State,City,Quantity,UnitPrice,Date,IsChillerStock'.split(',');
//
let App = {
    name: "App",
    created: function () {
        //create RestGroupCollectionView instance 
        //with settings for default server grouping on first load
        this.view = new RestGroupCollectionView('purchaseorders', this.settings)
    },
    data: function () {
        return {
            isReadOnly: true,
            _isFirstLoad: true,
            settings: {
                fields: fields,
                virtualization: false,
                groupLazyLoading: false,
                groupDescriptions: ['State', 'City'],
                loading: () => { this.toggleSpinner(this.flexGrid, true); },
                loaded: (s, e) => {
                    this.toggleSpinner(this.flexGrid, false);
                    if (this._isFirstLoad) {
                        this._isFirstLoad = false;
                        // select first group row 
                        setTimeout(() => {
                            this.flexGrid.select(0, 0);
                        })
                    }
                }
            }
        }
    },
    methods: {
        flexInitialized(grid) {
            this.flexGrid = grid;
        },
        toggleFeature(feature) {
            this.selectedFeature = feature;
            this._isFirstLoad = true;
            if (feature === 'groupServer') {
                this.settings.virtualization = false;
                this.settings.groupLazyLoading = false;
            } else if (feature === 'virtual') {
                this.settings.virtualization = true;
                this.settings.groupLazyLoading = false;
            } else if (feature === 'lazyload') {
                this.settings.virtualization = false;
                this.settings.groupLazyLoading = true;
            }
            this.flexGrid.itemsSource = new RestGroupCollectionView('purchaseorders', this.settings);
        },
        //show gif loader while data loading
        toggleSpinner(grid, show) {
            let _rect = grid.controlRect;
            let elem = grid.hostElement.querySelector('.spinner');
            if (!elem)
                elem = wijmo.createElement(`<div class='spinner' style="left:${_rect.left}px;top:${_rect.top}px;width:${_rect.width}px;height:${_rect.height}px;"><img src="resources/Rounded%20blocks.gif"></div>`, grid.hostElement);
            elem.style.display = show ? 'block' : 'none';
        }
    }
};

const app = createApp(App);
// register all components and directives from Wijmo modules
registerInput(app);
registerGrid(app);
registerGridFilter(app);
app.mount('#app');

</script>

<style>
body {
    margin-bottom: 36pt;
    margin-top: 10px;
}

.wj-flexgrid {
    height: 400px;
}

.spinner {
    position: absolute;
    z-index: 10;
    opacity: .5;
}

.spinner img {
    margin: auto;
    position: relative;
    top: 40%;
    left: 45%;
}
</style>