# -*- coding: utf-8 -*-
"""
	Fusion Tables wrapper
	~~~~~~~~~~~~~~~~~~~~
	:By Michael Geary - http://mg.to/
	:See UNLICENSE or http://unlicense.org/ for public domain notice.
"""

from ftclient.ftclient import OAuthFTClient

import csv
def csvToList( csvText ):
	list = []
	reader = csv.reader( csvText.strip().split('\n') )
	head = map(
		lambda t: t.replace( ' ', '_' ),
		reader.next()
	)
	# TODO: is there a more Pythonic way to do this?
	for row in reader:
		r = {}
		for j in range( len(head) ):
			r[ head[j] ] = row[j]
		list.append( r )
	return list


def fixId( id ):
	return str( int( id ) )


def hasCol( cols, name ):
	# There must be a better way to do this
	for col in cols:
		if col['name'] == name:
			return True
	return False


class Client( object ):
	
	def __init__( self, handler ):
		conf = handler.app.config['tipfy.auth.google']
		token = handler.session['google_access_token']
		self.client = OAuthFTClient(
			conf['google_consumer_key'], conf['google_consumer_secret'],
			token['key'], token['secret']
		)
	
	def query( self, query, request_type=None ):
		result = self.client.query( query, request_type )
		return csvToList( result )

