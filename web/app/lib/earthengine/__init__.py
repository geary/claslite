# -*- coding: utf-8 -*-
"""
	Earth Engine interface
	~~~~~~~~~~~~~~~~~~~~
	:By Michael Geary - http://mg.to/
	:See UNLICENSE or http://unlicense.org/ for public domain notice.
"""

import cgi, re, urllib, urllib2

from tipfy.utils import json_decode


class EarthEngine( object ):
	
	def __init__( self, handler ):
		self.url = handler.get_config( 'earth-engine', 'api' )
		self.auth = handler.get_config( 'earth-engine', 'auth' )
	
	def post( self, api, data=None ):
		url = self.url + cgi.escape( api )
		
		req = urllib2.Request(
			url = url,
			headers = { 'Authorization': 'GoogleLogin auth=' + self.auth },
			data = data
		)
		
		f = urllib2.urlopen( req )
		json = f.read()
		f.close()
		
		return json_decode( json )
	
