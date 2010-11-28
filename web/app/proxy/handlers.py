# -*- coding: utf-8 -*-
'''
	handlers.py for Earth Engine proxy
	
	Public Domain where allowed, otherwise:
	Copyright 2010 Michael Geary - http://mg.to/
	Use under MIT, GPL, or any Open Source license:
	http://www.opensource.org/licenses/
'''

from tipfy import RequestHandler, Response

from tipfy.utils import json_decode, json_encode

import cgi, re, urllib, urllib2

class ProxyHandler( RequestHandler ):
	'''
		Proxy an Earth Engine request
	'''
	
	def _getApiFromUrl( self ):
		return re.sub( r'http(s)?://[^/]+/\w+/', '', self.request.url )
	
	def _proxy( self, allow, data=None ):
		api = self._getApiFromUrl()
		
		debug = api.startswith( 'debug/' )
		if debug:
			api = api.replace( 'debug/', '', 1 )
		
		if not re.match( allow, api ):
			self.abort( 403 )
		
		api = cgi.escape( api )
		
		req = urllib2.Request(
			url = self.get_config( 'private', 'earth-engine-api' ) + api,
			headers = {
				'Authorization': 'GoogleLogin auth=' +
					self.get_config( 'private', 'earth-engine-auth' )
			},
			data = data
		)
		
		f = urllib2.urlopen( req )
		json = f.read()
		f.close()
		
		if debug:
			jd = json_decode( json )
			json = json_encode( jd, indent=4 )
			
		response = Response( json )
		if debug:
			response.headers['Content-Type'] = 'text/plain'
		else:
			response.headers['Content-Type'] = 'application/json'
		return response
	
	def get( self, path=None ):
		return self._proxy( r'(info|list|map|value)\?' )
	
	def post( self, path=None ):
		return self._proxy( r'(mapid)$', urllib.urlencode(self.request.form) )
