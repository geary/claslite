# -*- coding: utf-8 -*-
"""App configuration."""

import private

config = {
	#'proxy': {
	#	'base': '/ee/'
	#},
	
	'tipfy': {
		'auth_store_class': 'tipfy.auth.MultiAuthStore',
		#'session_store_class': 'tipfy.sessions.SessionStore',
	},
	
}

try:
	import dbgp.client
	config['tipfy']['enable_debugger'] = False
except:
	pass

config.update( private.config )

