import * as util from './common.mjs';
import { Signalling } from './signalling.mjs';
import { ContactPeer } from './contactpeer.mjs';
import { WebRtcAdapter } from './webrtcadapter.mjs';

/**
 * WebRTC controls the interaction between the
 * adapter and user configuration.
 */
export class WebRtcApp {

    // Global.
    webrtcadapter: WebRtcAdapter;
    closed: boolean;
    config: any;
    parent: any;

    /**
    * subscribe to the WebRtc event handler.
    * {function} callback(eventName, eventDetails, object, event)
    */
    private eventWebRtc: (eventName: string, event: any) => void;

    /**
    * WebRTC class.
    * 
    * @param {Object}   webRtcOptions  A collection of options.
    *         
    * @example                         
    *  options = { 
    *      signallingURL: "wss://127.0.0.1:443",
    *      peerConnectionConfiguration: {
    *          iceServers: [ 
    *		        { 
    *                  "urls": "stun:stun.l.google.com:19302"
    *			    },
    *               {
    *			        "urls": "turn:127.0.0.1:19305?transport=udp",
    *			        "username": "username",
    *			        "credential": "password"
    *		        },
    *		        {
    *			        "urls": "turn:127.0.0.1:19305?transport=tcp",
    *			        "username": "username",
    *			        "credential": "password"
    *		        }
    *	        ]
    *      },
    *      peerConnectionConstraints: {
    *          optional: []
    *      },
    *      receiveOfferMedia: {
    *          offerToReceiveAudio: 1,
    *          offerToReceiveVideo: 1
    *      } 
    *  }
    */
    constructor(public webRtcOptions: any) {

        // local.
        let self = this;
        this.closed = false;
        let item;

        this.parent = null;
        let options = webRtcOptions || {};
        let config = this.config = {

            // Peer connection configuration.
            peerConnectionConfiguration: {
                iceServers: [
                    {
                        "urls": "stun:stun.l.google.com:19302"
                    }
                ]
            },

            // Peer connection constraints.
            peerConnectionConstraints: {
                optional: []
            },

            // Receive offer media config.
            receiveOfferMedia: {
                offerToReceiveAudio: 1,
                offerToReceiveVideo: 1
            },

            // Signalling URL.
            signallingURL: "wss://127.0.0.1:443",

            // Local video settings.
            localVideo: {
                autoplay: true,
                mirror: true,
                muted: true
            }
        };

        // set our config from options
        for (item in options) {
            if (options.hasOwnProperty(item)) {
                this.config[item] = options[item];
            }
        }

        // Create the webrtc adapter.
        this.webrtcadapter = new WebRtcAdapter(this.config);
        this.webrtcadapter.onWebRtcAdapterEventHandler((eventName, eventDetails, object, event) => {

            // select the event.
            switch (eventName) {

                case "adapterRecordingData": {
                    let argum = {
                        data: event,
                        text: eventDetails,
                        object: object,
                        objectName: "WebRtcAdapter",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('recordingData', argum);
                    break;
                }
                case "adapterRecordingStopped": {
                    let argum = {
                        evt: event,
                        text: eventDetails,
                        object: object,
                        objectName: "WebRtcAdapter",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('recordingStopped', argum);
                    break;
                }
            }
        });

        this.webrtcadapter.onContactPeerEventHandler((eventName, eventDetails, object, event) => {

            // select the event.
            switch (eventName) {

                case "peerContactEventICEStateChange": {
                    let argum = {
                        contact: object,
                        state: event,
                        text: eventDetails,
                        object: object,
                        objectName: "ContactPeer",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('contactICEStateChange', argum);
                    break;
                }
                case "peerContactEventICECandidateError": {
                    let argum = {
                        contact: object,
                        error: event,
                        text: eventDetails,
                        object: object,
                        objectName: "ContactPeer",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('contactICECandidateError', argum);
                    break;
                }
                case "peerContactEventICECandidate": {
                    let argum = {
                        contact: object,
                        message: event,
                        text: eventDetails,
                        object: object,
                        objectName: "ContactPeer",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('contactICECandidate', argum);
                    break;
                }
                case "peerContactEventSignalingStateChange": {
                    let argum = {
                        contact: object,
                        state: event,
                        text: eventDetails,
                        object: object,
                        objectName: "ContactPeer",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('contactSignalingStateChange', argum);
                    break;
                }
                case "peerContactEventNegotiationNeeded": {
                    let argum = {
                        contact: object,
                        state: event,
                        text: eventDetails,
                        object: object,
                        objectName: "ContactPeer",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('contactNegotiationNeeded', argum);
                    break;
                }
                case "peerContactEventRemoveStream": {
                    let argum = {
                        contact: object,
                        remove: event,
                        text: eventDetails,
                        object: object,
                        objectName: "ContactPeer",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('contactRemoveStream', argum);
                    break;
                }
                case "peerContactEventAddStream": {
                    let argum = {
                        contact: object,
                        add: event,
                        text: eventDetails,
                        object: object,
                        objectName: "ContactPeer",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('contactAddStream', argum);
                    break;
                }
                case "peerContactEventAddTrack": {
                    let argum = {
                        contact: object,
                        add: event,
                        text: eventDetails,
                        object: object,
                        objectName: "ContactPeer",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('contactAddStream', argum);
                    break;
                }
                case "peerContactEventDataChannelReceivedSize": {
                    let argum = {
                        contact: object,
                        size: event,
                        text: eventDetails,
                        object: object,
                        objectName: "ContactPeer",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('contactReceiveSize', argum);
                    break;
                }
                case "peerContactEventDataChannelReceiveComplete": {
                    let argum = {
                        contact: object,
                        buffer: event,
                        text: eventDetails,
                        object: object,
                        objectName: "ContactPeer",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('contactReceiveComplete', argum);
                    break;
                }
                case "peerContactEventDataChannelOpen": {
                    let argum = {
                        contact: object,
                        open: event,
                        text: eventDetails,
                        object: object,
                        objectName: "ContactPeer",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('contactReceiveOpen', argum);
                    break;
                }
                case "peerContactEventDataChannelClose": {
                    let argum = {
                        contact: object,
                        close: event,
                        text: eventDetails,
                        object: object,
                        objectName: "ContactPeer",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('contactReceiveClose', argum);
                    break;
                }
                case "peerContactEventDataChannelError": {
                    let argum = {
                        contact: object,
                        error: event,
                        text: eventDetails,
                        object: object,
                        objectName: "ContactPeer",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('contactReceiveError', argum);
                    break;
                }
                case "peerContactEventDataChannelSentSize": {
                    let argum = {
                        contact: object,
                        size: event,
                        text: eventDetails,
                        object: object,
                        objectName: "ContactPeer",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('contactSentSize', argum);
                    break;
                }
                case "peerContactEventDataChannelSentComplete": {
                    let argum = {
                        contact: object,
                        buffer: event,
                        text: eventDetails,
                        object: object,
                        objectName: "ContactPeer",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('contactSentComplete', argum);
                    break;
                }
                case "peerContactEventDataChannelSentMessage": {
                    let argum = {
                        contact: object,
                        message: event,
                        text: eventDetails,
                        object: object,
                        objectName: "ContactPeer",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('contactSentMessage', argum);
                    break;
                }
                case "peerContactEventClose": {
                    let argum = {
                        contact: object,
                        session: event,
                        text: eventDetails,
                        object: object,
                        objectName: "ContactPeer",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('contactClose', argum);
                    break;
                }
                case "peerContactEventSessionError": {
                    let argum = {
                        contact: object,
                        session: event,
                        text: eventDetails,
                        object: object,
                        objectName: "ContactPeer",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('contactSessionError', argum);
                    break;
                }
                case "peerContactRecordingData": {
                    let argum = {
                        contact: object,
                        data: event,
                        text: eventDetails,
                        object: object,
                        objectName: "ContactPeer",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('contactRecordingData', argum);
                    break;
                }
                case "peerContactRecordingStopped": {
                    let argum = {
                        contact: object,
                        evt: event,
                        text: eventDetails,
                        object: object,
                        objectName: "ContactPeer",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('contactRecordingStopped', argum);
                    break;
                }
            }
        });

        this.webrtcadapter.onSignallingEventHandler((eventName, eventDetails, object, event) => {

            // select the event.
            switch (eventName) {

                case "signallingEventOpen": {
                    let argum = {
                        open: true,
                        text: eventDetails,
                        object: object,
                        objectName: "Signalling",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('connectionOpen', argum);
                    break;
                }
                case "signallingEventError": {
                    let argum = {
                        error: true,
                        data: event.data,
                        text: eventDetails,
                        object: object,
                        objectName: "Signalling",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('connectionError', argum);
                    break;
                }
                case "signallingEventClose": {
                    let argum = {
                        close: true,
                        text: eventDetails,
                        object: object,
                        objectName: "Signalling",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('connectionClose', argum);
                    break;
                }
                case "signallingEventErrorDetails": {
                    let argum = {
                        error: event,
                        text: eventDetails,
                        object: object,
                        objectName: "Signalling",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('signalError', argum);
                    break;
                }
                case "signallingEventApplications": {
                    let argum = {
                        list: event,
                        text: eventDetails,
                        object: object,
                        objectName: "Signalling",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('signalApplications', argum);
                    break;
                }
                case "signallingEventUniques": {
                    let argum = {
                        list: event,
                        text: eventDetails,
                        object: object,
                        objectName: "Signalling",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('signalUniques', argum);
                    break;
                }
                case "signallingEventGroups": {
                    let argum = {
                        list: event,
                        text: eventDetails,
                        object: object,
                        objectName: "Signalling",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('signalGroups', argum);
                    break;
                }
                case "signallingEventSettings": {
                    let argum = {
                        setting: event,
                        text: eventDetails,
                        object: object,
                        objectName: "Signalling",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('signalSettings', argum);
                    break;
                }
                case "signallingEventAvailable": {
                    let contact: ContactPeer = self.createContact(event.contactUniqueID, event.contactApplicationID);
                    let argum = {
                        contact: contact,
                        available: event.contactAvailable,
                        text: eventDetails,
                        object: object,
                        objectName: "Signalling",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('signalAvailable', argum);
                    break;
                }
                case "signallingEventSelfAvailable": {
                    let argum = {
                        available: event.contactAvailable,
                        text: eventDetails,
                        object: object,
                        objectName: "Signalling",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('signalSelfAvailable', argum);
                    break;
                }
                case "signallingEventMessage": {
                    let contact: ContactPeer = self.createContact(event.contactUniqueID, event.contactApplicationID);
                    let argum = {
                        contact: contact,
                        message: event.contactMessage,
                        text: eventDetails,
                        object: object,
                        objectName: "Signalling",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('signalMessage', argum);
                    break;
                }
                case "signallingEventState": {
                    let contact: ContactPeer = self.createContact(event.contactUniqueID, event.contactApplicationID);
                    let argum = {
                        contact: contact,
                        state: event.contactState,
                        text: eventDetails,
                        object: object,
                        objectName: "Signalling",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('signalState', argum);
                    break;
                }
                case "signallingEventDetails": {
                    let contact: ContactPeer = self.createContact(event.contactUniqueID, event.contactApplicationID);
                    contact.setContactDetails(event.clientDetails);
                    let argum = {
                        contact: contact,
                        details: event.clientDetails,
                        text: eventDetails,
                        object: object,
                        objectName: "Signalling",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('signalDetails', argum);
                    break;
                }
                case "signallingEventJoinConferenceOffer": {
                    let contact: ContactPeer = self.createContact(event.contactUniqueID, event.contactApplicationID);
                    let argum = {
                        contact: contact,
                        conference: event.conference,
                        text: eventDetails,
                        object: object,
                        objectName: "Signalling",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('signalJoinConferenceOffer', argum);
                    break;
                }
                case "signallingEventJoinConferenceAnswer": {
                    let contact: ContactPeer = self.createContact(event.contactUniqueID, event.contactApplicationID);
                    let argum = {
                        contact: contact,
                        conference: event.conference,
                        text: eventDetails,
                        object: object,
                        objectName: "Signalling",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('signalJoinConferenceAnswer', argum);
                    break;
                }
                case "signallingEventSDP": {
                    // Get the contact.
                    let contact: ContactPeer = null;

                    // If file transfer or data channel.
                    if (event.isData) {
                        // Get data contact.
                        contact = self.createContactData(event.contactUniqueID, event.contactApplicationID);
                    }
                    else {
                        contact = self.createContact(event.contactUniqueID, event.contactApplicationID);
                    }

                    let argum = {
                        contact: contact,
                        text: eventDetails,
                        isData: event.isData,
                        sdp: event.sdp,
                        object: object,
                        objectName: "Signalling",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('signalSDP', argum);
                    break;
                }
                case "signallingEventCandidate": {
                    // Get the contact.
                    let contact: ContactPeer = null;

                    // If file transfer or data channel.
                    if (event.isData) {
                        // Get data contact.
                        contact = self.createContactData(event.contactUniqueID, event.contactApplicationID);
                    }
                    else {
                        contact = self.createContact(event.contactUniqueID, event.contactApplicationID);
                    }

                    let argum = {
                        contact: contact,
                        text: eventDetails,
                        isData: event.isData,
                        candidate: event.candidate,
                        object: object,
                        objectName: "Signalling",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('signalIceCandidate', argum);
                    break;
                }
                case "signallingEventOffer": {
                    let contact: ContactPeer = self.createContact(event.contactUniqueID, event.contactApplicationID);
                    let argum = {
                        contact: contact,
                        text: eventDetails,
                        object: object,
                        objectName: "Signalling",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('signalOffer', argum);
                    break;
                }
                case "signallingEventAnswer": {
                    let contact: ContactPeer = self.createContact(event.contactUniqueID, event.contactApplicationID);
                    let argum = {
                        contact: contact,
                        text: eventDetails,
                        object: object,
                        objectName: "Signalling",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('signalAnswer', argum);
                    break;
                }
                case "signallingEventFileOffer": {
                    let contact: ContactPeer = self.createContactData(event.contactUniqueID, event.contactApplicationID);
                    contact.setFileInfo(event.name, event.size, event.type, event.lastModified);
                    let argum = {
                        contact: contact,
                        name: event.name,
                        size: event.size,
                        type: event.type,
                        lastModified: event.lastModified,
                        text: eventDetails,
                        object: object,
                        objectName: "Signalling",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('signalFileOffer', argum);
                    break;
                }
                case "signallingEventFileAnswer": {
                    let contact: ContactPeer = self.createContactData(event.contactUniqueID, event.contactApplicationID);
                    let argum = {
                        contact: contact,
                        text: eventDetails,
                        object: object,
                        objectName: "Signalling",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('signalFileAnswer', argum);
                    break;
                }
                case "signallingEventNoAnswer": {
                    let contact: ContactPeer = self.createContact(event.contactUniqueID, event.contactApplicationID);
                    let argum = {
                        contact: contact,
                        text: eventDetails,
                        object: object,
                        objectName: "Signalling",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('signalNoAnswer', argum);
                    break;
                }
                case "signallingEventEndCall": {
                    let contact: ContactPeer = self.createContact(event.contactUniqueID, event.contactApplicationID);
                    let argum = {
                        contact: contact,
                        text: eventDetails,
                        object: object,
                        objectName: "Signalling",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('signalEndCall', argum);
                    break;
                }
                case "signallingEventTypingMessage": {
                    let contact: ContactPeer = self.createContact(event.contactUniqueID, event.contactApplicationID);
                    let argum = {
                        contact: contact,
                        typing: event.typing,
                        text: eventDetails,
                        object: object,
                        objectName: "Signalling",
                        objectEvent: event,
                        rtc: self
                    };
                    self.eventWebRtc('signalTyping', argum);
                    break;
                }
            }
        });
    }

    /**
    * subscribe to the WebRtc Adapter event handler.
    * @param {function}	event callback(eventName, event).
    */
    onWebRtcEventHandler(event: (eventName: string, event: any) => void): void {
        // assign the event.
        this.eventWebRtc = event;
    }

    /**
     * Create a new contact if it does not exist, else return existing contact.
     * 
     * @param {string}      contactUniqueID        The contact unique id.
     * @param {string}      contactApplicationID   The contact application id.
     * 
     * @return {ContactPeer} Returns the contact.
     */
    createContact(contactUniqueID: string, contactApplicationID: string): ContactPeer {

        // Get the contact.
        let contact = this.webrtcadapter.getContactPeer(contactUniqueID, contactApplicationID, false);
        if (contact[0]) {
            // Return the contact.
            return contact[0];
        }
        else {
            // Options.
            var options = {
                uniqueID: contactUniqueID,
                applicationID: contactApplicationID,
                isData: false
            };

            // Create a new contact.
            let contactpeer = this.webrtcadapter.createContactPeer(options);
            return contactpeer;
        }
    }

    /**
     * Create a new data contact if it does not exist, else return existing contact.
     * 
     * @param {string}      contactUniqueID        The contact unique id.
     * @param {string}      contactApplicationID   The contact application id.
     * 
     * @return {ContactPeer} Returns the contact.
     */
    createContactData(contactUniqueID: string, contactApplicationID: string): ContactPeer {

        // Get the contact.
        var contact = this.webrtcadapter.getContactPeer(contactUniqueID, contactApplicationID, true);
        if (contact[0]) {
            // Return the contact.
            return contact[0];
        }
        else {
            // Options.
            var options = {
                uniqueID: contactUniqueID,
                applicationID: contactApplicationID,
                isData: true
            };

            // Create a new contact.
            let contactpeer = this.webrtcadapter.createContactPeer(options);
            return contactpeer;
        }
    }

    /**
     * Remove the contact if it exists.
     * 
     * @param {string}      contactUniqueID        The contact unique id.
     * @param {string}      contactApplicationID   The contact application id.
     */
    removeContact(contactUniqueID: string, contactApplicationID: string): void {

        // Get the contact.
        let contact = this.webrtcadapter.getContactPeer(contactUniqueID, contactApplicationID, false);
        if (contact[0]) {

            // Remove contact.
            this.webrtcadapter.removeContactPeer(contactUniqueID, contactApplicationID, false);
        }
    }

    /**
     * Remove the data contact if it exists.
     * 
     * @param {string}      contactUniqueID        The contact unique id.
     * @param {string}      contactApplicationID   The contact application id.
     */
    removeContactData(contactUniqueID: string, contactApplicationID: string): void {

        // Get the contact.
        let contact = this.webrtcadapter.getContactPeer(contactUniqueID, contactApplicationID, true);
        if (contact[0]) {

            // Remove contact.
            this.webrtcadapter.removeContactPeer(contactUniqueID, contactApplicationID, true);
        }
    }

    /**
     * Is the contact in the contact list.
     * 
     * @param {string}  contactUniqueID        The contact unique id.
     * @param {string}  contactApplicationID   The contact application id.
     * 
     * @return {boolean} True if the contact is in the list; else false.
     */
    isContactPeer(contactUniqueID: string, contactApplicationID: string): boolean {

        // Get the contact.
        let contact = this.webrtcadapter.isContactPeer(contactUniqueID, contactApplicationID);
        if (contact[0]) {
            // Found one.
            return true;
        }
        else {
            return false;
        }
    }

    /**
     * Close the webRTC interface.
     */
    close(): void {

        if (this.closed) return;
        this.closed = true;

        try {
            // Close the interface.
            this.webrtcadapter.close();
        }
        catch (e) {
            // Log the error.
            util.logger("error", "Error closing the WebRTC interface", e);
        }
    }

    /**
     * Change client settings.
     * 
     * @param {string}      uniqueID        The contact unique id.
     * @param {string}      applicationID   The contact application id.
     * @param {boolean}     available       True if this client is avaliable for contact; else false.
     * @param {boolean}     broadcast       True if this client allows the unique id to be broadcast; else false.
     * @param {boolean}     broadcastAppID  True if this client allows the application id to be broadcast; else false.
     * @param {string}      accessToken     The access token.
     */
    changeClientSettings(uniqueID: string, applicationID: string, available: boolean, broadcast: boolean, broadcastAppID: boolean, accessToken: string): void {

        // Change client settings
        this.webrtcadapter.changeClientSettings(uniqueID, applicationID, available, broadcast, broadcastAppID, accessToken);
    }

    /**
     * Create the local audio and video stream.
     *
     * @param {boolean}     audio   True to enable audio in local stream; else false.
     * @param {boolean}     video   True to enable video in local stream; else false.
     */
    createStream(audio: boolean, video: boolean): void {

        // Create stream.
        this.webrtcadapter.createStream(audio, video);
    }

    /**
     * Create the local media stream.
     * 
     * @param {string}      audioSource   The audio source.
     * @param {string}      videoSource   The video source.
     */
    createStreamSource(audioSource: any, videoSource: any): void {

        // Create the constraint.
        let constraints = {
            audio: { deviceId: audioSource ? { exact: audioSource } : undefined },
            video: { deviceId: videoSource ? { exact: videoSource } : undefined }
        };

        // Create stream.
        this.webrtcadapter.createStreamEx(constraints);
    }

    /**
     * Create a local capture media, screen or application window: no audio.
     *
     * @param {string}     captureMediaSource   The capture media source ('screen' or 'window').
     */
    createStreamCapture(captureMediaSource: string): void {

        // Create stream.
        this.webrtcadapter.createStreamCapture(captureMediaSource);
    }

    /**
     * Create the local media stream.
     *
     * @param {MediaStreamConstraints}     constraints   The media constraints.
     * @link  https://w3c.github.io/mediacapture-main/getusermedia.html#media-track-constraints
     * @example 
     *      qvga =  video: {width: {exact: 320}, height: {exact: 240}}
     *      vga =   video: {width: {exact: 640}, height: {exact: 480}}
     *      hd =    video: {width: {exact: 1280}, height: {exact: 720}}
     *      fullHd =video: {width: {exact: 1920}, height: {exact: 1080}}
     *      fourK = video: {width: {exact: 4096}, height: {exact: 2160}}
     * 
     *              audio: {deviceId: audioSource ? {exact: audioSource} : undefined}
     *              video: {deviceId: videoSource ? {exact: videoSource} : undefined}
     */
    createStreamEx(constraints: MediaStreamConstraints): void {

        // Create stream.
        this.webrtcadapter.createStreamEx(constraints);
    }

    /**
    * Create the local media stream from the display media selection.
    *
    * @param {DisplayMediaStreamOptions}     constraints   The media constraints.
    * @link  https://developer.mozilla.org/docs/Web/API/MediaDevices/getDisplayMedia
    * @example 
    *      qvga =  video: {width: {exact: 320}, height: {exact: 240}}
    *      vga =   video: {width: {exact: 640}, height: {exact: 480}}
    *      hd =    video: {width: {exact: 1280}, height: {exact: 720}}
    *      fullHd =video: {width: {exact: 1920}, height: {exact: 1080}}
    *      fourK = video: {width: {exact: 4096}, height: {exact: 2160}}
    * 
    *      displaySurface: ('screen' or 'window'),
    * 
    *   {
    *       video: {
    *            displaySurface: "window",
    *            width: { max: 1920 },
    *            height: { max: 1080 },
    *            frameRate: { max: 10 }
    *        },
    *        audio: {
    *            echoCancellation: true,
    *            noiseSuppression: true,
    *            sampleRate: { max: 44100 }
    *        }
    *    }
    */
    createStreamCaptureEx(constraints: DisplayMediaStreamOptions): void {

        // Create stream.
        this.webrtcadapter.createStreamCaptureEx(constraints);
    }

    /**
     * Set the local video element.
     * 
     * @param {object}      videoElement   The local video element.
     */
    setLocalVideoElement(videoElement: any): void {

        // Assign the video element.
        this.webrtcadapter.setLocalVideoElement(videoElement);
    }

    /**
     * Set the local stream to the video element.
     * 
     * @param {object}      videoElement   The local video element.
     */
    setLocalStreamToVideoElement(videoElement: any): void {

        // Assign the video element.
        this.webrtcadapter.setLocalStreamToVideoElement(videoElement);
    }

    /**
     * Get all audio input sources.
     * 
     * @param {Function}     callback   (sourceList: Array<{ deviceID: string, deviceText : string }>)
     */
    getAudioInputSources(callback: (sourceList: Array<{ deviceID: string, deviceText : string }>) => void): void {

        // Get all devices
        let deviceIndex = 1;
        let sources: Array<{ deviceID: string, deviceText: string }> = [];

        // Get the device list.
        this.webrtcadapter.getAudioInputDevices(function (devices) {
            // For each device.
            devices.forEach(function (device) {

                let info = {
                    deviceID: device.deviceId,
                    deviceText: device.label || 'microphone ' + deviceIndex
                };

                // Add to source.
                sources.push(info);
                deviceIndex++;
            });

            // Send callback.
            callback(sources);
        });
    }

    /**
     * Get all audio output sources.
     * 
     * @param {Function}     callback   (sourceList: Array<{ deviceID: string, deviceText : string }>)
     */
    getAudioOutputSources(callback: (sourceList: Array<{ deviceID: string, deviceText: string }>) => void): void {

        // Get all devices
        let deviceIndex = 1;
        let sources: Array<{ deviceID: string, deviceText: string }> = [];

        // Get the device list.
        this.webrtcadapter.getAudioOutputDevices(function (devices) {
            // For each device.
            devices.forEach(function (device) {

                let info = {
                    deviceID: device.deviceId,
                    deviceText: device.label || 'speaker ' + deviceIndex
                };

                // Add to source.
                sources.push(info);
                deviceIndex++;
            });

            // Send callback.
            callback(sources);
        });
    }

    /**
     * Get all video input sources.
     * 
     * @param {Function}     callback   (sourceList: Array<{ deviceID: string, deviceText : string }>)
     */
    getVideoInputSources(callback: (sourceList: Array<{ deviceID: string, deviceText: string }>) => void): void {

        // Get all devices
        let deviceIndex = 1;
        let sources: Array<{ deviceID: string, deviceText: string }> = [];

        // Get the device list.
        this.webrtcadapter.getVideoInputDevices(function (devices) {
            // For each device.
            devices.forEach(function (device) {

                let info = {
                    deviceID: device.deviceId,
                    deviceText: device.label || 'camera ' + deviceIndex
                };

                // Add to source.
                sources.push(info);
                deviceIndex++;
            });

            // Send callback.
            callback(sources);
        });
    }

    /**
     * Attach audio output device to video element using device/sink ID.
     * 
     * @param {object}      videoElement    The video element.
     * @param {string}      deviceID        The source device id.
     */
    attachSinkIdVideoElement(videoElement: any, deviceID: string): void {

        // If no sink id applied.
        if (typeof videoElement.sinkId !== 'undefined') {
            let self = this;

            // Set the device ID.
            videoElement.setSinkId(deviceID)
                .then(function () {

                    let argum = {
                        data: deviceID,
                        text: "App has attached to Sink Id.",
                        object: self,
                        objectName: "WebRtcApp",
                        rtc: self
                    };
                    self.eventWebRtc('attachSinkId', argum);
                })
                .catch(function (e) {

                    // Log the error.
                    util.logger("error", "Error assigning device ID", e);
                });
        }
        else {
            util.logger("error", "Browser does not support output device selection.", null);
        }
    }

    /**
     * Take a picture of what is in the video element,
     * using the canvas element as the base context.
     * 
     * @param {object}      videoElement    The video element (get the width and height of the video).
     * @param {object}      canvasElement   The canvas element (set the width and height of the canvas).
     * 
     * @return {object}     The picture data; else null.
     */
    takePicture(videoElement: any, canvasElement: any): any | null {

        let data = null;
        let width = videoElement.videoWidth;
        let height = videoElement.videoHeight;

        // Get the canvas contaxt.
        let context = canvasElement.getContext('2d');
        canvasElement.width = width;
        canvasElement.height = height;

        // Draw the picture on the cavas.
        context.drawImage(videoElement, 0, 0, width, height);

        // Get the data.
        data = canvasElement.toDataURL('image/png');

        // Return the picture data.
        return data
    }

    /**
     * Close the local stream.
     */
    closeStream(): void {

        // Close stream.
        this.webrtcadapter.closeStream();
    }
}