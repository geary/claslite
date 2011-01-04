// claslite.js
// By Michael Geary - http://mg.to/
// See UNLICENSE or http://unlicense.org/ for public domain notice.

(function() {
	
	var app;
	var layout = {
		sidebarWidth: 350
	};
	
	$.jsonRPC.setup({
		endPoint: '/rpc'
	});
	
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
		initHider();
		initProject();
		initViewButtons();
		initCalcButtons();
		initRangeInputs();
		initDateSelects();
		initUnitSelects();
		initColorPickers();
		initSizer();
		resize();
		initMap();
		activateDefaultTab();
		app.$outermost.show();
		resize();
	}
	
	function initVars() {
		app = {
			layers: {},
			forestCoverDates: {},
			forestChangeDateRanges: {},
			viewed: {},
			$window: $(window),
			$outermost: $('#outermost'),
			$main: $('#main'),
			$tabs: $('#tabs'),
			$sidebarHider: $('#sidebar-hider'),
			$sidebarOuter: $('#sidebar-outer'),
			$tabPanels: $('#sidebar-top-panel, #sidebar-padder'),
			$sidebarTopPanel: $('#sidebar-top-panel'),
			$sidebarScrolling: $('#sidebar-scrolling'),
			$forestViewDateStart: $('#forestview-date-start'),
			$forestViewDateEnd: $('#forestview-date-end'),
			$deforestationRadio: $('#deforestation-radio'),
			$disturbanceRadio: $('#disturbance-radio'),
			$bothRadio: $('#both-radio'),
			$units: $('#statistics-units-select'),
			$mapwrap: $('#mapwrap'),
			$statswrap: $('#statswrap'),
			$mapstatswrap: $('#mapwrap,#statswrap'),
			_: null
		};
	}
	
	var tileBase = 'http://claslite.geary.joyeurs.com/tiles/';
	// TODO: use tab hiders to simplify this code
	var activateTab = {
		project: function() {
			disableGeoclick();
			removeLayers();
			autoSaveProject();
		},
		location: function() {
			enableGeoclick();
			removeLayers();
		},
		forestcover: function( id ) {
			disableGeoclick();
			removeLayers();
			if( app.$outermost.is('.stats') ) {
				addStatistics( id );
			}
			else if( app.viewed.forestcover ) {
				addForestCoverLayer( id );
			}
		},
		forestchange: function( id ) {
			disableGeoclick();
			removeLayers();
			if( app.$outermost.is('.stats') ) {
				addStatistics( id );
			}
			else {
				addLegends();
				if( app.viewed.forestchange ) {
					// TODO: there's probably a simpler way to do this:
					var deforestation = app.$deforestationRadio.is(':checked');
					var disturbance = app.$disturbanceRadio.is(':checked');
					if( app.$bothRadio.is(':checked') ) deforestation = disturbance = true;
					if( deforestation ) addForestChangeLayer( 'deforestation' );
					if( disturbance ) addForestChangeLayer( 'disturbance' );
				}
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
		var view = 'map';
		switch( subst ) {
			case 'forestview':
				view = $('#'+subst+'-input-form-top button.submit')[0].id.split('-')[2];
			case 'project':
			case 'location':
				app.$outermost.addClass( id + '-' + view ).addClass( subst + '-' + view ).addClass( view );
				break;
		}
		return id;
	}
	
	function initTabs() {
		app.tabOpts = {
			parent: '#tabs',
			panels: app.$tabPanels,
			tabs: {
				project: 'Project',
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
				// TODO: without the setTimeout, it doesn't get the correct height
				// the first time, not sure why
				setTimeout( resizeSidebarHeight, 1 );
			}
		};
		app.tabs = S.Tabs( app.tabOpts );
		
		$('form.input-form').submit( function( event ) {
			event.preventDefault();
			// TODO: this could be cleaner
			if( app.$outermost.is('.map') )
				app.viewed[app.tabs.selected] = true;
			app.tabOpts.click( app.tabs.selected );
		});
	}
	
	function activateDefaultTab() {
		var tab = location.hash.replace( /^#/, '' );
		app.tabs.select( app.tabOpts.tabs[tab] ? tab : 'location' );
	}
	
	function initHider() {
		app.$sidebarHider.click( toggleSidebar );
	}
	
	function toggleSidebar( show ) {
		app.$main.toggleClass( 'show-sidebar', show );
		resize();
	}
	
	function initProject() {
		var combo = S.Combo({
			input: '#project-input',
			list: '#project-list',
			onchange: function( inlist ) {
				$('#project-form').toggleClass( 'inlist', !! inlist );
			}
		});
		app.project = { combo: combo }
		
		$('#project-form').submit( function() {
			var name = combo.$input.val();
			var $match = combo.inlist();
			if( $match ) {
			}
			else {
				$.jsonRPC.request( 'project_new', [ name ], {
					success: function( rpc ) {
						load();  // TODO: optimize
						//$('<li>').text( combo.$input.val() ).appendTo( combo.$list );
					},
					error: function(result) {
						alert( 'Error creating project' );  // TODO: better errors
					}
				});
			}
			return false;
		});
		
		load();
		
		function load() {
			$.jsonRPC.request( 'project_list', [], {
				success: function( rpc ) {
					var list = rpc.result.projects.map( function( project ) {
						return S(
							'<li value="', project.key, '">',
								'<div class="text project-name">',
									project.name,
								'</div>',
								'<div class="delete inline-block sprite icon16 icon16-cross">',
								'</div>',
								'<div class="undelete inline-block">',
									'Undo',
								'</div>',
							'</li>'
						);
					});
					combo.$list.html( list.join('') );
				},
				error: function(result) {
					combo.$list.html( '<li><i>Error loading project list</i></li>' );
				}
			});
		}
	}
	
	// Temp
	
	function twoDigits( n ) {
		return ( n < 10 ? '0' : '' ) + n;
	}
	
	function formatDateTime( date ) {
		return S(
			date.getFullYear(),
			'-',
			date.getMonth() + 1,
			'-',
			date.getDate(),
			' ',
			twoDigits( date.getHours() ),
			':',
			twoDigits( date.getMinutes() ),
			':',
			twoDigits( date.getSeconds() )
		);
	}
	
	function autoSaveProject() {
		var $input = $('#project-input');
		$input.val( S(
			'My Project ', formatDateTime( new Date )
		) );
		setTimeout( function() {
			$input.focus().select();
		}, 20 );
	}
	
	// TODO: refactor initViewButtons() and dirtyView() into a button manager
	function initViewButtons() {
		$('button.view-button').click( function() {
			$button = $(this);
			$button
				.blur()
				.parent()
					.find('button.submit')
						.removeClass('submit')
					.find('div.icon16')
						.removeClass('icon16-tick icon16-arrow-circle')
						.addClass('hide');
			$button
				.addClass( 'submit' )
				.find('div.icon16')
					.addClass('icon16-tick')
					.removeClass('hide');
		});
	}
	
	function dirtyView() {
		//$('button.view-button.submit div.icon16')
		//	.removeClass('icon16-tick')
		//	.addClass('icon16-arrow-circle');
	}
	
	function initCalcButtons() {
		$('#view-forestview-add').click( function( event ) {
			var index = app.$forestViewDateStart.val();
			var set = app.forestCoverDates;
			if( app.$outermost.is('.forestchange') ) {
				index += '-' + app.$forestViewDateEnd.val();
				set = app.forestChangeDateRanges;
			}
			if( set[index] ) {
				//event.preventDefault();
			}
			set[index] = true;
		});
		
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
			.fillSelect( arr( 1985, 2009 ), 1985, function( event ) {
				var $end = $(this).parent().find('.date-end');
				if( +this.value >= +$end.val() )
					$end.val( +this.value + 1 );
				addLegends();
				dirtyView();
			});
		
		$('select.date-end')
			.fillSelect( arr( 1986, 2009 ), 2009, function( event ) {
				var $start = $(this).parent().find('.date-start');
				if( +this.value <= +$start.val() )
					$start.val( +this.value - 1 );
				addLegends();
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
	
	function initColorPickers( root ) {
		var $root = $( root || 'body' );
		$root.find('input.color-picker').mColorPicker()
		$root.find('input.mColorPickerInput').click( function( event ) {
			$(this).next().trigger( 'click', event );
		});
	}
	
	function addLegends() {
		if( ! app.$outermost.is('.forestchange.map') )
			return;
		setTimeout( function() {
			addForestChangeLegend( 'deforestation-legend' );
			addForestChangeLegend( 'disturbance-legend' );
		}, 1 );
	}
	
	function makeColorPicker( id, name, value, label, check ) {
		return S(
			'<div class="color-picker-row">',
				check ? '<input type="checkbox" class="color-picker-check" checked="checked" />' : '',
				'<input class="color-picker" data-hex="true" name="', name, '" id="', id, '" value="', value, '">',
				'<label for="', id, '">', label, '</label>',
			'</div>'
		);
	}
	
	function addForestChangeLegend( id ) {
		var $legend = $( '#' + id );
		$legend.html( getForestChangeLegend(id) );
		initColorPickers( $legend );
		$legend.delegate( 'input[type="checkbox"]', 'click', function( event ) {
			var $checkbox = $(this);
			$checkbox.parent().toggleClass( 'disabled', ! $checkbox.is(':checked') );
		});
		$legend.setHider( '.legend-hider', '.legend-colors', function( expand ) {
			if( expand ) {
				var $content = $legend.find('.legend-colors');
				if( $content.is(':empty') ) {
					// TODO: populate legend here instead of at panel load time
				}
			}
		});
	}
	
	$.fn.setHider = function( hider, content, callback ) {
		var $wrapper = $(this),
			$hider = $wrapper.find(hider),
			$icon = $hider.find('.icon16'),
			$content = $wrapper.find(content);
		function expanded() {
			return $icon.is('.icon16-toggle');
		}
		$hider.click( function() {
			var expand = ! expanded();
			$icon
				.removeClass( 'icon16-toggle icon16-toggle-expand' )
				.addClass( expand ? 'icon16-toggle' : 'icon16-toggle-expand' );
			$content.toggle( expand );
			callback && callback( expand );
		});
	};
	
	var temp = { oldest:'#FFFF00', newest:'#FF0000' };
	
	function getForestChangeLegend( id ) {
		var start = app.$forestViewDateStart.val(), end = app.$forestViewDateEnd.val(),
			steps = end - start + 1;
		if( steps < 2 ) return '';
		
		var gradient = S.Color.hexGradient( steps, [ temp.oldest, temp.newest ] );
		return S(
			'<div class="legend-wrapper">',
				'<span class="legend-hider hider">',
					'<div class="inline-block sprite icon16 icon16-toggle-expand">',
					'</div>',
					' ',
					'<b>Set Colors</b>',
				'</span>',
				'<div class="legend-colors">',
					gradient.map( function( color, i ) {
						var year = +start + i;
						return makeColorPicker( id + '-' + year, id, color, year, true );
					}).join(''),
				'</div>',
			'</div>'
		);
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
		addLayer( id, S( 'forestcover/idesam/', year, '/' ) );
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
			value /= 100;
			set( 'forestcover' );
			set( 'deforestation' );
			set( 'disturbance' );
			
			function set( id ) { app.layers[id] && app.layers[id].setOpacity( value ); }
		});
	}
	
	function addSolidMapType( id, color, name, alt ) {
		app.map.map.mapTypes.set( id,
			new S.Map.v3.SolidMapType({ color:color, name:name, alt:alt })
		);
	}
	
	function setChart( sel, table, url, width, height, title ) {
		var chart = ! url ? '' : S(
			'<div class="statistics-chart" style="width:', width, 'px; height:', height, 'px; background-image:url(', url, ')">',
			'</div>'
		);
		table = ! table ? '' : S(
			'<div class="statistics-table-wrap">',
				table,
			'</div>'
		);
		setChartContent( sel, title, S( chart, table ) );
	}
	
	function setEmptyChart( sel, table, url, width, height, title ) {
		setChartContent( sel, title,
			'Select years and use the <b>Calculate</b> button on the left to add statistics'
		);
	}
	
	function setChartContent( sel, title, content ) {
		$(sel).html( S(
			'<div>',
				'<h2>',
					title || '',
				'</h2>',
				'<div class="statistics-block">',
					content || '',
				'</div>',
			'</div>'
		) );
	}
	
	function addStatistics( id ) {
		$.getCachedJSON( 'js/statistics-test.json', function( json, cached ) {
			
			var region = json.regions[0];
			
			if( ! cached ) {
				region.forestChange.forEach( function( entry ) {
					entry.daterange = [ entry.startdate, entry.enddate ].join('-');
				});
				S.indexArray( region.forestChange, 'daterange' );
				S.indexArray( region.forestCover, 'date' );
			}
			
			var units = app.$units.val().split('|'),
				unit = { value:units[0], abbr:units[1], name:units[2] },
				factor = json.pixelWidth * json.pixelHeight / unit.value;
			function U( value ) { return value * factor; }
			function num( value ) { return S.formatNumber( value, 2 ); }
			
			var height = 150, width = 600;
			
			var charts = {
				forestcover: function() {
					var scaleMax = 0, labels = [], rows = [],
						forests = [], nonforests = [], unobserveds = [];
					S.sortSet(app.forestCoverDates).forEach( function( date ) {
						var cover = region.forestCover.by_date[date];
						if( ! cover ) return;
						var
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
					
					var container = '#forest-cover-chart', title = 'Forest Cover';
					if( ! rows.length ) {
						setEmptyChart( container, title );
						return;
					}
					
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
					
					var url = S.ChartApi.barV({
						width: width,
						height: height,
						labels: labels,
						colors: [ '00FF00', 'EE9A00', '000000' ],
						data: [ [ forests.join(), nonforests.join(), unobserveds.join() ].join('|') ],
						scale: [ 0, scaleMax ],
						barWidth: [ 25, 20 ],
						legend: 'Forest|Non-Forest|Unobserved',
						legendPos: '|r',
						axes: 'x,y',
						axisRange: [ 1, 0, scaleMax ],
						axisFormat: '0,222222,13|1N*s*,222222,13'
					});
					
					setChart( container, table, url, width, height, title );
				},
				
				forestchange: function( a ) {
					a = a || { chart:true, table:true, details:true };
					var container = a.container || '#forest-change-chart';
					var ranges = a.ranges || app.forestChangeDateRanges;
					var totalpix = 2753565;  // temp for demo
					var scaleMax = 0, labels = [], rows = [],
						deforestations = [], disturbances = [];
					S.sortSet(ranges).forEach( function( range ) {
						var change = region.forestChange.by_daterange[range];
						if( ! change ) return;
						var startdate = change.startdate, enddate = change.enddate,
							deforestation = U(change.deforestation),
							disturbance = U(change.disturbance);
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
						labels.push( S( startdate.slice(-2), '-', enddate.slice(-2) ) );
						//labels.push( S( '-', enddate.slice(-2) ) );
						scaleMax = Math.max( scaleMax, deforestation, disturbance );
						deforestations.push( deforestation );
						disturbances.push( disturbance );
					});
					
					var title = a.title != null ? a.title : S('Forest Change - Area (', unit.name, ')' );
					if( ! rows.length ) {
						setEmptyChart( container, title );
						return;
					}
					
					var table = ! a.table ? '' : S(
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
					
					var url = ! a.chart ? '' : S.ChartApi.barV({
						width: width,
						height: height,
						labels: labels,
						colors: [ 'FF0000', 'FFD000' ],
						data: [ [ deforestations.join(), disturbances.join() ].join('|') ],
						scale: [ 0, scaleMax ],
						//barWidth: [ 22, 10 ],
						barWidth: [ 25, 20 ],
						legend: 'Deforestation|Disturbance',
						legendPos: '|r',
						axes: 'x,y',
						axisRange: [ 1, 0, scaleMax ],
						axisFormat: '0,222222,13|1N*s*,222222,13'
					});
					
					setChart( container, table, url, width, height, title );
					
					if( a.details )
						addForestChangeDetails( container );
				}
			};
			
			charts[id]();
			
			function addForestChangeDetails( container ) {
				var $container = $(container);
				var minYear = +Infinity, maxYear = -Infinity;
				for( var range in app.forestChangeDateRanges ) {
					var years = range.split('-');
					minYear = Math.min( minYear, years[0] );
					maxYear = Math.max( maxYear, years[1] );
				}
				if( minYear >= maxYear )
					return;
				var ranges = {};
				for( var year = minYear;  year < maxYear;  ++year )
					ranges[ S( year, '-', year+1 ) ] = true;
				// TODO: refactor with similar hider code
				$.S(
					'<div class="details-wrapper">',
						'<div class="details-hider hider">',
							'<div class="inline-block sprite icon16 icon16-toggle-expand">',
							'</div>',
							' ',
							'<b>Details</b>',
						'</div>',
						'<div class="details-content">',
						'</div>',
					'</div>'
				).appendTo( $container );
				$container.setHider( '.details-hider', '.details-content', function( expand ) {
					if( expand ) {
						charts.forestchange({
							container: $container.find('.details-content'),
							title: '',
							table: true,
							ranges: ranges
						});
					}
				});
			}
			
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
		var mh = wh - app.$main.offset().top;
		app.$main.css({ height: mh });
		
		if( app.$main.is('.show-sidebar') ) {
			var sbw = layout.sidebarWidth + $.scrollBarWidth();
			app.$sidebarHider.css({ left: sbw + 1 });
			app.$sidebarOuter.css({ width: sbw, height: mh });
			app.$sidebarScrolling.css({ width: sbw });
			resizeSidebarHeight();
		}
		else {
			sbw = 0;
			app.$sidebarHider.css({ left: 0 });
		}
		
		app.$mapstatswrap.css({ left: sbw, width: ww - sbw - 1 });
		app.map && app.map.resize();
	}
	
	function resizeSidebarHeight() {
		var sbh = app.$window.height() - app.$sidebarScrolling.offset().top;
		app.$sidebarScrolling.css({ height: sbh });
	}
	
})();
