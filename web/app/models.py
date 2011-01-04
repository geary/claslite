# -*- coding: utf-8 -*-
"""
	models
	~~~~~~~~~~~~~~~~~~~~

	CLASlite data models

	:By Michael Geary - http://mg.to/
	:See UNLICENSE or http://unlicense.org/ for public domain notice.
"""

from google.appengine.ext import db


class Project( db.Model ):
	owner = db.UserProperty()
	created = db.DateTimeProperty( auto_now_add=True )
	updated = db.DateTimeProperty( auto_now=True )
	name = db.StringProperty()
	description = db.TextProperty()
	settings = db.TextProperty()

