# -*- coding: utf-8 -*-
"""URL definitions."""

from tipfy import Rule

rules = [
	Rule( '/', name='claslite', handler='claslite.handlers.ClasliteHandler' ),
	
	Rule( '/ee/<path:path>', name='proxy', handler='proxy.handlers.ProxyHandler' ),

	Rule( '/auth/login', name='auth/login', handler='claslite.handlers.LoginHandler'),
	Rule( '/auth/logout', name='auth/logout', handler='claslite.handlers.LogoutHandler'),
	Rule( '/auth/signup', name='auth/signup', handler='claslite.handlers.SignupHandler'),
]
