# -*- coding: utf-8 -*-
"""
	Earth Engine interface
	~~~~~~~~~~~~~~~~~~~~
	:By Michael Geary - http://mg.to/
	:See UNLICENSE or http://unlicense.org/ for public domain notice.
"""

import cgi

from google.appengine.api import urlfetch

from tipfy.utils import json_decode


class EarthEngine( object ):
	
	def __init__( self, handler ):
		self.url = handler.get_config( 'earth-engine', 'api' )
		self.auth = handler.get_config( 'earth-engine', 'auth' )
	
	def _http( self, method, url, params=None ):
		try:
			response = urlfetch.fetch(
				method = method,
				url = self.url + url,
				headers = { 'Authorization': 'GoogleLogin auth=' + self.auth },
				payload = params,
				deadline = 10
			)
			if response.status_code == 200:
				json = json_decode( response.content )
			else:
				json = { 'error': { 'type':'http', 'code': response.status_code } }
		except urlfetch.DownloadError:
			json = { 'error': { 'type':'DownloadError' } }
		except urlfetch.ResponseTooLargeError:
			json = { 'error': { 'type':'ResponseTooLargeError' } }
		finally:
			return json
	
	def get( self, api, params=None ):
		if params: url = api + '?' + params
		else: url = api
		return self._http( 'GET', url )
	
	def post( self, api, params=None ):
		return self._http( 'POST', api, params )


class EarthImage( object ):
	
	def __init__( self ):
		pass
	
	def step( self, creator, *args ):
		return {
			'type': 'Image',
			'creator': creator,
			'args': args,
		}
		
