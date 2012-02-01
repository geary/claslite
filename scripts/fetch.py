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

#api = 'list?id=LANDSAT/L7_L1T&num=5&bbox=-62,-12,-61,-11'
#api = 'list?id=LANDSAT/L7_L1T&bbox=-61.6,-11.4,-60.8,-10.6'
#api = 'list?id=LANDSAT/L7_L1T&bbox=-74,-13,-60,-8'

#api = 'info?id=L7_L1T/LE72300681999227EDC00'

image = [
	"CLASLITE/VCFAdjustedImage",
	[
		"CLASLITE/AutoMCU",
		"LANDSAT/L7_L1T/LE72300681999227EDC00",
		[
			"CLASLITE/Reflectance",
			[
				"CLASLITE/Calibrate",
				"LANDSAT/L7_L1T/LE72300681999227EDC00"
			]
		]
	],
	"MOD44B_C4_TREE_2000"
]

image = {
	"creator": "CLASLITE/VCFAdjustedImage",
	"args": [
		{
			"creator": "CLASLITE/AutoMCU",
			"args": [
				"LANDSAT/L7_L1T/LE72300681999227EDC00",
				{
					"creator": "CLASLITE/Reflectance",
					"args": [
						{
							"creator": "CLASLITE/Calibrate",
							"args": [
								"LANDSAT/L7_L1T/LE72300681999227EDC00"
							]
						}
					]
				}
			]
		},
		"MOD44B_C4_TREE_2000"
	]
}

api = 'value?image=%s&fields=vcf_adjustment' % json.dumps(image)

api = 'value?image={"creator":"CLASLITE/VCFAdjustedImage","args":[{"creator":"CLASLITE/AutoMCU","args":["LANDSAT/L7_L1T/LE72300681999227EDC00",{"creator":"CLASLITE/Reflectance","args":[{"creator":"CLASLITE/Calibrate","args":["LANDSAT/L7_L1T/LE72300681999227EDC00"]}]}]},"MOD44B_C4_TREE_2000"]}&fields=vcf_adjustment'

#api = 'value?image=["CLASLITE/VCFAdjustedImage",["CLASLITE/AutoMCU","LANDSAT/L7_L1T/LE72300681999227EDC00",["CLASLITE/Reflectance",["CLASLITE/Calibrate","LANDSAT/L7_L1T/LE72300681999227EDC00"]]],"MOD44B_C4_TREE_2000"]&fields=vcf_adjustment'

url = base + api

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
	
