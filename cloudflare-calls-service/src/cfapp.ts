const fs = require('fs');

import http = require('http');
import { ApplicationServer } from './cfserver';
import { AppSettings } from './cfappsettings';

// load the settings.
var appSettingsJson = fs.readFileSync('cfappsettings.json');
const appSettings: AppSettings = JSON.parse(appSettingsJson) as AppSettings;

// set ports
const port = process.env.port || appSettings.WebApplicationServerPort;

// create application server.
var appServer = new ApplicationServer({ appSettings: appSettings });

// http server.
var httpServer1 = http.createServer(async function (req, res) {

	// application server.
	await appServer.processRequestAsync(req, res);

}).listen(port);