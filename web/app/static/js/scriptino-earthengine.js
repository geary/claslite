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
			}
			
		});
	};
	
})( Scriptino, jQuery );
