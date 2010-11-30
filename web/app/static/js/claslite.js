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
			$mapwrap: $('#mapwrap'),
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
			hideMap();
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
		
		app.tabs.select( 'location' );
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
		app.$forestChangeStart
			.fillSelect( arr( 1985, 2008 ), 1985, function( event ) {
				if( +this.value >= +app.$forestChangeEnd.val() )
					app.$forestChangeEnd.val( +this.value + 1 );
			});
		
		app.$forestChangeEnd
			.fillSelect( arr( 1986, 2009 ), 2009, function( event ) {
				if( +this.value <= +app.$forestChangeStart.val() )
					app.$forestChangeStart.val( +this.value - 1 );
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
		$('#main').addClass('with-map');
	}
	
	function hideMap() {
		$('#main').removeClass('with-map');
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
		$(sel).html( S(
			'<img style="width:', width, 'px; height:', height, 'px;" src="', url, '" />'
		) );
	}
	
	function U( value ) { return value * .09; }
	
	function addStatistics() {
		$.getJSON( 'js/statistics-test.json', function( json ) {
			
			var region = json.regions[0];
			
			var labels = [], scale = [], forest = [], nodata = [], nonforest = [];
			region.forestCover.forEach( function( cover ) {
				labels.push( cover.date );
				scale.push([ 0, U(cover.forest) + U(cover.nodata) + U(cover.nonforest) ]);
				forest.push( U(cover.forest) );
				nodata.push( U(cover.nodata) );
				nonforest.push( U(cover.nonforest) );
			});
			
			var width = 300, height = 200;
			
			var url = S.ChartApi.barV({
				width: width,
				height: height,
				labels: labels,
				colors: [ '00FF00', '000000', 'EE9A00' ],
				data: [ [ forest.join(), nodata.join(), nonforest.join() ].join('|') ],
				scale: scale,
				barWidth: [ 25, 20 ],
				axis: '2,000000,15'
			});
			
			setImg( '#forest-cover-chart', url, width, height );
			
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
		app.$mapwrap.css({ width: ww - layout.sidebarWidth - 1 });
		app.map && app.map.resize();
	}
	
})();
