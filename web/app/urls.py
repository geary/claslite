# -*- coding: utf-8 -*-
"""URL definitions."""

from tipfy import Rule

proxybase = '/ee/'  # TODO: use get_config( 'proxy', 'base' ) or such

rules = [
	Rule('/', name='hello-world', handler='hello_world.handlers.HelloWorldHandler'),
	Rule('/pretty', name='hello-world-pretty', handler='hello_world.handlers.PrettyHelloWorldHandler'),
	
	Rule( proxybase + '<path:path>', name='proxy', handler='proxy.handlers.ProxyHandler' ),
]
