// apiloader-claslite.googlecode.com.js

// To run this app in a different domain, copy this file
// to a new file with a name like this:
// apiloader-yourhostname.js
// apiloader-yourhostname-yourportnumber.js
// apiloader-www.example.com.js
// apiloader-www.example.com-exampleportnumber.js
//
// Then edit the new file and change the key value below to your
// Google API key for your host/domain name (and port number
// if you have one). Get the API key here:
// http://code.google.com/apis/maps/signup.html

(function() {
	
	var key = 'ABQIAAAAgNQJhbWKFHRJJiHCXotPZxRitwddhLxv0TgLCKvVYEagCYiAGhRr6IqGqrV02g7C13GR7TQ54qWK_g';
	
	document.write(
		'<script type="text/javascript" src="http://www.google.com/jsapi?key=', key, '">',
		'<\/script>'
	);

}());