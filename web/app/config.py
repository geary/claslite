# -*- coding: utf-8 -*-
"""App configuration."""

import private

config = {
	#'proxy': {
	#	'base': '/ee/'
	#},
	
	#'tipfy': {
	#	'auth_store_class': 'tipfy.appengine.auth.AuthStore',
	#},
	
}

config.update( private.config )
