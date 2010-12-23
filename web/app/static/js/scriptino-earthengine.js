// Scriptino Earth Engine
// By Michael Geary - http://mg.to/
// See UNLICENSE or http://unlicense.org/ for public domain notice.

(function( S, $ ) {
	
	S.EarthEngine = function( opt ) {
		var ee = this;
		
		S.extend( ee, {
			
			getTiles: function( request, ready ) {
				$.ajax({
					type: 'POST',
					url: '/ee/mapid',
					data: request,
					success: function( json ) {
						ready( json.data );
					}
				});
			},
			
			list: function( request, ready ) {
				$.ajax({
					url: '/ee/list',
					data: request,
					success: function( json ) {
						ready( json.data );
					}
				});
			},
			
			makeLayer: function( id ) {
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
			}
		});
	};
	
})( Scriptino, jQuery );
