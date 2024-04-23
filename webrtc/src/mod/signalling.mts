import * as util from './common.mjs';

/**
 * Signalling interface used to signal other contacted
 * clients, this signalling interface uses WebSockets
 * for the signalling transport.
 */
export interface ISignalling {

    /**
    * subscribe to the signalling event handler.
    * @param {function}	event callback(eventName, eventDetails, this object, event).
    */
    onSignallingEventHandler(event: (eventName: string, eventDetails: string, object: Signalling, event: any) => void): void;

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
    changeClientSettings(uniqueID: string, applicationID: string, available: boolean, broadcast: boolean, broadcastAppID: boolean, accessToken: string): void;

    /**
     * Send the current state of the client to the contact.
     * 
     * @param {string}  contactUniqueID         The contact unique id.
     * @param {string}  contactApplicationID    The contact application id.
     * @param {string}  state                   The client state.
     */
    sendClientState(contactUniqueID: string, contactApplicationID: string, state: string): void;

    /**
     * Send the current details of the client to the contact.
     * 
     * @param {string}  contactUniqueID         The contact unique id.
     * @param {string}  contactApplicationID    The contact application id.
     * @param {string}  details                 The client details.
     */
    sendClientDetails(contactUniqueID: string, contactApplicationID: string, details: string): void;

    /**
     * Send a message to this contact.
     * 
     * @param {string}  contactUniqueID         The contact unique id.
     * @param {string}  contactApplicationID    The contact application id.
     * @param {string}  message                 The message to send.
     */
    sendMessage(contactUniqueID: string, contactApplicationID: string, message: string): void;

    /**
     * Send ICE candidate details to this contact.
     * 
     * @param {string}  contactUniqueID         The contact unique id.
     * @param {string}  contactApplicationID    The contact application id.
     * @param {string}  candidate               The candidate details.
     * @param {boolean} isData                  Is the candidate a data channel.
     */
    iceCandidate(contactUniqueID: string, contactApplicationID: string, candidate: string, isData: boolean): void;

    /**
     * Send do not want to answer to this contact.
     * 
     * @param {string}  contactUniqueID         The contact unique id.
     * @param {string}  contactApplicationID    The contact application id.
     */
    noAnswer(contactUniqueID: string, contactApplicationID: string): void;

    /**
     * Send end of call to this contact.
     * 
     * @param {string}  contactUniqueID         The contact unique id.
     * @param {string}  contactApplicationID    The contact application id.
     */
    sendEndCallToContact(contactUniqueID: string, contactApplicationID: string): void;

    /**
     * Send a request asking if the contact is available.
     * 
     * @param {string}  contactUniqueID         The contact unique id.
     * @param {string}  contactApplicationID    The contact application id.
     */
    contactAvailable(contactUniqueID: string, contactApplicationID: string): void;

    /**
     * Send the offer to this contact.
     * 
     * @param {string}                  contactUniqueID         The contact unique id.
     * @param {string}                  contactApplicationID    The contact application id.
     * @param {RTCSessionDescription}   sdpOfferRequest         The SDP offer.
     */
    sendOffer(contactUniqueID: string, contactApplicationID: string, sdpOfferRequest: RTCSessionDescription): void;

    /**
     * Send the answer to this contact.
     * 
     * @param {string}                  contactUniqueID         The contact unique id.
     * @param {string}                  contactApplicationID    The contact application id.
     * @param {RTCSessionDescription}   sdpAnswerResponse       The SDP answer.
     */
    sendAnswer(contactUniqueID: string, contactApplicationID: string, sdpAnswerResponse: RTCSessionDescription): void;

    /**
     * Send to the contact a message indicating that this client is joining the conference.
     * 
     * @param {string}                  contactUniqueID         The contact unique id.
     * @param {string}                  contactApplicationID    The contact application id.
     * @param {RTCSessionDescription}   sdpOfferRequest         The SDP offer.
     */
    sendJoinConferenceOffer(contactUniqueID: string, contactApplicationID: string, sdpOfferRequest: RTCSessionDescription): void;

    /**
     * Send to the contact a message indicating that this client has joined the conference.
     * 
     * @param {string}                  contactUniqueID         The contact unique id.
     * @param {string}                  contactApplicationID    The contact application id.
     * @param {RTCSessionDescription}   sdpAnswerResponse       The SDP answer.
     */
    sendJoinConferenceAnswer(contactUniqueID: string, contactApplicationID: string, sdpAnswerResponse: RTCSessionDescription): void;

    /**
     * Send a message to the contact that this contact has started typing.
     * 
     * @param {string}     contactUniqueID          The contact unique id.
     * @param {string}     contactApplicationID     The contact application id.
     */
    startedTypingMessage(contactUniqueID: string, contactApplicationID: string): void;

    /**
     * Send a message to the contact that this contact has stopped typing.
     * 
     * @param {string}     contactUniqueID          The contact unique id.
     * @param {string}     contactApplicationID     The contact application id.
     */
    stoppedTypingMessage(contactUniqueID: string, contactApplicationID: string): void;

    /**
     * Send the file transfer offer to this contact.
     * 
     * @param {string}                  contactUniqueID         The contact unique id.
     * @param {string}                  contactApplicationID    The contact application id.
     * @param {RTCSessionDescription}   sdpOfferRequest         The SDP offer.
     * @param {string}                  fileName                The file name to send.
     * @param {number}                  fileSize                The file size.
     * @param {string}                  fileType                The file type.
     * @param {number}                  fileLastModified        The file last modified date.
     */
    sendFileTransferOffer(
        contactUniqueID: string,
        contactApplicationID: string,
        sdpOfferRequest: RTCSessionDescription,
        fileName: string,
        fileSize: number,
        fileType: string,
        fileLastModified: number): void;

    /**
     * Send the file transfer answer to this contact.
     * 
     * @param {string}                  contactUniqueID         The contact unique id.
     * @param {string}                  contactApplicationID    The contact application id.
     * @param {RTCSessionDescription}   sdpAnswerResponse       The SDP answer.
     */
    sendFileTransferAnswer(contactUniqueID: string, contactApplicationID: string, sdpAnswerResponse: RTCSessionDescription): void;

    /**
     * Send do not want the file transfer answer to this contact.
     * 
     * @param {string}     contactUniqueID          The contact unique id.
     * @param {string}     contactApplicationID     The contact application id.
     */
    noFileTransferAnswer(contactUniqueID: string, contactApplicationID: string): void;

    /**
     * Sent a request to get the list of uniques.
     */
    contactUniqueIDList(): void;

    /**
     * Sent a request to get the list of applications.
     */
    contactApplicationIDList(): void;

    /**
     * Sent a request to get the list of groups.
    */
    contactGroupList(): void;

    /**
     * Close the current signalling connection.
    */
    close(): void;
}

/**
 * Signalling class used to signal other contacted
 * clients, this signalling class uses WebSockets
 * for the signalling transport.
 */
export class Signalling implements ISignalling {

    // Global.
    webSocket: WebSocket;
    closed: boolean;
    config: any;

    /**
    * subscribe to the signalling event handler.
    * {function} callback(eventName, eventDetails, this object, event)
    */
    private eventSignalling: (eventName: string, eventDetails: string, object: Signalling, event: any) => void;

    /**
     * Signalling prototype.
     * 
     * @param {Object}   signalOptions  A collection of options.
     *        
     * @example                          
     *  options = { 
     *      signallingURL: "wss://127.0.0.1:443" 
     *  }
     */
    constructor(public signalOptions: any) {

        // local.
        let self = this;
        this.closed = false;
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

        try {
            // Create a new WebSocket client for signalling.
            this.webSocket = new WebSocket(config.signallingURL);
        }
        catch (e) {
            util.logger("error", "Error connecting to WebSocket", e);
        }

        // If created.
        if (this.webSocket) {

            // Open new connection handler.
            this.webSocket.onopen = function (openEvent) {
                // Send open connection alert.
                self.eventSignalling('signallingEventOpen', "Signalling has opened.", self, openEvent);
            };

            // Error handler.
            this.webSocket.onerror = function (errorEvent) {
                // Send error connection alert.
                self.eventSignalling('signallingEventError', "Signalling has encountered and unknown error.", self, errorEvent);
            };

            // Connection closed handler.
            this.webSocket.onclose = function (closeEvent) {
                // Send close connection alert.
                self.eventSignalling('signallingEventClose', "Signalling has closed.", self, closeEvent);
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
                        self.eventSignalling('signallingEventErrorDetails', "Signalling has encountered an error.", self, signal.error);
                    }
                    else if (signal.applications) {
                        self.eventSignalling('signallingEventApplications', "Signalling has applications", self, signal.applications);
                    }
                    else if (signal.uniques) {
                        self.eventSignalling('signallingEventUniques', "Signalling has uniques", self, signal.uniques);
                    }
                    else if (signal.groups) {
                        self.eventSignalling('signallingEventGroups', "Signalling has groups", self, signal.groups);
                    }
                    else {
                        // If settings have been applied.
                        if (signal.settings && signal.settings === true) {
                            // The client settings.
                            self.eventSignalling('signallingEventSettings', "Signalling settings have been applied.", self, signal.settings);
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
                            self.eventSignalling('signallingEventAvailable', "Signalling contact available.", self, details);
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
                            self.eventSignalling('signallingEventMessage', "Signalling contact message.", self, details);
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
                            self.eventSignalling('signallingEventState', "Signalling contact state.", self, details);
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
                            self.eventSignalling('signallingEventDetails', "Signalling contact details.", self, details);
                        }
                        else {
                            // If the client is available
                            if (signal.available && signal.available === true) {

                                // Get the contact details.
                                let uniqueID = signal.contactUniqueID;
                                let applicationID = signal.contactApplicationID;
                                let isDataChannel = false;

                                // If this is a file transfer or data channel.
                                if (signal.fileTransferOffer || signal.fileTransferAnswer || signal.isData) {
                                    isDataChannel = true;
                                }

                                // A SDP signal has been received.
                                if (signal.sdp) {

                                    // Details.
                                    let details = {
                                        contactUniqueID: uniqueID,
                                        contactApplicationID: applicationID,
                                        sdp: signal.sdp,
                                        isData: isDataChannel
                                    };

                                    // Send SDP data.
                                    self.eventSignalling('signallingEventSDP', "Signalling an SDP signal has been received.", self, details);
                                }

                                // Add the peer ICE candidate.
                                if (signal.candidate) {

                                    // Details.
                                    let details = {
                                        contactUniqueID: uniqueID,
                                        contactApplicationID: applicationID,
                                        candidate: signal.candidate,
                                        type: signal.type,
                                        isData: isDataChannel
                                    };

                                    // Send candidate data.
                                    self.eventSignalling('signallingEventCandidate', "Signalling a candidate signal has been received.", self, details);
                                }

                                // If a call request offer was sent.
                                if (signal.callOffer) {

                                    // Details.
                                    let details = {
                                        contactUniqueID: uniqueID,
                                        contactApplicationID: applicationID,
                                    };

                                    // Send offer data.
                                    self.eventSignalling('signallingEventOffer', "Signalling an offer signal has been received.", self, details);
                                }

                                // If the call response answer was sent.
                                if (signal.callAnswer) {

                                    // Details.
                                    let details = {
                                        contactUniqueID: uniqueID,
                                        contactApplicationID: applicationID,
                                    };

                                    // Send answer data.
                                    self.eventSignalling('signallingEventAnswer', "Signalling an answer signal has been received.", self, details);
                                }

                                // If a join conference request offer was sent.
                                if (signal.joinConferenceOffer) {

                                    // Details.
                                    let details = {
                                        contactUniqueID: uniqueID,
                                        contactApplicationID: applicationID,
                                        conference: signal.conferenceCall
                                    };

                                    // Send offer data.
                                    self.eventSignalling('signallingEventJoinConferenceOffer', "Signalling a join conference offer signal has been received.", self, details);
                                }

                                // If the join conference response answer was sent.
                                if (signal.joinConferenceAnswer) {

                                    // Details.
                                    let details = {
                                        contactUniqueID: uniqueID,
                                        contactApplicationID: applicationID,
                                        conference: signal.conferenceCall
                                    };

                                    // Send answer data.
                                    self.eventSignalling('signallingEventJoinConferenceAnswer', "Signalling a join conference answer signal has been received.", self, details);
                                }

                                // If a file transfer request offer was sent.
                                if (signal.fileTransferOffer) {

                                    // Details.
                                    let details = {
                                        contactUniqueID: uniqueID,
                                        contactApplicationID: applicationID,
                                        name: signal.name,
                                        size: signal.size,
                                        type: signal.type,
                                        lastModified: signal.lastModified,
                                        fileTransfer: signal.fileTransferOffer
                                    };

                                    // Send file transfer offer data.
                                    self.eventSignalling('signallingEventFileOffer', "Signalling a file transfer offer signal has been received.", self, details);
                                }

                                // If file transfer response answer was sent.
                                if (signal.fileTransferAnswer) {

                                    // Details.
                                    let details = {
                                        contactUniqueID: uniqueID,
                                        contactApplicationID: applicationID,
                                        fileTransfer: signal.fileTransferAnswer
                                    };

                                    // Send file answer data.
                                    self.eventSignalling('signallingEventFileAnswer', "Signalling a file answer signal has been received.", self, details);
                                }

                                // The client did not accept the call request.
                                if (signal.noanswer) {

                                    // Details.
                                    let details = {
                                        contactUniqueID: uniqueID,
                                        contactApplicationID: applicationID,
                                        noanswer: signal.noanswer
                                    };

                                    // Send file answer data.
                                    self.eventSignalling('signallingEventNoAnswer', "Signalling the peer contact did not answer.", self, details);
                                }

                                // The remote client closed, ended the call.
                                if (signal.endCallRemote) {

                                    // Details.
                                    let details = {
                                        contactUniqueID: uniqueID,
                                        contactApplicationID: applicationID,
                                        endCallRemote: signal.endCallRemote
                                    };

                                    // Send file answer data.
                                    self.eventSignalling('signallingEventEndCall', "Signalling the peer contact ended the call.", self, details);
                                }

                                // If contact typing a message.
                                if (signal.contactTypingMessage) {

                                    // Details.
                                    let details = {
                                        contactUniqueID: uniqueID,
                                        contactApplicationID: applicationID,
                                        contactTypingMessage: signal.contactTypingMessage,
                                        typing: signal.typing
                                    };

                                    // If typing.
                                    if (signal.typing && signal.typing === true) {
                                        // The client is typing a message.
                                        self.eventSignalling('signallingEventTypingMessage', "Signalling the contact is typing a message.", self, details);
                                    }
                                    else {
                                        // The client has stopped typing.
                                        self.eventSignalling('signallingEventTypingMessage', "Signalling the contact has stopped typing.", self, details);
                                    }
                                }
                                else {

                                    // Details.
                                    let details = {
                                        contactAvailable: signal.available
                                    };

                                    // The client is available.
                                    self.eventSignalling('signallingEventSelfAvailable', "Signalling the contact is available.", self, details);
                                }
                            }
                            else {

                                // Details.
                                let details = {
                                    contactAvailable: signal.available
                                };

                                // The client is not available.
                                self.eventSignalling('signallingEventSelfAvailable', "Signalling the contact is not available.", self, details);
                            }
                        }
                    }
                }
                else {
                    // Unknown error from the WebSocket.
                    self.eventSignalling('signallingEventErrorDetails', "Signalling has encountered an unknown error.", self, null);
                }
            };
        };
    }

    /**
    * subscribe to the signalling event handler.
    * @param {function}	event callback(eventName, eventDetails, this object, event).
    */
    onSignallingEventHandler(event: (eventName: string, eventDetails: string, object: Signalling, event: any) => void): void {
        // assign the event.
        this.eventSignalling = event;
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
    changeClientSettings(uniqueID: string, applicationID: string, available: boolean, broadcast: boolean, broadcastAppID: boolean, accessToken: string): void {

        // If the socket is not open.
        if (this.webSocket.readyState !== this.webSocket.OPEN) return;

        // Send to the signalling provider.
        this.webSocket.send(
            JSON.stringify(
                {
                    "uniqueID": uniqueID,
                    "applicationID": applicationID,
                    "available": available,
                    "broadcast": broadcast,
                    "broadcastAppID": broadcastAppID,
                    "accessToken": accessToken
                })
        );
    }

    /**
     * Send the current state of the client to the contact.
     * 
     * @param {string}  contactUniqueID         The contact unique id.
     * @param {string}  contactApplicationID    The contact application id.
     * @param {string}  state                   The client state.
     */
    sendClientState(contactUniqueID: string, contactApplicationID: string, state: string): void {

        // If the socket is not open.
        if (this.webSocket.readyState !== this.webSocket.OPEN) return;

        // Send to the signalling provider.
        this.webSocket.send(
            JSON.stringify(
                {
                    "contactUniqueID": contactUniqueID,
                    "contactApplicationID": contactApplicationID,
                    "clientState": true,
                    "state": state
                })
        );
    }

    /**
     * Send the current details of the client to the contact.
     * 
     * @param {string}  contactUniqueID         The contact unique id.
     * @param {string}  contactApplicationID    The contact application id.
     * @param {string}  details                 The client details.
     */
    sendClientDetails(contactUniqueID: string, contactApplicationID: string, details: string): void {

        // If the socket is not open.
        if (this.webSocket.readyState !== this.webSocket.OPEN) return;

        // Send to the signalling provider.
        this.webSocket.send(
            JSON.stringify(
                {
                    "contactUniqueID": contactUniqueID,
                    "contactApplicationID": contactApplicationID,
                    "clientDetails": true,
                    "details": details
                })
        );
    }

    /**
     * Send a message to this contact.
     * 
     * @param {string}  contactUniqueID         The contact unique id.
     * @param {string}  contactApplicationID    The contact application id.
     * @param {string}  message                 The message to send.
     */
    sendMessage(contactUniqueID: string, contactApplicationID: string, message: string): void {

        // If the socket is not open.
        if (this.webSocket.readyState !== this.webSocket.OPEN) return;

        // Send to the signalling provider.
        this.webSocket.send(
            JSON.stringify(
                {
                    "contactUniqueID": contactUniqueID,
                    "contactApplicationID": contactApplicationID,
                    "contactMessage": message
                })
        );
    }

    /**
     * Send ICE candidate details to this contact.
     * 
     * @param {string}  contactUniqueID         The contact unique id.
     * @param {string}  contactApplicationID    The contact application id.
     * @param {string}  candidate               The candidate details.
     * @param {boolean} isData                  Is the candidate a data channel.
     */
    iceCandidate(contactUniqueID: string, contactApplicationID: string, candidate: string, isData: boolean): void {

        // If the socket is not open.
        if (this.webSocket.readyState !== this.webSocket.OPEN) return;

        // Send to the signalling provider.
        this.webSocket.send(
            JSON.stringify(
                {
                    "contactUniqueID": contactUniqueID,
                    "contactApplicationID": contactApplicationID,
                    "candidate": candidate,
                    "type": "candidate",
                    "isData": isData
                })
        );
    }

    /**
     * Send do not want to answer to this contact.
     * 
     * @param {string}  contactUniqueID         The contact unique id.
     * @param {string}  contactApplicationID    The contact application id.
     */
    noAnswer(contactUniqueID: string, contactApplicationID: string): void {

        // If the socket is not open.
        if (this.webSocket.readyState !== this.webSocket.OPEN) return;

        // Send to the signalling provider.
        this.webSocket.send(
            JSON.stringify(
                {
                    "contactUniqueID": contactUniqueID,
                    "contactApplicationID": contactApplicationID,
                    "noanswer": true
                })
        );
    }

    /**
     * Send end of call to this contact.
     * 
     * @param {string}  contactUniqueID         The contact unique id.
     * @param {string}  contactApplicationID    The contact application id.
     */
    sendEndCallToContact(contactUniqueID: string, contactApplicationID: string): void {

        // If the socket is not open.
        if (this.webSocket.readyState !== this.webSocket.OPEN) return;

        // Send to the signalling provider.
        this.webSocket.send(
            JSON.stringify(
                {
                    "contactUniqueID": contactUniqueID,
                    "contactApplicationID": contactApplicationID,
                    "endCallRemote": true
                })
        );
    }

    /**
     * Send a request asking if the contact is available.
     * 
     * @param {string}  contactUniqueID         The contact unique id.
     * @param {string}  contactApplicationID    The contact application id.
     */
    contactAvailable(contactUniqueID: string, contactApplicationID: string): void {

        // If the socket is not open.
        if (this.webSocket.readyState !== this.webSocket.OPEN) return;

        // Send to the signalling provider.
        this.webSocket.send(
            JSON.stringify(
                {
                    "contactUniqueID": contactUniqueID,
                    "contactApplicationID": contactApplicationID,
                    "contactAvailable": true
                })
        );
    }

    /**
     * Send the offer to this contact.
     * 
     * @param {string}                  contactUniqueID         The contact unique id.
     * @param {string}                  contactApplicationID    The contact application id.
     * @param {RTCSessionDescription}   sdpOfferRequest         The SDP offer.
     */
    sendOffer(contactUniqueID: string, contactApplicationID: string, sdpOfferRequest: RTCSessionDescription): void {

        // If the socket is not open.
        if (this.webSocket.readyState !== this.webSocket.OPEN) return;

        // Send to the signalling provider.
        this.webSocket.send(
            JSON.stringify(
                {
                    "contactUniqueID": contactUniqueID,
                    "contactApplicationID": contactApplicationID,
                    "callOffer": true,
                    "sdp": sdpOfferRequest
                })
        );
    }

    /**
     * Send the answer to this contact.
     * 
     * @param {string}                  contactUniqueID         The contact unique id.
     * @param {string}                  contactApplicationID    The contact application id.
     * @param {RTCSessionDescription}   sdpAnswerResponse       The SDP answer.
     */
    sendAnswer(contactUniqueID: string, contactApplicationID: string, sdpAnswerResponse: RTCSessionDescription): void {

        // If the socket is not open.
        if (this.webSocket.readyState !== this.webSocket.OPEN) return;

        // Send to the signalling provider.
        this.webSocket.send(
            JSON.stringify(
                {
                    "contactUniqueID": contactUniqueID,
                    "contactApplicationID": contactApplicationID,
                    "callAnswer": true,
                    "sdp": sdpAnswerResponse
                })
        );
    }

    /**
     * Send to the contact a message indicating that this client is joining the conference.
     * 
     * @param {string}                  contactUniqueID         The contact unique id.
     * @param {string}                  contactApplicationID    The contact application id.
     * @param {RTCSessionDescription}   sdpOfferRequest         The SDP offer.
     */
    sendJoinConferenceOffer(contactUniqueID: string, contactApplicationID: string, sdpOfferRequest: RTCSessionDescription): void {

        // If the socket is not open.
        if (this.webSocket.readyState !== this.webSocket.OPEN) return;

        // Send to the signalling provider.
        this.webSocket.send(
            JSON.stringify(
                {
                    "contactUniqueID": contactUniqueID,
                    "contactApplicationID": contactApplicationID,
                    "joinConferenceOffer": true,
                    "conferenceCall": true,
                    "sdp": sdpOfferRequest
                })
        );
    }

    /**
     * Send to the contact a message indicating that this client has joined the conference.
     * 
     * @param {string}                  contactUniqueID         The contact unique id.
     * @param {string}                  contactApplicationID    The contact application id.
     * @param {RTCSessionDescription}   sdpAnswerResponse       The SDP answer.
     */
    sendJoinConferenceAnswer(contactUniqueID: string, contactApplicationID: string, sdpAnswerResponse: RTCSessionDescription): void {

        // If the socket is not open.
        if (this.webSocket.readyState !== this.webSocket.OPEN) return;

        // Send to the signalling provider.
        this.webSocket.send(
            JSON.stringify(
                {
                    "contactUniqueID": contactUniqueID,
                    "contactApplicationID": contactApplicationID,
                    "joinConferenceAnswer": true,
                    "conferenceCall": true,
                    "sdp": sdpAnswerResponse
                })
        );
    }

    /**
     * Send a message to the contact that this contact has started typing.
     * 
     * @param {string}     contactUniqueID          The contact unique id.
     * @param {string}     contactApplicationID     The contact application id.
     */
    startedTypingMessage(contactUniqueID: string, contactApplicationID: string): void {

        // If the socket is not open.
        if (this.webSocket.readyState !== this.webSocket.OPEN) return;

        // Send to the signalling provider.
        this.webSocket.send(
            JSON.stringify(
                {
                    "contactUniqueID": contactUniqueID,
                    "contactApplicationID": contactApplicationID,
                    "contactTypingMessage": true,
                    "typing": true
                })
        );
    }

    /**
     * Send a message to the contact that this contact has stopped typing.
     * 
     * @param {string}     contactUniqueID          The contact unique id.
     * @param {string}     contactApplicationID     The contact application id.
     */
    stoppedTypingMessage(contactUniqueID: string, contactApplicationID: string): void {

        // If the socket is not open.
        if (this.webSocket.readyState !== this.webSocket.OPEN) return;

        // Send to the signalling provider.
        this.webSocket.send(
            JSON.stringify(
                {
                    "contactUniqueID": contactUniqueID,
                    "contactApplicationID": contactApplicationID,
                    "contactTypingMessage": true,
                    "typing": false
                })
        );
    }

    /**
     * Send the file transfer offer to this contact.
     * 
     * @param {string}                  contactUniqueID         The contact unique id.
     * @param {string}                  contactApplicationID    The contact application id.
     * @param {RTCSessionDescription}   sdpOfferRequest         The SDP offer.
     * @param {string}                  fileName                The file name to send.
     * @param {number}                  fileSize                The file size.
     * @param {string}                  fileType                The file type.
     * @param {number}                  fileLastModified        The file last modified date.
     */
    sendFileTransferOffer(
        contactUniqueID: string,
        contactApplicationID: string,
        sdpOfferRequest: RTCSessionDescription,
        fileName: string,
        fileSize: number,
        fileType: string,
        fileLastModified: number): void {

        // If the socket is not open.
        if (this.webSocket.readyState !== this.webSocket.OPEN) return;

        // Send to the signalling provider.
        this.webSocket.send(
            JSON.stringify(
                {
                    "contactUniqueID": contactUniqueID,
                    "contactApplicationID": contactApplicationID,
                    "fileTransferOffer": true,
                    "name": fileName,
                    "size": fileSize,
                    "type": fileType,
                    "lastModified": fileLastModified,
                    "sdp": sdpOfferRequest
                })
        );
    }

    /**
     * Send the file transfer answer to this contact.
     * 
     * @param {string}                  contactUniqueID         The contact unique id.
     * @param {string}                  contactApplicationID    The contact application id.
     * @param {RTCSessionDescription}   sdpAnswerResponse       The SDP answer.
     */
    sendFileTransferAnswer(contactUniqueID: string, contactApplicationID: string, sdpAnswerResponse: RTCSessionDescription): void {

        // If the socket is not open.
        if (this.webSocket.readyState !== this.webSocket.OPEN) return;

        // Send to the signalling provider.
        this.webSocket.send(
            JSON.stringify(
                {
                    "contactUniqueID": contactUniqueID,
                    "contactApplicationID": contactApplicationID,
                    "fileTransferAnswer": true,
                    "sdp": sdpAnswerResponse
                })
        );
    }

    /**
     * Send do not want the file transfer answer to this contact.
     * 
     * @param {string}     contactUniqueID          The contact unique id.
     * @param {string}     contactApplicationID     The contact application id.
     */
    noFileTransferAnswer(contactUniqueID: string, contactApplicationID: string): void {

        // If the socket is not open.
        if (this.webSocket.readyState !== this.webSocket.OPEN) return;

        // Send to the signalling provider.
        this.webSocket.send(
            JSON.stringify(
                {
                    "contactUniqueID": contactUniqueID,
                    "contactApplicationID": contactApplicationID,
                    "noanswer": true
                })
        );
    }

    /**
     * Sent a request to get the list of uniques.
     */
    contactUniqueIDList(): void {

        // If the socket is not open.
        if (this.webSocket.readyState !== this.webSocket.OPEN) return;

        // Send to the signalling provider.
        this.webSocket.send("uniqueids");
    }

    /**
     * Sent a request to get the list of applications.
     */
    contactApplicationIDList(): void {

        // If the socket is not open.
        if (this.webSocket.readyState !== this.webSocket.OPEN) return;

        // Send to the signalling provider.
        this.webSocket.send("applicationids");
    }

    /**
     * Sent a request to get the list of groups.
    */
    contactGroupList(): void {

        // If the socket is not open.
        if (this.webSocket.readyState !== this.webSocket.OPEN) return;

        // Send to the signalling provider.
        this.webSocket.send("uniqueapplication");
    }

    /**
     * Close the current signalling connection.
    */
    close(): void {

        if (this.closed) return;
        this.closed = true;

        // Close the WebSocket connection.
        if (this.webSocket) {

            // If the socket is not open.
            if (this.webSocket.readyState !== this.webSocket.OPEN) return;

            try {
                // Close.
                this.webSocket.close();
                this.webSocket = null;
            }
            catch (e) {
                // Log the error.
                util.logger("error", "Error closing signalling", e);
            }
        }
    }
}
