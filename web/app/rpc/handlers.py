# -*- coding: utf-8 -*-
"""
	rpc.handlers
	~~~~~~~~~~~~~~~~~~~~

	CLASlite JSON-RPC handlers

	:By Michael Geary - http://mg.to/
	:See UNLICENSE or http://unlicense.org/ for public domain notice.
"""

from main import fix_sys_path;  fix_sys_path()

from google.appengine.api import urlfetch, users
from google.appengine.ext import db

import logging
import ee
import datetime

from tipfy import RequestHandler, current_handler
from tipfy.ext.jsonrpc import JSONRPCMixin
from tipfy.utils import json_decode, json_encode

from models import Project

from earthengine import EarthEngine, EarthImage

import fusion

from beautifulsoup.BeautifulSoup import BeautifulStoneSoup, SoupStrainer


CLASLITE = 'CLASLITE/com.google.earthengine.third_party.claslite.frontend.'


class JsonService( object ):
	
	# earthengine_...
	
	def earthengine_getyears( self, opt ):
		EarthEngine( current_handler )
		
		poly = ee.Geometry.Rectangle(-69.9365234375,-11.6928965625,-69.8161621094,-11.4097965708)
		collection = ee.ImageCollection(opt['sat'][1]).filterBounds(poly)
		newCollection = collection.map(lambda img: ee.Feature(poly).set({'date':img.get('system:time_start')}))
		response = newCollection.getInfo()

		if 'error' in response:
			return response
		
		years = {}
		ymd = {}
		for image in response['features']:
			seconds_since_epoch = image['properties']['date']
			date = datetime.datetime.fromtimestamp(int(seconds_since_epoch / 1000)).strftime('%Y-%m-%d') 
			logging.info(date)
			year = int( date.split('-')[0] )
			years[year] = True
			ymd[date] = True
		
		ymd = list(ymd)
		ymd.sort()
		
		years = list(years)
		years.sort()
		return {
			'years': years,
			'ymd': ymd
		}
	
	def make_mosaic( self, opt):
		EarthEngine( current_handler )
		collection = ee.ImageCollection(opt['sat'][1])
		vcf = ee.Image('MOD44B_C4_TREE_2000')
		elevation = ee.Image('srtm90_v4')
		sensor = opt['sat'][0]
		starttime = opt['times'][0]['starttime']
		endtime = opt['times'][0]['endtime']
		#polygon = [ polyBbox( opt['bbox'] ) ]
		polygon = ee.Geometry.Rectangle(-69.9365234375,-11.6928965625,-69.8161621094,-11.4097965708)
		call = CLASLITE + 'MosaicScene'
		mosaic = ee.call(call,
			collection, 
			vcf, 
			elevation,
			sensor,
			starttime,
			endtime, 
			polygon)
		return mosaic

	#def make_mosaic(self, opt):
	#	EarthEngine(current_handler)
	#	image = ee.Image('srtm90_v4')
	#	return image

	def earthengine_map( self, action, opt):
		mosaic = self.make_mosaic(opt)
		result = _get_raw_mapid(mosaic.getMapId({'bands':'vis-red,vis-green,vis-blue'}))
		logging.info('mosaic')
		logging.info(result)
		return {'tiles':result}

		#polygon = [ polyBbox( opt['bbox'] ) ]
		#palette = opt.get('palette')
		#mode = opt['mode']
		#mosaic = self.make_mosaic(opt)
		#return _get_raw_mapid(mosaic.getMapId({
		#	'bands': 'vis-red,vis-green,vis-blue'
		#}))
			
		
	def old_earthengine_map( self, action, opt ):
		'''	Create an Earth Engine map as tiles or as a download image,
			or requests statistics.
			action = 'click', 'download', 'stats', or 'tiles'
			opt = {
				'sat': [ satname, sensor ],
				'mode': 'fractcover' or 'forestcover' or 'forestchange',
				'times': [
					{ 'starttime': n, 'endtime': n },
					/* ... */
				],
				# for tiles or download:
				'bbox': [ west, south, east, north ],
				# for click:
				'points': [ lng, lat ],
				# for fractcover:
				'bias': n,
				'gain': n,
				'gamma': n,
				# for forestcover:
				# (nothing extra)
				# for forestchange:
				'type': 'deforestation' or 'disturbance',
				# for forestcover or forestchange:
				'palette': [ rrggbb, ..., rrggbb ],
			}
		'''
		polygon = [ polyBbox( opt['bbox'] ) ]
		palette = opt.get('palette')
		mode = opt['mode']
		final = None
		bandsDown = None
		if mode == 'fractcover':
			bands = 'sub,pv,npv'
			bandsDown = 'sub,pv,npv,sdev_sub,sdev_pv,sdev_npv,rms'
			visual = 'bias=%f&gain=%f&gamma=%f' %(
				float(opt['bias']), float(opt['gain']), float(opt['gamma'])
			)
		elif mode == 'forestcover':
			final = 'ForestCoverMap'
			bands = 'Forest_NonForest'
			visual = 'min=0&max=2&palette=%s' %(
				str( ','.join(palette) )
			)
			statFields = 'count'
		elif mode == 'forestchange':
			final = 'ForestCoverChange'
			bands = ( 'disturb', 'deforest' )[ opt['type'] == 'deforestation' ]
			visual = 'min=1&max=%d&palette=%s' %(
				len(palette), str( ','.join(palette) )
			)
			statFields = 'DEFORESTATION_PIX_CNT,DISTURBANCE_PIX_CNT,TOTAL_PIX_CNT'
		if action == 'download':
			( w, s, e, n ) = opt['bbox']
			coords = [
				[ w, s ],
				[ w, n ],
				[ e, n ],
				[ e, s ],
			]
			region = json_encode({
				"type": "LinearRing",
				"coordinates": coords,
			})
			bands = map(
				lambda band: { 'id': band, 'scale': 30 },
				( bandsDown or bands ).split(',')
			)
			bands = '%s&crs=EPSG:4326&region=%s' %(
				json_encode(bands),
				region
			)
		
		ee = EarthEngine( current_handler )
		ei =  EarthImage()
		modImage = ei.obj( 'Image', 'MOD44B_C4_TREE_2000' )
		tempImage = ei.obj( 'Image', 'LANDSAT/L7_L1T/LE72290682008245EDC00' )
		collection = ei.obj( 'ImageCollection', opt['sat'][1] )
		sensor = opt['sat'][0]
		
		image = []
		for time in opt['times']:
			image.append( ei.step(
				CLASLITE+'MosaicScene',
				collection, modImage, sensor,
				time['starttime'], time['endtime'],
				[ polygon ]
			) )
		if len(image) == 1:
			image = image[0]
		
		if final:
			image = ei.step( CLASLITE+final, image )
		#image = ei.clip( image )
		
		if action == 'stats':
			image = ei.step( CLASLITE+final+'Stat', image, {
				"features": [
					{
						"type": "Feature",
						"geometry": {
							"type": "Polygon",
							"coordinates": polygon
						}
					}
				]
			})
		
		params = 'image=%s' % json_encode(image)
		
		if action == 'click':
			params += '&points=[[%s,%s]]' %( opt['lng'], opt['lat'] )
		elif action == 'stats':
			params += '&fields=%s' % statFields
		else:
			params += '&bands=%s' %( bands )
		
		def vp( p ): return visual + '&' + p
		
		if action == 'click':
			value = ee.get( 'value', params )
			return value
		elif action == 'download':
			download = ee.post( 'download', vp(params) )
			return download
		elif action == 'tiles':
			tiles = ee.post( 'mapid', vp(params) )
			if 'error' in tiles:
				return tiles
			else:
				return { 'tiles': tiles['data'] }
		elif action == 'stats':
			stats = ee.post( 'value', params )
			if 'error' in stats:
				return stats
			else:
				return { 'stats': stats['data']['properties'] }
	
	# project_...
	
	def project_delete( self, keytext ):
		key = db.Key( keytext )
		project = db.get( key )
		if project.owner != users.get_current_user():
			return {
				'error': 'Wrong owner'
			}
		db.delete( project )
		return {
			'deleted': keytext
		}
	
	def project_get( self, keytext ):
		key = db.Key( keytext )
		project = db.get( key )
		if project.owner != users.get_current_user():
			return {
				'error': 'Wrong owner'
			}
		return {
			'key': keytext,
			'name': project.name,
			'settings': project.settings
		}
	
	def project_list( self ):
		owner = users.get_current_user()
		projects = Project.gql(
			'WHERE owner = :1 ORDER BY name',
			owner
		)
		result = []
		for project in projects:
			result.append({
				'key': str( project.key() ),
				'name': project.name
			})
		return {
			'projects': result,
		}
	
	def project_new( self, name, settings ):
		owner = users.get_current_user()
		project = Project( name=name, owner=owner, settings=settings )
		project.put()
		return {
			'key': str( project.key() )
		}
	
	# shape_...
	
	def shape_list_tables( self ):
		client = fusion.Client( current_handler )
		tables = filter(
			lambda row: row['name'].endswith(('.kml','.shp')),
			client.query( 'SHOW TABLES' )
		)
		return {
			'tables': tables
		}
	
	def shape_describe( self, idTable ):
		client = fusion.Client( current_handler )
		cols = client.query( 'DESCRIBE ' + fusion.fixId(idTable) )
		return {
			'cols': cols
		}
	
	def shape_list_rows( self, idTable ):
		client = fusion.Client( current_handler )
		cols = client.query( 'DESCRIBE ' + fusion.fixId(idTable) )
		if not fusion.hasCol( cols, 'geometry' ):
			return { 'error': 'No geometry column' }
		rows = client.query( 'SELECT rowid FROM ' + fusion.fixId(idTable) )
		return {
			'rows': rows
		}
	
	# other
	
	def fetch_content( self, path ):
		try:
			response = urlfetch.fetch( 'http://claslite.ciw.edu/%s/.atom' % path )
		except urlfetch.DownloadError, e:
			#logging.exception( e )
			response = { 'status_code': 500 }
		if response.status_code != 200:
			return { 'error': response.status_code }
		strainer = SoupStrainer( 'content' )
		soup = BeautifulStoneSoup( response.content, parseOnlyThese=strainer )
		content = soup.content
		if content is None:
			return { 'error': 404 }
		return { 'content': '<div>%s</div>' % content.text }


class JsonHandler( RequestHandler, JSONRPCMixin ):
	jsonrpc_service = JsonService()
	jsonrpc_name = 'CLASlite JSON-RPC Service',
	jsonrpc_summary = 'RPC services for CLASlite web client.'


def strBbox( bbox ):
	return ','.join( map( str, bbox ) )

def polyBbox( bbox ):
	( w, s, e, n ) = bbox
	return [
		# clockwise
		#[ w, n ],
		#[ e, n ],
		#[ e, s ],
		#[ w, s ],
		#[ w, n ],
		# counter-clockwise
		[ w, n ],
		[ w, s ],
		[ e, s ],
		[ e, n ],
		[ w, n ],
	]

def _get_raw_mapid(mapid):
	"""Strips any fields other than "mapid" and "token" from a MapId object."""
	return {
		'token': mapid['token'],
		'mapid': mapid['mapid']
	}
