//get jquery and define global variables
var $ = giscloud.exposeJQuery();
var viewer, toolbar, author, map, layer, table, mapId, layerId, listOfObjects = [], listOfFestivalLocations = [], listOfFestivalTitles = [], listOfFestivalCoord = [], listOfFestivalUrl = [], listOfFestivalCity =[], listOfFestivalCountry = [];


//start my app
giscloud.ready(function(){

	//show map (public map) and toolbar
	viewer = new giscloud.Viewer("map", "256495");
	toolbar = new giscloud.ui.Toolbar({
		viewer: viewer,
		container: "toolbar",
		defaultTools: ["pan", "zoom", "full", "measure", "select"]
	}); 

	//click on feature -> start displayFeatures function
	viewer.selectionChange (function (event) {
		if (event.action === "add") {
			giscloud.features.byId(event.feature.layerId, event.feature.featureId)
			.done(displayFeatures);
		}
	});

	//login part -> api key (e442091480d0f1a04621) is generated by Gis Cloud - you can use this one, or
	//you can make your own application on Gis Cloud: My Account -> API access -> Applications
	giscloud.oauth2.authorize("e442091480d0f1a04621", function() {
		giscloud.oauth2.button("login");
	});

	//jquery click event -> submit input data
	$('#save').click(function(){
		//empty lists
		listOfObjects = []; listOfFestivalLocations = []; listOfFestivalTitles = []; listOfFestivalCoord = []; listOfFestivalUrl = []; listOfFestivalCity =[]; listOfFestivalCountry = [];
		//get input data
		author = $('#author').val();
		map = $('#mapName').val();
		layer = $('#layerName').val();
		table = $('#tableName').val();
		//empty divisions for alerts and for showing saved data
		$('#response1,#response2,#response3,#response4,#text,#featureData').empty();

		//if input data exist -> start application
		if(author,map,layer,table){
			//if token not exist -> alert that you are not loged in
			var token = giscloud.oauth2.token();
			if (!token) {
				$('#text').append('Please log in!');
				return;
			}
			//if you are loged in -> start checkAuthor function
			else {
				checkAuthor();
			}
		}

		//if input data not exist -> alert that you must fill every space
		else {
			if(!author){
				$('#response1').append('*fill that space!');
			}
			if(!map){
				$('#response2').append('*fill that space!');
			}
			if(!layer){
				$('#response3').append('*fill that space!');
			}
			if(!table){
				$('#response4').append('*fill that space!');
			}
		}

	});

});


//function that check every artist and save specific data for his concerts
function checkAuthor() {
	//api key for last.fm -> write it between quotes
	var apiKey = '';

	//get artist data
	$.get('http://ws.audioscrobbler.com/2.0/?method=artist.getevents&artist='+author+'&api_key='+apiKey+'&format=json', function(data){
		//define empty object and save artist data 
		var objects = {};
		objects = data.events;
		
		//save artist data in list
		for(var i in objects){
			listOfObjects.push(objects[i]);
		}

		//if value of sixth place in list is equal to zero -> artist is known but there is no data for his concerts
		if(listOfObjects[6] == 0) {
			$('#text').append('No data for this artist!');
			$('#mapName,#layerName,#tableName').val('');
			return;
		}

		//if there is no artist -> probably grammar error
		if(!objects) {
			$('#text').append('No artist in database!');
			$('#mapName,#layerName,#tableName').val('');
			return;
		}

		//if there is data for artist concerts
		else {
			//check length of list of artist data
			var listLength = listOfObjects[0].length;

			//if length is "undefined" then we have only one concert for that artist
			if (typeof listLength == "undefined") {
				//save specific data for that one concert
				listOfFestivalTitles.push(listOfObjects[0].title);
				listOfFestivalUrl.push(listOfObjects[0].url);
				listOfFestivalLocations.push(listOfObjects[0].venue.location);
				listOfFestivalCoord.push(listOfFestivalLocations[0]['geo:point']);
				listOfFestivalCity.push(listOfFestivalLocations[0].city);
				listOfFestivalCountry.push(listOfFestivalLocations[0].country);

				//if that concert doesn't have informations about concert geolocation -> stop application and 
				//alert "no data for this author"
				if (!listOfFestivalCoord[0]['geo:long']) {
					$('#text').append('No data for this artist!');
					$('#mapName,#layerName,#tableName').val('');
					return;
				}

			}

			//if length is defined we have more then one concert for artist
			else {

				//save specific data for all concerts
				for(var i = 0; i < listOfObjects[0].length; i++){
					listOfFestivalTitles.push(listOfObjects[0][i].title);
					listOfFestivalUrl.push(listOfObjects[0][i].url);
					listOfFestivalLocations.push(listOfObjects[0][i].venue.location);
					listOfFestivalCoord.push(listOfFestivalLocations[i]['geo:point']);
					listOfFestivalCity.push(listOfFestivalLocations[i].city);
					listOfFestivalCountry.push(listOfFestivalLocations[i].country);

				}

			}

			//start saveMap function
			saveMap();
		}

	});

}


//function that defines and creates (saves) map for chosen artist
function saveMap() {
	//map definition
	var mapDef = {
       	name: map,
        units: "meter"
    };

    //create map
    giscloud.maps.create(mapDef)
    //if fails -> alert
    .fail(function () {
        $("#text").append("Problems with saving your map name!");
        return;
    })
    //if succeeds -> get new map id and start saveTable function
    .done(function (newMapId) {
        mapId = newMapId;
        saveTable();
    });

}


//function that defines and creates table for artist data
function saveTable() {
	//clean table name and add time to table name (excludes same table name)
	table = table.toLowerCase().replace(/(^[^a-z]+)|(\W+)/g, '_').substr(0, 50);
    table += $.now();
    //table definition
	tableDef = {
		name: table,
		geometry: "point", 
		srid: 4326, 
		columns: {
			"Country": { "type": "text" },
			"City": { "type": "text" },
			"Web_page": { "type": "text" },
			"Name_of_concert": { "type": "text" }
		}
	}

	//create table
	giscloud.tables.create(tableDef)
	//if fails -> alert
	.fail(function () {
		$("#text").append("Problems with saving your table name!");
		return;
	})
	//if succeeds -> start saveLayer function
	.done(function () {
		saveLayer();
	});

}


//function that defines and creates base and feature layer for artist data
function saveLayer() {
	//base layer definition
	var layerDef =  {
		map_id: mapId, 
		name: "MapQuest OSM",
		source: { "type": "tile", "src": "mapquest-osm" },
		type: "tile",
		x_min: "-4500000.000000", x_max: "4500000.000000",
		y_min: "-9000000.000000", y_max: "9000000.000000",
		visible: true
	};

	// create basemap layer
	(new giscloud.Layer(layerDef)).update()
	//if fails -> alert
	.fail(function () {
		$("#text").append("Problems with saving your base layer!");
		return;
	})
	//if succeeds -> define feature layer
	.done(function () {
		// now add the feature layer
		layerDef.name = layer;
		layerDef.type = "point";
		layerDef.styles = [{ "symbol": { "type": "circle", "color":"9,195,0", "border":"0,0,204", "bw":"3", "size":"6" } }];
		layerDef.source = {
			"type": "pg",
			"src": table
		};

		//create feature layer
		(new giscloud.Layer(layerDef)).update()
		//if fails -> alert
		.fail(function () {
			$("#text").append("Problems with saving your layer!");
			return;
		})
		//if succeeds -> get new feature layer id and start saveFeature function
		.done(function (newLayerId) {
			layerId = newLayerId;
			saveFeature();
		});

	});

}


//function that stores every feature with specific data in table and shows: map + base layer + layer with features 
function saveFeature() {
	//define variables and check length of list of artist data
	var featureDef;
	var listLength = listOfObjects[0].length;

	//if length is "undefined" then we have only one concert for that artist
	if (typeof listLength == "undefined") {
		// prepare feature definition
		featureDef = {
			geometry: new giscloud.geometry.Point(listOfFestivalCoord[0]['geo:long'], listOfFestivalCoord[0]['geo:lat']).toOGC(),
			data: {
				"Country": listOfFestivalCountry[0],
				"City": listOfFestivalCity[0],
				"Web_page": listOfFestivalUrl[0],
				"Name_of_concert": listOfFestivalTitles[0]
			}
		};

		// create a new feature
		giscloud.features.create(layerId, featureDef)
		//if fails -> alert
		.fail(function() {
			$('#text').append('Problem with data saving!');
			return;
		})
		//if succeeds -> show map with basemap layer and feature layer
		.done(function() {
			viewer.loadMap(mapId);
		});

		return;
	}    
	
	//if length is defined we have more then one concert for artist
	else {			            		            
		
		//for loop -> for every concert 
		for(var i = 0; i < listLength; i++){

			//if concert have informations about concert geolocation
			if(listOfFestivalCoord[i]['geo:long'] && listOfFestivalCoord[i]['geo:lat']){
				// prepare feature definition
				featureDef = {
					geometry: new giscloud.geometry.Point(listOfFestivalCoord[i]['geo:long'], listOfFestivalCoord[i]['geo:lat']).toOGC(),
					data: {
						"Country": listOfFestivalCountry[i],
						"City": listOfFestivalCity[i],
						"Web_page": listOfFestivalUrl[i],
						"Name_of_concert": listOfFestivalTitles[i]
					}
				};

				// create a new feature
				giscloud.features.create(layerId, featureDef)
				//if fails -> alert
				.fail(function () {
					$('#text').append('Problem with data saving!');
					return;
				})
				//if succeeds -> show map with basemap layer and feature layer
				.done(function () {
					viewer.loadMap(mapId);
				});

			}

		}

	}

}


//function that displays data of feature in table below map 
function displayFeatures (feature) {
	//define variables and get feature data
	var value, attr, data = feature.data;

	//if feature data exists
	if(data) {
		//empty division with feature data
		$('#featureData').empty();
		//define counter for positioning on the page
		var i = 0;

		//for loop -> for every attribute in feature data
		for(attr in data) {
			//save attribute value
			value = data[attr];
			//define style for attribute -> display attribute in left side of division
			var attrStyle = "width:50%;height:18px;margin:0px;padding:0px;top:"+i+"px;left:0px;position:absolute;font-size:50%;text-align:center;";
			//define style for attribute value -> display attribute value in right side of division
			var dataStyle = "width:50%;height:18px;margin:0px;padding:0px;top:"+i+"px;left:50%;position:absolute;font-size:50%;text-align:center;";
			//define style for paragraph 
			var pStyle = "margin:0px; padding:0px; white-space:nowrap; width:100%; overflow:hidden; text-overflow:ellipsis;";
			
			//if attribute is web page 
			if(attr === "web_page") {
				//attribute value is hyperlink
				value = '<a target="_blank" href="'+value+'">'+value+'</a>';
			}

			//display feature data
			$('#featureData').append('<tr><td style="'+attrStyle+'"><p style="'+pStyle+'">'+attr+'</p></td><td style="'+dataStyle+'"><p style="'+pStyle+'">'+value+'</p></td></tr>');
			//count new position
			i = i+18;
		}

	}

}



