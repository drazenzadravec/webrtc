const fs = require('fs');
const WebSocketServer = require('websocket').server;

import http = require('http');
import { WebSocketAppServer } from './wsserver';
import { AppSettings } from './wsappsettings';

// load the settings.
var appSettingsJson = fs.readFileSync('wsappsettings.json');
const appSettings: AppSettings = JSON.parse(appSettingsJson) as AppSettings;

// set ports
const portws = process.env.port || appSettings.WebSocketServerPort;;

// http websocket server.
var wsHttpServer = http.createServer(function (req, res) {

	// all other requests invalid.
	res.writeHead(404);
	res.end();

}).listen(portws);

// the Websocket server.
var wsServer = new WebSocketServer({

	// attach to the ws http server
	httpServer: wsHttpServer,

	// You should not use autoAcceptConnections for production
	// applications, as it defeats all standard cross-origin protection
	// facilities built into the protocol and the browser.  You should
	// *always* verify the connection's origin and decide whether or not
	// to accept it.
	autoAcceptConnections: false
});

// create the websocket app server.
var webSocketAppServer = new WebSocketAppServer({
	webSocketServer: wsServer,
	appSettings: appSettings
});
