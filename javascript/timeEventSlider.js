require([
    "dojo/_base/declare",
    "http://d3js.org/d3.v3.min.js",
    "dojo/_base/lang"
], function(declare,D3,lang){
    
    return declare("TimeEventSlider", null, {

        /*** CONSTRUCTOR **********************/
	    constructor: function(/*Object*/ args){
            this._timeSliderDateLabel = "Date: January";
            this._selectedEventSliderIndex = 0;
            this._currentDateTime = null;
            this._currentDateTimeString = '';
            this._timeSlicesTable = null;
            this._currentChartTable = null;
            this._eventSliderPlayActive = false;
            this._tsChartPointSelected = "Selected";
            this._valueField = "value";
            this._timeField = "time";
            this._actValueField = "actvalue";
            this._variableName = '';
            this._variableUnits = '';
            this._isInChartMode = false;
            
            var myVar=setInterval(lang.hitch(this,function(){this._myTimer()}),3000);
        },
        /*** Properties **********************/
        getIsInChartMode: function(){
            return this._isInChartMode;
        },
        getDateTime: function (){
            return this._currentDateTime;
        },
        
        isPlayActive: function (){
            return this._eventSliderPlayActive;
        },
        setTimeField: function(value){
            this._timeField = value;
        },
        setVariableName: function(value){
            this._variableName = value;
        },
        setVariableUnits: function(value){
            this._variableUnits = value;
        },
        
        
        /*** Public Functions **********************/
        setTimeSlices: function(timeValues){

            var timeSlices = [];
            for (index=0;index <  timeValues.length;index++)
            {
                var ob = [];
                var date = new Date(timeValues[index]);
                var timeString = date.toLocaleString();
                var dateTime = date;

                var ob = [];
                ob[this._timeField] = dateTime;
                ob[this._valueField] = 0;
                ob[this._actValueField] = timeString;

                timeSlices.push(ob);
            }	

            this._timeSlicesTable = timeSlices;	
        },
        
        createTimeEventSlider: function (){
            this._isInChartMode = false;
            var features = this._timeSlicesTable;
            var timeField = this._timeField;
            var actValueField = this._actValueField;
            var valueField = this._valueField;
            
            timeSliderWidth = this._getEventSliderWidth();
            
            var margin = {top: 20, right: 15, bottom: 20, left: 35},
            width = timeSliderWidth - margin.left - margin.right; 
            height = 2; 


            //Adding the plot framwork to the application
            var svg = this._addPlot(margin, width, height);

            //Configuring the Plot
            var x = D3.time.scale().range([0, width]);
            var y = D3.scale.linear().range([height, 0]);

            var xAxis = D3.svg.axis().scale(x).orient("bottom").ticks(4);

            var line = D3.svg.line().x(function(d) {
                return x(d[timeField]);
            }).y(function(d) {
                return y(0);
            });		


            x.domain(D3.extent(features, function(d) {
                return d[timeField];
            }));


            y.domain(D3.extent(features, function(d) {
                return 0;
            })); 

            svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis);

            svg.append("path").datum(features).attr("class", "line").attr("d", line);

            svg.selectAll(".tsDot")
            .data(features)
            .enter().append("circle")
            .attr("class", "tsDot")
            .attr("r", 3.5)
            .attr("cx", function(d) { return x(d[timeField]); })
            .attr("cy", function(d) { return y(d[valueField]);})
            .on("click",lang.hitch(this, this._dotOnMouseClick))
            .on("mouseover",lang.hitch(this, this._dotOnMouseOver))
            .on("mouseout",lang.hitch(this, this._dotOnMouseOut))
            .append("svg:title").text(function(d) {
                return (d[actValueField]).toString();
            }); 

            svg.append("text")
                .attr("x", (width / 2))          
                .attr("y", 0 - (margin.top / 2))
                .attr("id", "Title")
                .attr("text-anchor", "middle")  
                .style("font-size", "14px") 
                .style("text-decoration", "underline")  
                .text(this._timeSliderDateLabel);

            //We want to highlight the current view of the map
            this._changeEventStep();	
        },
        
        createTimeChartSlider: function(timeSlices){
            this._isInChartMode = true;
            this._currentChartTable = timeSlices;
            var features = timeSlices;
            var timeField = "StdTime";
            this._timeField = "StdTime";
            var actValueField = this._actValueField;
            var valueField = this._valueField;
            
            timeSliderWidth = this._getEventSliderWidth();
            
            var margin = {top: 20, right: 15, bottom: 20, left: 56},
            width = timeSliderWidth - margin.left - margin.right; 
            height = 185 - margin.top - margin.bottom;


            //Adding the plot framwork to the application
            var svg = this._addPlot(margin, width, height);

            //Configuring the Plot
            var x = D3.time.scale().range([0, width]);
            var y = D3.scale.linear().range([height, 0]);

            var xAxis = D3.svg.axis().scale(x).orient("bottom").ticks(4);
            var yAxis = d3.svg.axis().scale(y).orient("left").ticks(6);
            
            var line = d3.svg.line()
            .x(function(d) {
                return x(d[timeField]);
            })
            .y(function(d) {
                return y(d[valueField]);
            });		

            x.domain(D3.extent(features, function(d) {
                return d[timeField];
            }));


            y.domain(D3.extent(features, function(d) {
                return d[valueField];
            })); 

            svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis);
            
            svg.append("g").attr("class", "y axis").call(yAxis)
               .append("text").attr("transform", "rotate(-90)")
               .attr("y", 6).attr("dy", "-48")
               .style("text-anchor", "end").text(this._variableName + " (" + this._variableUnits + ")");
            
            svg.append("path")
                .datum(features)
                .attr("class", "line")
                .attr("d", line);

            svg.selectAll(".tsDot")
            .data(features)
            .enter().append("circle")
            .attr("class", "tsDot")
            .attr("r", 3.5)
            .attr("cx", function(d) { return x(d[timeField]); })
            .attr("cy", function(d) { return y(d[valueField]);})
            .on("click",lang.hitch(this, this._dotOnMouseClick))
            .on("mouseover",lang.hitch(this, this._dotOnMouseOver))
            .on("mouseout",lang.hitch(this, this._dotOnMouseOut))
            .append("svg:title").text(function(d) {
                return ("Value: " + d[valueField] + "\nDepth: " + d["StdZ"] + "\nTime: " + d["StdTime"]+ "\nName: " + d["Name"]).toString();
            }); 

            svg.append("text")
                .attr("x", (width / 2))          
                .attr("y", 0 - (margin.top / 2))
                .attr("id", "Title")
                .attr("text-anchor", "middle")  
                .style("font-size", "14px") 
                .style("text-decoration", "underline")  
                .text(this._timeSliderDateLabel);

            //We want to highlight the current view of the map
            this._changeEventStep();	           
        },

	
        moveSliderForward : function (){
            if(!this.isSlidersLastSpot())
                this._selectedEventSliderIndex++;
            else
                this._selectedEventSliderIndex = 0;

            this._changeEventStep();
        
            this.eventTimeSliderUpdated();
        },
	
        moveSliderBackward : function (){
            this._selectedEventSliderIndex--;

            this._changeEventStep();

            this.eventTimeSliderUpdated();
        },
	
        playButtonClicked : function (){
            if(this._eventSliderPlayActive)
                this._eventSliderPlayActive = false;
            else
                this._eventSliderPlayActive = true;
        },
		
        updateChartSize: function (){
           this.deleteChart();
            
           if(this._isInChartMode)
               this.createTimeChartSlider(this._currentChartTable);
           else
	           this.createTimeEventSlider();
        },
        deleteChart: function() {
            var oldSVG = D3.select("#eventSliderPanel").select("svg");
            if(oldSVG != null)
    	       oldSVG.remove();	
        },
        /**
        *Check if we are on the last spot, this is typically used by an animation widget to let it know we cannot
        * go any further into the future
        */  
        isSlidersLastSpot: function (){
            var lastStep = false;
            totalSteps = this._getStepsCount();
            if(totalSteps != 0)
            {
                if(this._selectedEventSliderIndex + 1 >= totalSteps)
                    lastStep = true;
            }

            return lastStep;
        },
	   /**
        *Check if we are on the first spot, this is typically used by an animation widget to let it know we cannot
        * go any further back in time
        */    
        isSlidersFirstSpot : function (){
            var firstStep = false;
            if(this._selectedEventSliderIndex == 0)
                firstStep = true;
            return firstStep;
        },
        
        /*****PRIVATE FUNCTIONS *************************/
        _getEventSliderWidth : function () {
            
            totalPossibleWidth = document.getElementById('eventSliderPanel').offsetWidth;

            return totalPossibleWidth * .90;
        },
        /**
         *Adds the Plot Framework to the Application 
         * @param {Object} margin
         * @param {Object} width
         * @param {Object} height
         */
        _addPlot : function (margin, width, height)
        {    	
            var panel= D3.select("#eventSliderPanel");
            var svg = D3.select("#eventSliderPanel").append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            return svg;
        },
        
        _selectNewTimeStep : function(dateTime){
            var timeField = this._timeField;
            var actValueField = this._actValueField
            
            var svg = D3.select("#eventSliderPanel").select("svg");
	
            var circles = svg.selectAll(".tsDot");
            for(var index = 0; index < circles[0].length; index++)
            {
                var chartDotCircle = circles[0][index];

                var dotDateValue = new Date(chartDotCircle.__data__[timeField]);

                if(dotDateValue.getTime() == dateTime.getTime()) 
                {
                    chartDotCircle.style.fill = "cyan";		
                    chartDotCircle.style.stroke = "black";	
                    chartDotCircle.setAttribute("r", 6);	

                    //Marking chart point as selected so we know when mousing over the point.
                    chartDotCircle.__data__[this._tsChartPointSelected] = true;

                    var chartStringValue = chartDotCircle.__data__[actValueField];

                    //Use Dimension Name
                    var chartingDateLabel = timeField + ": " + chartStringValue; 

                    var textAll = svg.selectAll("#Title");
                    textAll[0][0].textContent = chartingDateLabel;		

                    //Save the selected index
                    this._selectedEventSliderIndex = index;
                }
                else
                {
                    chartDotCircle.style.fill = "";		
                    chartDotCircle.style.stroke = "";
                    chartDotCircle.setAttribute("r", 3.5);
                    chartDotCircle.__data__[this._tsChartPointSelected] = false;
                }
            }	
        },
        
        _getStepsCount : function(){
            var length = 0;
	
            var svg = D3.select("#eventSliderPanel").select("svg");

            var circles = svg.selectAll(".tsDot");
            if(circles != null && circles.length > 0)
                length= circles[0].length;

            return length;
        },
        /**
         *Highlights the selected point and sets the other points back to the original value 
         */
        _changeEventStep : function () {
            var svg = D3.select("#eventSliderPanel").select("svg");

            var circles = svg.selectAll(".tsDot");
            var selectedItem = circles[0][this._selectedEventSliderIndex];
            this._currentDateTime = new Date(selectedItem.__data__[this._timeField]);
            this._currentDateTimeString = selectedItem.__data__[this._actValueField];

            this._selectNewTimeStep(this._currentDateTime);
        },
        /**
         *This event is fired off when an plot point is clicked.
         * We highlight the point on the chart and send out another event
         * so the map knows to highlight the point. 
         */
        _dotOnMouseClick: function (d,i)
        {
            this._selectedEventSliderIndex = i;

            this._changeEventStep();

            this.eventTimeSliderUpdated();
        },

        /**
         *This event is fired off when an plot point is clicked.
         * We highlight the point on the chart and send out another event
         * so the map knows to highlight the point. 
         */
        _dotOnMouseOver: function (d,i)
        {
            var svg = D3.select("#eventSliderPanel").select("svg");
            var circles = svg.selectAll(".tsDot");
            var selectedCircle = circles[0][i];	

            if(d[this._tsChartPointSelected])
            {
                selectedCircle.setAttribute("r", 7);
            }
            else
            {
                selectedCircle.setAttribute("r", 4.5);
            }
        },

        /**
         *This event is fired off when the mouse is no longer hovering
         */
        _dotOnMouseOut: function eventSliderOnMouseOut(d,i)
        {	
            var svg = D3.select("#eventSliderPanel").select("svg");
            var circles = svg.selectAll(".tsDot");
            var selectedCircle = circles[0][i];	

            if(d[this._tsChartPointSelected])
            {
                selectedCircle.setAttribute("r", 6);
            }
            else
            {
                selectedCircle.setAttribute("r", 3.5);
            }

        },
        _myTimer: function()
        {	
            if(this._eventSliderPlayActive)
                this.moveSliderForward();
        },

        /*****  EVENTS  *********************************/ 
        /**
         * We need to let the mapping client know when a point has been selected on the chart
        */
        eventTimeSliderUpdated : function () {}
    });
}); 