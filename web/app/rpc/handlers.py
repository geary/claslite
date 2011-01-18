# -*- coding: utf-8 -*-
"""
	rpc.handlers
	~~~~~~~~~~~~~~~~~~~~

	CLASlite JSON-RPC handlers

	:By Michael Geary - http://mg.to/
	:See UNLICENSE or http://unlicense.org/ for public domain notice.
"""

from google.appengine.api import users
from google.appengine.ext import db

from tipfy import RequestHandler, current_handler
from tipfy.ext.jsonrpc import JSONRPCMixin

from models import Project

from ftclient.ftclient import OAuthFTClient


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
	
	def test( self ):
		conf = current_handler.app.config['tipfy.auth.google']
		token = current_handler.session['google_access_token']
		
		client = OAuthFTClient(
			conf['google_consumer_key'], conf['google_consumer_secret'],
			token['key'], token['secret']
		)
		
		tables = client.query( 'SHOW TABLES' )
		
		return {
			'tables': tables
		}


class JsonHandler( RequestHandler, JSONRPCMixin ):
	jsonrpc_service = JsonService()
	jsonrpc_name = 'CLASlite JSON-RPC Service',
	jsonrpc_summary = 'RPC services for CLASlite web client.'
