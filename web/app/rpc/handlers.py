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

from models import Project

from ftclient.ftclient import OAuthFTClient

import csv
def csvToList( csvText ):
	list = []
	reader = csv.reader( csvText.strip().split('\n') )
	head = map(
		lambda t: t.replace( ' ', '_' ),
		reader.next()
	)
	# TODO: is there a more Pythonic way to do this?
	for row in reader:
		r = {}
		for j in range( len(head) ):
			r[ head[j] ] = row[j]
		list.append( r )
	return list


def fixId( id ):
	return str( int( id ) )

def hasCol( cols, name ):
	# There must be a better way to do this
	for col in cols:
		if col['name'] == name:
			return True
	return False

class FTClient( object ):
	
	def __init__( self ):
		conf = current_handler.app.config['tipfy.auth.google']
		token = current_handler.session['google_access_token']
		self.client = OAuthFTClient(
			conf['google_consumer_key'], conf['google_consumer_secret'],
			token['key'], token['secret']
		)
	
	def query( self, query, request_type=None ):
		result = self.client.query( query, request_type )
		return csvToList( result )

class JsonService( object ):
	
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
	
	def shape_list_tables( self ):
		client = FTClient()
		tables = filter(
			lambda row: row['name'].endswith(('.kml','.shp')),
			client.query( 'SHOW TABLES' )
		)
		return {
			'tables': tables
		}
	
	def shape_describe( self, idTable ):
		client = FTClient()
		cols = client.query( 'DESCRIBE ' + fixId(idTable) )
		return {
			'cols': cols
		}
	
	def shape_list_rows( self, idTable ):
		client = FTClient()
		cols = client.query( 'DESCRIBE ' + fixId(idTable) )
		if not hasCol( cols, 'geometry' ):
			return { 'error': 'No geometry column' }
		rows = client.query( 'SELECT rowid FROM ' + fixId(idTable) )
		return {
			'rows': rows
		}

class JsonHandler( RequestHandler, JSONRPCMixin ):
	jsonrpc_service = JsonService()
	jsonrpc_name = 'CLASlite JSON-RPC Service',
	jsonrpc_summary = 'RPC services for CLASlite web client.'
