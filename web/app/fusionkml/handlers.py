# -*- coding: utf-8 -*-
'''
	handlers.py for Fusion Table KML proxy
	
	By Michael Geary - http://mg.to/
	See UNLICENSE or http://unlicense.org/ for public domain notice.
'''

from main import fix_sys_path;  fix_sys_path()

from tipfy import RequestHandler, Response

import cgi, re, urllib, urllib2

import fusion

class FusionKmlHandler( RequestHandler ):
	'''
		Fetch a KML cell from a Fusion Table and make it available
		at its own URL.
	'''
	
	def get( self, tableId=None, rowId=None ):
		client = fusion.Client( self )
		selection = client.query(
			'SELECT geometry FROM ' + fusion.fixId(tableId) +
			' WHERE rowid = ' + fusion.fixId(rowId)
		)
		row = selection and selection[0]
		kml = row and row['geometry']
		response = Response( kml )
		response.headers['Content-Type'] = 'text/plain' # 'application/vnd.google-earth.kml+xml'
		return response
