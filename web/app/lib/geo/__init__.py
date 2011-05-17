# -*- coding: utf-8 -*-
"""
	geo/__init__.py
	~~~~~~~~~~~~~~~~~~~~
	:By Michael Geary - http://mg.to/
	:See UNLICENSE or http://unlicense.org/ for public domain notice.
"""

#import xml.etree.ElementTree as ET
import elementtree.ElementTree as ET

#ET._namespace_map['http://www.opengis.net/kml/2.2'] = 'kml'
ET.register_namespace( 'kml', 'http://www.opengis.net/kml/2.2' )

class Kml( object ):
	
	def __init__( self, kml ):
		'''	Parse a KML file.
		'''
		self.kml = ET.parse( kml )
		self.ns = self.kml.getroot().tag[1:-4]
	
	def toGeo( self ):
		'''	Return a GeoJSON-compatible dict with each KML folder
			converted to a Feature with the name of that folder,
			and each Feature containing a single MultiPolygon with
			either the MultiGeometry or Polygon from the KML.
			TODO: the bbox doesn't work if you cross the
			180 meridian, but that's OK for the moment.
			TODO: use dict/list comprenhensions for some of the loops.
		'''
		features = []
		for folder in self.findall( self.kml, '{}Document/{}Folder' ):
			place = self.find( folder, '{}Placemark' )
			multi = self.find( place, '{}MultiGeometry' )
			if multi is None: multi = place
			self.bbox = [ 180.0, 90.0, -180.0, -90.0 ]
			features.append({
				'type': 'Feature',
				'properties': {
					'name': self.findtext( folder, '{}name' )
				},
				'bbox': self.bbox,
				'geometry': self.multiPolygonToGeo( multi ),
			})
		return {
			'type': 'FeatureCollection',
			'features': features,
		}
	
	def multiPolygonToGeo( self, multi ):
		m = []
		for poly in self.findall( multi, '{}Polygon' ):
			p = self.polygonToGeo( poly )
			m.append( p )
		return {
			'type': 'MultiPolygon',
			'coordinates': m,
		}
	
	def polygonToGeo( self, poly ):
		p = []
		outer = self.find( poly, '{}outerBoundaryIs' )
		p.append( self.boundaryToGeo(outer) )
		for inner in self.findall( poly, '{}innerBoundaryIs' ):
			p.append( self.boundaryToGeo(inner) )
		return p
	
	def boundaryToGeo( self, boundary ):
		ring = []
		text = self.findtext( boundary, '{}LinearRing/{}coordinates' )
		for coord in text.strip().split():
			c = []
			for n in coord.split(','):
				c.append( float(n) )
			self.extendbox( c )
			ring.append( c )
		return ring
	
	def extendbox( self, c ):
		box = self.bbox
		box[0] = min( box[0], c[0] )
		box[1] = min( box[1], c[1] )
		box[2] = max( box[2], c[0] )
		box[3] = max( box[3], c[1] )
	
	def find( self, et, sel ):
		return et.find( self.fixsel(sel) )
	
	def findall( self, et, sel ):
		return et.findall( self.fixsel(sel) )
	
	def findtext( self, et, sel ):
		return et.findtext( self.fixsel(sel) )
	
	def fixsel( self, sel ):
		return sel.replace( '{}', '{%s}' % self.ns )
