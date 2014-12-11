require([
    "dojo/_base/declare",
    "http://d3js.org/d3.v3.min.js",
    "dojo/_base/lang"
], function(declare,D3,lang){
    
    return declare("DimensionalSlider", null, {

        /*** CONSTRUCTOR **********************/
	    constructor: function(/*Object*/ args){
            
            this._dimField = "depth";
            this._chartMode = false;
            this._dimValueField = "value";
            this._dimActFieldValue = "actvalue";
            this._dimSlicesTable = null;
            this._currentSliceTable = null;
            this._selectedDimSliderIndex = 0;
            this._dimSelectionAtr = "Selection";
            this._units = 'meters';
            this._currentSelectedDimensionValue = -2;
            this._PanelID = "#elevationSliderPanel";
        },
        /*** Properties **********************/
        getDimensionValue: function (){
            return this._currentSelectedDimensionValue;
        },
        setDimensionField: function (fieldName){
            this._dimField = fieldName;
        },
        setDefaultValue: function (defaultValue){
            this._currentSelectedDimensionValue = defaultValue;
        },
        setDimensionUnits: function (dimensionUnits){
            this._units = dimensionUnits;
        },
        setIsInChartMode: function(inChartMode){
          this._chartMode = inChartMode;  
        },
        getIsInChartMode: function(){
            return this._chartMode;
        },
        /*** Public Functions **********************/
        setSlices: function(dimensionValues){
            var slices = [];
            
            var dimValueField = this._dimValueField;
            var dimActFieldValue = this._dimActFieldValue;
            var dimField = this._dimField;
            
            for (var index=0;index <  dimensionValues.length;index++)
            {
                var ob = [];
                var value = parseFloat(dimensionValues[index]);
                var invertedDepthValue = value;
                
                //When using a Log D3 chart there is a bug that doesn't let you use 0 values'
                if(value != 0) 
                {	
                    ob[dimField] = invertedDepthValue;
                    ob[dimValueField] = 0;
                    ob[dimActFieldValue] = value;
                    slices.push(ob);
                }
                else{
                    ob[dimField] = -1;
                    ob[dimValueField] = 0;
                    ob[dimActFieldValue] = 0;
                    slices.push(ob);            
                }
            }	

            this._dimSlicesTable = slices;
        },
       createDimensionSlider: function(){
        
            var features = this._dimSlicesTable;
            var dimSelectionAtr = this._dimSelectionAtr;
            var selectedDimSliderIndex = this._selectedDimSliderIndex;
            var dimActFieldValue = this._dimActFieldValue;
            var currentSelectedDimensionValue = this._currentSelectedDimensionValue;
            var dimField = this._dimField;
            var dimValueField = this._dimValueField;
            var units = this._units;
           
           this._chartMode = false;
           
           this._resetElevationSliderPanel();
           
            nDimSliderWidth = this._getDimensionSliderWidth();
            eventSliderHeight = this._getDimensionSliderHeight();

            var margin = {top: 25, right: 5, bottom: 5, left: 50};
            var width = nDimSliderWidth - margin.left - margin.right; 
            var height = eventSliderHeight - 5; 

            
            //Adding the plot framwork to the application
            var svg = this._addSliderPlot(margin, width, height);
            
            //Configuring the Plot
            var x = D3.time.scale().range([0, width]);
            var y = D3.scale.log().range([height, 0]);
            var formatSi = D3.format("s");

            var yAxis = D3.svg.axis().scale(y).orient("left").ticks(6, D3.format(",.1s"));

            var line = D3.svg.line().x(function(d) {
                return x(0);
            }).y(function(d) {
                return y(d[dimField]);
            });		


            x.domain(D3.extent(features, function(d) {
                return 0;
            }));


            y.domain(D3.extent(features, function(d) {
                return d[dimField];
            })).nice(); 

            //Axis Label
            svg.append("g")
            .attr("class", "y axis").call(yAxis).append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", "-40").style("text-anchor", "end")
            .text(dimField + " (" + this._units + ")");

            //svg.append("path").datum(features).attr("class", "line").attr("d", line);

            svg.selectAll(".dsDot")
            .data(features)
            .enter().append("circle")
            .attr("class", "dsDot")
            .attr("r", 2)
            .attr("cx", function(d) { return x(d[dimValueField]); })
            .attr("cy", function(d) { return y(d[dimField]);})
            .on("click",lang.hitch(this, this._dotMouseClick))
            .on("mouseover",lang.hitch(this, this._dotOnMouseOver))
            .on("mouseout",lang.hitch(this, this._dotOnMouseOut))
            .append("svg:title").text(function(d) {
                return (d[dimActFieldValue]).toString() + " " + units;
            }); 


            svg.append("text")
                .attr("x", 0)          
                .attr("y", 0 - (margin.top / 2))
                .attr("id", "Title")
                .attr("text-anchor", "middle")  
                .style("font-size", "14px") 
                .style("text-decoration", "underline")  
                .text(dimField + ": " + currentSelectedDimensionValue.toString()); 
           
            //We want to highlight the current view of the map
            this._selectDimensionStep();	
        },
        createDimensionalChartSilder: function (dimensionalValues)
        {
            var dimSelectionAtr = this._dimSelectionAtr;
            var selectedDimSliderIndex = this._selectedDimSliderIndex;
            var dimActFieldValue = this._dimActFieldValue;
            var currentSelectedDimensionValue = this._currentSelectedDimensionValue;
            this._dimField = "StdZ";
            var dimField = this._dimField;
            var dimValueField = this._dimValueField;
            var units = this._units;
            
            this._chartMode = true;
            this._currentSliceTable = dimensionalValues;
            this._resetElevationSliderPanel();
            
            features = this.cleanupZeroValues(dimensionalValues);

            nDimSliderWidth = this._getDimensionSliderWidth()
            eventSliderHeight = this._getDimensionSliderHeight()

            var margin = {top: 25, right: 5, bottom: 20, left: 45},
            width = nDimSliderWidth - margin.left - margin.right,
            height = eventSliderHeight - 20; 

            //Adding the plot framwork to the application
            var svg = this._addSliderPlot(margin, width, height);

            //Configuring the Plot
            var x = D3.scale.linear().range([0, width]);
            var y = D3.scale.log().range([height, 0]);

            var xAxis = D3.svg.axis().scale(x).orient("bottom").ticks(3,D3.format(",.1s"));
            var yAxis = D3.svg.axis().scale(y).orient("left").ticks(6, D3.format(",.1s"));

            var myArrayOfValues = this.arrayOfValues(features);
            var max = D3.max(myArrayOfValues, function(d) {
                return d;
            });
            
            var min = D3.min(myArrayOfValues, function(d) {
                return d;
            });
            
            var line = D3.svg.line().x(function(d) {
                return x(d[dimValueField]);
            }).y(function(d) {
                var yValue = d[dimField];
                if(yValue == 0)
                    yValue = -1;
                return y(yValue);
            });		
            
            x.domain(D3.extent(myArrayOfValues, function(d) {
                return d;
            }))
            

            y.domain(D3.extent(features, function(d) {
                var yValue = d[dimField];
                if(yValue == 0)
                    yValue = -1;

                return yValue;
            })).nice(); 

            //Axis Labels
            svg.append("g")
                .attr("class", "axis")
                .attr("transform", "translate(0," + height + ")")
                .call(D3.svg.axis().scale(x).ticks(3));

            
            svg.append("g")
            .attr("class", "y axis").call(yAxis).append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", "-40").style("text-anchor", "end")
            .text(dimField + " (" + units + ")");

            svg.append("path").datum(features).attr("class", "line").attr("d", line);

            var color = D3.scale.linear()
            .domain([-1.86,9, 20, 30])
            .range(["blue","cyan", "yellow", "red"]);
            
            svg.selectAll(".dsDot")
            .data(features)
            .enter().append("circle")
            .attr("class", "dsDot")
            .attr("r", 4)
            .attr("cx", function(d) { return x(d[dimValueField]); })
            .attr("cy", function(d) { 
                var yValue = d[dimField];
                if(yValue == 0)
                    yValue = -1;
                return y(yValue);
            })
            .style('fill', function(d) {
                return d.color = color(d[dimValueField]);
            })  
            .on("click",lang.hitch(this, this._dotMouseClick))
            .on("mouseover",lang.hitch(this, this._dotOnMouseOver))
            .on("mouseout",lang.hitch(this, this._dotOnMouseOut))
            .append("svg:title").text(function(d) {
                return (dimField + " : " + d[dimField].toString() + " " + units + "\n" + dimValueField + " : " + d[dimValueField].toString()) ;
            }); 

            var textTitle = dimField + ": " + currentSelectedDimensionValue.toString();

            svg.append("text")
                .attr("x", 0 + (width/2) - textTitle.length)          
                .attr("y", 0 - (margin.top / 2))
                .attr("id", "Title")
                .attr("text-anchor", "middle")  
                .style("font-size", "14px") 
                .style("text-decoration", "underline")  
                .text(dimField + ": " + currentSelectedDimensionValue.toString()); 

            this._updateSelectedIndex();
            //We want to highlight the current view of the map
            this._selectDimensionStep();	
        },
        cleanupZeroValues: function(features){
            var cleanFeatures = [];
            var dimValueField = this._dimValueField;
            var dimActFieldValue = this._dimActFieldValue;
            var dimField = this._dimField;
            
            for (var index=0;index <  features.length;index++)
            {
                var ob = features[index];
                
                
                var dimensionValue = parseFloat(ob[dimField]);
                var variableValue = parseFloat(ob[dimValueField]);
                
                if(!isNaN(variableValue))
                {
                    //When using a Log D3 chart there is a bug that doesn't let you use 0 values'
                    if(dimensionValue != 0) 
                    {	
                        ob[dimActFieldValue] = dimensionValue;
                    }
                    else{
                        ob[dimField] = -1;
                        ob[dimActFieldValue] = dimensionValue;    
                    }

                    cleanFeatures.push(ob);
                }
            }	 
            
            
            return cleanFeatures;
        },
        arrayOfValues: function(features)
        {
            var arrayofValues = [];
            
            for (var index=0;index <  features.length;index++)
            {
                var ob = features[index];
                var variableValue = parseFloat(ob[this._dimValueField]);
                arrayofValues.push(variableValue);
            }
            
            arrayofValues.sort(function(a, b){return a-b});
            
            return arrayofValues;
        },
        /**
         * 
         */
        deleteChart: function ()
        {
            var oldSVG = D3.select("#elevationSliderPanel").select("svg");
            if(oldSVG != null)
                oldSVG.remove();	
        },
        updateChartSize: function ()
        {
            this.deleteChart();
            if(this._chartMode)
                this.createDimensionalChartSilder(this._currentSliceTable);
            else
                this.createDimensionSlider();
        },
        
        /**********Private Functions ************************************/
        _resetElevationSliderPanel:function(){
            var mapHeight = document.getElementById('map').offsetHeight;
            
            if(this._chartMode)
                sliderHeight = mapHeight - 315;
            else
                sliderHeight = mapHeight - 185;
            //document.getElementById('elevationSliderPanel').offsetHeight = sliderHeight;
            document.getElementById('leftChart').style.height = sliderHeight.toString() + 'px';
            document.getElementById('elevationSliderPanel').style.height = 'auto';
        },
        _getDimensionSliderWidth: function(){
	       var totalPossibleWidth = document.getElementById('leftChart').offsetWidth;
	
	       return totalPossibleWidth * .90;
        },
        _getDimensionSliderHeight:function(){
	       var totalPossibleHeight = document.getElementById('leftChart').offsetHeight;
	
	       return totalPossibleHeight * .90;	
        },
        _addSliderPlot: function(margin, width, height){
           var panel= D3.select("#elevationSliderPanel");
	       var svg = D3.select("#elevationSliderPanel").append("svg")
		    .attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.top + margin.bottom)
		  	.append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		    
	       return svg;
        },
        
        _updateSelectedIndex: function(){
            var currentSelectedValue = this._currentSelectedDimensionValue;
            var svg = D3.select("#elevationSliderPanel").select("svg");
            
            var circles = svg.selectAll(".dsDot");
            for(var index = 0; index < circles[0].length; index++)
            {
                var chartDotCircle = circles[0][index];
                if(chartDotCircle.__data__[this._dimActFieldValue] == currentSelectedValue){
                    this._selectedDimSliderIndex = index;
                    break;
                }
            }
        },
        _selectDimensionStep: function ()
        {
            var dimSelectionAtr = this._dimSelectionAtr;
            var selectedDimSliderIndex = this._selectedDimSliderIndex;
            var dimActFieldValue = this._dimActFieldValue;
            var dimField = this._dimField;
            
            var svg = D3.select("#elevationSliderPanel").select("svg");
                
            var circles = svg.selectAll(".dsDot");
            for(var index = 0; index < circles[0].length; index++)
            {
                var chartDotCircle = circles[0][index];

                chartDotCircle.style.fill = "";		
                chartDotCircle.style.stroke = "";
                chartDotCircle.setAttribute("r", 2);
                chartDotCircle.__data__[dimSelectionAtr] = false;
            }

            circles[0][selectedDimSliderIndex].style.fill = "cyan";
            circles[0][selectedDimSliderIndex].style.stroke = "black";	
            circles[0][selectedDimSliderIndex].setAttribute("r", 4);	
            circles[0][selectedDimSliderIndex].__data__[dimSelectionAtr] = true;	

            this._currentSelectedDimensionValue = circles[0][selectedDimSliderIndex].__data__[dimActFieldValue];	

            var textAll = svg.selectAll("#Title");
            textAll[0][0].textContent = dimField + ": " + this._currentSelectedDimensionValue.toString();			
        },
        /**
         *This event is fired off when an plot point is clicked.
         * We highlight the point on the chart and send out another event
         * so the map knows to highlight the point. 
         */
        _dotMouseClick: function (d,i)
        {
            this._selectedDimSliderIndex = i;

            this._selectDimensionStep();
            
            this.dimensionalSliderUpdated();
        },
        /**
         *This event is fired off when an plot point is clicked.
         * We highlight the point on the chart and send out another event
         * so the map knows to highlight the point. 
         */
        _dotOnMouseOver: function(d,i)  {
            var svg = D3.select("#elevationSliderPanel").select("svg");
            var circles = svg.selectAll(".dsDot");
            var selectedCircle = circles[0][i];	
            var dimSelectionAtr = this._dimSelectionAtr; 

            if(d[dimSelectionAtr])
            {
                selectedCircle.setAttribute("r", 5);
            }
            else
            {
                selectedCircle.setAttribute("r", 3.5);
            }
        },
        /**
         *This event is fired off when the mouse is no longer hovering
         */
        _dotOnMouseOut: function(d,i) {

            var svg = D3.select("#elevationSliderPanel").select("svg");
            var circles = svg.selectAll(".dsDot");
            var selectedCircle = circles[0][i];	
            var dimSelectionAtr = this._dimSelectionAtr;

            if(d[dimSelectionAtr])
            {
                selectedCircle.setAttribute("r", 4);
            }
            else
            {
                selectedCircle.setAttribute("r", 2);
            }
	
        },
        /*****  EVENTS  *********************************/ 
        /**
         * We need to let the mapping client know when a point has been selected on the chart
        */
        dimensionalSliderUpdated : function () {}
    });
}); 