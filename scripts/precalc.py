# -*- coding: utf-8 -*-
'''
	Earth Engine precalculator for CLASlite
	Requires Python 2.6+
	
	Public Domain where allowed, otherwise:
	Copyright 2010 Michael Geary - http://mg.to/
	Use under MIT, GPL, or any Open Source license:
	http://www.opensource.org/licenses/
'''

import cgi, json, os, sys, time, urllib2

sys.path.append( os.path.abspath('../web/app') )
import private
base = private.private['earth-engine-api']
auth = private.private['earth-engine-auth']

sat = 'LANDSAT/L7_L1T'
#bbox = '-61.6,-11.4,-60.8,-10.6'
bbox = '-64.0,-13.0,-60.0,-9.0'

def fetch( api ):
	req = urllib2.Request(
		url = base + api,
		headers = { 'Authorization': 'GoogleLogin auth=' + auth }
	)
	try:
		f = urllib2.urlopen( req, None, 600 )
		data = f.read()
		f.close()
		return json.loads( data )
	except urllib2.HTTPError, error:
		return error.read()

def listImages( sat, bbox ):
	return fetch( 'list?id=%s&bbox=%s' %( sat, bbox ) )['data']

def calcVCF( id ):
	return fetch( vcfAPI(id) )

def vcfAPI( id ):
	return 'value?image={"creator":"CLASLITE/VCFAdjustedImage","args":[{"creator":"CLASLITE/AutoMCU","args":["%s",{"creator":"CLASLITE/Reflectance","args":[{"creator":"CLASLITE/Calibrate","args":["%s"]}]}]},"MOD44B_C4_TREE_2000"]}&fields=vcf_adjustment' %( id, id )

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
	adjustment = vcf['data']['properties']['vcf_adjustment']
	forest = adjustment['forest_pixel_count']
	valid = adjustment['valid_pixel_count']
	if valid > 0:
		percent = forest * 100 / valid
	else:
		percent = 0
	print '%d seconds, %d%% forest' %( t, percent )

if __name__ == "__main__":
	main()
