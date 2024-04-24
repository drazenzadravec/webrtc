import * as util from '../mod/common.mjs';
import { startWebRTC, stopWebRTC } from '../mod/webrtc.mjs';
import * as mainApp from './main-ext.mjs';
/**
 * auth Login Access Token
 */
export function authLoginAccessToken() {
    // WebRTC options.
    let webrtcOptions = {
        debug: false,
        signallingURL: "",
        peerConnectionConfiguration: {
            iceServers: [
                {
                    "urls": "stun:stun.l.google.com:19302"
                }
            ]
        }
    };
    // access options
    let accessOptions = {
        useLoginAuth: false,
        accessToken: "",
        url: "",
        username: "",
        password: ""
    };
    // get auth details from the query string.
    getAuthFromQueryString(webrtcOptions, accessOptions);
    // Initialise the WebRTC application.
    initialiseWebRTC(webrtcOptions, accessOptions);
}
/**
 * get auth details from the query string.
 * @param {object}    webrtcOptions  the webrtc options.
 * @param {object}    accessOptions  the access options.
*/
export function getAuthFromQueryString(webrtcOptions, accessOptions) {
    // get the query.
    let urlParams = new URLSearchParams(location.search);
    let uniqueID = "";
    let conferenceAppID = "";
    // get uniqueID
    let hasUniqueID = urlParams.has('u');
    if (hasUniqueID === true) {
        // get the value.
        let uniqueIDValue = urlParams.get('u');
        if (uniqueIDValue !== "") {
            // uniqueID
            uniqueID = uniqueIDValue;
        }
    }
    // get applicationID
    let hasApplicationID = urlParams.has('a');
    if (hasApplicationID === true) {
        // get the value.
        let applicationIDValue = urlParams.get('a');
        if (applicationIDValue !== "") {
            // conferenceAppID
            conferenceAppID = applicationIDValue;
        }
    }
    // get websocket server 
    let hasWebSocket = urlParams.has('ws');
    if (hasWebSocket === true) {
        // get the value.
        let websocketValue = urlParams.get('ws');
        if (websocketValue !== "") {
            // websocket server
            webrtcOptions.signallingURL = websocketValue;
        }
    }
    // get token
    let hasToken = urlParams.has('t');
    if (hasToken === true) {
        // get the value.
        let tokenValue = urlParams.get('t');
        if (tokenValue !== "") {
            // token
            accessOptions.accessToken = tokenValue;
            // assign init contact.
            mainApp.assignContact(uniqueID, conferenceAppID);
        }
    }
}
/**
 * Initialise the WebRTC application.
 * @param {object}    webrtcOptions  the webrtc options.
 * @param {object}    state  any state data.
 */
export function initialiseWebRTC(webrtcOptions, state) {
    try {
        // start the webRTC interface.
        startWebRTC(webrtcOptions, callbackStartWebRTC, state);
    }
    catch (e) {
        util.logger("Error", "Could not initialise the WebRTC interface", e);
    }
}
/**
 * Deinitialize the WebRTC application.
 * @param {WebRtc}    webRtc the implementation.
 */
export function deinitializeWebRTC(webRtc) {
    try {
        // stop the webRTC interface.
        stopWebRTC(webRtc);
    }
    catch (e) {
        util.logger("Error", "Could not deinitialize the WebRTC interface", e);
    }
}
/**
 * callback start WebRTC application.
 * @param {WebRtc}    webRtc the implementation.
 */
function callbackStartWebRTC(webRtc, state) {
    // assign events
    webRtc.onConnectionOpen((event) => mainApp.onConnectionOpen(event));
    webRtc.onConnectionClose((event) => mainApp.onConnectionClose(event));
    webRtc.onConnectionError((event) => mainApp.onConnectionError(event));
    webRtc.onSignalError((event) => mainApp.onSignalError(event));
    webRtc.onSignalApplications((event) => mainApp.onSignalApplications(event));
    webRtc.onSignalUniques((event) => mainApp.onSignalUniques(event));
    webRtc.onSignalGroups((event) => mainApp.onSignalGroups(event));
    webRtc.onSignalSettings((event) => mainApp.onSignalSettings(event));
    webRtc.onSignalAvailable((event) => mainApp.onSignalAvailable(event));
    webRtc.onSignalSelfAvailable((event) => mainApp.onSignalSelfAvailable(event));
    webRtc.onSignalMessage((event) => mainApp.onSignalMessage(event));
    webRtc.onSignalState((event) => mainApp.onSignalState(event));
    webRtc.onSignalDetails((event) => mainApp.onSignalDetails(event));
    webRtc.onSignalNoAnswer((event) => mainApp.onSignalNoAnswer(event));
    webRtc.onSignalEndCall((event) => mainApp.onSignalEndCall(event));
    webRtc.onSignalTyping((event) => mainApp.onSignalTyping(event));
    webRtc.onSignalOffer((event) => mainApp.onSignalOffer(event));
    webRtc.onSignalAnswer((event) => mainApp.onSignalAnswer(event));
    webRtc.onSignalJoinConferenceOffer((event) => mainApp.onSignalJoinConferenceOffer(event));
    webRtc.onSignalJoinConferenceAnswer((event) => mainApp.onSignalJoinConferenceAnswer(event));
    webRtc.onSignalFileOffer((event) => mainApp.onSignalFileOffer(event));
    webRtc.onSignalFileAnswer((event) => mainApp.onSignalFileAnswer(event));
    webRtc.onSignalIceCandidate((event) => mainApp.onSignalIceCandidate(event));
    webRtc.onSignalSDP((event) => mainApp.onSignalSDP(event));
    webRtc.onContactAddStream((event) => mainApp.onContactAddStream(event));
    webRtc.onContactSentSize((event) => mainApp.onContactSentSize(event));
    webRtc.onContactSentComplete((event) => mainApp.onContactSentComplete(event));
    webRtc.onContactSentMessage((event) => mainApp.onContactSentMessage(event));
    webRtc.onContactClose((event) => mainApp.onContactClose(event));
    webRtc.onContactSessionError((event) => mainApp.onContactSessionError(event));
    webRtc.onContactReceiveSize((event) => mainApp.onContactReceiveSize(event));
    webRtc.onContactReceiveComplete((event) => mainApp.onContactReceiveComplete(event));
    webRtc.onContactReceiveClose((event) => mainApp.onContactReceiveClose(event));
    webRtc.onContactReceiveError((event) => mainApp.onContactReceiveError(event));
    webRtc.onContactReceiveOpen((event) => mainApp.onContactReceiveOpen(event));
    webRtc.onContactRemoveStream((event) => mainApp.onContactRemoveStream(event));
    webRtc.onContactICEStateChange((event) => mainApp.onContactICEStateChange(event));
    webRtc.onContactICECandidateError((event) => mainApp.onContactICECandidateError(event));
    webRtc.onContactICECandidate((event) => mainApp.onContactICECandidate(event));
    webRtc.onContactSignalingStateChange((event) => mainApp.onContactSignalingStateChange(event));
    webRtc.onContactNegotiationNeeded((event) => mainApp.onContactNegotiationNeeded(event));
    webRtc.onContactRecordingData((event) => mainApp.onContactRecordingData(event));
    webRtc.onContactRecordingStopped((event) => mainApp.onContactRecordingStopped(event));
    webRtc.onRecordingData((event) => mainApp.onRecordingData(event));
    webRtc.onRecordingStopped((event) => mainApp.onRecordingStopped(event));
    webRtc.onAttachSinkId((event) => mainApp.onAttachSinkId(event));
    // Initialise the app.
    mainApp.initialiseApplication(webRtc, state);
}
