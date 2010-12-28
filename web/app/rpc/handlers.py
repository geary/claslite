# -*- coding: utf-8 -*-
"""
	rpc.handlers
	~~~~~~~~~~~~~~~~~~~~

	CLASlite JSON-RPC handlers

	:By Michael Geary - http://mg.to/
	:See UNLICENSE or http://unlicense.org/ for public domain notice.
"""

from tipfy import RequestHandler
from tipfy.ext.jsonrpc import JSONRPCMixin


class JsonService( object ):
	
	# Test method
	def test( self, one, two, three ):
		return {
			'first': one,
			'second': two,
			'third': three['anda'],
		}
	

class JsonHandler( RequestHandler, JSONRPCMixin ):
	jsonrpc_service = JsonService()
	jsonrpc_name = 'CLASlite JSON-RPC Service',
	jsonrpc_summary = 'RPC services for CLASlite web client.'
