# -*- coding: utf-8 -*-
"""
	rpc.handlers
	~~~~~~~~~~~~~~~~~~~~

	CLASlite JSON-RPC handlers

	:By Michael Geary - http://mg.to/
	:See UNLICENSE or http://unlicense.org/ for public domain notice.
"""

from main import fix_sys_path;  fix_sys_path()

from google.appengine.api import users
from google.appengine.ext import db

import logging

from tipfy import RequestHandler, current_handler
from tipfy.ext.jsonrpc import JSONRPCMixin
from tipfy.utils import json_decode, json_encode

from models import Project

from earthengine import EarthEngine, EarthImage

import fusion


CLASLITE = 'CLASLITE/com.google.earthengine.third_party.claslite.frontend.'


class JsonService( object ):
	
	# earthengine_...
	
	def earthengine_getyears( self, opt ):
		ee = EarthEngine( current_handler )
		
		params = 'id=%s&fields=ACQUISITION_DATE&bbox=%s' %(
			opt['sat'][1], strBbox( opt['bbox'] )
		)
		
		response = ee.get( 'list', params )
		if 'error' in response:
			return response
		
		years = {}
		ymd = {}
		for image in response['data']:
			date = image['properties']['ACQUISITION_DATE']
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
	
	def earthengine_map( self, action, opt ):
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
		if mode == 'fractcover':
			bands = 'sub,pv,npv'
			visual = 'bias=%f&gain=%f&gamma=%f' %(
				float(opt['bias']), float(opt['gain']), float(opt['gamma'])
			)
		elif mode == 'forestcover':
			final = 'ForestCoverMap'
			bands = 'Forest_NonForest'
			visual = 'min=0&max=2&palette=%s' %(
				str( ','.join(palette) )
			)
		elif mode == 'forestchange':
			final = 'ForestCoverChange'
			bands = ( 'disturb', 'deforest' )[ opt['type'] == 'deforestation' ]
			visual = 'min=1&max=%d&palette=%s' %(
				len(palette), str( ','.join(palette) )
			)
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
			bands = '[{"id":"%s","scale":30}]&crs=EPSG:4326&region=%s' %( bands, region )
		
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
			params += '&fields=count'
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
			stats = ee.get( 'value', params )
			if 'error' in stats:
				return stats
			else:
				return { 'stats': stats['data']['properties']['count'] }
	
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
