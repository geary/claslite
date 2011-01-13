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
from tipfy.auth.google import GoogleMixin
from tipfyext.jinja2 import Jinja2Mixin


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
			'email': str(self.auth.user.email),
			'logout_url': self.auth.logout_url(),
			'user_id': self.auth.user.auth_id,
		}
		return self.render_response( 'claslite.html', **context )


class LoginHandler( BaseHandler, GoogleMixin ):
	def get( self, **kwargs ):
		if self.request.args.get( 'openid.mode', None ):
			return self.get_authenticated_user( self._on_auth )
		return self.authenticate_redirect()
	
	def _on_auth( self, user ):
		if not user:
			self.abort( 403 )
		auth_id = user['claimed_id']
		email = user['email']
		self.auth.login_with_auth_id( auth_id, True )
		if not self.auth.user:
			user = self.auth.create_user( auth_id, auth_id, email=email )
		return self.redirect()


class LogoutHandler( BaseHandler, GoogleMixin ):
	def get( self, **kwargs ):
		self.auth.logout()
		return self.redirect( 'https://www.google.com/accounts/Logout' )


class SignupHandler( BaseHandler ):
	@login_required
	def get( self, **kwargs ):
		if not self.auth.user:
			return self.redirect( '/auth/logout' )  # avoid redirect loop
		context = {
			'redirect_url': self.redirect_path(),
		}
		return self.render_response( 'signup.html', **context )
	
	@login_required
	def post( self, **kwargs ):
		return self.redirect()
