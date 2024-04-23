import * as util from './common.mjs';
import { WebRtcApp } from './webrtcapp.mjs';

/**
 * start the WebRTC application.
 * @param {object}    options  the webrtc options.
 * @param {Function}    callback  the callback implementation, with state if any: (webRtc: WebRtc, state: any) => void.
 * @param {object}    state  any state data.
 * @example                         
 *  options = {
 *      debug: false,
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
export function startWebRTC(options: any, callback: (webRtc: WebRtc, state: any) => void, state?: any): void {

    let webRtcImp: WebRtc = null;
    try {

        // Create the webRTC interface.
        if (options.signallingURL !== "") {
            webRtcImp = new WebRtc(options);
        }
        else {
            util.logger("warn", "WebRTC Interface", "Has not been initialised, signalling URL does not exist.");
        }
    }
    catch (e) {
        util.logger("Error", "Could not start the WebRTC interface", e);
    }

    // If defined.
    if (webRtcImp) {
        try {
            // call callback
            callback(webRtcImp, state);
        } catch (e) {
            util.logger("Error", "Could not initialise the WebRTC interface", e);
        }
    }
    else {
        util.logger("warn", "WebRTC Interface", "Has not been initialised");
    }
}

/**
 * stop the WebRTC application.
 * @param {WebRtc}    webRtcImp  the callback implementation.
 */
export function stopWebRTC(webRtcImp: WebRtc): void {

    // If defined.
    if (webRtcImp) {
        try {
            // Close the connection.
            webRtcImp.webrtc.close();
        }
        catch (e) {
            util.logger("Error", "Could not stop the WebRTC interface", e);
        }
    }
    else {
        util.logger("warn", "WebRTC Interface", "Has not been initialised");
    }
};

/**
 * WebRTC Application.
 */
export class WebRtc {

    // Global.
    webrtc: WebRtcApp;
    config: any;
    parent: any;

    /**
    * WebRTC Application.
    * @param {Object}   webRtcOptions  A collection of options.  
    * @example                         
    *  options = { 
    *      debug: false,
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
        let item;

        this.parent = null;
        let options = webRtcOptions || {};
        let config = this.config = {
            debug: false,

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

        // create the webrtc.
        this.webrtc = new WebRtcApp(this.config);
        this.webrtc.parent = self;
        this.webrtc.onWebRtcEventHandler((eventName, event) => {

            // if debug is true then write all events
            if (self.config.debug) {
                util.logger("info", "Event: " + eventName, event);
            }

            try {
                // select the event.
                switch (eventName) {

                    case "connectionOpen": {
                        self.connectionOpen(event);
                        break;
                    }
                    case "connectionError": {
                        self.connectionError(event);
                        break;
                    }
                    case "connectionClose": {
                        self.connectionClose(event);
                        break;
                    }
                    case "signalError": {
                        self.signalError(event);
                        break;
                    }
                    case "signalApplications": {
                        self.signalApplications(event);
                        break;
                    }
                    case "signalUniques": {
                        self.signalUniques(event);
                        break;
                    }
                    case "signalGroups": {
                        self.signalGroups(event);
                        break;
                    }
                    case "signalSettings": {
                        self.signalSettings(event);
                        break;
                    }
                    case "signalAvailable": {
                        self.signalAvailable(event);
                        break;
                    }
                    case "signalSelfAvailable": {
                        self.signalSelfAvailable(event);
                        break;
                    }
                    case "signalMessage": {
                        self.signalMessage(event);
                        break;
                    }
                    case "signalState": {
                        self.signalState(event);
                        break;
                    }
                    case "signalDetails": {
                        self.signalDetails(event);
                        break;
                    }
                    case "signalJoinConferenceOffer": {
                        self.signalJoinConferenceOffer(event);
                        break;
                    }
                    case "signalJoinConferenceAnswer": {
                        self.signalJoinConferenceAnswer(event);
                        break;
                    }
                    case "signalSDP": {
                        self.signalSDP(event);
                        break;
                    }
                    case "signalIceCandidate": {
                        self.signalIceCandidate(event);
                        break;
                    }
                    case "signalOffer": {
                        self.signalOffer(event);
                        break;
                    }
                    case "signalAnswer": {
                        self.signalAnswer(event);
                        break;
                    }
                    case "signalFileOffer": {
                        self.signalFileOffer(event);
                        break;
                    }
                    case "signalFileAnswer": {
                        self.signalFileAnswer(event);
                        break;
                    }
                    case "signalNoAnswer": {
                        self.signalNoAnswer(event);
                        break;
                    }
                    case "signalEndCall": {
                        self.signalEndCall(event);
                        break;
                    }
                    case "signalTyping": {
                        self.signalTyping(event);
                        break;
                    }
                    case "contactICEStateChange": {
                        self.contactICEStateChange(event);
                        break;
                    }
                    case "contactICECandidateError": {
                        self.contactICECandidateError(event);
                        break;
                    }
                    case "contactICECandidate": {
                        self.contactICECandidate(event);
                        break;
                    }
                    case "contactSignalingStateChange": {
                        self.contactSignalingStateChange(event);
                        break;
                    }
                    case "contactNegotiationNeeded": {
                        self.contactNegotiationNeeded(event);
                        break;
                    }
                    case "contactRemoveStream": {
                        self.contactRemoveStream(event);
                        break;
                    }
                    case "contactAddStream": {
                        self.contactAddStream(event);
                        break;
                    }
                    case "contactReceiveSize": {
                        self.contactReceiveSize(event);
                        break;
                    }
                    case "contactReceiveComplete": {
                        self.contactReceiveComplete(event);
                        break;
                    }
                    case "contactReceiveOpen": {
                        self.contactReceiveOpen(event);
                        break;
                    }
                    case "contactReceiveClose": {
                        self.contactReceiveClose(event);
                        break;
                    }
                    case "contactReceiveError": {
                        self.contactReceiveError(event);
                        break;
                    }
                    case "contactSentSize": {
                        self.contactSentSize(event);
                        break;
                    }
                    case "contactSentComplete": {
                        self.contactSentComplete(event);
                        break;
                    }
                    case "contactSentMessage": {
                        self.contactSentMessage(event);
                        break;
                    }
                    case "contactClose": {
                        self.contactClose(event);
                        break;
                    }
                    case "contactSessionError": {
                        self.contactSessionError(event);
                        break;
                    }
                    case "contactRecordingData": {
                        self.contactRecordingData(event);
                        break;
                    }
                    case "contactRecordingStopped": {
                        self.contactRecordingStopped(event);
                        break;
                    }
                    case "recordingData": {
                        self.recordingData(event);
                        break;
                    }
                    case "recordingStopped": {
                        self.recordingStopped(event);
                        break;
                    }
                    case "attachSinkId": {
                        self.attachSinkId(event);
                        break;
                    }
                }
            } catch (e) {
                util.logger("error", "Error:", e);
            }
        });
    }

    private connectionOpen: (event: any) => void;
    /**
    * subscribe to the connectionOpen event handler.
    * @param {function}	event callback(event).
    */
    onConnectionOpen(event: (event: any) => void): void {
        // assign the event.
        this.connectionOpen = event;
    }

    private connectionError: (event: any) => void;
    /**
    * subscribe to the connectionError event handler.
    * @param {function}	event callback(event).
    */
    onConnectionError(event: (event: any) => void): void {
        // assign the event.
        this.connectionError = event;
    }

    private connectionClose: (event: any) => void;
    /**
    * subscribe to the connectionClose event handler.
    * @param {function}	event callback(event).
    */
    onConnectionClose(event: (event: any) => void): void {
        // assign the event.
        this.connectionClose = event;
    }

    private signalError: (event: any) => void;
    /**
    * subscribe to the signalError event handler.
    * @param {function}	event callback(event).
    */
    onSignalError(event: (event: any) => void): void {
        // assign the event.
        this.signalError = event;
    }

    private signalApplications: (event: any) => void;
    /**
    * subscribe to the signalApplications event handler.
    * @param {function}	event callback(event).
    */
    onSignalApplications(event: (event: any) => void): void {
        // assign the event.
        this.signalApplications = event;
    }

    private signalUniques: (event: any) => void;
    /**
    * subscribe to the signalUniques event handler.
    * @param {function}	event callback(event).
    */
    onSignalUniques(event: (event: any) => void): void {
        // assign the event.
        this.signalUniques = event;
    }

    private signalGroups: (event: any) => void;
    /**
    * subscribe to the signalGroups event handler.
    * @param {function}	event callback(event).
    */
    onSignalGroups(event: (event: any) => void): void {
        // assign the event.
        this.signalGroups = event;
    }

    private signalSettings: (event: any) => void;
    /**
    * subscribe to the signalSettings event handler.
    * @param {function}	event callback(event).
    */
    onSignalSettings(event: (event: any) => void): void {
        // assign the event.
        this.signalSettings = event;
    }

    private signalAvailable: (event: any) => void;
    /**
    * subscribe to the signalAvailable event handler.
    * @param {function}	event callback(event).
    */
    onSignalAvailable(event: (event: any) => void): void {
        // assign the event.
        this.signalAvailable = event;
    }

    private signalSelfAvailable: (event: any) => void;
    /**
    * subscribe to the signalSelfAvailable event handler.
    * @param {function}	event callback(event).
    */
    onSignalSelfAvailable(event: (event: any) => void): void {
        // assign the event.
        this.signalSelfAvailable = event;
    }

    private signalMessage: (event: any) => void;
    /**
    * subscribe to the signalMessage event handler.
    * @param {function}	event callback(event).
    */
    onSignalMessage(event: (event: any) => void): void {
        // assign the event.
        this.signalMessage = event;
    }

    private signalState: (event: any) => void;
    /**
    * subscribe to the signalState event handler.
    * @param {function}	event callback(event).
    */
    onSignalState(event: (event: any) => void): void {
        // assign the event.
        this.signalState = event;
    }

    private signalDetails: (event: any) => void;
    /**
    * subscribe to the signalDetails event handler.
    * @param {function}	event callback(event).
    */
    onSignalDetails(event: (event: any) => void): void {
        // assign the event.
        this.signalDetails = event;
    }

    private signalJoinConferenceOffer: (event: any) => void;
    /**
    * subscribe to the signalJoinConferenceOffer event handler.
    * @param {function}	event callback(event).
    */
    onSignalJoinConferenceOffer(event: (event: any) => void): void {
        // assign the event.
        this.signalJoinConferenceOffer = event;
    }

    private signalJoinConferenceAnswer: (event: any) => void;
    /**
    * subscribe to the signalJoinConferenceAnswer event handler.
    * @param {function}	event callback(event).
    */
    onSignalJoinConferenceAnswer(event: (event: any) => void): void {
        // assign the event.
        this.signalJoinConferenceAnswer = event;
    }

    private signalSDP: (event: any) => void;
    /**
    * subscribe to the signalSDP event handler.
    * @param {function}	event callback(event).
    */
    onSignalSDP(event: (event: any) => void): void {
        // assign the event.
        this.signalSDP = event;
    }

    private signalIceCandidate: (event: any) => void;
    /**
    * subscribe to the signalIceCandidate event handler.
    * @param {function}	event callback(event).
    */
    onSignalIceCandidate(event: (event: any) => void): void {
        // assign the event.
        this.signalIceCandidate = event;
    }

    private signalOffer: (event: any) => void;
    /**
    * subscribe to the signalOffer event handler.
    * @param {function}	event callback(event).
    */
    onSignalOffer(event: (event: any) => void): void {
        // assign the event.
        this.signalOffer = event;
    }

    private signalAnswer: (event: any) => void;
    /**
    * subscribe to the signalAnswer event handler.
    * @param {function}	event callback(event).
    */
    onSignalAnswer(event: (event: any) => void): void {
        // assign the event.
        this.signalAnswer = event;
    }

    private signalFileOffer: (event: any) => void;
    /**
    * subscribe to the signalFileOffer event handler.
    * @param {function}	event callback(event).
    */
    onSignalFileOffer(event: (event: any) => void): void {
        // assign the event.
        this.signalFileOffer = event;
    }

    private signalFileAnswer: (event: any) => void;
    /**
    * subscribe to the signalFileAnswer event handler.
    * @param {function}	event callback(event).
    */
    onSignalFileAnswer(event: (event: any) => void): void {
        // assign the event.
        this.signalFileAnswer = event;
    }

    private signalNoAnswer: (event: any) => void;
    /**
    * subscribe to the signalNoAnswer event handler.
    * @param {function}	event callback(event).
    */
    onSignalNoAnswer(event: (event: any) => void): void {
        // assign the event.
        this.signalNoAnswer = event;
    }

    private signalEndCall: (event: any) => void;
    /**
    * subscribe to the signalEndCall event handler.
    * @param {function}	event callback(event).
    */
    onSignalEndCall(event: (event: any) => void): void {
        // assign the event.
        this.signalEndCall = event;
    }

    private signalTyping: (event: any) => void;
    /**
    * subscribe to the signalTyping event handler.
    * @param {function}	event callback(event).
    */
    onSignalTyping(event: (event: any) => void): void {
        // assign the event.
        this.signalTyping = event;
    }

    private contactICEStateChange: (event: any) => void;
    /**
    * subscribe to the contactICEStateChange event handler.
    * @param {function}	event callback(event).
    */
    onContactICEStateChange(event: (event: any) => void): void {
        // assign the event.
        this.contactICEStateChange = event;
    }

    private contactICECandidateError: (event: any) => void;
    /**
    * subscribe to the contactICECandidateError event handler.
    * @param {function}	event callback(event).
    */
    onContactICECandidateError(event: (event: any) => void): void {
        // assign the event.
        this.contactICECandidateError = event;
    }

    private contactICECandidate: (event: any) => void;
    /**
    * subscribe to the contactICECandidate event handler.
    * @param {function}	event callback(event).
    */
    onContactICECandidate(event: (event: any) => void): void {
        // assign the event.
        this.contactICECandidate = event;
    }

    private contactSignalingStateChange: (event: any) => void;
    /**
    * subscribe to the contactSignalingStateChange event handler.
    * @param {function}	event callback(event).
    */
    onContactSignalingStateChange(event: (event: any) => void): void {
        // assign the event.
        this.contactSignalingStateChange = event;
    }

    private contactNegotiationNeeded: (event: any) => void;
    /**
    * subscribe to the contactNegotiationNeeded event handler.
    * @param {function}	event callback(event).
    */
    onContactNegotiationNeeded(event: (event: any) => void): void {
        // assign the event.
        this.contactNegotiationNeeded = event;
    }

    private contactRemoveStream: (event: any) => void;
    /**
    * subscribe to the contactRemoveStream event handler.
    * @param {function}	event callback(event).
    */
    onContactRemoveStream(event: (event: any) => void): void {
        // assign the event.
        this.contactRemoveStream = event;
    }

    private contactAddStream: (event: any) => void;
    /**
    * subscribe to the contactAddStream event handler.
    * @param {function}	event callback(event).
    */
    onContactAddStream(event: (event: any) => void): void {
        // assign the event.
        this.contactAddStream = event;
    }

    private contactReceiveSize: (event: any) => void;
    /**
    * subscribe to the contactReceiveSize event handler.
    * @param {function}	event callback(event).
    */
    onContactReceiveSize(event: (event: any) => void): void {
        // assign the event.
        this.contactReceiveSize = event;
    }

    private contactReceiveComplete: (event: any) => void;
    /**
    * subscribe to the contactReceiveComplete event handler.
    * @param {function}	event callback(event).
    */
    onContactReceiveComplete(event: (event: any) => void): void {
        // assign the event.
        this.contactReceiveComplete = event;
    }

    private contactReceiveOpen: (event: any) => void;
    /**
    * subscribe to the contactReceiveOpen event handler.
    * @param {function}	event callback(event).
    */
    onContactReceiveOpen(event: (event: any) => void): void {
        // assign the event.
        this.contactReceiveOpen = event;
    }

    private contactReceiveClose: (event: any) => void;
    /**
    * subscribe to the contactReceiveClose event handler.
    * @param {function}	event callback(event).
    */
    onContactReceiveClose(event: (event: any) => void): void {
        // assign the event.
        this.contactReceiveClose = event;
    }

    private contactReceiveError: (event: any) => void;
    /**
    * subscribe to the contactReceiveError event handler.
    * @param {function}	event callback(event).
    */
    onContactReceiveError(event: (event: any) => void): void {
        // assign the event.
        this.contactReceiveError = event;
    }

    private contactSentSize: (event: any) => void;
    /**
    * subscribe to the contactSentSize event handler.
    * @param {function}	event callback(event).
    */
    onContactSentSize(event: (event: any) => void): void {
        // assign the event.
        this.contactSentSize = event;
    }

    private contactSentComplete: (event: any) => void;
    /**
    * subscribe to the contactSentComplete event handler.
    * @param {function}	event callback(event).
    */
    onContactSentComplete(event: (event: any) => void): void {
        // assign the event.
        this.contactSentComplete = event;
    }

    private contactSentMessage: (event: any) => void;
    /**
    * subscribe to the contactSentMessage event handler.
    * @param {function}	event callback(event).
    */
    onContactSentMessage(event: (event: any) => void): void {
        // assign the event.
        this.contactSentMessage = event;
    }

    private contactClose: (event: any) => void;
    /**
    * subscribe to the contactClose event handler.
    * @param {function}	event callback(event).
    */
    onContactClose(event: (event: any) => void): void {
        // assign the event.
        this.contactClose = event;
    }

    private contactSessionError: (event: any) => void;
    /**
    * subscribe to the contactSessionError event handler.
    * @param {function}	event callback(event).
    */
    onContactSessionError(event: (event: any) => void): void {
        // assign the event.
        this.contactSessionError = event;
    }

    private contactRecordingData: (event: any) => void;
    /**
    * subscribe to the contactRecordingData event handler.
    * @param {function}	event callback(event).
    */
    onContactRecordingData(event: (event: any) => void): void {
        // assign the event.
        this.contactRecordingData = event;
    }

    private contactRecordingStopped: (event: any) => void;
    /**
    * subscribe to the contactRecordingStopped event handler.
    * @param {function}	event callback(event).
    */
    onContactRecordingStopped(event: (event: any) => void): void {
        // assign the event.
        this.contactRecordingStopped = event;
    }

    private recordingData: (event: any) => void;
    /**
    * subscribe to the recordingData event handler.
    * @param {function}	event callback(event).
    */
    onRecordingData(event: (event: any) => void): void {
        // assign the event.
        this.recordingData = event;
    }

    private recordingStopped: (event: any) => void;
    /**
    * subscribe to the recordingStopped event handler.
    * @param {function}	event callback(event).
    */
    onRecordingStopped(event: (event: any) => void): void {
        // assign the event.
        this.recordingStopped = event;
    }

    private attachSinkId: (event: any) => void;
    /**
    * subscribe to the attachSinkId event handler.
    * @param {function}	event callback(event).
    */
    onAttachSinkId(event: (event: any) => void): void {
        // assign the event.
        this.attachSinkId = event;
    }
}