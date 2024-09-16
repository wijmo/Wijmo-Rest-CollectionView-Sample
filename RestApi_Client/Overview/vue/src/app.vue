<template>
    <div class="container-fluid">
        <label>

            <input id="paging" type="radio" name="viewtype" value="paging" checked
                @change="toggleFeature('paging')" />Paging
        </label>

        <label>

            <input id="virtualization" type="radio" name="viewtype" value="virtualization"
                @change="toggleFeature('virtualization')" />Virtualization
        </label>

        <br />

        <wj-collection-view-navigator v-if="enablePaging" ref="navRef" :cv="view" :by-page="true" />

        <wj-flex-grid :initialized="flexInitialized" :is-read-only="isReadOnly" :items-source="view">
            <wj-flex-grid-filter />
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
import { RestCollectionViewExt } from "./rest-collection-view-ext";
//
// field info for PurchaseOrders table
const fields = 'OrderId,StockItem,Color,State,City,Quantity,UnitPrice,Date,IsChillerStock'.split(',');
//
let App = {
    name: "App",
    created: function () {
        //create RestCollectionViewExt instance 
        this.view = new RestCollectionViewExt('purchaseorders', this.settings)
    },
    data: function () {
        return {
            enablePaging: true,
            isReadOnly: true,
            settings: {
                fields: fields,
                pageSize: 100,
                loading: () => { this.toggleSpinner(this.flexGrid, true); },
                loaded: () => { this.toggleSpinner(this.flexGrid, false); }
            }

        }
    },
    methods: {
        flexInitialized(grid) {
            this.flexGrid = grid;
        },
        //toggle b/w paging and virtualization
        toggleFeature(feature) {
            if (feature === 'paging') {
                this.enablePaging = true;
                this.view.pageSize = 100;
                this.view.virtualization = false;
            } else {
                this.enablePaging = false;
                this.view.pageSize = 0;
                this.view.virtualization = true;
            }
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

label {
    padding-right: 10px;
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