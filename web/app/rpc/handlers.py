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


CLASLITE = 'CLASLITE/com.google.earthengine.third_party.claslite.'


class JsonService( object ):
	
	# earthengine_...
	
	def earthengine_getyears( self, opt ):
		ee = EarthEngine( current_handler )
		
		params = 'id=%s&fields=ACQUISITION_DATE&bbox=%s' %(
			opt['sat'][1], opt['bbox']
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
	
	# TODO: refactor the earthengine_map_* functions
	
	def earthengine_map_fractcover( self, opt ):
		ee = EarthEngine( current_handler )
		ei =  EarthImage()
		modImage = ei.obj( 'Image', 'MOD44B_C4_TREE_2000' )
		collection = ei.obj( 'ImageCollection', opt['sat'][1] )
		sensor = opt['sat'][0]
		
		mosaic = ei.step(
			CLASLITE+'MosaicScene',
			collection, modImage, sensor,
			opt['starttime'], opt['endtime']
		)
		
		params = 'image=%s&bbox=%s' %(
			json_encode(mosaic), str(opt['bbox'])
		)
		params = 'image=%s&bands=npv,pv,sub&bias=0&gain=255&gamma=1&bbox=%s' %(
			json_encode(mosaic), str(opt['bbox'])
		)
		
		tiles = ee.post( 'mapid', params )
		
		if 'error' in tiles:
			return tiles
		else:
			return { 'tiles': tiles['data'] }
	
	def earthengine_map_forestcover( self, opt ):
		ee = EarthEngine( current_handler )
		ei =  EarthImage()
		modImage = ei.obj( 'Image', 'MOD44B_C4_TREE_2000' )
		collection = ei.obj( 'ImageCollection', opt['sat'][1] )
		sensor = opt['sat'][0]
		
		mosaic = ei.step(
			CLASLITE+'MosaicScene',
			collection, modImage, sensor,
			opt['starttime'], opt['endtime']
		)
		forest = ei.step( CLASLITE+'ForestMask', mosaic )
		
		params = 'image=%s&bands=%s&min=0&max=2&palette=%s&bbox=%s' %(
			json_encode(forest), 'Forest_NonForest',
			str( ','.join(opt['palette']) ), str(opt['bbox'])
		)
		logging.info( 'Forest_NonForest %d bytes' %(
			len(params)
		) )
		
		tiles = ee.post( 'mapid', params )
		
		if 'error' in tiles:
			return tiles
		else:
			return { 'tiles': tiles['data'] }
	
	def earthengine_map_forestchange( self, opt ):
		ee = EarthEngine( current_handler )
		ei =  EarthImage()
		modImage = ei.obj( 'Image', 'MOD44B_C4_TREE_2000' )
		collection = ei.obj( 'ImageCollection', opt['sat'][1] )
		sensor = opt['sat'][0]
		
		mosaics = []
		for time in opt['times']:
			mosaics.append( ei.step(
				CLASLITE+'MosaicScene',
				collection, modImage, sensor,
				time['starttime'], time['endtime']
			) )
		
		forest = ei.step( CLASLITE+'ForestCoverChange', mosaics )
		
		if opt['type'] == 'deforestation':
			band = 'deforest'
		else:
			band = 'disturb'
		palette = opt['palette']
		params = 'image=%s&bands=%s&min=1&max=%d&palette=%s&bbox=%s' %(
			json_encode(forest), band, len(palette), str( ','.join(palette) ), str(opt['bbox'])
		)
		
		tiles = ee.post( 'mapid', params )
		
		if 'error' in tiles:
			return tiles
		else:
			return { 'tiles': tiles['data'] }
	
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
