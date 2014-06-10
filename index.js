var $ = giscloud.exposeJQuery();
var viewer, toolbar, author, map, layer, table;
giscloud.apiKey("17d062fcdfceb87734a495677ec6e00b");
var mapid = 250450;

giscloud.ready(function(){

	viewer = new giscloud.Viewer("map", mapid);
	toolbar = new giscloud.ui.Toolbar({
		viewer: viewer,
		container: "toolbar",
		defaultTools: ["pan", "zoom", "full", "measure"]
	}); 

	$('#save').click(function(){

		author = $('#author').val();
		map = $('#mapName').val();
		layer = $('#layerName').val();
		table = $('#tableName').val();

		$('#response1,#response2,#response3,#response4,#text').empty();

		if(author,map,layer,table){
			checkAuthor();
		}

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

function checkAuthor() {

	var apiKey = '0086b501599ef8c832c86aa8b95697be';

	$.get('http://ws.audioscrobbler.com/2.0/?method=artist.getevents&artist='+author+'&api_key='+apiKey+'&format=json', function(data){
		
		var objects = {}, listOfObjects = [], listOfFestivalTitles = [], listOfFestivalLocations = [], listOfFestivalCoord = [], listOfFestivalUrl = [], listOfFestivalCity =[], listOfFestivalCountry = [];
		objects = data.events;
		
		for(var i in objects){
			listOfObjects.push(objects[i]);
		}

		if(listOfObjects[6] == 0) {

			$('#text').append('No data for this author!');
			$('#mapName,#layerName,#tableName').val('');
			
		}

		if(!objects) {

			$('#text').append('No author in database!');
			$('#mapName,#layerName,#tableName').val('');

		}

		else {

			for(var i = 0; i < listOfObjects[0].length; i++){
				listOfFestivalTitles.push(listOfObjects[0][i].title);
				listOfFestivalUrl.push(listOfObjects[0][i].url);
				listOfFestivalLocations.push(listOfObjects[0][i].venue.location);
				listOfFestivalCoord.push(listOfFestivalLocations[i]['geo:point']);
				listOfFestivalCity.push(listOfFestivalLocations[i].city);
				listOfFestivalCountry.push(listOfFestivalLocations[i].country);
			}

		}

	});
}
