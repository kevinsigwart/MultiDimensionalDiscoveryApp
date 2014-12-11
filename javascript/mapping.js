require([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/promise/all",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/TimeExtent",
    "esri/layers/ArcGISImageServiceLayer",
    "esri/layers/ImageServiceParameters",
    "esri/layers/MosaicRule",
    "esri/graphic",
], function(declare,lang,all,SimpleMarkerSymbol,SimpleLineSymbol,TimeExtent,
             ArcGISImageServiceLayer,ImageServiceParameters,MosaicRule,Graphic){
    
    return declare("EsriMapHandler", null, {

        
        
        /*** CONSTRUCTOR **********************/
	    constructor: function(/*Object*/ args){
            this._map  = args;
            this._currentPointGeom = null;
        },
        getCurrentPoint : function(){
            return this._currentPointGeom;
        },
        updateMapTime: function(startDate,endDate)
        {
            //TODO: SHould pull from layer
            var timeExtent = new TimeExtent();
            timeExtent.startTime = startDate;
            timeExtent.endTime = endDate;
            map.setTimeExtent(timeExtent);
            
        },
        createMultiDimLayer: function(url){
            var mr = new MosaicRule();
            mr.method = MosaicRule.METHOD_NONE;
            mr.where = "StdZ = -500";

            var params = new ImageServiceParameters();
            params.noData = 0;
            params.mosaicRule = mr;

            multiDimensionaLayer = new MultiDimensionalImageService(url, {
                  imageServiceParameters: params,
                  opacity: 0.75
                });

            return multiDimensionaLayer;
            
        },
        /*** Public Functions **********************/           
        /**
         *Clears out the map graphics, removes the chart and sets variables to default values 
         */
        clearGraphics: function () {
	       this._map.graphics.clear();  
        },

        plotPointOnMap: function(geometry){

            var symbol = new SimpleMarkerSymbol();	    
            symbol.setSize(12);
            symbol.setOutline(new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0,0,0]), 1));
            //symbol.setColor(new dojo.Color([255,0,0,0.75]));
            symbol.setColor(new dojo.Color([0,255,255,0.75]));
            
            this._currentPointGeom = geometry;
            
            var graphic = new Graphic(geometry,symbol);
            
            var myMap = this._map;
            myMap.graphics.clear();
            myMap.graphics.add(graphic);
            myMap.centerAt(geometry);
        },
        
        /*****  EVENTS  *********************************/ 
        /**
         * We need to let the mapping client know when a point has been selected on the chart
        */
        graphicPlotted : function () {}
    });
}); 