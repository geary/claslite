// Scriptino Map
// Copyright 2010 Michael Geary
// Use under any Open Source license:
// http://www.opensource.org/licenses/

(function( S, $ ) {
	
	var gm = google.maps, gme = gm.event;
	if( ! gme ) {
		var v2 = true;
		gme = gm.Event;
	}
	else {
	}
	
	S.Map = function( $map, opt ) {
		var sm = this;
		$map = $($map);
		
		if( v2 ) {
			if( ! GBrowserIsCompatible() ) return;
			var map = sm.map = new GMap2( $map[0] );
			//map.addMapType(G_PHYSICAL_MAP);
			//map.setMapType(G_NORMAL_MAP);
			map.enableContinuousZoom();
			map.enableDoubleClickZoom();
			//map.enableScrollWheelZoom();
			map.addControl( new GLargeMapControl3D );
			map.addControl( new GMapTypeControl );
		}
		else {
			var map = sm.map = new gm.Map( $map[0], opt.v3 );
		}
		
		S.extend( sm, {
			
			addBoundsPoly: function( bounds ) {
				var sw = bounds.getSouthWest(), ne = bounds.getNorthEast();
				var s = sw.lat(), w = sw.lng(), n = ne.lat(), e = ne.lng();
				var path = [
					new gm.LatLng( n, w ),
					new gm.LatLng( n, e ),
					new gm.LatLng( s, e ),
					new gm.LatLng( s, w ),
					new gm.LatLng( n, w )
				];
				if( v2 ) {
					var poly = new gm.Polygon( path, '#000000', 5, .7, '#000000', .1, {
						clickable: false
					});
					try {
						// This throws an exception!
						sm.map.addOverlay( poly );
					}
					catch( e ) {
						debugger;
					}
				}
				else {
					var poly = new gm.Polygon({
						map: map,
						clickable: false,
						fillColor: '#000000',
						fillOpacity: .1,
						paths: path,
						strokeColor: '#000000',
						strokeOpacity: .7,
						strokeWeight: 2
					});
				}
				return poly;
			},
			
			addLayer: function( opt ) {
				var layer = {
					opacity: opt.opacity == null ? 1 : opt.opacity
				};
				
				function getTileUrl( coord, zoom ) {
					return opt.tiles
						.replace( '{X}', coord.x )
						.replace( '{Y}', ( 1 << zoom ) - coord.y - 1 )
						.replace( '{Z}', zoom );
				}
				
				if( v2 ) {
					var tileLayer = S.extend( new GTileLayer(
						new GCopyrightCollection(''), opt.minZoom, opt.maxZoom
					), {
						getTileUrl: getTileUrl,
						isPng: function() { return true; },
						getOpacity: function() { return layer.opacity; }
					});
					var tileLayerOverlay = new GTileLayerOverlay( tileLayer);
					map.addOverlay( tileLayerOverlay );
					
					layer.remove = function() {
						map.removeOverlay( tileLayerOverlay );
					};
					
					layer.setOpacity = function( opacity ) {
						layer.opacity = opacity;
						map.removeOverlay( tileLayerOverlay );
						map.addOverlay( tileLayerOverlay );
					};
					
					//var tileLayer = new GTileLayer(
					//	new GCopyrightCollection(''),
					//	opt.minZoom, opt.maxZoom
					//);
					//var mercator = new GMercatorProjection( opt.maxZoom + 1 );
					//tileLayer.getTileUrl = function( tile, zoom ) {
					//	if( zoom < opt.minZoom  ||  zoom > opt.maxZoom )
					//		return "http://www.maptiler.org/img/none.png";
					//	var ymax = 1 << zoom;
					//	var y = ymax - tile.y - 1;
					//	var tileBounds = new GLatLngBounds(
					//		mercator.fromPixelToLatLng( new GPoint( (tile.x)*256, (tile.y+1)*256 ) , zoom ),
					//		mercator.fromPixelToLatLng( new GPoint( (tile.x+1)*256, (tile.y)*256 ) , zoom )
					//	);
					//	//if (mapBounds.intersects(tileBounds)) {
					//		return 'http://claslite.geary.joyeurs.com/tiles/peru_redd_2007_mosaic_frac_tif/' + zoom + '/' + tile.x + '/' + tile.y + '.png'
					//	//} else {
					//	//	return "http://www.maptiler.org/img/none.png";
					//	//}
					//}
					//// IE 7-: support for PNG alpha channel
					//// Unfortunately, the opacity for whole overlay is then not changeable, either or...
					//tileLayer.isPng = function() { return true;};
					//tileLayer.getOpacity = function() { return .5 /*opacity*/; }
					//
					//overlay = new GTileLayerOverlay( tileLayer );
					//map.addOverlay(overlay);
					
				}
				else {
					var mapType = new S.Map.v3.TileMapType({
						minZoom: opt.minZoom,
						maxZoom: opt.maxZoom,
						tileSize: new gm.Size( 256, 256 ),
						isPng: true,
						getTileUrl: getTileUrl,
						opacity: opt.opacity
					});
					sm.map.overlayMapTypes.insertAt( 0, mapType );
					
					layer.remove = function() {
						sm.map.overlayMapTypes.removeAt( 0 );
					};
					
					layer.setOpacity = function( opacity ) {
						mapType.setOpacity( opacity );
					};
				}
				
				return layer;
			},
			
			fitBounds: function( s, w, n, e ) {  // or ( bounds )
				var bounds =
					arguments.length == 1 ?
						s :
						new gm.LatLngBounds(
							new gm.LatLng( s, w ),
							new gm.LatLng( n, e )
						);
				if( v2 ) {
					var zoom = map.getBoundsZoomLevel( bounds );
					map.setCenter( bounds.getCenter(), zoom || 4 );
				}
				else {
					map.fitBounds( bounds );
				}
			},
			
			Geoclick: function( opt ) {
				var geoclick = this;
				geoclick.enabled = true;
				
				var $form = $(opt.form), $input = $(opt.input), $list = $('<div>');
				$(opt.list).html( $list );
				sm.geocoder = sm.geocoder || new S.Geocoder;
				
				sm.clickCoder = sm.clickCoder  ||
					gme.addListener( sm.map, 'click', function( event, latlng ) {
						if( ! geoclick.enabled ) return;
						if( ! v2 ) latlng = event.latLng;
						geocode({ address: latlng.lat() + ',' + latlng.lng() }, { click: true });
						opt.onclick && opt.onclick();
					});
				
				$form.submit( function( event ) {
					if( ! geoclick.enabled ) return;
					event.preventDefault();
					geocode({ address: $input.val() });
				});
				
				var $ul;
				function hilite( $li, bounds ) {
					if( ! $ul ) return;
					sm.hoverPoly && sm.removePoly( sm.hoverPoly );
					delete sm.hoverPoly;
					$ul.find('li.hover').removeClass( 'hover' );
					if( ! $li ) return;
					$li.addClass( 'hover' );
					sm.hoverPoly = sm.addBoundsPoly( bounds );
				}
				
				function geocode( request, opt ) {
					opt = opt || {};
					sm.geocoder.geocode( request, function( results, status ) {
						$ul = $('<ul class="geocode-list">');
						if( status == gm.GeocoderStatus.OK ) {
							var outer = new gm.LatLngBounds;
							results.forEach( function( result, i ) {
								if( ! result.geometry ) return;
								var viewport = result.geometry.viewport, bounds = result.geometry.bounds || viewport;
								if( ! opt.click ) outer = outer.union( bounds );
								var $li = $('<li class="geocode-item">')
									.text( result.formatted_address )
									.appendTo($ul)
									.mouseenter( function( event ) {
										hilite( $li, bounds );
									})
									.mouseleave( function( event ) {
										hilite();
									})
									.click( function( event ) {
										$ul.find('li.active').removeClass( 'active' );
										$li.addClass( 'active' );
										sm.fitBounds( bounds );
									});
								if( i == 0 ) hilite( $li, bounds );
							});
							if( ! opt.click ) map.fitBounds( outer );
						}
						$list.html( $ul );
					});
				}
				
				geoclick.enable = function() {
					geoclick.enabled = true;
				};
				
				geoclick.disable = function() {
					geoclick.enabled = false;
					hilite();
				};
			},
			
			removePoly: function( poly ) {
				if( v2 ) sm.map.removeOverlay( poly );
				else poly.setMap( null );
			},
			
			resize: function() {
				if( v2 ) map.checkResize();
				else gme.trigger( map, 'resize' );
			}
		});
		
		function cancelClick() {
			if( sm.clicker ) {
				clearTimeout( sm.clicker );
				delete sm.clicker;
			}
		}
		
		gme.addListener( sm.map, 'click', function( event ) {
			//console.log( 'click', event.latLng );
			cancelClick();
			sm.clicker = setTimeout( function() {
				gme.trigger( sm.map, 'Scriptino_singleclick', event );
			}, 500 );
		});
		
		gme.addListener( sm.map, 'dblclick', function( event ) {
			//console.log( 'dblclick', event.latLng );
			cancelClick();
		});
		
		gme.addListener( sm.map, 'Scriptino_singleclick', function( event ) {
			//console.log( 'Scriptino_singleclick', event.latLng );
		});
	};
	
	S.extend( S.Map, v2 ? {
		v2: {
		}
	} : {
		v3: {
			SolidMapType: function( opt ) {
				var mt = S.extend( this, {
					name: opt.name,
					alt: opt.alt,
					tileSize: new gm.Size( 256, 256 ),
					minZoom: 0,
					maxZoom: Infinity,
					getTile: function( coord, zoom, doc ) {
						var tile = doc.createElement( 'div' );
						tile.style.width = '256px';
						tile.style.height = '256px';
						tile.style.backgroundColor = opt.color;
						return tile;
					}
				});
			},
			
			TileMapType: function( opt ) {
				var tiles = {};
				var opacity = opt.opacity == null ? 1 : opt.opacity;
				var mt = S.extend( this, {
					tileSize: opt.tileSize,
					minZoom: opt.minZoom,
					maxZoom: opt.maxZoom,
					getTile: function( coord, zoom, doc ) {
						var url = opt.getTileUrl( coord, zoom );
						var id = url.replace( /\W+/g, '-' );
						var tile = doc.createElement('tile');
						tile.id = id;
						tile.style.width = opt.tileSize.width + 'px';
						tile.style.height = opt.tileSize.height + 'px';
						tile.style.backgroundImage = 'url(' + url + ')';
						tile.style.opacity = opacity;
						tiles[id] = tile;
						return tile;
					},
					releaseTile: function( tile ) {
						delete tiles[ tile.id ];
					},
					setOpacity: function( _opacity ) {
						opacity = _opacity;
						for( var id in tiles )
							tiles[id].style.opacity = opacity;
					}
				});
			}
		}
	});
	
	S.Geocoder = function() {
		var sg = this;
		if( v2 ) {
			var frame;
			
			function loadFrame( callback ) {
				S.Geocoder.ready = function( _frame ) {
					callback( frame = _frame );
				};
				if( frame ) {
					callback( frame );
				}
				else {
					$('<iframe>').html( S(
						'<html>',
							'<head>',
								'<script type="text/javascript">',
									'function ready() { parent.Scriptino.Geocoder.ready(window); }',
								'</script>',
								'<script type="text/javascript" src="http://maps.google.com/maps/api/js?sensor=false&callback=ready"></script>',
							'</head>',
							'<body>',
							'</body>',
						'</html>'
					) ).appendTo('body');
				}
			}
			
			var geocoder = this;
			var framecoder;
			
			S.extend( sg, {
				geocode: function( request, callback ) {
					loadFrame( function( frame ) {
						framecoder = framecoder || new frame.google.maps.Geocoder;
						framecoder.geocode( request, callback );
					});
				}
			});
		}
		else {
			var geocoder = new gm.Geocoder();
			
			S.extend( sg, {
				geocode: function( request, callback ) {
					geocoder.geocode( request, callback );
				}
			});
		}
	};
	
})( Scriptino, jQuery );
