# -*- coding: utf-8 -*-
"""
	shape.handlers
	~~~~~~~~~~~~~~~~~~~~

	Shapefile/KML handler

	:By Michael Geary - http://mg.to/
	:See UNLICENSE or http://unlicense.org/ for public domain notice.
"""

from main import fix_sys_path;  fix_sys_path()

import os

from google.appengine.api import users
from google.appengine.ext import db

from tipfy import RequestHandler, Response
from tipfy.auth import login_required, user_required
from tipfy.sessions import SessionMiddleware
from tipfy.utils import json_encode
from tipfyext.jinja2 import Jinja2Mixin

from models import Place

import geo

class BaseHandler( RequestHandler, Jinja2Mixin ):
	middleware = [ SessionMiddleware() ]


class ShapeUploadHandler( BaseHandler ):
	@user_required
	def post( self ):
		'''	Upload shape/kml file
		'''
		file = self.request.files['shape_file']
		if not file:
			return self.render_json({
				'error': 'No file uploaded'
			})
		name = file.filename
		base, ext = os.path.splitext( name )
		if ext.lower() != '.kml':
			return self.render_json({
				'error': 'Not a KML file'
			})
		g = geo.Kml( file ).toGeo()
		#return self.render_json( g )
		name = g['features'][0]['properties']['name']
		geojson = json_encode( g )
		key = result = self.save_place( name, geojson )['key']
		return self.render_json({
			'name': name,
			'key': key,
			'geo': g,
		})
	
	def render_json( self, dict ):
		'''	Using this code instead of tipfy.utils.render_json_response
			because the mimetype='application/json' triggers a file
			download in Firefox.
		'''
		return self.app.response_class( json_encode(dict) )
	
	def save_place( self, name, geojson ):
		owner = self.auth.user.auth_id
		place = Place( name=name, owner=owner, geojson=geojson )
		place.put()
		key = str( place.key() )
		self.session['current_place'] = key
		return {
			'key': str( place.key() )
		}
