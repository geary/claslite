# -*- coding: utf-8 -*-
"""URL definitions."""

from tipfy import Rule

rules = [
	Rule( '/', name='claslite', handler='claslite.handlers.ClasliteHandler' ),
	
	Rule( '/ee/<path:path>', name='proxy', handler='proxy.handlers.ProxyHandler' ),
]
