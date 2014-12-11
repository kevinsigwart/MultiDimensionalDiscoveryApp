require([
    "dojo/_base/declare",
    "esri/layers/ArcGISImageServiceLayer",
    "esri/layers/ImageServiceParameters",
    "esri/layers/MosaicRule",
    "esri/request",
    "esri/TimeExtent",
    "esri/tasks/ImageServiceIdentifyTask",
    "esri/tasks/ImageServiceIdentifyParameters",
    "dojo/_base/lang",
    "dojo/promise/all"
], function(declare, ArcGISImageServiceLayer,ImageServiceParameters,
             MosaicRule,esriRequest,TimeExtent,
             ImageServiceIdentifyTask,ImageServiceIdentifyParameters,lang,all){
    
    return declare("MultiDimensionalImageService", esri.layers.ArcGISImageServiceLayer, {
    	    
	    constructor: function(/*Object*/ args){
                        
            /*****  PARAMETERS  *********************************/ 
            this._multiDimensionalInfo = null;
            
            var multiDimInfoURL = this.url + "/multiDimensionalInfo?f=pjson";  
            var multiDimensionData = esriRequest({
              url: multiDimInfoURL,
              handleAs: "json"
            });
            
            multiDimensionData.then(lang.hitch(this, gotMultiDimData), requestFailed);
            
            
            /*****  Private FUNCTIONS  *********************************/ 
            function gotMultiDimData(data){
                this._multiDimensionalInfo = data.multidimensionalInfo;   
                this.multiDimPropertiesLoaded();
            }
            
            function requestFailed(error){
                alert("Failed");
            }
            
            
            /*****  Public FUNCTIONS  *********************************/ 
            /**
            *  Updates the dimension values, Do not use for time.  Time is handled within
            * map properties.  ONly works for one dimension at a time currently
            **/
            this.updateDimension = function (dimension, value)
                {
                    var mr = new MosaicRule();
                    mr.method = MosaicRule.METHOD_NONE;
                    mr.where = dimension + " = " + value.toString();

                    this.setMosaicRule(mr);
                };
            
            this.getVariablesNames = function(){
                var variables = this._multiDimensionalInfo.variables;
                var names = [];
                for (var key in variables){
                    names.push(variables[key].name);
                }
                return names;
            }
            
            this.getVariableProperties = function(variable){
                var variables = this._multiDimensionalInfo.variables;
                var variableProps = [];
                for (var key in variables){
                    if (variables[key].name == variable)
                    {
                        variableProps = {
                         name:variables[key].name,
                         description: variables[key].description,
                         units: variables[key].units
                        };
                    }
                }
                
                return variableProps;
            }
            
            this.getDimensions = function(variable){
                var variables = this._multiDimensionalInfo.variables;
                var dimensions = [];
                
                for (var key in variables){
                    if (variables[key].name == variable)
                    {
                        variableDimensions = variables[key].dimensions
                        for (var dimkey in variableDimensions){
                            dimensions.push(variableDimensions[dimkey].name);
                        }
                    }
                }
                
                return dimensions;

            };
            
            this.getDimensionProperties = function(variable, dimension){
                var dimensionProperties = [];
                var variables = this._multiDimensionalInfo.variables;
                for (var key in variables){
                    if (variables[key].name == variable)
                    {
                        variableDimensions = variables[key].dimensions
                        for (var dimkey in variableDimensions){
                            if(variableDimensions[dimkey].name == dimension){
                                dimensionProperties = {
                                    name: variableDimensions[dimkey].name,
                                    description: variableDimensions[dimkey].description,
                                    units: variableDimensions[dimkey].units,
                                    field: variableDimensions[dimkey].field,
                                    extent: variableDimensions[dimkey].extent,
                                    hasRanges: variableDimensions[dimkey].hasRanges
                                };
                            }
                        }
                    }
                }      
                
                return dimensionProperties;
            }
            
            this.getDimensionValues = function(variable,dimension){
                var variables = this._multiDimensionalInfo.variables;
                var dimenionValues = [];
                for (var key in variables){
                    if (variables[key].name == variable)
                    {
                        variableDimensions = variables[key].dimensions
                        for (var dimkey in variableDimensions){
                            if(variableDimensions[dimkey].name == dimension){
                                dimenionValues = variableDimensions[dimkey].values;
                            }
                        }
                    }
                }
                
                return dimenionValues;
            };
        },
        identifySubset:function(geometry,variable,timeDimension,depthDimension){
            var url = this.url;
            
            var timeValues = this.getDimensionValues(variable,timeDimension);
            //var map = this.getMap();
            
            var indentifies = [];
            
            
            for(var index = 0; index < timeValues.length; index+=10) {
                var time = timeValues[index];
                var endTime;
                if(index + 10 < timeValues.length){
                    
                   endTime = timeValues[index + 10];
                }
                else
                    endTime = timeValues[timeValues.length - 1];
                
                var timeExtent = new TimeExtent();
                timeExtent.startTime = new Date(time);
                timeExtent.endTime = new Date(endTime);
                
                var imageTask = new ImageServiceIdentifyTask(url);
                var imageParams = new ImageServiceIdentifyParameters();
                
                imageParams.returnCatalogItems = true;
                imageParams.geometry = geometry;
                imageParams.timeExtent = timeExtent;
                
                var executeTask = imageTask.execute(imageParams);
                indentifies.push(executeTask);
                
            }
            
            var promises = new all(indentifies);            
            promises.then(lang.hitch(this, this._getResults));         
        },
        identifyDimensionSlice:function(geometry,dimensionField, dimensionValue){
            var url = this.url;
            var imageTask = new ImageServiceIdentifyTask(url);
            
            var imageParams = new ImageServiceIdentifyParameters();
            
            var mr = new MosaicRule();
            mr.method = MosaicRule.METHOD_NONE;
            mr.where = dimensionField + " = " + dimensionValue.toString();
            
            imageParams.returnCatalogItems = true;
            imageParams.geometry = geometry;
            imageParams.mosaicRule = mr;
            imageTask.execute(imageParams, lang.hitch(this, this._getDimensionSliceResults));
        },
        identifyTimeSlice:function(geometry,timeDimension,timeExtent){
            var url = this.url;
                        
            var indentifies = [];
                        
            var imageTask = new ImageServiceIdentifyTask(url);
            
            var imageParams = new ImageServiceIdentifyParameters();            
            imageParams.returnCatalogItems = true;
            imageParams.geometry = geometry;
            imageParams.timeExtent = timeExtent;
            imageTask.execute(imageParams, lang.hitch(this, this._getTimeSliceResults));
        },
        
        identifyAll:function(geometry,variable,timeDimension,depthDimension){
            var url = this.url;
                        
            var indentifies = [];
                        
            var imageTask = new ImageServiceIdentifyTask(url);

            var imageParams = new ImageServiceIdentifyParameters();            
            imageParams.returnCatalogItems = true;
            imageParams.geometry = geometry;
            imageTask.execute(imageParams, lang.hitch(this, this._getResults));
        },
        _getResults:function(result){
            alert("Got Something");
        },
        _getTimeSliceResults:function(result){
            var sliceValues = result.properties.Values;
            var footprintFeatures = result.catalogItems.features;
            var valueTable = [];
            
            for(var index = 0; index < footprintFeatures.length; index++){
                var footprintAttr = footprintFeatures[index].attributes;
                footprintAttr.value = sliceValues[index];
                valueTable.push(footprintAttr);
            }
            
            //We also want to sort these based on date
            valueTable.sort(function (a, b) {
                if (a["StdZ"] > b["StdZ"])
                  return 1;
                if (a["StdZ"] < b["StdZ"])
                  return -1;
                // a must be equal to b
                return 0;
            });
            
            this.idTimeSlicesValues(valueTable);
        },
        _getDimensionSliceResults:function(result){
            //alert("Got Dimensional");
            var sliceValues = result.properties.Values;
            var footprintFeatures = result.catalogItems.features;
            var valueTable = [];
            var firstName = footprintFeatures[0].attributes.Name.split(":")[0]
            
            for(var index = 0; index < footprintFeatures.length; index++){
                var footprintAttr = footprintFeatures[index].attributes;
                var name = footprintFeatures[index].attributes.Name.split(":")[0]
                footprintAttr.value = sliceValues[index];
                footprintAttr.actvalue = (new Date(footprintAttr["StdTime"])).toLocaleTimeString();
                valueTable.push(footprintAttr);
                //Only interested in one result set (In case there are overlapping areas)
                /*if(firstName == name){
                    footprintAttr.value = sliceValues[index];
                    footprintAttr.actvalue = (new Date(footprintAttr["StdTime"])).toLocaleTimeString();
                     valueTable.push(footprintAttr);
                }*/
            }
            
            //We also want to sort these based on date
            valueTable.sort(function (a, b) {
                if (a["StdTime"] > b["StdTime"])
                  return 1;
                if (a["StdTime"] < b["StdTime"])
                  return -1;
                // a must be equal to b
                return 0;
            });
            
            this.idDimensionSlicesValues(valueTable);
        },
        /*****  EVENTS  *********************************/ 
        multiDimPropertiesLoaded : function () {},
        idTimeSlicesValues: function(){},
        idDimensionSlicesValues: function(){},
    });
}); 
