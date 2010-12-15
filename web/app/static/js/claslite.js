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
		initViewButtons();
		initRangeInputs();
		initDateSelects();
		initUnitSelects();
		initColorPickers();
		initLegends();
		initSizer();
		resize();
		initMap();
		app.$outermost.show();
		resize();
	}
	
	function initVars() {
		app = {
			layers: {},
			$window: $(window),
			$outermost: $('#outermost'),
			$main: $('#main'),
			$tabs: $('#tabs'),
			$sidebarOuter: $('#sidebar-outer'),
			$sidebarScrolling: $('#sidebar-scrolling'),
			$forestViewDateStart: $('#forestview-date-start'),
			$forestViewDateEnd: $('#forestview-date-end'),
			$deforestationRadio: $('#deforestation-radio'),
			$disturbanceRadio: $('#disturbance-radio'),
			$bothRadio: $('#both-radio'),
			$units: $('#statistics-units-select'),
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
			enableGeoclick();
			removeLayers();
		},
		forestcover: function( id ) {
			disableGeoclick();
			removeLayers();
			if( app.$outermost.is('.map') ) {
				addForestCoverLayer( id );
			}
			else {
				addStatistics( id );
			}
		},
		forestchange: function( id ) {
			disableGeoclick();
			removeLayers();
			if( app.$outermost.is('.map') ) {
				// TODO: there's probably a simpler way to do this:
				var deforestation = app.$deforestationRadio.is(':checked');
				var disturbance = app.$disturbanceRadio.is(':checked');
				if( app.$bothRadio.is(':checked') ) deforestation = disturbance = true;
				if( deforestation ) addForestChangeLayer( 'deforestation' );
				if( disturbance ) addForestChangeLayer( 'disturbance' );
			}
			else {
				addStatistics( id );
			}
		},
		help: function() {
			disableGeoclick();
			removeLayers();
		}
	};
	
	function getSubTab( id ) {
		var subst = app.tabOpts.subst[id] || id;
		app.$outermost.removeClass().addClass( id ).addClass( subst );
		switch( subst ) {
			case 'location':
			case 'forestview':
				var view = $('#'+subst+'-panel button.submit')[0].id.split('-')[2];
				app.$outermost.addClass( id + '-' + view ).addClass( subst + '-' + view ).addClass( view );
		}
		return id;
	}
	
	function initTabs() {
		app.tabOpts = {
			parent: '#tabs',
			panels: '#sidebar-scrolling',
			tabs: {
				location: 'Location',
				forestcover: 'Forest Cover',
				forestchange: 'Forest Change',
				help: 'Help'
			},
			subst: {
				forestcover: 'forestview',
				forestchange: 'forestview'
			},
			click: function( id ) {
				id = getSubTab( id );
				var activate = activateTab[id];
				activate && activate( id );
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
	
	// TODO: refactor initViewButtons() and dirtyView() into a button manager
	function initViewButtons() {
		$('button.view-button').click( function() {
			$button = $(this);
			$button.blur().parent()
				.find('button.submit').removeClass('submit')
					.find('div.icon16').removeClass('icon16-tick icon16-arrow-circle');
			$button.addClass( 'submit' )
				.find('div.icon16').addClass('icon16-tick');
		});
	}
	
	function dirtyView() {
		$('button.view-button.submit div.icon16')
			.removeClass('icon16-tick')
			.addClass('icon16-arrow-circle');
	}
	
	function initRangeInputs() {
		$('input:range').rangeinput();
	}
	
	function initDateSelects() {
		function arr( first, last ) {
			var a = [];
			for( var i = first;  i <= last;  ++i )
				a.push({ text:i, value:i });
			// TEST: uncomment this to add test layers to date selectors
			//var nTests = 5;
			//for( var i = 1;  i <= nTests;  i++ )
			//	a.push({ text:'Test '+i, value:i });
			// END TEST
			return a;
		}
		$('select.date-start')
			.fillSelect( arr( 1985, 2008 ), 1985, function( event ) {
				var $end = $(this).parent().find('.date-end');
				if( +this.value >= +$end.val() )
					$end.val( +this.value + 1 );
				dirtyView();
			});
		
		$('select.date-end')
			.fillSelect( arr( 1986, 2009 ), 2009, function( event ) {
				var $start = $(this).parent().find('.date-start');
				if( +this.value <= +$start.val() )
					$start.val( +this.value - 1 );
				dirtyView();
			});
	}
	
	function initUnitSelects() {
		app.$units.bind( 'change keyup', function() {
			$(this).closest('form').submit();
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
	
	function addTestLayer( id ) {
		var layers = {
			1: function() {
				var rawImage = 'LANDSAT/L7_L1T/LE72300681999227EDC00';  // Aug 15, 1999
		
				var vcfImage = 'MOD44B_C4_TREE_2000';
				var bounds = [ -26, -89, 5, -32 ]
				app.map.fitBounds.apply( app.map, bounds );
				app.map.setZoom( 8 );
				var ei = new EarthImage;
				var radiance = ei.step( 'CLASLITE/Calibrate', rawImage );
				var reflectance = ei.step( 'CLASLITE/Reflectance', radiance );
				var autoMCU = ei.step( 'CLASLITE/AutoMCU', rawImage, reflectance );
				var vcfAdjusted = ei.step( 'CLASLITE/VCFAdjustedImage', autoMCU, vcfImage );
				var forest = ei.step('CLASLITE/ForestMask', vcfAdjusted);
				
				addEarthEngineLayer({
					image: JSON.stringify( forest ),
					bands: 'Forest_NonForest',
					gain: 127
				});
			},
			
			2: function() {
				rawImage = 'LANDSAT/L7_L1T/LE72300682006134EDC00';	// 2006
			
				var vcfImage = 'MOD44B_C4_TREE_2000';
				var bounds = [ -26, -89, 5, -32 ]
				app.map.fitBounds.apply( app.map, bounds );
				app.map.setZoom( 8 );
				var ei = new EarthImage;
				var radiance = ei.step( 'CLASLITE/Calibrate', rawImage );
				var reflectance = ei.step( 'CLASLITE/Reflectance', radiance );
				var autoMCU = ei.step( 'CLASLITE/AutoMCU', rawImage, reflectance );
				var vcfAdjusted = ei.step( 'CLASLITE/VCFAdjustedImage', autoMCU, vcfImage );
				var forest = ei.step('CLASLITE/ForestMask', vcfAdjusted);
				
				addEarthEngineLayer({
					image: JSON.stringify( forest ),
					bands: 'Forest_NonForest',
					gain: 127
				});
			},
			
			3: function() {
				rawImage = 'LANDSAT/L7_L1T/LE72300682010289EDC00';	// 2010
		
				var vcfImage = 'MOD44B_C4_TREE_2000';
				var bounds = [ -26, -89, 5, -32 ]
				app.map.fitBounds.apply( app.map, bounds );
				app.map.setZoom( 8 );
				var ei = new EarthImage;
				var radiance = ei.step( 'CLASLITE/Calibrate', rawImage );
				var reflectance = ei.step( 'CLASLITE/Reflectance', radiance );
				var autoMCU = ei.step( 'CLASLITE/AutoMCU', rawImage, reflectance );
				var vcfAdjusted = ei.step( 'CLASLITE/VCFAdjustedImage', autoMCU, vcfImage );
				var forest = ei.step('CLASLITE/ForestMask', vcfAdjusted);
				
				addEarthEngineLayer({
					image: JSON.stringify( forest ),
					bands: 'Forest_NonForest',
					gain: 127
				});
			},
			
			4: function() {
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
			},
			
			5: function() {
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
		};
		
		layers[id]();
	}
	
	function addEarthEngineLayer( request ) {
		var ee = new S.EarthEngine;
		ee.getTiles( request, function( tiles ) {
			var opid = 'forestcover';
			app.layers[opid] = app.map.addLayer({
				minZoom: 3,
				maxZoom: 14,
				opacity: $('#forestview-opacity').data('rangeinput').getValue() / 100,
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
		var year = app.$forestViewDateStart.val();
		// TEST:
		if( year < 1000 ) {
			addTestLayer( year );
			return;
		}
		// END TEST
		addLayer( year, S( 'forestcover/idesam/', year, '/' ) );
	}
	
	function addForestChangeLayer( id ) {
		var type = id == 'deforestation' ? 'deforestation' : 'pertubacao_compiled';
		addLayer( id, S(
			'forestchange/idesam/', type, '_',
			app.$forestViewDateStart.val().slice(-2),
			'_',
			app.$forestViewDateEnd.val().slice(-2),
			'_masked_rgb/'
		) );
	}
	
	function addLayer( id, path ) {
		// TEMP HACK
		var opid = id == 'forestcover' ? id : 'forestchange';
		app.layers[id] = app.map.addLayer({
			minZoom: 6,
			maxZoom: 14,
			opacity: $('#forestview-opacity').data('rangeinput').getValue() / 100,
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
				listEarthEngineAssets( bounds );
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
	
	function setChart( sel, table, url, width, height, title ) {
		$(sel).html( S(
			'<div>',
				'<h2>',
					title,
				'</h2>',
				'<div class="statistics-block">',
					'<div class="xfloat-left statistics-chart" style="width:', width, 'px; height:', height, 'px; background-image:url(', url, ')">',
					'</div>',
					'<div class="xfloat-left statistics-table-wrap">',
						table,
					'</div>',
					'<div class="xfloat-clear">',
					'</div>',
				'</div>',
			'</div>'
		) );
	}
	
	function addStatistics( id ) {
		$.getJSON( 'js/statistics-test.json', function( json ) {
			
			var units = app.$units.val().split('|'),
				unit = { value:units[0], abbr:units[1], name:units[2] },
				factor = json.pixelWidth * json.pixelHeight / unit.value;
			function U( value ) { return value * factor; }
			function num( value ) { return S.formatNumber( value, 2 ); }
			
			var region = json.regions[0];
			var height = 100;
			
			var charts = {
				forestcover: function() {
					var scaleMax = 0, labels = [], rows = [],
						forests = [], nonforests = [], unobserveds = [];
					region.forestCover.forEach( function( cover ) {
						var date = cover.date,
							forest = U(cover.forest),
							nonforest = U(cover.nonforest),
							unobserved = U(cover.unobserved);
						// Table
						rows.push( S(
							'<tr>',
								'<td>', date, '</td>',
								'<td>', num(forest), '</td>',
								'<td>', num(nonforest), '</td>',
								'<td>', num(unobserved), '</td>',
							'</tr>'
						) );
						// Chart
						labels.push( date );
						scaleMax = Math.max( scaleMax, forest + nonforest + unobserved );
						forests.push( forest );
						nonforests.push( nonforest );
						unobserveds.push( unobserved );
					});
					
					var table = S(
						'<table class="stats-table">',
							'<thead>',
								'<tr>',
									'<th class="stats-table-topleft">&nbsp;</th>',
									'<th colspan="3">Area (', unit.name, ')</th>',
								'</tr>',
								'<tr>',
									'<th class="stats-table-x">Year</th>',
									'<th>Forest</th>',
									'<th>Non-Forest</th>',
									'<th>Unobserved</th>',
								'</tr>',
							'</thead>',
							'<tbody>',
								rows.join(''),
							'</tbody>',
						'</table>'
					);
					
					var width = 220;
					
					var url = S.ChartApi.barV({
						width: width,
						height: height,
						labels: labels,
						colors: [ '00FF00', 'EE9A00', '000000' ],
						data: [ [ forests.join(), nonforests.join(), unobserveds.join() ].join('|') ],
						scale: [ 0, scaleMax ],
						barWidth: [ 25, 20 ],
						axis: '2,000000,15',
						legend: 'Forest|Non-Forest|Unobserved',
						legendPos: '|r',
						axes: 'x,y',
						axisRange: [ 1, 0, scaleMax ],
						axisFormat: '1N*s*'
					});
					
					setChart( '#forest-cover-chart', table, url, width, height, 'Forest Cover' );
				},
				
				forestchange: function() {
					var totalpix = 2753565;  // temp for demo
					var limit = { startdate: +app.$statsStart.val(), enddate: +app.$statsEnd.val() };
					var scaleMax = 0, labels = [], rows = [],
						deforestations = [], disturbances = [];
					region.forestChange.forEach( function( change ) {
						var startdate = change.startdate, enddate = change.enddate,
							deforestation = U(change.deforestation),
							disturbance = U(change.disturbance);
						if( +startdate < limit.startdate  ||  +enddate > limit.enddate )
							return;
						// Table
						var years = enddate - startdate;
						function pct( value ) {
							return S.formatNumber( value / years / totalpix * 100, 3 ) + '%';
						}
						rows.push( S(
							'<tr>',
								'<td>', startdate, '</td>',
								'<td>', enddate, '</td>',
								'<td>', num(deforestation), '</td>',
								'<td>', pct(change.deforestation), '</td>',
								'<td>', num(disturbance), '</td>',
								'<td>', pct(change.disturbance), '</td>',
							'</tr>'
						) );
						// Chart
						if( years > 1 ) return;  // omit large ranges in demo
						//labels.push( S( startdate.slice(-2), '-', enddate.slice(-2) ) );
						labels.push( S( '-', enddate.slice(-2) ) );
						scaleMax = Math.max( scaleMax, deforestation, disturbance );
						deforestations.push( deforestation );
						disturbances.push( disturbance );
					});
					
					var table = S(
						'<table class="stats-table">',
							'<thead>',
								'<tr>',
									'<th class="stats-table-topleft">&nbsp;</th>',
									'<th class="stats-table-topleft">&nbsp;</th>',
									'<th colspan="2">Deforestation</th>',
									'<th colspan="2">Disturbance</th>',
								'</tr>',
								'<tr>',
									'<th class="stats-table-x">Start</th>',
									'<th class="stats-table-x">End</th>',
									'<th>Area (', unit.abbr, ')</th>',
									'<th>Rate</th>',
									'<th>Area (', unit.abbr, ')</th>',
									'<th>Rate</th>',
								'</tr>',
							'</thead>',
							'<tbody>',
								rows.join(''),
							'</tbody>',
						'</table>'
					);
					var width = 870;
					
					var url = S.ChartApi.barV({
						width: width,
						height: height,
						labels: labels,
						colors: [ 'FF0000', 'FFD000' ],
						data: [ [ deforestations.join(), disturbances.join() ].join('|') ],
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
					
					setChart( '#forest-change-chart', table, url, width, height,
						S('Forest Change - Area (', unit.name, ')' )
					);
				}
			};
			
			charts[id]();
			
			// Old test code, save it for color bits
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
			//				get( '#statistics-unobserved-color', 'unobservedPixels' ),
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
