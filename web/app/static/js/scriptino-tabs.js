// Scriptino Tabs
// By Michael Geary - http://mg.to/
// See UNLICENSE or http://unlicense.org/ for public domain notice.

(function( S, $ ) {
	
	S.Tabs = function( a ) {
		var tabs = {
			select: select
		};
		var selectedClass = a.selectedClass || 'selected';
		var items = [];
		for( var id in a.tabs ) items.push( S(
			'<li id="', id, '">',
				'<a href="#">',
					'<span>',
						a.tabs[id],
					'</span>',
				'</a>',
			'</li>'
		) );
		var $list = $.S( '<ul class="', a.tabsClass || 'tabs', '">', items.join(''), '</ul>' )
			.delegate( 'a', {
				mouseenter: function( event ) {
					$(this).addClass('hover');
				},
				mouseleave: function( event ) {
					$(this).removeClass('hover');
				},
				click: function( event ) {
					event.preventDefault();
					select( this.parentNode.id, true );
				}
			})
			.appendTo( a.parent );
		$('<div style="clear:left;">').appendTo( a.parent );  // must be a better way
		function select( id ) {
			tabs.selected = id;
			$list.find('li').removeClass(selectedClass);
			$('#'+id).addClass(selectedClass);
			a.click && a.click( id );
			$(a.panels).children().not( a.alwaysShow || '' ).hide();
			id = a.subst[id] || id;
			$(a.panels).find('> .'+id+'-panel').show();
		}
		return tabs;
	};
	
})( Scriptino, jQuery );
