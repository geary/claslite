# -*- coding: utf-8 -*-
"""
	claslite.handlers
	~~~~~~~~~~~~~~~~~~~~

	CLASlite handler

	:By Michael Geary - http://mg.to/
	:See UNLICENSE or http://unlicense.org/ for public domain notice.
"""

from main import fix_sys_path;  fix_sys_path()

from google.appengine.api import urlfetch

from tipfy import RequestHandler, Response
from tipfy.auth import login_required, user_required
from tipfy.sessions import SessionMiddleware
from tipfy.utils import json_decode
from tipfy.auth.google import GoogleMixin
from tipfyext.jinja2 import Jinja2Mixin

from urllib import quote

import private


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
		return self.authorize_redirect( 'http://www.google.com/fusiontables/api/query' )

	
	def _on_auth( self, user ):
		if not user:
			self.abort( 403 )
		auth_id = user['claimed_id']
		email = user['email']
		#access_token = user['access_token']
		
		ok = whitelisted( email )
		if not ok:
			return self.redirect( private.config['whitelist']['form'] )
		if ok == 'pending':
			return self.redirect( 'thanks.html' )
		
		self.auth.login_with_auth_id( auth_id, True )
		if not self.auth.user:
			user = self.auth.create_user( auth_id, auth_id, email=email )
		#self.session['google_access_token'] = access_token
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


def whitelisted( email ):
	sheetUrlFormat = 'http://spreadsheets.google.com/feeds/list/%s/public/values?alt=json&sq=%s'
	whitelist = private.config['whitelist']
	if not whitelist['enabled']:
		return True
	query = quote( 'emailaddress="%s"' % email )
	url = sheetUrlFormat %( whitelist['sheet'], query )
	try:
		response = urlfetch.fetch(
			method = 'GET',
			url = url
		)
		if response.status_code != 200:
			return False
		rows = json_decode( response.content )['feed']['entry']
		row = rows[0]
	except:
		return False
	testuser = row['gsx$testuser']['$t']
	#stableuser = row['gsx$stableuser']['$t']
	if testuser != '':
		return True
	#if stableuser != '':
	#	return True
	return 'pending'  # email is in whitelist table but not approved

