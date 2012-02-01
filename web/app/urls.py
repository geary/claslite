# -*- coding: utf-8 -*-
"""URL definitions."""
from tipfy.routing import Rule

rules = [
	Rule( '/', name='claslite', handler='claslite.handlers.ClasliteHandler' ),
	
	Rule( '/auth/login', name='auth/login', handler='claslite.handlers.LoginHandler'),
	Rule( '/auth/logout', name='auth/logout', handler='claslite.handlers.LogoutHandler'),
	Rule( '/auth/signup', name='auth/signup', handler='claslite.handlers.SignupHandler'),
	
	Rule( '/ee/<path:path>', name='proxy', handler='proxy.handlers.ProxyHandler' ),
	Rule( '/fusionkml/<int:tableId>/<int:rowId>', name='fusionkml', handler='fusionkml.handlers.FusionKmlHandler' ),
	Rule( '/rpc', name='rpc', handler='rpc.handlers.JsonHandler'),
	Rule( '/shape/upload', name='shape', handler='shape.handlers.ShapeUploadHandler'),
]
