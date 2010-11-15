# -*- coding: utf-8 -*-
'''
	handlers.py for Earth Engine proxy
	
	Public Domain where allowed, otherwise:
	Copyright 2010 Michael Geary - http://mg.to/
	Use under MIT, GPL, or any Open Source license:
	http://www.opensource.org/licenses/
'''

from tipfy import RequestHandler, Response

import cgi, re, urllib2

class ProxyHandler( RequestHandler ):
	'''
		Proxy an Earth Engine request
	'''
	def get( self, path=None ):
		api = re.sub( r'http(s)?://[^/]+/\w+/', '', self.request.url )
		debug = api.startswith( 'debug/' )
		if debug:
			api = api.replace( 'debug/', '', 1 )
		api = cgi.escape( api )
		
		req = urllib2.Request(
			url = self.get_config( 'private', 'earth-engine-api' ) + api,
			headers = {
				'Authorization': 'GoogleLogin auth=' + self.get_config( 'private', 'earth-engine-auth' )
			}
		)
		
		f = urllib2.urlopen( req )
		json = f.read()
		f.close()
		
		response = Response( json )
		if not debug:
			response.headers['Content-Type'] = 'application/json'
		return response
