# -*- coding: utf-8 -*-
'''
	handlers.py for Earth Engine proxy
	
	By Michael Geary - http://mg.to/
	See UNLICENSE or http://unlicense.org/ for public domain notice.
'''

from main import fix_sys_path;  fix_sys_path()

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
		
		test = api.startswith( 'test/' )
		if test:
			api = api.replace( 'test/', '', 1 )
		
		debug = api.startswith( 'debug/' )
		if debug:
			api = api.replace( 'debug/', '', 1 )
		
		if not re.match( allow, api ):
			self.abort( 403 )
		
		api = cgi.escape( api )
		url = self.get_config( 'earth-engine', 'api' ) + api
		
		if test:
			response = Response( url )
			response.headers['Content-Type'] = 'text/plain'
			return response
		
		req = urllib2.Request(
			url = url,
			headers = {
				'Authorization': 'GoogleLogin auth=' +
					self.get_config( 'earth-engine', 'auth' )
			},
			data = data
		)
		
		f = urllib2.urlopen( req )
		json = f.read()
		f.close()
		
		if debug:
			jd = json_decode( json )
			#jd['eeurl'] = url
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
