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

from tipfy import RequestHandler, current_handler
from tipfy.ext.jsonrpc import JSONRPCMixin
from tipfy.utils import json_decode, json_encode

from models import Project

from earthengine import EarthEngine, EarthImage

import fusion


class JsonService( object ):
	
	# earthengine_...
	
	def earthengine_map_forestcover( self, opt ):
		ee = EarthEngine( current_handler )
		
		params = 'id=%s&fields=ACQUISITION_DATE&starttime=%d&endtime=%d&bbox=%s' %(
			opt['id'], opt['starttime'], opt['endtime'], opt['bbox']
		)
		
		list = ee.get( 'list', params )
		if 'error' in list:
			return list
		
		images = list['data']
		
		if len(images) == 0:
			return { 'error': { 'type': 'no_images' } }
		
		# Just use the first for now
		image = images[0]
		rawImage = image['id']
		
		modImage = 'MOD44B_C4_TREE_2000'
		ei =  EarthImage()
		radiance = ei.step( 'CLASLITE/Calibrate', rawImage )
		reflectance = ei.step( 'CLASLITE/Reflectance', radiance )
		autoMCU = ei.step( 'CLASLITE/AutoMCU', rawImage, reflectance )
		vcfAdjusted = ei.step( 'CLASLITE/VCFAdjustedImage', autoMCU, modImage )
		forest = ei.step( 'CLASLITE/ForestMask', vcfAdjusted )
		
		params = 'image=%s&bands=%s&min=0&max=2&palette=%s' %(
			json_encode(forest), 'Forest_NonForest', opt['palette']
		)
		
		tiles = ee.post( 'mapid', params )
		
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
		list = []
		for project in projects:
			list.append({
				'key': str( project.key() ),
				'name': project.name
			})
		return {
			'projects': list,
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
