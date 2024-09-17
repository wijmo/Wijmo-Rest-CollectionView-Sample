var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { DataType, DateTime, httpRequest, copy, changeType, isString, isDate, asNumber, isBoolean, } from '@mescius/wijmo';
import { RestCollectionView } from '@mescius/wijmo.rest';
// limit item count to fetch when virtualization or group lazy-loading is not enabled
const _MAXITEMCOUNT = 10000;
const _TableRecordCount = 231412; // total number of records available in DB for API.

// DataSource API
const _apiUrl = "http://localhost:5125/wwi/api/v1/";
/**
 * Class that extends {@link RestCollectionView} to support RestAPI data sources.
 */
export class RestGroupCollectionView extends RestCollectionView {
    /**
     * Initializes a new instance of the {@link RestGroupCollectionView} class to support ServerSide Grouping.
     *
     * @param tableName Name of the table (entity) to retrieve from the service.
     * @param options JavaScript object containing initialization data (property
     * values and event handlers) for the {@link RestCollectionView}.
     */
    constructor(tableName, options) {
        super(options);
        this._url = _apiUrl;
        this._pendingRequest = null;
        this._tbl = tableName;
        this.groupOnServer = true;
        copy(this, options);
    }
    // parse data
    _jsonReviver(key, value) {
        // regex to parse date
        const _rxDate = /^\d{4}\-\d{2}\-\d{2}T\d{2}\:\d{2}\:\d{2}|\/Date\([\d\-]*?\)/;
        if (typeof value === 'string' && _rxDate.test(value)) {
            value = value.indexOf('/Date(') == 0 // verbosejson
                ? new Date(parseInt(value.substr(6)))
                : new Date(value);
        }
        return value;
    }
    // get request parameters to fetch data based on settings
    _getReadParams(item, groupInfo = true, virtualParams = true) {
        let gDescs = this.groupDescriptions;
        let settings = {};

        // #region Only required when ServerAPI limits top to 100 or other value
        // load max _MAXITEMCOUNT items when virtualization is not enabled
        if (!this.virtualization && this.groupOnServer) {
            settings.top = _MAXITEMCOUNT;
        }
        // all available groups in-case of virtualization 
        if (this.virtualization && groupInfo && this.groupOnServer) {
            settings.top = _MAXITEMCOUNT;
        }
        // load all available records from table for ServerSide GroupOnly case 
        if (this.groupOnServer && !this.virtualization && !this.groupLazyLoading && !groupInfo) {
            settings.top = _TableRecordCount;
        }
        // #endRegion
        // get filter definition 
        if (this.filterOnServer && this._filterProvider) {
            let filter = this._asODataFilter(this._filterProvider);
            if (filter.length > 0) {
                settings.filterBy = filter;
            }
        }
        // get groupby defintion 
        if (this.groupOnServer && gDescs.length > 0) {
            // groupby def for groupLazyloading feature
            if (this.groupLazyLoading) {
                if (item) {
                    let filters = [];
                    for (let i = 0; i <= (item.isBottomLevel ? gDescs.length - 1 : item.level); i++) {
                        let group = gDescs[i].propertyName;
                        const val = item.items[0][group];
                        filters.push(`(${group} eq '${val}')`);
                    }
                    if (settings.filterBy && settings.filterBy.length > 0) {
                        filters.splice(0, 0, settings.filterBy);
                    }
                    if (filters.length > 0) {
                        settings.filterBy = filters.join(' and ');
                    }
                    if (!item.isBottomLevel)
                        settings.groupBy = item.groups[0].groupDescription.propertyName;
                }
                else
                    settings.groupBy = gDescs[0].propertyName;
            }
            // groupby definition for other cases
            if (!this.groupLazyLoading) {
                let _groupBy = [];
                let _sortBy = [];
                for (let i = 0; i < gDescs.length; i++) {
                    let _prop = gDescs[i].propertyName;
                    _groupBy.push(_prop);
                    _sortBy.push(`${_prop} ASC`);
                }
                settings.groupBy = _groupBy;
                settings.sortBy = _sortBy.join(','); //sort the defined groups
            }
        }
        // donot set groupby if request is not for groupItems
        if (!groupInfo) {
            delete settings.groupBy;
        }
        //update sortBy definition
        if (this.sortDescriptions.length > 0) {
            let _sortBy = [];
            //check existing sort
            if (settings.sortBy) {
                _sortBy = settings.sortBy.split(',');
            }
            for (let i = 0; i < this.sortDescriptions.length; i++) {
                let sort = `${this.sortDescriptions[i].property} ${this.sortDescriptions[i].ascending ? 'ASC' : 'DESC'}`;
                var _cSrtIdx = _sortBy.findIndex(x => x.indexOf(this.sortDescriptions[i].property) > -1);
                if (_cSrtIdx > -1)
                    _sortBy[_cSrtIdx] = sort; // update existing sort
                else
                    _sortBy.push(sort); // add new sort
            }
            settings.sortBy = _sortBy.join(',');
        }
        //skip and top for fetch data when virtualization is enabled
        if (virtualParams && this.virtualization) {
            settings.skip = this._start;
            settings.top = this._fetchSize();
        }
        // for paginated data
        if (this.pageOnServer && this.pageSize > 0 && !groupInfo) {
            settings.skip = this.pageIndex * this.pageSize;
            settings.top = (this.pageIndex * this.pageSize) + this.pageSize;
        }
        // set aggregates property if required (only with groupBy)
        if (groupInfo && this.aggregates && this.aggregates.length > 0 && this.groupDescriptions.length > 0) {
            settings.aggregates = this.aggregates;
        }
        // get specified fields only if set
        if (this.fields && this.fields.length > 0 && !groupInfo) {
            settings.select = this.fields;
        }
        return settings;
    }
    // ** overrides
    //fetch data
    getItems(item) {
        // cancel any pending requests
        if (this._pendingReq) {
            this._pendingReq.abort();
        }
        return new Promise(resolve => {
            let _settings = this._getReadParams(item, false, true); // get data chunks if virtualization enabled
            this._pendingReq = httpRequest(this._url + this._tbl, {
                requestHeaders: this.requestHeaders,
                data: _settings,
                success: (xhr) => __awaiter(this, void 0, void 0, function* () {
                    // parse response
                    let resp = JSON.parse(xhr.responseText, this._jsonReviver);
                    let _count = asNumber(resp.totalItemCount);
                    if (_count != this._totalItemCount)
                        this._totalItemCount = _count;
                    resolve(resp.items);
                }),
                error: xhr => this._raiseError(xhr.responseText, false),
                complete: xhr => { this._pendingReq = null; } // no pending requests
            });
        });
    }
    //fetch group items
    getGroupItems(item) {
        // cancel any pending requests
        if (this._pendingRequest) {
            this._pendingRequest.abort();
        }
        return new Promise(resolve => {
            let _settings = this._getReadParams(item, true, false); // request parameters for grouping
            if (this.groupDescriptions.length > 0 && this.groupOnServer) {
                httpRequest(this._url + this._tbl, {
                    requestHeaders: this.requestHeaders,
                    data: _settings,
                    success: (xhr) => __awaiter(this, void 0, void 0, function* () {
                        // parse response
                        let re = xhr.responseText;
                        let resp = JSON.parse(xhr.responseText, this._jsonReviver);
                        this._totalGroupItemCount = asNumber(resp.totalGroupCount);
                        let _count = asNumber(resp.totalItemCount);
                        if (_count != this._totalItemCount)
                            this._totalItemCount = _count;
                        resolve(resp.groupItems);
                    }),
                    error: xhr => this._raiseError(xhr.responseText, false),
                    complete: xhr => this._pendingRequest = null // no pending requests
                });
            }
        });
    }
    //#region Filter Implementation
    // gets the OData like filter definition that accepts by datasource from a wijmo.grid.filter.FlexGridFilter object.
    _asODataFilter(filter) {
        let def = '';
        for (let c = 0; c < filter.grid.columns.length; c++) {
            let col = filter.grid.columns[c], cf = filter.getColumnFilter(col, false);
            if (cf && cf.isActive) {
                if (def) {
                    def += ' and ';
                }
                if (cf.conditionFilter && cf.conditionFilter.isActive) {
                    def += this._asODataConditionFilter(cf.conditionFilter);
                }
                else if (cf.valueFilter && cf.valueFilter.isActive) {
                    def += this._asODataValueFilter(cf.valueFilter);
                }
            }
        }
        return def;
    }
    _asODataValueFilter(vf) {
        let col = vf.column, fld = col.binding, map = col.dataMap, def = '';
        // build condition with 'eq/or'
        for (let key in vf.showValues) {
            let value = changeType(key, col.dataType, col.format);
            if (map && isString(value)) { // TFS 239356
                value = map.getKeyValue(value);
            }
            if (def)
                def += ' or ';
            def += this._asEquals(fld, value, col.dataType);
        }
        // enclose in parenthesis if not empty
        if (def.length) {
            def = '(' + def + ')';
        }
        // all done
        return def;
    }
    _asEquals(fld, value, type) {
        let def = '', DT = DataType;
        if (value === '' || value == null) { // null or empty
            def += fld + ' eq null';
            if (type == DT.String) { // empty OK for strings only
                def += ' or ' + fld + ' eq \'\'';
            }
        }
        else if (type == DT.Date) { // non-null/empty dates (TFS 458080)
            def += fld + ' ge ' + this._asODataValue(value, type) + ' and ' +
                fld + ' lt ' + this._asODataValue(DateTime.addDays(value, 1), type);
        }
        else { // other types
            def += fld + ' eq ' + this._asODataValue(value, type);
        }
        return '(' + def + ')';
    }
    _asODataConditionFilter(cf) {
        let c1 = this._asODataCondition(cf, cf.condition1), c2 = this._asODataCondition(cf, cf.condition2);
        if (c1 && c2)
            return '(' + c1 + (cf.and ? ' and ' : ' or ') + c2 + ')';
        if (c1)
            return '(' + c1 + ')';
        if (c2)
            return '(' + c2 + ')';
        return null;
    }
    _asODataCondition(cf, cnd) {
        let col = cf.column, fld = col.binding, map = col.dataMap, value = cnd.value;
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
                return this._url.indexOf('4000') == -1 ? `${fld} starts-with ${value}`: `startswith(${fld},${value})`;
            case 7: // EW = 7, 
                return this._url.indexOf('4000') == -1 ? `${fld} ends-with ${value}` : `endswith(${fld},${value})`;
            case 8: // CT = 8, 
                return this._url.indexOf('4000') == -1 ? `${fld} contains ${value}`:`substringof(${fld},${value})`;
            case 9: // NC = 9 
                return this._url.indexOf('4000') == -1 ? `${fld} not-contains ${value}`:`not substringof(${fld},${value})`;
            case 10: // NBW = 10 
                return this._url.indexOf('4000') == -1 ? `${fld} not-starts-with ${value}`:`not startswith(${fld},${value})`;
            case 11: // NEW = 11 
                return this._url.indexOf('4000') == -1 ? `${fld} not-ends-with ${value}`:`not endswith(${fld},${value})`;
        }
    }
    _asODataValue(value, dataType) {
        if (isDate(value)) {
            value = `'${value.toJSON()}'`;
            return value;
        }
        else if (isString(value)) {
            return "'" + value.replace(/'/g, "''") + "'";
        }
        else if (isBoolean(value)) {
            return "'" + value + "'";
        }
        else if (value != null) {
            return value.toString();
        }
        return dataType == DataType.String ? "''" : null;
    }
}
