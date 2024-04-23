import { WebSocketAppServer } from './wsserver';
import { AppSettings } from './wsappsettings';

/**
 * WebSocket Client implementation.
 */
export class WebSocketAppClient {

	apiConfig: any;
	self: any;
	clientID: string;

	// the server ref.
	wsServer: WebSocketAppServer;
	appSettings: AppSettings = null;

	// connection is of type WebSocketConnection.
	connection: any;
	// request is of type WebSocketRequest.
	request: any;

	// ativated time stamp.
	activeTimstamp: Date;

	// has been granted access.
	grantedAccess: boolean;
	hasClosed: boolean;
	grantedAccessToken: string;

	// client details.
	uniqueID: string;
	applicationID: string;
	available: boolean;
	broadcast: boolean;
	broadcastAppID: boolean;

	/**
	 * WebSocket Client implementation.
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

		// assign values.
		this.self = this;
		this.wsServer = this.apiConfig.wsServer;
		this.appSettings = this.apiConfig.appSettings;
		this.clientID = this.apiConfig.clientID;
		this.connection = this.apiConfig.connection;
		this.request = this.apiConfig.request;
		this.activeTimstamp = this.apiConfig.activeTimstamp;
		this.grantedAccess = false;
		this.hasClosed = false;

		// this is an internal token using API service.
		this.grantedAccessToken = this.appSettings.AccessToken;

		// local
		let connectionLocal = this.connection;
		let selflocal: WebSocketAppClient = this.self;

		// on message handler.
		this.connection.on('message', function (message) {

			// if text
			if (message.type === 'utf8') {
				selflocal.processTextMessage(connectionLocal, message);
			}
			else if (message.type === 'binary') {
				selflocal.processBinaryMessage(connectionLocal, message);
			}
		});
	}

	/**
	* has the client been granted access.
	* @return {boolean}    True if access granted else false.
	*/
	isGrantedAccess(): boolean {
		return this.grantedAccess;
	}

	/**
	* has the client connection been closed.
	* @return {boolean}    True if connection has closed else false.
	*/
	connectionHasClosed(): boolean {
		return this.hasClosed;
	}

	/**
	* get the connection.
	* @return {boolean}    The connection.
	*/
	getConnection(): any {
		return this.connection;
	}

	/**
	* process close connection.
	* @param {any} reasonCode	The reasonCode.
	* @param {any} description	The description.
	*/
	closeConnection(reasonCode: any, description: any): void {

		this.grantedAccess = false;
		try {
			this.connection.close(reasonCode, description);
			this.hasClosed = true;
		} catch (e) {
			var error = e;
		}
	}

	/**
	* process text message.
	* @param {any} connection	The connection.
	* @param {any} message	The message.
	*/
	processTextMessage(connection: any, message: any): void {

		try {
			//console.log('Received Message: ' + message.utf8Data);
			let jsonMessage = JSON.parse(message.utf8Data);

			// if not granted.
			if (!this.grantedAccess) {

				let continueToValidate = false;

				// to grant all must exist.
				// if unique id found.
				if ((jsonMessage.uniqueID !== null && jsonMessage.uniqueID !== undefined) &&
					(jsonMessage.applicationID !== null && jsonMessage.applicationID !== undefined)) {

					// has text.
					if (jsonMessage.uniqueID !== "" && jsonMessage.applicationID !== "") {

						// exists continue.
						continueToValidate = true;
					}
				}

				// if continue.
				if (continueToValidate) {
					// if a token exists.
					if (jsonMessage.accessToken !== null && jsonMessage.accessToken !== undefined) {
						// if valid access token.
						if (jsonMessage.accessToken === this.grantedAccessToken) {

							// access granted.
							this.grantedAccess = true;
						}

						//TODO
						// validate a generated token.
						// validate a real access token here
						// jsonMessage.accessToken
						var valid = false;

						// if valid.
						if (valid) {
							// access granted.
							this.grantedAccess = true;
						}
					}
				}
			}

			// if granted.
			if (this.grantedAccess) {

				// if unique id found.
				if ((jsonMessage.uniqueID !== null && jsonMessage.uniqueID !== undefined) &&
					(jsonMessage.applicationID !== null && jsonMessage.applicationID !== undefined)) {

					// has text.
					if (jsonMessage.uniqueID !== "" && jsonMessage.applicationID !== "") {

						// assign the client details.
						this.uniqueID = jsonMessage.uniqueID;
						this.applicationID = jsonMessage.applicationID;

						// send message.
						connection.sendUTF(JSON.stringify({
							response: "ok",
							settings: true
						}));
					}
					else {
						// send message.
						connection.sendUTF(JSON.stringify({
							response: "ok",
							settings: false
						}));
					}
				}
				else {
					// send message.
					connection.sendUTF(JSON.stringify({
						response: "ok",
						settings: false
					}));
				}

				// assign contact details.
				if (jsonMessage.available !== null && jsonMessage.available !== undefined) {
					this.available = jsonMessage.available;
				}
				if (jsonMessage.broadcast !== null && jsonMessage.broadcast !== undefined) {
					this.broadcast = jsonMessage.broadcast;
				}
				if (jsonMessage.broadcastAppID !== null && jsonMessage.broadcastAppID !== undefined) {
					this.broadcastAppID = jsonMessage.broadcastAppID;
				}

				// sending to a contact.
				// find the contact.
				// if unique id found.
				if ((jsonMessage.contactUniqueID !== null && jsonMessage.contactUniqueID !== undefined) &&
					(jsonMessage.contactApplicationID !== null && jsonMessage.contactApplicationID !== undefined)) {

					// has text.
					if (jsonMessage.contactUniqueID !== "" && jsonMessage.contactApplicationID !== "") {

						// get the client.
						let contacts: Array<WebSocketAppClient> =
							this.wsServer.findWebSocketClient(jsonMessage.contactUniqueID, jsonMessage.contactApplicationID);

						// if found.
						if (contacts !== null && contacts !== undefined) {
							if (contacts.length > 0) {

								// get the first contact found.
								let contact: WebSocketAppClient = contacts[0];

								// if available.
								if (contact.available) {

									// copy the complate current request.
									let jsonMessageCurrent = Object.assign({}, jsonMessage, {});
									jsonMessageCurrent.contactUniqueID = this.uniqueID;
									jsonMessageCurrent.contactApplicationID = this.applicationID;
									jsonMessageCurrent.response = "ok";
									jsonMessageCurrent.available = true;

									// send a message.
									contact.connection.sendUTF(JSON.stringify(jsonMessageCurrent));
								}
								else {
									// send message.
									connection.sendUTF(JSON.stringify({
										contactUniqueID: this.uniqueID,
										contactApplicationID: this.applicationID,
										response: "ok",
										available: false
									}));
								}
							}
							else {
								// send message.
								connection.sendUTF(JSON.stringify({
									response: "error",
									error: "No contacts, searching"
								}));
							}
						}
						else {
							// send message.
							connection.sendUTF(JSON.stringify({
								response: "error",
								error: "No contacts, unable to find contact."
							}));
						}
					}
				}
			}
			else {
				// denid access.
				// send message.
				connection.sendUTF(JSON.stringify({
					response: "error",
					error: "Access Denied"
				}));
			}
		} catch (e) {
			var error = e;
			// send message.
			connection.sendUTF(JSON.stringify({
				response: "error",
				error: "Unable to read request"
			}));
		}
	}

	/**
	* process binary message.
	* @param {any} connection	The connection.
	* @param {any} message	The message.
	*/
	processBinaryMessage(connection: any, message: any): void {

		//console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
		//connection.sendBytes(message.binaryData);
	}
}