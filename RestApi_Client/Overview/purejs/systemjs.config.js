(function (global) {
    System.config({
        transpiler: 'plugin-babel',
        babelOptions: {
            es2015: true
        },
        meta: {
            '*.css': { loader: 'css' }
        },
        paths: {
            // paths serve as alias
            'npm:': 'node_modules/'
        },
        // map tells the System loader where to look for things
        map: {
            'jszip': 'npm:jszip/dist/jszip.js',
            '@mescius/wijmo': 'npm:@mescius/wijmo/index.js',
            '@mescius/wijmo.input': 'npm:@mescius/wijmo.input/index.js',
            '@mescius/wijmo.styles': 'npm:@mescius/wijmo.styles',
            '@mescius/wijmo.cultures': 'npm:@mescius/wijmo.cultures',
            '@mescius/wijmo.chart': 'npm:@mescius/wijmo.chart/index.js',
            '@mescius/wijmo.chart.analytics': 'npm:@mescius/wijmo.chart.analytics/index.js',
            '@mescius/wijmo.chart.animation': 'npm:@mescius/wijmo.chart.animation/index.js',
            '@mescius/wijmo.chart.annotation': 'npm:@mescius/wijmo.chart.annotation/index.js',
            '@mescius/wijmo.chart.finance': 'npm:@mescius/wijmo.chart.finance/index.js',
            '@mescius/wijmo.chart.finance.analytics': 'npm:@mescius/wijmo.chart.finance.analytics/index.js',
            '@mescius/wijmo.chart.hierarchical': 'npm:@mescius/wijmo.chart.hierarchical/index.js',
            '@mescius/wijmo.chart.interaction': 'npm:@mescius/wijmo.chart.interaction/index.js',
            '@mescius/wijmo.chart.radar': 'npm:@mescius/wijmo.chart.radar/index.js',
            '@mescius/wijmo.chart.render': 'npm:@mescius/wijmo.chart.render/index.js',
            '@mescius/wijmo.chart.webgl': 'npm:@mescius/wijmo.chart.webgl/index.js',
            '@mescius/wijmo.chart.map': 'npm:@mescius/wijmo.chart.map/index.js',
            '@mescius/wijmo.gauge': 'npm:@mescius/wijmo.gauge/index.js',
            '@mescius/wijmo.grid': 'npm:@mescius/wijmo.grid/index.js',
            '@mescius/wijmo.grid.detail': 'npm:@mescius/wijmo.grid.detail/index.js',
            '@mescius/wijmo.grid.filter': 'npm:@mescius/wijmo.grid.filter/index.js',
            '@mescius/wijmo.grid.search': 'npm:@mescius/wijmo.grid.search/index.js',
            '@mescius/wijmo.grid.style': 'npm:@mescius/wijmo.grid.style/index.js',
            '@mescius/wijmo.grid.grouppanel': 'npm:@mescius/wijmo.grid.grouppanel/index.js',
            '@mescius/wijmo.grid.multirow': 'npm:@mescius/wijmo.grid.multirow/index.js',
            '@mescius/wijmo.grid.transposed': 'npm:@mescius/wijmo.grid.transposed/index.js',
            '@mescius/wijmo.grid.transposedmultirow': 'npm:@mescius/wijmo.grid.transposedmultirow/index.js',
            '@mescius/wijmo.grid.pdf': 'npm:@mescius/wijmo.grid.pdf/index.js',
            '@mescius/wijmo.grid.sheet': 'npm:@mescius/wijmo.grid.sheet/index.js',
            '@mescius/wijmo.grid.xlsx': 'npm:@mescius/wijmo.grid.xlsx/index.js',
            '@mescius/wijmo.grid.selector': 'npm:@mescius/wijmo.grid.selector/index.js',
            '@mescius/wijmo.grid.cellmaker': 'npm:@mescius/wijmo.grid.cellmaker/index.js',
            '@mescius/wijmo.nav': 'npm:@mescius/wijmo.nav/index.js',
            '@mescius/wijmo.odata': 'npm:@mescius/wijmo.odata/index.js',
            '@mescius/wijmo.olap': 'npm:@mescius/wijmo.olap/index.js',
            '@mescius/wijmo.rest': 'npm:@mescius/wijmo.rest/index.js',
            '@mescius/wijmo.pdf': 'npm:@mescius/wijmo.pdf/index.js',
            '@mescius/wijmo.pdf.security': 'npm:@mescius/wijmo.pdf.security/index.js',
            '@mescius/wijmo.viewer': 'npm:@mescius/wijmo.viewer/index.js',
            '@mescius/wijmo.xlsx': 'npm:@mescius/wijmo.xlsx/index.js',
            '@mescius/wijmo.undo': 'npm:@mescius/wijmo.undo/index.js',
            '@mescius/wijmo.interop.grid': 'npm:@mescius/wijmo.interop.grid/index.js',
            '@mescius/wijmo.touch': 'npm:@mescius/wijmo.touch/index.js',
            '@mescius/wijmo.cloud': 'npm:@mescius/wijmo.cloud/index.js',
            '@mescius/wijmo.barcode': 'npm:@mescius/wijmo.barcode/index.js',
            '@mescius/wijmo.barcode.common': 'npm:@mescius/wijmo.barcode.common/index.js',
            '@mescius/wijmo.barcode.composite': 'npm:@mescius/wijmo.barcode.composite/index.js',
            '@mescius/wijmo.barcode.specialized': 'npm:@mescius/wijmo.barcode.specialized/index.js',
            'jszip': 'npm:jszip/dist/jszip.js',
            'bootstrap.css': 'npm:bootstrap/dist/css/bootstrap.min.css',
            'css': 'npm:systemjs-plugin-css/css.js',
            'plugin-babel': 'npm:systemjs-plugin-babel/plugin-babel.js',
            'systemjs-babel-build':'npm:systemjs-plugin-babel/systemjs-babel-browser.js'
        },
        // packages tells the System loader how to load when no filename and/or no extension
        packages: {
            src: {
                defaultExtension: 'js'
            },
            "node_modules": {
                defaultExtension: 'js'
            },
        }
    });
})(this);
