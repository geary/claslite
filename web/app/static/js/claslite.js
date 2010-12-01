// claslite.js
// Copyright 2010 Carnegie Institution for Science and Michael Geary
// Use under any Open Source license:
// http://www.opensource.org/licenses/

(function() {
	
	var app;
	var layout = {
		sidebarWidth: 350
	};
	
	S.extend( $.fn.mColorPicker.defaults, {
		imageFolder: 'images/mColorPicker/'
	});
	S.extend( $.fn.mColorPicker.init, {
		replace: false,
		showLogo: false
	});
	
	//var monthNames = [
	//	'January', 'February', 'March', 'April', 'May', 'June',
	//	'July', 'August', 'September', 'October', 'November', 'December'
	//];
	
	$.fn.fillSelect = function( list, initial, changed ) {
		this
			.html( list.map( function( item ) {
				return S(
					//'<option value="', year, '-', padDigits( month, 2 ), '">',
					//	monthNames[ month - 1 ], ' ', year,
					//'</option>'
					'<option value="', item.value, '">',
						item.text,
					'</option>'
				);
			}).join('') )
			.bind( 'change keyup', function( event ) {
				changed && changed.apply( this, arguments );
			});
		if( initial != null )
			this	.val( initial );
	}
	
	$().ready( initUI );
	
	function initUI() {
		initVars();
		initTabs();
		initRangeInputs();
		initDateSelects();
		initColorPickers();
		initLegends();
		initSizer();
		resize();
		initMap();
		$('#outermost').show();
		resize();
	}
	
	function initVars() {
		app = {
			layers: {},
			$window: $(window),
			$main: $('#main'),
			$tabs: $('#tabs'),
			$sidebarOuter: $('#sidebar-outer'),
			$sidebarScrolling: $('#sidebar-scrolling'),
			$forestCoverDate: $('#forestcover-date'),
			$forestChangeStart: $('#forestchange-date-start'),
			$forestChangeEnd: $('#forestchange-date-end'),
			$deforestationRadio: $('#deforestation-radio'),
			$disturbanceRadio: $('#disturbance-radio'),
			$bothRadio: $('#both-radio'),
			$statsStart: $('#statistics-date-start'),
			$statsEnd: $('#statistics-date-end'),
			$mapwrap: $('#mapwrap'),
			$statswrap: $('#statswrap'),
			$mapstatswrap: $('#mapwrap,#statswrap'),
			_: null
		};
	}
	
	var tileBase = 'http://claslite.geary.joyeurs.com/tiles/';
	// TODO: use tab hiders to simplify this code
	var activateTab = {
		location: function() {
			showMap();
			enableGeoclick();
			removeLayers();
		},
		forestcover: function() {
			showMap();
			disableGeoclick();
			removeLayers();
			addForestCoverLayer( 'forestcover' );
		},
		forestchange: function() {
			showMap();
			disableGeoclick();
			removeLayers();
			// TODO: there's probably a simpler way to do this:
			var deforestation = app.$deforestationRadio.is(':checked');
			var disturbance = app.$disturbanceRadio.is(':checked');
			if( app.$bothRadio.is(':checked') ) deforestation = disturbance = true;
			if( deforestation ) addForestChangeLayer( 'deforestation' );
			if( disturbance ) addForestChangeLayer( 'disturbance' );
		},
		statistics: function() {
			showStats();
			disableGeoclick();
			removeLayers();
			addStatistics();
		},
		help: function() {
			showMap();
			disableGeoclick();
			removeLayers();
		}
	};
	
	function initTabs() {
		app.tabOpts = {
			parent: '#tabs',
			panels: '#sidebar-scrolling',
			tabs: {
				location: 'Location',
				forestcover: 'Forest Cover',
				forestchange: 'Forest Change',
				statistics: 'Statistics',
				help: 'Help'
			},
			click: function( id ) {
				var activate = activateTab[id];
				activate && activate();
			}
		};
		app.tabs = S.Tabs( app.tabOpts );
		
		$('form.input-form').submit( function( event ) {
			event.preventDefault();
			// TODO: this could be cleaner
			app.tabOpts.click( app.tabs.selected );
		});
		
		var tab = location.hash.replace( /^#/, '' );
		app.tabs.select( app.tabOpts.tabs[tab] ? tab : 'location' );
	}
	
	function initRangeInputs() {
		$('input:range').rangeinput();
	}
	
	function initDateSelects() {
		initForestCoverDateSelect();
		initForestChangeDateSelect();
	}
	
	function initForestCoverDateSelect() {
		function idesam( year ) {
			return {
				text: year,
				value: S( 'addLayer:forestcover/idesam/', year, '/' )
			};
		}
		//function peru( year ) {
		//	return {
		//		text: year,
		//		value: S(
		//			'addLayer:forestcover/peru_redd_',
		//			year,
		//			'_forestcover_geotiff_rgb/'
		//		)
		//	};
		//}
		function test( val ) {
			return {
				text: 'Test ' + val,
				value: 'testLayer:' +val
			};
		}
		var dates = [].concat(
			idesam( 1985 ),
			idesam( 2009 ),
			//peru( 2007 ),
			//peru( 2008 ),
			//peru( 2009 ),
			test( 1 ),
			test( 2 ),
			test( 3 )
		);
		app.$forestCoverDate
			.fillSelect( dates, '', function( event ) {
				//app.tabOpts.click( app.tabs.selected );
			});
	}
	
	function initForestChangeDateSelect() {
		function arr( first, last ) {
			var a = [];
			for( var i = first;  i <= last;  ++i ) a.push({ text:i, value:i });
			return a;
		}
		$('select.date-start')
			.fillSelect( arr( 1985, 2008 ), 1985, function( event ) {
				var $end = $(this).parent().find('.date-end');
				if( +this.value >= +$end.val() )
					$end.val( +this.value + 1 );
			});
		
		$('select.date-end')
			.fillSelect( arr( 1986, 2009 ), 2009, function( event ) {
				var $start = $(this).parent().find('.date-start');
				if( +this.value <= +$start.val() )
					$start.val( +this.value - 1 );
			});
	}
	
	function padDigits( value, digits ) {
		return ( '' + ( value + 100000000 ) ).slice( -digits );
	}
	
	function initColorPickers() {
		$('input.color-picker').mColorPicker()
		$('input.mColorPickerInput').click( function( event ) {
			$(this).next().trigger( 'click', event );
		});
	}
	
	function initLegends() {
		addLegend( '#deforestation-legend' );
		addLegend( '#disturbance-legend' );
	}
	
	function addLegend( legend ) {
		var colors = [ '#FF0000', '#FF4400', '#FF8800', '#FFCC00', '#FFFF00' ];
		$.S(
			'<div class="legend-colors">',
				colors.map( function( color, i ) {
					return S(
						'<div class="legend-color" style="background-color:', color, '">',
						'</div>',
						'<div class="legend-label">',
							i == 0 ? 'Recent' : i == colors.length - 1 ? 'Oldest' : '',
						'</div>',
						'<div class="clear-both">',
						'</div>'
					)
				}).join(''),
			'</div>'
		).appendTo( legend );
	}
	
	function showMap() {
		$('#main').addClass('with-map').removeClass('with-stats');
	}
	
	function showStats() {
		$('#main').addClass('with-stats').removeClass('with-map');
	}
	
	function enableGeoclick() {
		app.geoclick && app.geoclick.enable();
	}
	
	function disableGeoclick() {
		app.geoclick && app.geoclick.disable();
	}
	
	function EarthImage() {
		//if( this == window ) return new EarthImage();
		S.extend( this, {
			step: function( creator ) {
				return {
					creator: creator,
					args: Array.prototype.slice.call( arguments, 1 )
				};
			}
		});
	}
	
	function addTestLayer1() {
		var rawImage = 'LANDSAT/L7_L1T/LE72300681999227EDC00';
		
		var ei = new EarthImage;
		var radiance = ei.step( 'CLASLITE/Calibrate', rawImage );
		var reflectance = ei.step( 'CLASLITE/Reflectance', radiance );
		var autoMCU = ei.step( 'CLASLITE/AutoMCU', rawImage, reflectance );
		
		addEarthEngineLayer({
			image: JSON.stringify( autoMCU ),
			bands: 'vis-red,vis-green,vis-blue'
		});
	}
	
	function addTestLayer2() {
		var image = {
			creator: 'LANDSAT/CalibratedSurfaceReflectance',
			args: [ 'LANDSAT/L7_L1T/LE70050672005171EDC00' ]
		};
		
		var request = {
			image: JSON.stringify( image ),
			bands: '30,20,10',
			gain: 500,
			gamma: 1.6
		};
		
		addEarthEngineLayer( request );
	}
	
	function addTestLayer3() {
		var dates = [ '2010_06_26', '2010_06_30' ];
		var images = dates.map( function( date ) {
			return {
				creator: 'SAD/ModisCombiner',
				args: [ 'MOD09GA_005_' + date, 'MOD09GA_005_' + date ]
			}
		});
		
		var bands = [
			'sur_refl_b01_250m', 'sur_refl_b02_250m', 'sur_refl_b03_500m',
			'sur_refl_b04_500m', 'sur_refl_b06_500m', 'sur_refl_b07_500m'
		];
		
		var image = {
			creator: 'SAD/UnmixModis',
			args: [{
				creator: 'SAD/KrigingStub',
				args: [{
					creator: 'SAD/MakeMosaic',
					args: [ images, bands ]
				}]
			}]
		};
		
		var request = {
			image: JSON.stringify( image ),
			bands: 'soil,gv,npv',
			//bias: ?,
			//gamma: ?,
			gain: 256
		};
		
		addEarthEngineLayer( request );
	}
	
	function addEarthEngineLayer( request ) {
		var ee = new S.EarthEngine;
		ee.getTiles( request, function( tiles ) {
			var opid = 'forestcover';
			app.layers[opid] = app.map.addLayer({
				minZoom: 3,
				maxZoom: 14,
				opacity: $('#'+opid+'-opacity').data('rangeinput').getValue() / 100,
				tiles: S(
					'https://earthengine.googleapis.com/map/', tiles.mapid,
					'/{Z}/{X}/{Y}?token=', tiles.token
				)
			});
		});
	}
	
	// TODO: turn these into an object
	function listEarthEngineAssets( bounds ) {
		var ne = bounds.getNorthEast(), sw = bounds.getSouthWest(),
			n = ne.lat(), e = ne.lng(), s = sw.lat(), w = sw.lng();
		//console.log( S( 'bbox=', w.toFixed(2), ',', s.toFixed(2), ',', e.toFixed(2), ',', n.toFixed(2) ) );
		var ee = new S.EarthEngine;
		var request = {
			id: 'MOD09GA',
			region: [ e, s, w, n ].join(),
			fields: 'ACQUISITION_DATE'
		};
		ee.list( request, function( assets ) {
			//console.dir( assets );
			//$('#assets-list').html( S(
			//	'<div class="assets">',
			//		assets.map( function( asset ) {
			//			return S(
			//				'<div class="asset">',
			//					asset
			//				'</div>'
			//			);
			//		}).join(''),
			//	'</div>'
			//) );
		});
	}
	
	function addForestCoverLayer( id ) {
		var value = app.$forestCoverDate.val().split(':'),
			fn = value[0], url = value[1];
		// temp:
		fn = ({
			addLayer: addLayer,
			testLayer: testLayer
		})[fn];
		fn && fn( id, url );
	}
	
	function testLayer( id, url ) {
		// TODO: temp hacky test code
		({
			1: addTestLayer1,
			2: addTestLayer2,
			3: addTestLayer3
		})[url]();
	}
	
	function addForestChangeLayer( id ) {
		var type = id == 'deforestation' ? 'desmatamento' : 'pertubacao';
		addLayer( id, S(
			'forestchange/idesam/230_068_',
			app.$forestChangeStart.val().slice(-2),
			'_',
			app.$forestChangeEnd.val().slice(-2),
			'_',
			type,
			'/'
		) );
	}
	
	function addLayer( id, path ) {
		// TEMP HACK
		var opid = id == 'forestcover' ? id : 'forestchange';
		app.layers[id] = app.map.addLayer({
			minZoom: 6,
			maxZoom: 14,
			opacity: $('#'+opid+'-opacity').data('rangeinput').getValue() / 100,
			tiles: function( coord, zoom ) {
				return S(
					tileBase, path,
					zoom, '/',
					coord.x, '/',
					( 1 << zoom ) - coord.y - 1,
					'.png'
				);
			}
		});
	}
	
	function removeLayers() {
		for( var id in app.layers ) {
			app.layers[id].remove();
			delete app.layers[id];
		}
	}
	
	function initMap() {
		var bounds = [ -26, -80, 5, -35 ];
		var mt = google.maps.MapTypeId;
		app.map = new S.Map( app.$mapwrap, {
			v3: {
				mapTypeId: mt.TERRAIN,
				streetViewControl: false,
				mapTypeControlOptions: {
					mapTypeIds: [
						mt.ROADMAP, mt.SATELLITE, mt.HYBRID, mt.TERRAIN,
						'black', 'white'
					]
				}
			}
		});
		
		if( S.Map.v3 ) {
			addSolidMapType( 'black', '#000000', 'Black', 'Show solid black background' );
			addSolidMapType( 'white', '#FFFFFF', 'White', 'Show solid white background' );
		}
		
		app.map.fitBounds.apply( app.map, bounds );
		if( app.map.v2 ) {
			// HACK FOR V2 MAPS API:
			setTimeout( function() {
				app.map.fitBounds.apply( app.map, bounds );
			}, 100 );
			// END HACK
		}
		
		app.geoclick = new app.map.Geoclick({
			form: '#location-search-form',
			input: '#location-search-input',
			list: '#location-results-list',
			onclick: function() {
				app.tabs.select( 'location' );
			},
			onselect: function( bounds ) {
				//listEarthEngineAssets( bounds );
			}
		});
		
		$('input.layer-slider').bind( 'onSlide change', function( event, value ) {
			// TODO: clean this up
			var id = this.id.split('-')[0];
			value /= 100;
			if( id == 'forestcover' ) {
				set( id );
			}
			else {
				set( 'deforestation' );
				set( 'disturbance' );
			}
			
			function set( id ) { app.layers[id] && app.layers[id].setOpacity( value ); }
		});
	}
	
	function addSolidMapType( id, color, name, alt ) {
		app.map.map.mapTypes.set( id,
			new S.Map.v3.SolidMapType({ color:color, name:name, alt:alt })
		);
	}
	
	function setImg( sel, url, width, height ) {
		return $(sel).css({
			width: width,
			height: height,
			backgroundImage: S( 'url(', url, ')' )
		});
	}
	
	function setChart( sel, url, width, height, title ) {
		setImg( sel, url, width, height ).prev().html( title );
	}
	
	function addStatistics() {
		$.getJSON( 'js/statistics-test.json', function( json ) {
			
			var units = $('#statistics-units-select').val().split('|');
			
			var factor = json.pixelWidth * json.pixelHeight / units[0];
			function U( value ) { return value * factor; }
			
			var region = json.regions[0];
			var height = 200;
			
			forestCoverBarChart();
			forestChangeLineChart();
			forestChangeBarChart();
			
			function forestCoverBarChart() {
				var labels = [], scaleMax = 0, forest = [], nonforest = [], nodata = [];
				region.forestCover.forEach( function( cover ) {
					labels.push( cover.date );
					scaleMax = Math.max( scaleMax,
						U(cover.forest) + U(cover.nonforest) + U(cover.nodata)
					);
					forest.push( U(cover.forest) );
					nonforest.push( U(cover.nonforest) );
					nodata.push( U(cover.nodata) );
				});
				
				var width = 220;
				
				var url = S.ChartApi.barV({
					width: width,
					height: height,
					labels: labels,
					colors: [ '00FF00', 'EE9A00', '000000' ],
					data: [ [ forest.join(), nonforest.join(), nodata.join() ].join('|') ],
					scale: [ 0, scaleMax ],
					barWidth: [ 25, 20 ],
					axis: '2,000000,15',
					legend: 'Forest|Non-Forest|Unobserved',
					legendPos: '|r',
					axes: 'x,y',
					axisRange: [ 1, 0, scaleMax ],
					axisFormat: '1N*s*'
				});
				
				setChart( '#forest-cover-chart', url, width, height, 'Forest Cover' );
			}
			
			function forestChangeBarChart() {
				var startdate = +app.$statsStart.val(), enddate = +app.$statsEnd.val();
				var labels = [], scaleMax = 0, deforestation = [], disturbance = [];
				region.forestChange.forEach( function( change ) {
					if( +change.startdate < startdate  ||  +change.enddate > enddate )
						return;
					//labels.push( S( change.startdate.slice(-2), '-', change.enddate.slice(-2) ) );
					labels.push( S( '-', change.enddate.slice(-2) ) );
					scaleMax = Math.max( scaleMax,
						U(change.deforestation) + U(change.disturbance)
					);
					deforestation.push( U(change.deforestation) );
					disturbance.push( U(change.disturbance) );
				});
				
				var width = 870;
				
				var url = S.ChartApi.barV({
					width: width,
					height: height,
					labels: labels,
					colors: [ 'FF0000', 'FFD000' ],
					data: [ [ deforestation.join(), disturbance.join() ].join('|') ],
					scale: [ 0, scaleMax ],
					//barWidth: [ 22, 10 ],
					barWidth: [ 10, 6 ],
					axis: '2,000000,15',
					legend: 'Deforestation|Disturbance',
					legendPos: '|r',
					axes: 'x,y',
					axisRange: [ 1, 0, scaleMax ],
					axisFormat: '1N*s*'
				});
				
				setChart( '#forest-change-area-chart', url, width, height,
					S('Forest Change - Area (', units[1], ')' )
				);
			}
			
			function forestChangeLineChart() {
				var totalpix = 2753565;  // temp for demo
				var labels = [], scaleMax = 0, deforestation = [], disturbance = [];
				region.forestChangeRate.forEach( function( change ) {
					labels.push( S( change.startdate.slice(-2), '-', change.enddate.slice(-2) ) );
					var years = (+change.enddate) - (+change.startdate);
					var de = change.deforestation / years / totalpix * 100;
					var di = change.disturbance / years / totalpix * 100;
					scaleMax = Math.max( scaleMax, Math.max( de, di ) );
					deforestation.push( de );
					disturbance.push( di );
				});
				
				var width = 350;
				
				var url = S.ChartApi.line({
					width: width,
					height: height,
					labels: labels,
					colors: [ 'FF0000', 'FFD000' ],
					data: [ [ deforestation.join(), disturbance.join() ].join('|') ],
					scale: [ 0, scaleMax ],
					barWidth: [ 22, 10 ],
					axis: '2,000000,15',
					legend: 'Deforestation|Disturbance',
					legendPos: '|r',
					axes: 'x,y',
					axisRange: [ 1, 0, scaleMax ],
					axisFormat: '1N**%'
				});
				
				setChart( '#forest-change-rate-chart', url, width, height,
					'Forest Change - Percent per Year'
				);
			}
			
			// Old test code
			//S.chart({
			//	container: '#statistics-chart' + ( suffix || '' ),
			//	list: json.statistics.images.map( function( image) {
			//		function get( sel, prop ) {
			//			return {
			//				color: $(sel).val(),
			//				value: image[prop]
			//			}
			//		}
			//		return {
			//			label: image.date,
			//			values: [
			//				get( '#statistics-forest-color', 'forestPixels' ),
			//				get( '#statistics-nodata-color', 'noDataPixels' ),
			//				get( '#statistics-nonforest-color', 'nonForestPixels' )
			//			]
			//		}
			//	})
			//});
		});
	}
	
	function initSizer() {
		$(window).resize( resize );
	}
	
	function resize() {
		var ww = app.$window.width(), wh = app.$window.height();
		app.$main.css({ height: wh - app.$main.offset().top });
		app.$mapstatswrap.css({ width: ww - layout.sidebarWidth - 1 });
		app.map && app.map.resize();
	}
	
})();
