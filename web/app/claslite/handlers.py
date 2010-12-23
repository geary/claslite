# -*- coding: utf-8 -*-
"""
	claslite.handlers
	~~~~~~~~~~~~~~~~~~~~

	CLASlite handler

	:By Michael Geary - http://mg.to/
	:See UNLICENSE or http://unlicense.org/ for public domain notice.
"""

from tipfy import RequestHandler, Response
from tipfy.auth import login_required, user_required
from tipfy.sessions import SessionMiddleware
from tipfyext.jinja2 import Jinja2Mixin

from google.appengine.api.users import(
	create_login_url, create_logout_url,
	get_current_user, is_current_user_admin
)

class BaseHandler( RequestHandler, Jinja2Mixin ):
	middleware = [ SessionMiddleware() ]
	
	def redirect( self, url=None ):
		if url == None: url = '/'
		return super(BaseHandler,self).redirect( url )
	
	def redirect_path( self, default='/' ):
		url = self.request.args.get( 'continue', '/' )
		if url.startswith('/'): return default
		return url


class ClasliteHandler( BaseHandler ):
	@user_required
	def get( self ):
		'''	Return Response object for main CLASlite page.
		'''
		if 'count' not in self.session: self.session['count'] = '0';
		count = int(self.session['count']) + 1
		self.session['count'] = str(count)
		
		context = {
			'count': count,
			'email': self.auth.session.email(),
			'logout_url': self.auth.logout_url(),
			'user_id': 'gae|' + self.auth.session.user_id(),
		}
		return self.render_response( 'claslite.html', **context )


class LoginHandler( BaseHandler ):
	def get( self, **kwargs ):
		return self.redirect( create_login_url( self.redirect_path() ) )


class LogoutHandler( BaseHandler ):
	def get( self, **kwargs ):
		return self.redirect( create_logout_url( self.redirect_path() ) )


class SignupHandler( BaseHandler ):
	@login_required
	def get( self, **kwargs ):
		if self.auth.user:
			return self.redirect()
		context = {
			'redirect_url': self.redirect_path(),
		}
		return self.render_response( 'signup.html', **context )
	
	@login_required
	def post( self, **kwargs ):
		if self.auth.user:
			return self.redirect()
		auth_id = 'gae|%s' % self.auth.session.user_id()
		email = self.auth.session.email()
		user = self.auth.create_user( auth_id, auth_id, email=email )
		if user:
			return self.redirect()
		return self.get( **kwargs )
