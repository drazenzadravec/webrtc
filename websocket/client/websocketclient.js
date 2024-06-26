"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketClient = void 0;
/**
 * WebSocketClient class used to signal other contacted
 * clients, this signalling class uses WebSockets
 * for the signalling transport.
 */
class WebSocketClient {
    signalOptions;
    // Global.
    webSocket;
    closed;
    config;
    signallingEventOpen;
    signallingEventError;
    signallingEventClose;
    signallingEventErrorDetails;
    signallingEventSettings;
    signallingEventAvailable;
    signallingEventMessage;
    signallingEventState;
    signallingEventDetails;
    /**
     * WebSocketClient prototype.
     *
     * @param {Object}   signalOptions  A collection of options.
     *
     * @example
     *  options = {
     *      signallingURL: "wss://127.0.0.1:443"
     *  }
     */
    constructor(signalOptions) {
        this.signalOptions = signalOptions;
        // local.
        let self = this;
        let item;
        // Set options.
        let options = signalOptions || {};
        // Configuration.
        let config = this.config = {
            signallingURL: "wss://127.0.0.1:443"
        };
        // Set options, override existing.
        for (item in options) {
            if (options.hasOwnProperty(item)) {
                config[item] = options[item];
            }
        }
        this.closed = true;
        this.webSocket = null;
    }
    /**
     * Subscribe to the on open event.
     *
     * @param {function}	event callback(message, signal class, data).
     */
    onOpen(event) {
        // assign the event.
        this.signallingEventOpen = event;
    }
    /**
     * Subscribe to the on error event.
     *
     * @param {function}	event callback(message, signal class, data).
     */
    onError(event) {
        // assign the event.
        this.signallingEventError = event;
    }
    /**
     * Subscribe to the on close event.
     *
     * @param {function}	event callback(message, signal class, data).
     */
    onClose(event) {
        // assign the event.
        this.signallingEventClose = event;
    }
    /**
     * Subscribe to the on error details event.
     *
     * @param {function}	event callback(message, signal class, data).
     */
    onErrorDetails(event) {
        // assign the event.
        this.signallingEventErrorDetails = event;
    }
    /**
     * Subscribe to the on settings event.
     *
     * @param {function}	event callback(message, signal class, data).
     */
    onSettings(event) {
        // assign the event.
        this.signallingEventSettings = event;
    }
    /**
     * Subscribe to the on available event.
     *
     * @param {function}	event callback(message, signal class, data).
     */
    onAvailable(event) {
        // assign the event.
        this.signallingEventAvailable = event;
    }
    /**
     * Subscribe to the on message event.
     *
     * @param {function}	event callback(message, signal class, data).
     */
    onMessage(event) {
        // assign the event.
        this.signallingEventMessage = event;
    }
    /**
     * Subscribe to the on state event.
     *
     * @param {function}	event callback(message, signal class, data).
     */
    onState(event) {
        // assign the event.
        this.signallingEventState = event;
    }
    /**
     * Subscribe to the on client details event.
     *
     * @param {function}	event callback(message, signal class, data).
     */
    onDetails(event) {
        // assign the event.
        this.signallingEventDetails = event;
    }
    /**
     * Change this client details.
     *
     * @param {string}      uniqueID        The client unique id.
     * @param {string}      applicationID   The client application id.
     * @param {boolean}     available       True if this client is avaliable for contact; else false.
     * @param {boolean}     broadcast       True if this client allows the unique id to be broadcast; else false.
     * @param {boolean}     broadcastAppID  True if this client allows the application id to be broadcast; else false.
     * @param {string}      accessToken     The access token.
     */
    changeClientSettings(uniqueID, applicationID, available, broadcast, broadcastAppID, accessToken) {
        // If the socket is not open.
        if (this.webSocket.readyState !== this.webSocket.OPEN)
            return;
        // Send to the signalling provider.
        this.webSocket.send(JSON.stringify({
            "uniqueID": uniqueID,
            "applicationID": applicationID,
            "available": available,
            "broadcast": broadcast,
            "broadcastAppID": broadcastAppID,
            "accessToken": accessToken
        }));
    }
    /**
     * Send the current state of the client to the contact.
     *
     * @param {string}  contactUniqueID         The contact unique id.
     * @param {string}  contactApplicationID    The contact application id.
     * @param {string}  state                   The client state.
     */
    sendClientState(contactUniqueID, contactApplicationID, state) {
        // If the socket is not open.
        if (this.webSocket.readyState !== this.webSocket.OPEN)
            return;
        // Send to the signalling provider.
        this.webSocket.send(JSON.stringify({
            "contactUniqueID": contactUniqueID,
            "contactApplicationID": contactApplicationID,
            "clientState": true,
            "state": state
        }));
    }
    /**
     * Send the current details of the client to the contact.
     *
     * @param {string}  contactUniqueID         The contact unique id.
     * @param {string}  contactApplicationID    The contact application id.
     * @param {string}  details                 The client details.
     */
    sendClientDetails(contactUniqueID, contactApplicationID, details) {
        // If the socket is not open.
        if (this.webSocket.readyState !== this.webSocket.OPEN)
            return;
        // Send to the signalling provider.
        this.webSocket.send(JSON.stringify({
            "contactUniqueID": contactUniqueID,
            "contactApplicationID": contactApplicationID,
            "clientDetails": true,
            "details": details
        }));
    }
    /**
     * Send a message to this contact.
     *
     * @param {string}  contactUniqueID         The contact unique id.
     * @param {string}  contactApplicationID    The contact application id.
     * @param {string}  message                 The message to send.
     */
    sendMessage(contactUniqueID, contactApplicationID, message) {
        // If the socket is not open.
        if (this.webSocket.readyState !== this.webSocket.OPEN)
            return;
        // Send to the signalling provider.
        this.webSocket.send(JSON.stringify({
            "contactUniqueID": contactUniqueID,
            "contactApplicationID": contactApplicationID,
            "contactMessage": message
        }));
    }
    /**
     * Send a request asking if the contact is available.
     *
     * @param {string}  contactUniqueID         The contact unique id.
     * @param {string}  contactApplicationID    The contact application id.
     */
    contactAvailable(contactUniqueID, contactApplicationID) {
        // If the socket is not open.
        if (this.webSocket.readyState !== this.webSocket.OPEN)
            return;
        // Send to the signalling provider.
        this.webSocket.send(JSON.stringify({
            "contactUniqueID": contactUniqueID,
            "contactApplicationID": contactApplicationID,
            "contactAvailable": true
        }));
    }
    /**
     * Send data to this contact.
     *
     * @param {string}  contactUniqueID         The contact unique id.
     * @param {string}  contactApplicationID    The contact application id.
     * @param {object}  data                 The data to send.
     */
    sendData(contactUniqueID, contactApplicationID, data) {
        // If the socket is not open.
        if (this.webSocket.readyState !== this.webSocket.OPEN)
            return;
        // Send to the signalling provider.
        this.webSocket.send(JSON.stringify({
            "contactUniqueID": contactUniqueID,
            "contactApplicationID": contactApplicationID,
            "data": data
        }));
    }
    /**
     * Open the current signalling connection.
    */
    open() {
        if (!this.closed)
            return;
        this.closed = false;
        let localThis = this;
        try {
            // Create a new WebSocket client for signalling.
            this.webSocket = new WebSocket(this.config.signallingURL);
            // If created.
            if (this.webSocket) {
                // Open new connection handler.
                this.webSocket.onopen = function (openEvent) {
                    // Send open connection alert.
                    localThis.signallingEventOpen("Signalling has opened.", localThis, openEvent);
                };
                // Error handler.
                this.webSocket.onerror = function (errorEvent) {
                    // Send error connection alert.
                    localThis.signallingEventError("Signalling has encountered and unknown error.", localThis, errorEvent);
                };
                // Connection closed handler.
                this.webSocket.onclose = function (closeEvent) {
                    // Send close connection alert.
                    localThis.signallingEventClose("Signalling has closed.", localThis, closeEvent);
                };
                // Incomming messsage handler.
                this.webSocket.onmessage = function (messageEvent) {
                    let signal = null;
                    // Get the signl from the WebSocket.
                    signal = JSON.parse(messageEvent.data);
                    // If a valid response.
                    if (signal.response) {
                        // If error.
                        if (signal.error) {
                            // Get the error message.
                            localThis.signallingEventErrorDetails("Signalling has encountered an error.", localThis, signal.error);
                        }
                        else {
                            // If settings have been applied.
                            if (signal.settings && signal.settings === true) {
                                // The client settings.
                                localThis.signallingEventSettings("Signalling settings have been applied.", localThis, signal.settings);
                            }
                            else if (signal.contactAvailable) {
                                // Get the contact details.
                                let uniqueID = signal.contactUniqueID;
                                let applicationID = signal.contactApplicationID;
                                // Details.
                                let details = {
                                    contactUniqueID: uniqueID,
                                    contactApplicationID: applicationID,
                                    contactAvailable: signal.contactAvailable
                                };
                                // Send signal.
                                localThis.signallingEventAvailable("Signalling contact available.", localThis, details);
                            }
                            else if (signal.contactMessage) {
                                // A message from a contact.
                                // Get the contact details.
                                let uniqueID = signal.contactUniqueID;
                                let applicationID = signal.contactApplicationID;
                                // Details.
                                let details = {
                                    contactUniqueID: uniqueID,
                                    contactApplicationID: applicationID,
                                    contactMessage: signal.contactMessage
                                };
                                // Send message.
                                localThis.signallingEventMessage("Signalling contact message.", localThis, details);
                            }
                            else if (signal.clientState) {
                                // A message from a contact.
                                // Get the contact details.
                                let uniqueID = signal.contactUniqueID;
                                let applicationID = signal.contactApplicationID;
                                // Details.
                                let details = {
                                    contactUniqueID: uniqueID,
                                    contactApplicationID: applicationID,
                                    contactState: signal.state
                                };
                                // Send message.
                                localThis.signallingEventState("Signalling contact state.", localThis, details);
                            }
                            else if (signal.clientDetails) {
                                // A message from a contact.
                                // Get the contact details.
                                let uniqueID = signal.contactUniqueID;
                                let applicationID = signal.contactApplicationID;
                                // Details.
                                let details = {
                                    contactUniqueID: uniqueID,
                                    contactApplicationID: applicationID,
                                    clientDetails: signal.details
                                };
                                // Send message.
                                localThis.signallingEventDetails("Signalling contact details.", localThis, details);
                            }
                            else {
                                // A message from a contact.
                                // Get the contact details.
                                let uniqueID = signal.contactUniqueID;
                                let applicationID = signal.contactApplicationID;
                                // Details.
                                let details = {
                                    contactUniqueID: uniqueID,
                                    contactApplicationID: applicationID,
                                    data: signal
                                };
                                // Send message.
                                localThis.signallingEventMessage("Signalling general contact message.", localThis, details);
                            }
                        }
                    }
                    else {
                        // Unknown error from the WebSocket.
                        localThis.signallingEventErrorDetails("Signalling has encountered an unknown error.", localThis, null);
                    }
                };
            }
            ;
        }
        catch (e) {
            // Log the error.
            this.signallingEventErrorDetails("Error opening signalling", this, e.message);
        }
    }
    /**
     * Close the current signalling connection.
    */
    close() {
        if (this.closed)
            return;
        this.closed = true;
        // Close the WebSocket connection.
        if (this.webSocket) {
            // If the socket is not open.
            if (this.webSocket.readyState !== this.webSocket.OPEN)
                return;
            try {
                // Close.
                this.webSocket.close();
                this.webSocket = null;
            }
            catch (e) {
                // Log the error.
                this.signallingEventErrorDetails("Error closing signalling", this, e.message);
            }
        }
    }
}
exports.WebSocketClient = WebSocketClient;
