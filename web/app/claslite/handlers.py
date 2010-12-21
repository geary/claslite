# -*- coding: utf-8 -*-
"""
	claslite.handlers
	~~~~~~~~~~~~~~~~~~~~

	CLASlite handler

	:Copyright 2010 Carnegie Institution for Science and Michael Geary
	:Use under any Open Source license:
	:http://www.opensource.org/licenses/
"""

from tipfy import RequestHandler, Response
#from tipfyext.jinja2 import Jinja2Mixin


class ClasliteHandler( RequestHandler ):
	def get( self ):
		'''	Return Response object for main CLASlite page.
			Uses plain file template.
		'''
		return Response( file('templates/claslite.html').read() )

#class ClasliteHandler( RequestHandler, Jinja2Mixin ):
#	def get( self ):
#		'''	Return Response object for main CLASlite page.
#			Uses Jinja2 template.
#		'''
#		context = {
#			'email': 'foo@bar.com',
#		}
#		return self.render_response( 'claslite.html', **context )
