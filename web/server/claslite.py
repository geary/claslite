from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app

class JsonHandler( webapp.RequestHandler ):
	def get( self, dump, debug ):
		self.response.headers['Content-Type'] = 'application/json'
		self.response.out.write( '{ "foo": "bar" }' )

application = webapp.WSGIApplication([
	( r'/\.json', JsonHandler )
], debug = True )

def main():
	run_wsgi_app( application )

if __name__ == '__main__':
	main()
