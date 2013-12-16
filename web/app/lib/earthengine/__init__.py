# -*- coding: utf-8 -*-
"""
	Earth Engine interface
	~~~~~~~~~~~~~~~~~~~~
	:By Michael Geary - http://mg.to/
	:See UNLICENSE or http://unlicense.org/ for public domain notice.
"""

import cgi, logging, sys, os
import ee
from oauth2client import appengine

from google.appengine.api import urlfetch, users
from google.appengine.ext import db

from tipfy import current_handler
from tipfy.utils import json_decode


class EarthEngine( object ):
	
	def __init__( self, handler ):
		self.url = handler.get_config( 'earth-engine', 'api' )
		account = handler.get_config( 'earth-engine', 'ee_account' )
		key = handler.get_config( 'earth-engine', 'ee_private_key_file' )
		DEBUG_MODE = ('SERVER_SOFTWARE' in os.environ and
              		os.environ['SERVER_SOFTWARE'].startswith('Dev'))

		if DEBUG_MODE:
    			EE_API_URL = 'https://earthengine.sandbox.google.com'
			EE_CREDENTIALS = ee.ServiceAccountCredentials(account, key)
		else:
			EE_API_URL = 'https://earthengine.googleapis.com'
    			EE_CREDENTIALS = appengine.AppAssertionCredentials(ee.OAUTH2_SCOPE)

		# Initialize the EE API
		EE_TILE_SERVER = EE_API_URL + '/map/'
		ee.data.DEFAULT_DEADLINE = 60 * 20
		logging.info('Initializing with ' + EE_API_URL)
		ee.Initialize(EE_CREDENTIALS, EE_API_URL)

	
	def _http( self, method, url, params=None ):
		logging.info( 'EarthEngine %s:\n%s', url, params )
		try:
			response = urlfetch.fetch(
				method = method,
				url = self.url + url,
				payload = params,
				deadline = 10
			)
			if response.status_code == 200:
				json = json_decode( response.content )
			else:
				json = { 'error': { 'type':'http', 'code': response.status_code } }
		except urlfetch.DeadlineExceededError:
			json = { 'error': { 'type':'DeadlineExceededError' } }
		except urlfetch.DownloadError:
			json = { 'error': { 'type':'DownloadError' } }
		except urlfetch.ResponseTooLargeError:
			json = { 'error': { 'type':'ResponseTooLargeError' } }
		except:
			json = { 'error': { 'type':'Other' } }
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
	
	def obj( self, type, id ):
		return {
			'type': type,
			'id': id,
		}
	
	def step( self, creator, *args ):
		return {
			'type': 'Image',
			'creator': creator,
			'args': args,
		}
	
	def clip( self, image ):
		key = db.Key( current_handler.session['current_place'] )
		if key is None:
			return image
		place = db.get( key )
		if place is None:
			return image
		if place.owner != users.get_current_user():
			return image
		g = json_decode( place.geojson )
		coords = g['features'][0]['geometry']['coordinates']
		return self.image( 'ClipToMultiPolygon', image, coords )
