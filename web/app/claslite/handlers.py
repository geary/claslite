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
from tipfy.sessions import SessionMiddleware
from tipfyext.jinja2 import Jinja2Mixin


class BaseHandler( RequestHandler ):
	middleware = [ SessionMiddleware() ]


class ClasliteHandler( BaseHandler, Jinja2Mixin ):
	def get( self ):
		'''	Return Response object for main CLASlite page.
		'''
		if 'count' not in self.session: self.session['count'] = '0';
		
		count = int(self.session['count']) + 1
		self.session['count'] = str(count)
		
		context = {
			'email': 'test-%d@example.com' % count,
		}
		return self.render_response( 'claslite.html', **context )
