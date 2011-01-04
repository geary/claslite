# -*- coding: utf-8 -*-
"""
	rpc.handlers
	~~~~~~~~~~~~~~~~~~~~

	CLASlite JSON-RPC handlers

	:By Michael Geary - http://mg.to/
	:See UNLICENSE or http://unlicense.org/ for public domain notice.
"""

from google.appengine.api import users

from tipfy import RequestHandler
from tipfy.ext.jsonrpc import JSONRPCMixin

from models import Project


class JsonService( object ):
	
	def project_delete( self, keytext ):
		owner = users.get_current_user()
		key = Key( keytext )
		project = db.get( key )
		if owner != project.owner:
			return {
				'error': 'Wrong owner'
			}
		db.delete( project )
		return {
			'deleted': keytext
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
			'projects': list
		}
	
	def project_new( self, name ):
		owner = users.get_current_user()
		project = Project( name=name, owner=owner )
		project.put()
		return {
			'key': str( project.key() )
		}


class JsonHandler( RequestHandler, JSONRPCMixin ):
	jsonrpc_service = JsonService()
	jsonrpc_name = 'CLASlite JSON-RPC Service',
	jsonrpc_summary = 'RPC services for CLASlite web client.'
