import { WebSocketAppClient } from './wsclient';
import { AppSettings } from './wsappsettings';

/**
 * WebSocket Server implementation.
 */
export class WebSocketAppServer {

	apiConfig: any;
	self: any;

	activeControl: any;
	activeControlInterval: number;
	activeControlStarted: boolean;

	webSocketServer: any;
	webSocketClients: Array<WebSocketAppClient>;
	webSocketClientTimeoutConnect: number;
	webSocketClientTimeoutExpiry: number;

	appSettings: AppSettings = null;

	/**
	 * WebSocket Server implementation.
	 *
	 * @param {Object}   apiOptions  A collection of options.
	 *
	 * @example
	 *  apiOptions = {
	 *		debug: true
	 *	};
	 */
	constructor(public apiOptions: any) {

		let itemApi;

		// ac api client options.
		let optionsApi = apiOptions || {};
		let apiConfig = this.apiConfig = {
			debug: true
		};

		// set our config from options
		for (itemApi in optionsApi) {
			if (optionsApi.hasOwnProperty(itemApi)) {
				this.apiConfig[itemApi] = optionsApi[itemApi];
			}
		}

		this.appSettings = this.apiConfig.appSettings;

		// assign values.
		this.self = this;
		this.webSocketClients = [];
		this.webSocketServer = this.apiConfig.webSocketServer;
		this.webSocketClientTimeoutConnect = (this.appSettings.WebSocketClientTimeoutConnect * 1000); // seconds.
		this.webSocketClientTimeoutExpiry = (this.appSettings.WebSocketClientTimeoutExpiry * 1000); // seconds.

		this.activeControl = null;
		this.activeControlInterval = (this.appSettings.ActiveControlInterval * 1000); // seconds.
		this.activeControlStarted = false;

		// local
		let webSocketClientsLocal = this.webSocketClients;
		let selflocal: WebSocketAppServer = this.self;

		// on request.
		this.webSocketServer.on('request', function (request) {

			// request is of type WebSocketRequest.
			// if not from trusted origin.
			if (!selflocal.originIsAllowed(request.origin)) {

				// Make sure we only accept requests from an allowed origin
				request.reject();
				return;
			}

			// accept new connection. connection is of type WebSocketConnection.
			var connection = request.accept(null, request.origin);

			// if valid.
			if (connection !== null && connection !== undefined) {

				// create a random client id.
				let clientid = this.generateRandomString(32);
				let activeTimstamp = new Date();

				// if first client start timer.
				if (webSocketClientsLocal.length <= 1 || !selflocal.activeControlStarted) {
					// start timer.
					selflocal.startInterval(selflocal);
				}

				// add the connection to the list.
				webSocketClientsLocal.push(new WebSocketAppClient(
					{
						wsServer: selflocal,
						appSettings: selflocal.appSettings,
						clientID: clientid,
						request: request,
						connection: connection,
						activeTimstamp: activeTimstamp
					}));
			}

			// on close connection.
			connection.on('close', function (reasonCode, description) {
				selflocal.processClose(connection, reasonCode, description);
			});
		});
	}

	/**
	* origin Is Allowed.
	* @param {any} origin	The origin.
	* @return {boolean}    The result.
	*/
	originIsAllowed(origin: any): boolean {

		// put logic here to detect whether the specified origin is allowed.
		return true;
	}

	/**
	* process close connection.
	* @param {any} connection	The connection.
	* @param {any} reasonCode	The reasonCode.
	* @param {any} description	The description.
	*/
	processClose(connection: any, reasonCode: any, description: any): void {

		//console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
		// remove from collection.
		let clients: Array<WebSocketAppClient> = this.getWebSocketClient(connection);

		// if found.
		if (clients.length > 0) {

			// get the client index.
			let index = this.webSocketClients.indexOf(clients[0]);
			if (index !== -1) {
				this.webSocketClients.splice(index, 1);
			}
		}

		// if no more clients stop the timer.
		if (this.webSocketClients.length <= 0 || this.activeControlStarted) {

			// stop timer.
			this.stopInterval();
		}
	}

	/**
	* start the active control timer.
	* @param {WebSocketAppServer} selflocal	The server reference.
	*/
	startInterval(selflocal: WebSocketAppServer): void {

		try {
			// not still defined. 
			if (this.activeControl === null) {

				// clear the interval
				this.activeControl = setInterval(this.activeControlHandler, this.activeControlInterval, selflocal);
				this.activeControlStarted = true;
			}
		} catch (e) {
			// log the error.
			var error = e;
		}
	}

	/**
	* stop the active control timer.
	*/
	stopInterval(): void {

		try {
			// still defined. 
			if (this.activeControl !== null) {

				// clear the interval
				clearInterval(this.activeControl);
				this.activeControl = null;
				this.activeControlStarted = false;
			}
		} catch (e) {
			// log the error.
			var error = e;
		}
	}

	/**
	* active control timer function handler.
	* @param {WebSocketAppServer} selflocal	The server reference.
	*/
	activeControlHandler(selflocal: WebSocketAppServer): void {
		// look for clients to close.
		try {
			// current time.
			let timeNow = new Date();
			let timeTimeoutConnect = new Date(timeNow.getTime() - selflocal.webSocketClientTimeoutConnect);
			let timeTimeoutExpiry = new Date(timeNow.getTime() - selflocal.webSocketClientTimeoutExpiry);

			// Get all clients.
			selflocal.getWebSocketClients().forEach(function (client) {

				// is access not granted.
				if (!client.isGrantedAccess()) {

					// look for TimeoutConnect.
					if ((client.activeTimstamp < timeTimeoutConnect)) {

						// if did not close.
						if (!client.connectionHasClosed()) {
							// close the connection.
							client.closeConnection(1000, "Normal connection closure");
						}
					}
				}
				else {
					// access granted.
					// look for TimeoutExpiry
					if ((client.activeTimstamp < timeTimeoutExpiry)) {

						// if did not close.
						if (!client.connectionHasClosed()) {
							// close the connection.
							client.closeConnection(1000, "Normal connection closure");
						}
					}
				}
			});
		} catch (e) {
			// log the error.
			var error = e;
			console.error(error);
		}
	}

	/**
	* get all websocket clients.
	* @return {Array<WebSocketAppClient>}    The client list.
	*/
	getWebSocketClients(): Array<WebSocketAppClient> {

		// return clients.
		return this.webSocketClients.filter(function (client) {

			// Return the client.
			return true;
		});
	}

	/**
	* get websocket client.
	* @param {any} connection	The connection.
	* @return {Array<WebSocketAppClient>}    The client list.
	*/
	getWebSocketClient(connection: any): Array<WebSocketAppClient> {

		// return clients.
		return this.webSocketClients.filter(function (client) {

			// if the connection match.
			if (client.getConnection() === connection) {
				// Return the client.
				return true;
			}
		});
	}

	/**
	* find websocket client.
	* @param {string} uniqueID	The uniqueID.
	* @param {string} applicationID	The applicationID.
	* @return {Array<WebSocketAppClient>}    The client list.
	*/
	findWebSocketClient(uniqueID: string, applicationID: string): Array<WebSocketAppClient> {

		// return clients.
		return this.webSocketClients.filter(function (client) {

			// if the connection match.
			if (client.uniqueID === uniqueID && client.applicationID === applicationID) {
				// Return the client.
				return true;
			}
		});
	}

	/**
	* generate a random string.
	* @param {number} size	The random size.
	* @return {string}    The result.
	*/
	generateRandomString(size: number = 32): string {

		let outString: string = '';
		let inOptions: string = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
		for (let i = 0; i < size; i++) {
			outString += inOptions.charAt(Math.floor(Math.random() * inOptions.length));
		}

		// return the random string.
		return outString;
	}
}