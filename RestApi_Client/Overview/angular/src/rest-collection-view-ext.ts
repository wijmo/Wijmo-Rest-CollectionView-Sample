import { RestCollectionView } from '@mescius/wijmo.rest';

import {
    DataType, isDate, DateTime, asNumber, isBoolean, httpRequest, copy, changeType, isString
} from '@mescius/wijmo';

const _apiUrl = "http://localhost:5125/wwi/api/v1/";

/**
 * Class that extends {@link RestCollectionView} to support RestAPI data sources.
 */
export class RestCollectionViewExt extends RestCollectionView {
    _pendingRequest: XMLHttpRequest;
    _url: string = _apiUrl;
    _tbl: string;

    /**
     * Initializes a new instance of the {@link RestCollectionViewExt} class.
     *
     * @param tableName Name of the table (entity) to retrieve from the service.
     * @param options JavaScript object containing initialization data (property 
     * values and event handlers) for the {@link RestCollectionView}.
     */
    constructor(tableName: string, options?: any) {
        super();
        this._tbl = tableName;
        copy(this, options);
    }


    // parse json data
    protected _jsonReviver(key: string, value: any): any {
        const _rxDate = /^\d{4}\-\d{2}\-\d{2}T\d{2}\:\d{2}\:\d{2}|\/Date\([\d\-]*?\)/;
        if (typeof value === 'string' && _rxDate.test(value)) {
            value = value.indexOf('/Date(') == 0 // verbosejson
                ? new Date(parseInt(value.substr(6)))
                : new Date(value);
        }
        return value;
    }

    // get parameter for sorting, filtering, paging and virtualization
    _getReadParams(): any {
        let settings: any = {};
        // apply filter 
        if (this.filterOnServer && this._filterProvider) {
            let filter = this._asODataFilter(this._filterProvider);
            if (filter.length > 0) {
                settings.filterBy = filter;
            }
        }

        //apply sortBy
        if (this.sortOnServer && this.sortDescriptions.length > 0) {
            let _sortBy = [];
            for (let i = 0; i < this.sortDescriptions.length; i++) {
                let sort = `${this.sortDescriptions[i].property} ${this.sortDescriptions[i].ascending ? 'ASC' : 'DESC'}`;
                _sortBy.push(sort);// add sort
            }
            settings.sortBy = _sortBy.join(',');
        }
        // current view window 
        if (this.virtualization) {
            settings.skip = this._start;
            settings.top = this._fetchSize();
        }

        // get page params 
        if (this.pageOnServer && this.pageSize > 0) {
            settings.skip = this.pageIndex * this.pageSize
            settings.top = this.pageSize;
        }
        if (this.fields && this.fields.length > 0) {
            settings.select = this.fields;
        }
        return settings;
    }

    // ** overrides

    protected getItems(): Promise<any[]> {
        // cancel any pending requests
        if (this._pendingReq) {
            this._pendingReq.abort();
        }
        return new Promise<any>(resolve => {
            let _settings = this._getReadParams(); // get the items virtually 
            this._pendingReq = httpRequest(this._url + this._tbl, {
                requestHeaders: this.requestHeaders,
                data: _settings,
                success: async xhr => {
                    // parse response
                    let resp = JSON.parse(xhr.responseText, this._jsonReviver);
                    let _count = asNumber(resp.totalItemCount);
                    if (_count != this._totalItemCount)
                        this._totalItemCount = _count;
                    resolve(resp.items);
                },
                error: xhr => this._raiseError(xhr.responseText, false),
                complete: xhr => { this._pendingReq = null; }// no pending requests
            });
        });;
    }
    //#region Filter Implementation

    // gets the OData filter definition from a wijmo.grid.filter.FlexGridFilter object.
    // https://www.odata.org/documentation/odata-version-2-0/uri-conventions/
    _asODataFilter(filter: any): string {
        let def = '';
        for (let c = 0; c < filter.grid.columns.length; c++) {
            let col = filter.grid.columns[c],
                cf = filter.getColumnFilter(col, false);
            if (cf && cf.isActive) {
                if (def) {
                    def += ' and ';
                }
                if (cf.conditionFilter && cf.conditionFilter.isActive) {
                    def += this._asODataConditionFilter(cf.conditionFilter);
                } else if (cf.valueFilter && cf.valueFilter.isActive) {
                    def += this._asODataValueFilter(cf.valueFilter);
                }
            }
        }
        return def;
    }
    _asODataValueFilter(vf: any): string {
        let col = vf.column,
            fld = col.binding,
            map = col.dataMap,
            def = '';

        // build condition with 'eq/or'
        for (let key in vf.showValues) {
            let value = changeType(key, col.dataType, col.format);
            if (map && isString(value)) { // TFS 239356
                value = map.getKeyValue(value);
            }
            if (def) def += ' or ';
            def += this._asEquals(fld, value, col.dataType);
        }

        // enclose in parenthesis if not empty
        if (def.length) {
            def = '(' + def + ')';
        }

        // all done
        return def;
    }
    _asEquals(fld: string, value: any, type: DataType): string {
        let def = '',
            DT = DataType;
        if (value === '' || value == null) { // null or empty
            def += fld + ' eq null';
            if (type == DT.String) { // empty OK for strings only
                def += ' or ' + fld + ' eq \'\'';
            }
        } else if (type == DT.Date) { // non-null/empty dates (TFS 458080)
            def += fld + ' ge ' + this._asODataValue(value, type) + ' and ' +
                fld + ' lt ' + this._asODataValue(DateTime.addDays(value, 1), type);
        } else { // other types
            def += fld + ' eq ' + this._asODataValue(value, type);
        }
        return '(' + def + ')';
    }
    _asODataConditionFilter(cf: any): string {
        let c1 = this._asODataCondition(cf, cf.condition1),
            c2 = this._asODataCondition(cf, cf.condition2);
        if (c1 && c2) return '(' + c1 + (cf.and ? ' and ' : ' or ') + c2 + ')';
        if (c1) return '(' + c1 + ')';
        if (c2) return '(' + c2 + ')';
        return null;
    }
    _asODataCondition(cf: any, cnd: any): string {
        let col = cf.column,
            fld = col.binding,
            map = col.dataMap,
            value = cnd.value;
        if (map && isString(value)) { // TFS 440901
            value = map.getKeyValue(value);
        }
        value = this._asODataValue(value, cf.column.dataType);
        switch (cnd.operator) {
            case 0: // EQ = 0, 
                return fld + ' eq ' + value;
            case 1: // NE = 1,
                return fld + ' ne ' + value;
            case 2: // GT = 2, 
                return fld + ' gt ' + value;
            case 3: // GE = 3, 
                return fld + ' ge ' + value;
            case 4: // LT = 4, 
                return fld + ' lt ' + value;
            case 5: // LE = 5, 
                return fld + ' le ' + value;
            case 6: // BW = 6, 
                return `${fld} starts-with ${value}`;
            case 7: // EW = 7, 
                return `${fld} ends-with ${value}`;
            case 8: // CT = 8, 
                return `${fld} contains ${value}`;
            case 9: // NC = 9 
                return `${fld} not-contains ${value}`;
            case 10: // NBW = 10 
                return `${fld} not-starts-with ${value}`;
            case 11: // NEW = 11 
                return `${fld} not-ends-with ${value}`;
        }
    }
    _asODataValue(value: any, dataType: DataType): string {
        if (isDate(value)) {
            value = `'${value.toJSON()}'`;
            return value;
        } else if (isString(value)) {
            return "'" + value.replace(/'/g, "''") + "'";
        } else if (isBoolean(value)) {
            return "'" + value + "'";
        }
        else if (value != null) {
            return value.toString();
        }
        return dataType == DataType.String ? "''" : null;
    }

    //#endRegion
}