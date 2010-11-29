# -*- coding: utf-8 -*-
'''
	Earth Engine fetch test
	Requires Python 2.6+
'''

import cgi, json, os, sys, urllib2

sys.path.append( os.path.abspath('../web/app') )
import private
base = private.private['earth-engine-api']
auth = private.private['earth-engine-auth']

#api = 'list?id=MOD09GA&region=-61,-12,-62,-11&limit=5'
api = 'list?limit=5&id=MOD09GA&region=-61,-12,-62,-11'

url = base + api
url = cgi.escape( url )

print url

req = urllib2.Request(
	url = url,
	headers = {
		'Authorization': 'GoogleLogin auth=' + auth
	}
)

try:
	f = urllib2.urlopen( req, None, 900 )
	data = f.read()
	f.close()
	j = json.loads( data )
	data = json.dumps( j, indent=4 )
	print data
except urllib2.HTTPError, error:
	print error.read()
	
