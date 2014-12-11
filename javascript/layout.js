dojo.require("esri.map");
dojo.require('esri.dijit.Attribution');
dojo.require("esri.arcgis.utils");
dojo.require("esri.dijit.Scalebar");
dojo.require("esri.dijit.BasemapGallery");
dojo.require("esri.layers.DynamicMapServiceLayer");
dojo.require("dojo/json");

//GLOBALS
  var map;
  //var eventSliderOb = null;
  var timeEventSlider = null;
  //var dimSliderOb = null;
  var depthSlider = null;
  var wmsLayer = null;
  var timeDim = '';
  var nDim = '';
  var multiDimLayer = null; 
  var portalSercher = null;
  var esriMap = null;

    
/**
 *Fires off when the web pages is loaded 
 */  
function initMap() {
   	
    esri.config.defaults.io.proxyUrl =  location.protocol + '//' + location.host + "/sharing/proxy.ashx";
    esri.config.defaults.io.alwaysUseProxy = false;
    esriConfig.defaults.io.corsEnabledServers.push("ec2-107-20-193-250.compute-1.amazonaws.com:6080");
    esriConfig.defaults.io.corsEnabledServers.push("ec2-54-221-57-65.compute-1.amazonaws.com:6080");
      	
  	require(["dojo/dom","esri/map","esri/dijit/BasemapToggle", "dojo/domReady!"], function(dom,Map,BasemapToggle) { 
        map = new Map("map", {
          center: [-56.049, 38.485],
          zoom: 3,
          basemap: "oceans"
        });
        
        var toggle = new BasemapToggle({
            map: map,
            basemap: "gray"
          }, "BasemapToggle");
        toggle.startup();
        
        dojo.addClass(map.infoWindow.domNode, "chrome");   
        
        portalSercher = new PortalSearch();
    
        esriMap = new EsriMapHandler(map); 
        esriMap.updateMapTime(new Date(1391040000000),new Date(1391040000000));

        loadNewMultiDimLayer("http://arcgis-multidim103-757712173.us-east-1.elb.amazonaws.com/arcgis/rest/services/NCOM/Sea_Temperature/ImageServer");
        
        dom.byId('titleValue').textContent = "Sea Temperature"; 
        placeTitle();

        tb = new esri.toolbars.Draw(map);
        dojo.connect(tb, "onDrawEnd", addGraphic);
  	});
}

/**
 *Loads the multidimensional layer and sets up the vent listeners
 */
function loadNewMultiDimLayer(url){
    
    multiDimLayer =   esriMap.createMultiDimLayer(url);

    multiDimLayer.multiDimPropertiesLoaded = function (arg) {
        multiDimLoaded();
    };  

    multiDimLayer.idDimensionSlicesValues = function(outputValues){
        document.getElementById('eventSliderPanel').style.height = '190px';
        document.getElementById('timeSliderFooter').style.height = 'auto';
        
        timeEventSlider.deleteChart();
        timeEventSlider.createTimeChartSlider(outputValues);
    };

    multiDimLayer.idTimeSlicesValues = function(outputValues){
        depthSlider.setIsInChartMode(true);
        document.getElementById('leftChart').style.width = '300px';
        document.getElementById('elevationSliderPanel').style.width = 'auto';
        
        depthSlider.deleteChart();
        depthSlider.createDimensionalChartSilder(outputValues);
    };
    
    //Set the sliders back to normal
    document.getElementById('eventSliderPanel').style.height = '';
    document.getElementById('timeSliderFooter').style.height = 'auto';
    document.getElementById('leftChart').style.width = '';
    document.getElementById('elevationSliderPanel').style.width = 'auto';

    map.addLayer(multiDimLayer);    
}

function multiDimLoaded(){
 
    if(timeEventSlider == null)
    {
        timeEventSlider = new TimeEventSlider();
        timeEventSlider.eventTimeSliderUpdated = function (arg) {
            updateMapTime();
        };
    }
    else{
        timeEventSlider.deleteChart();
    }
    
    var variables = multiDimLayer.getVariablesNames();
    var variable = variables[0];
    var variableProperties = multiDimLayer.getVariableProperties(variable);
    var timeValues = multiDimLayer.getDimensionValues(variable,"StdTime");
    var timeProps = multiDimLayer.getDimensionProperties(variable,"StdTime"); 
        
    timeEventSlider.setTimeField(timeProps.description);
    timeEventSlider.setVariableName(variableProperties.description);
    timeEventSlider.setVariableUnits(variableProperties.units);
    timeEventSlider.setTimeSlices(timeValues);
    timeEventSlider.createTimeEventSlider();

    //Show the Event Slider.
    var footerElem = document.getElementById('footer');
    footerElem.style.visibility = 'visible';
        
    //Only show the n Dim Slider when there is a dimension other than time
    var dimensionValues = multiDimLayer.getDimensionValues(variable,"StdZ");
    if(dimensionValues != '')
    {
    	if(depthSlider == null)
    	{
    		depthSlider = new DimensionalSlider();
            depthSlider.dimensionalSliderUpdated = function (arg) {
                updateDimension();
            };
    	}
        else{
            depthSlider.deleteChart();
        }
        
        var dimensionProps = multiDimLayer.getDimensionProperties(variable,"StdZ"); 
    	var sortedList = dimensionValues.sort(function(a, b){return a-b});
        
        depthSlider.setDimensionField(dimensionProps.description);
        depthSlider.setDimensionUnits(dimensionProps.units);
        depthSlider.setDefaultValue(sortedList[0]);
        depthSlider.setSlices(sortedList.reverse());
        depthSlider.createDimensionSlider();

    	//Show the Dimension Slider.
    	var leftChartElem = document.getElementById('leftChart');
  		leftChartElem.style.visibility = 'visible';
    }
    
    //We want to make sure that the current time is shown
    updateMapTime();
    updateDimension();
}

function resetLayout(){
	if(timeEventSlider != null){
		//When the application is rezied, we want to refresh the graph
		timeEventSlider.updateChartSize();
	}
    if(depthSlider != null){
        depthSlider.updateChartSize();
    }
    
    placeTitle();
}

function placeTitle(){
    require(["dojo/dom"], function(dom){
        var mapWidth = dom.byId('map').offsetWidth;
        var panelWidth = dom.byId('titlePanel').offsetWidth;

        var left = (mapWidth/2) - (panelWidth/2)
        var panelWidth = dom.byId('titlePanel').style.left = left;
    });
}

var utils = {
	applyOptions : function(configVariable, newConfig) {
		var q;

		//Override any config options with query parameters
		for (q in newConfig) {
			configVariable[q] = newConfig[q];
		}
		return configVariable;
	},
	mapResize : function(mapNode) {
		//Have the map resize on a window resize
		dojo.connect(dijit.byId('map'), 'resize', map, map.resize);
	},
	onError : function(error) {
		console.log('Error occured');
		console.log(error);
	}
};	

function addGraphic(geometry){
    esriMap.plotPointOnMap(geometry);
    multiDimLayer.identifyDimensionSlice(geometry,"StdZ",0);
    multiDimLayer.identifyTimeSlice(geometry,"StdTime",map.timeExtent);
    tb.deactivate();
}

function updateDimension()
{
	//Gets the current selected dimension value from the Dimension Slider
	var dimensionValue = depthSlider.getDimensionValue();
    var pntGeom = esriMap.getCurrentPoint();

    if(depthSlider.getIsInChartMode())
        multiDimLayer.identifyDimensionSlice(pntGeom,"StdZ",dimensionValue);
    
    multiDimLayer.updateDimension(dimensionValue,"StdZ");
    multiDimLayer.refresh();
}

function animationShow(ob)
{
	//graphingWidget.style.top = '130px';
}  

function animationHide(ob)
{
	//graphingWidget.style.top = '60px';
}    
  
  function updateAnimationWidget(dateTimeStr)
  {
	  	//animationDateTimeLabel.textContent = dateTimeStr; 
		//timeLabel = document.getElementById('time');
		//timeLabel.textContent = dateTimeStr; 
  	 	
  	 	if(timeEventSlider.isSlidersLastSpot()) 
  	 		animForwardBtn.disabled = true;
  	 	else
  	 		animForwardBtn.disabled = false;
  	 		
  	 	if(timeEventSlider.isSlidersFirstSpot())
  	 		animBackwordBtn.disabled = true;
  	 	else
  	 		animBackwordBtn.disabled = false;  	
  }
  
  /***
   * Event Handler Listener function for when the Event Sliders Date Changes. 
   * We want to update our Animation Widgets Date to be the same as the Event Slider
   * Also Enable/Disable the Animation buttons depending on where we are at within the
   * Event Slider.  For example disable the Forward button when we are at the last event
   * within the map.
   */
  function updateMapTime()
  {
  	 if(timeEventSlider != null)
  	 {
  	 	//dateTime = eventSliderOb.getDateTime();
		var dateTime = timeEventSlider.getDateTime();
        var dateTimeStr = dateTime.toDateString();

        if(timeEventSlider.getIsInChartMode()){
            var pntGeom = esriMap.getCurrentPoint();
            multiDimLayer.identifyTimeSlice(pntGeom,"StdTime",map.timeExtent);
        }
            
        esriMap.updateMapTime(dateTime,dateTime);

  	 	updateAnimationWidget(dateTimeStr);
  	 }
  }
  /**
 *Move the Event Slider to the next event. 
 */
function animationGoForward()
{
	if(timeEventSlider != null)
	{
		timeEventSlider.moveSliderForward();
	}
}
/**
 *Move the Event Slider to the previous event. 
 */
function animationGoBackward()
{
	if(timeEventSlider != null)
	{
		timeEventSlider.moveSliderBackward();
	}
}

/**
 *Animates through all the events.
 */
function animationPlay()
{
	if(timeEventSlider != null)
	{
		timeEventSlider.playButtonClicked();
		
		var playButton = document.getElementById('animPlayBtn');
		var img = playButton.children[0];
		
		
		if(timeEventSlider.isPlayActive())
			img.src = "./images/Button-Pause-16.png";
		else
			img.src = "./images/Button-Play-16.png";
		
	}
}

function searchSciData(){
    
  var searchTerm = document.getElementById('dataFinder');
  
    portalSercher.findSciData(searchTerm.value);
    portalSercher.getQueryResults = function (data) {
        showSciResults(data)
    };
    
}

function clearSearch(){
    require(["dojo/dom", ], function(dom){
        if(itemGrid){
            itemGrid.refresh();
            itemGrid.renderArray([]);
        }
        //grid.style.display = 'none';   
        dom.byId('grid').style.display = 'none';   
        dom.byId('dataFinder').value = '';   
        dom.byId('sciDataResults').innerHTML = '';
    });
}

var groupGrid;
var itemGrid;

//display a list of groups that match the input user name
function showSciResults(response) {
    require([
        "dojo/parser", 
        "dojo/ready", 
        "dojo/dom", 
        "dojo/dom-construct", 
        "dojo/_base/array", 
        "dijit/registry", 
        "dojo/on", 
        "esri/arcgis/Portal", 
        "esri/config",
        "esri/lang",
        "dgrid/Grid", 
        "dijit/layout/BorderContainer", 
        "dijit/layout/ContentPane" 
    ], function(
        parser, 
        ready, 
        dom, 
        domConstruct, 
        array, 
        registry, 
        on, 
        esriPortal,
        config, 
        esriLang,
        Grid
    ){
  //clear any existing results
  var data = [];
    if (itemGrid) {
      grid.style.display  = "inherit";
      itemGrid.refresh();
    }
    if (response.total > 0) {
      //create an array of attributes for each group - we'll display these in a dojo dgrid
      data = array.map(response.results, function (item) {
        return {
          'snippet': item.snippet,
          'title': item.title,
          'url': item.url,
          'thumbnail': item.thumbnailUrl || '',
          'id': item.id,
          'owner': item.owner
        }
      });
      //create the grid
      itemGrid = new Grid({
        columns: {
          thumbnail: 'Group Icon',
          title: 'Group',
          snippet: 'Description'
        },
        renderRow: function(obj, options){
            var template = '<div class="thumbnail"><img src=${thumbnail} width="50" height="50"/></div><a target="_blank" class="title" href=${url}>${title}</a><span class="owner"> (${owner} ) </span><div class="summary">${snippet} </div>';

            obj.thumbnail = obj.thumbnail || '';

            //domConstruct.create is a replacement for dojo.create
            return div = domConstruct.create("div",{
              innerHTML : esriLang.substitute(obj,template)
            });},
        //this function renders the table in a non-grid looking view
        showHeader: false,
      }, "grid");
        
      itemGrid.on(".dgrid-row:click", function(event){
        var row = itemGrid.row(event);
        var imageServerURL = row.data.url;
        itemGrid.refresh();
        itemGrid.renderArray([]);
        dom.byId('grid').style.display = 'none';
        dom.byId('dataFinder').value = '';   
          
        map.removeLayer(multiDimLayer);
          
        loadNewMultiDimLayer(imageServerURL);
        
        dom.byId('titleValue').textContent = row.data.title;   
      });
        
      itemGrid.renderArray(data);
        


    } else {
      dom.byId('sciDataResults').innerHTML = '<h2>Group Results</h2><p>No groups were found. If the group is not public use the sign-in link to sign in and find private groups.</p>';
    }
  });
}