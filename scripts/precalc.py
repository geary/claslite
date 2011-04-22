# -*- coding: utf-8 -*-
'''
	Earth Engine precalculator for CLASlite
	Requires Python 2.6+
	
	By Michael Geary - http://mg.to/
	See UNLICENSE or http://unlicense.org/ for public domain notice.
'''

try:
	import json
except:
	import simplejson as json

import cgi, os, sys, time, urllib2

sys.path.append( os.path.abspath('../web/app') )
import private
base = private.config['earth-engine']['api']
auth = private.config['earth-engine']['auth']

sat = ( 'LANDSAT/L7_L1T', 'L7' )
#bbox = '-61.6,-11.4,-60.8,-10.6'
bbox = '-64.0,-13.0,-60.0,-9.0'
#bbox = '-61.795884,-11.619288,-61.000521,-10.987566' # cacoal
#bbox = '-72.399051,-13.354849,-68.677986,-9.863813' # madre

def fetch( api ):
	req = urllib2.Request(
		url = base + api,
		headers = { 'Authorization': 'GoogleLogin auth=' + auth }
	)
	try:
		f = urllib2.urlopen( req, None )
		data = f.read()
		f.close()
		return json.loads( data )
	except urllib2.HTTPError, error:
		return error.read()

def listImages( sat, bbox ):
	return fetch( 'list?id=%s&bbox=%s' %( sat[0], bbox ) )['data']

def calcVCF( id ):
	return fetch( vcfAPI(id) )

def vcfAPI( id ):
	return 'value?image={"creator":"CLASLITE/com.google.earthengine.third_party.claslite.VCFAdjustedImage","args":[{"creator":"CLASLITE/com.google.earthengine.third_party.claslite.AutoMCU","args":["%s",{"creator":"CLASLITE/com.google.earthengine.third_party.claslite.Reflectance","args":[{"creator":"CLASLITE/com.google.earthengine.third_party.claslite.Calibrate","args":["%s"]}]},"%s"]},"MOD44B_C4_TREE_2000"]}&fields=vcf_adjustment' %( id, id, sat[1] )

def main():
	images = listImages( sat, bbox )
	count = len(images)
	n = 0
	for image in images:
		id = image['id']
		n += 1
		print 'Loading %d/%d: %s' %( n, count, id )
		t = time.time()
		vcf = calcVCF( id )
		t = time.time() - t
		report( vcf, t )

def report( vcf, t ):
	if 'data' not in vcf:
		print '%d seconds, ERROR:\n%s' %( t, vcf )
		return
	values = vcf['data']['properties']['vcf_adjustment']['values']
	forest = values['forest_pixel_count']
	valid = values['valid_pixel_count']
	if valid > 0:
		percent = forest * 100 / valid
	else:
		percent = 0
	print '%d seconds, %d%% forest' %( t, percent )

if __name__ == "__main__":
	main()
