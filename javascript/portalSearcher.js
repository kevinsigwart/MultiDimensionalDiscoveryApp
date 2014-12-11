require([
    "dojo/_base/declare",
    "esri/arcgis/Portal", 
    "dojo/_base/lang",
    "dojo/dom", 
], function(declare,esriPortal,lang,dom){
    
    return declare("PortalSearch", null, {
        constructor: function(ags){
            var portalUrl = document.location.protocol + '//www.arcgis.com';
        
            //create the portal
            this._portal = new esriPortal.Portal(portalUrl);
        },
        findArcGISGroup:function findArcGISGroup() {
          var keyword = "esri"; // dom.byId('groupFinder').value;
          var params = {
            q:  keyword,
            sortField:'modified',
            sortOrder:'desc',
            num:20  //find 20 items - max is 100
          };
          this._portal.queryGroups(params).then(lang.hitch(this,function (data) {
             this.getQueryResults(data);
          }));
        },
        findSciData: function (string) {
          var keyword = "group:d7588e21b0904505868fb16f937147b9 AND " + string; // dom.byId('groupFinder').value;
          var params = {
            q:  keyword,
            sortField:'modified',
            sortOrder:'desc',
            num:20  //find 20 items - max is 100
          };
          this._portal.queryItems(params).then(lang.hitch(this,function (data) {
             this.getQueryResults(data);
          }));
        },
        getQueryResults:function(data){}
        
    }); 
    
});