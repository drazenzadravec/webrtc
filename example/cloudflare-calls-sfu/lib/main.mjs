import * as util from '../mod/common.mjs';
import * as mainFunc from './out/app-main.mjs';
import { startCallClient, stopCallClient } from './callclient.mjs';
import * as mainApp from './main-ext.mjs';
/**
 * auth Login Access Token
 * @param {string} serviceURL the service base URL.
 * @param {string} accessTokenUrlOrPath the service URL or path to get access token.
 */
export function authLoginAccessToken(serviceURL, accessTokenUrlOrPath) {
    // get the access token.
    mainFunc.getCurrentAccessToken(accessTokenUrlOrPath, (token) => {
        // Call options.
        let callOptions = {
            debug: false,
            signallingURL: "",
            accessToken: token,
            serviceBaseURL: serviceURL,
            peerConnectionConfiguration: {
                iceServers: [
                    {
                        "urls": "stun:stun.cloudflare.com:3478"
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
        getAuthFromQueryString(callOptions, accessOptions);
        // Initialise the Call Client application.
        initialiseCallClient(callOptions, accessOptions);
    });
}
/**
* get auth details from the query string.
* @param {object}    webrtcOptions  the webrtc options.
* @param {object}    accessOptions  the access options.
*/
export function getAuthFromQueryString(webrtcOptions, accessOptions) {
    // get the query.
    var urlParams = new URLSearchParams(location.search);
    var uniqueID = "";
    var conferenceAppID = "";
    // get uniqueID
    var hasUniqueID = urlParams.has('u');
    if (hasUniqueID === true) {
        // get the value.
        var uniqueIDValue = urlParams.get('u');
        if (uniqueIDValue !== "") {
            // uniqueID
            uniqueID = uniqueIDValue;
        }
    }
    // get applicationID
    var hasApplicationID = urlParams.has('a');
    if (hasApplicationID === true) {
        // get the value.
        var applicationIDValue = urlParams.get('a');
        if (applicationIDValue !== "") {
            // conferenceAppID
            conferenceAppID = applicationIDValue;
        }
    }
    // get websocket server 
    var hasWebSocket = urlParams.has('ws');
    if (hasWebSocket === true) {
        // get the value.
        var websocketValue = urlParams.get('ws');
        if (websocketValue !== "") {
            // websocket server
            webrtcOptions.signallingURL = websocketValue;
        }
    }
    // get token
    var hasToken = urlParams.has('t');
    if (hasToken === true) {
        // get the value.
        var tokenValue = urlParams.get('t');
        if (tokenValue !== "") {
            // token
            accessOptions.accessToken = tokenValue;
            // assign init contact.
            mainApp.assignContact(uniqueID, conferenceAppID);
        }
    }
    // get access token
    var hasTokenAccess = urlParams.has('ac');
    if (hasTokenAccess === true) {
        // get the value.
        var tokenAccessValue = urlParams.get('ac');
        if (tokenAccessValue !== "") {
            // token
            webrtcOptions.accessToken = tokenAccessValue;
        }
    }
}
/**
* Initialise the Call Client application.
* @param {object}    callOptions  the webrtc options.
* @param {object}    state  any state data.
*/
export function initialiseCallClient(callOptions, state) {
    try {
        // start the Call Client interface.
        startCallClient(callOptions, callbackStartCallClient, state);
    }
    catch (e) {
        util.logger("Error", "Could not initialise the Call Client interface", e);
    }
}
/**
 * Deinitialize the Call Client application.
 * @param {CallClient}    callClient the implementation.
 */
export function deinitializeCallClient(callClient) {
    try {
        // stop the CallClient interface.
        stopCallClient(callClient);
    }
    catch (e) {
        util.logger("Error", "Could not deinitialize the Call Client interface", e);
    }
}
/**
* callback start Call Client application.
* @param {CallClient}    callClient the implementation.
*/
function callbackStartCallClient(callClient, state) {
    // assign events
    callClient.webRtcImp.onConnectionOpen((event) => mainApp.onConnectionOpen(event));
    callClient.webRtcImp.onConnectionClose((event) => mainApp.onConnectionClose(event));
    callClient.webRtcImp.onConnectionError((event) => mainApp.onConnectionError(event));
    callClient.webRtcImp.onSignalError((event) => mainApp.onSignalError(event));
    callClient.webRtcImp.onSignalApplications((event) => mainApp.onSignalApplications(event));
    callClient.webRtcImp.onSignalUniques((event) => mainApp.onSignalUniques(event));
    callClient.webRtcImp.onSignalGroups((event) => mainApp.onSignalGroups(event));
    callClient.webRtcImp.onSignalSettings((event) => mainApp.onSignalSettings(event));
    callClient.webRtcImp.onSignalAvailable((event) => mainApp.onSignalAvailable(event));
    callClient.webRtcImp.onSignalSelfAvailable((event) => mainApp.onSignalSelfAvailable(event));
    callClient.webRtcImp.onSignalMessage((event) => mainApp.onSignalMessage(event));
    callClient.webRtcImp.onSignalState((event) => mainApp.onSignalState(event));
    callClient.webRtcImp.onSignalDetails((event) => mainApp.onSignalDetails(event));
    callClient.webRtcImp.onSignalNoAnswer((event) => mainApp.onSignalNoAnswer(event));
    callClient.webRtcImp.onSignalEndCall((event) => mainApp.onSignalEndCall(event));
    callClient.webRtcImp.onSignalTyping((event) => mainApp.onSignalTyping(event));
    callClient.webRtcImp.onSignalOffer((event) => mainApp.onSignalOffer(event));
    callClient.webRtcImp.onSignalAnswer((event) => mainApp.onSignalAnswer(event));
    callClient.webRtcImp.onSignalJoinConferenceOffer((event) => mainApp.onSignalJoinConferenceOffer(event));
    callClient.webRtcImp.onSignalJoinConferenceAnswer((event) => mainApp.onSignalJoinConferenceAnswer(event));
    callClient.webRtcImp.onSignalFileOffer((event) => mainApp.onSignalFileOffer(event));
    callClient.webRtcImp.onSignalFileAnswer((event) => mainApp.onSignalFileAnswer(event));
    callClient.webRtcImp.onSignalIceCandidate((event) => mainApp.onSignalIceCandidate(event));
    callClient.webRtcImp.onSignalSDP((event) => mainApp.onSignalSDP(event));
    callClient.webRtcImp.onContactAddStream((event) => mainApp.onContactAddStream(event));
    callClient.webRtcImp.onContactSentSize((event) => mainApp.onContactSentSize(event));
    callClient.webRtcImp.onContactSentComplete((event) => mainApp.onContactSentComplete(event));
    callClient.webRtcImp.onContactSentMessage((event) => mainApp.onContactSentMessage(event));
    callClient.webRtcImp.onContactClose((event) => mainApp.onContactClose(event));
    callClient.webRtcImp.onContactSessionError((event) => mainApp.onContactSessionError(event));
    callClient.webRtcImp.onContactReceiveSize((event) => mainApp.onContactReceiveSize(event));
    callClient.webRtcImp.onContactReceiveComplete((event) => mainApp.onContactReceiveComplete(event));
    callClient.webRtcImp.onContactReceiveClose((event) => mainApp.onContactReceiveClose(event));
    callClient.webRtcImp.onContactReceiveError((event) => mainApp.onContactReceiveError(event));
    callClient.webRtcImp.onContactReceiveOpen((event) => mainApp.onContactReceiveOpen(event));
    callClient.webRtcImp.onContactRemoveStream((event) => mainApp.onContactRemoveStream(event));
    callClient.webRtcImp.onContactICEStateChange((event) => mainApp.onContactICEStateChange(event));
    callClient.webRtcImp.onContactICECandidateError((event) => mainApp.onContactICECandidateError(event));
    callClient.webRtcImp.onContactICECandidate((event) => mainApp.onContactICECandidate(event));
    callClient.webRtcImp.onContactSignalingStateChange((event) => mainApp.onContactSignalingStateChange(event));
    callClient.webRtcImp.onContactNegotiationNeeded((event) => mainApp.onContactNegotiationNeeded(event));
    callClient.webRtcImp.onContactRecordingData((event) => mainApp.onContactRecordingData(event));
    callClient.webRtcImp.onContactRecordingStopped((event) => mainApp.onContactRecordingStopped(event));
    callClient.webRtcImp.onRecordingData((event) => mainApp.onRecordingData(event));
    callClient.webRtcImp.onRecordingStopped((event) => mainApp.onRecordingStopped(event));
    callClient.webRtcImp.onAttachSinkId((event) => mainApp.onAttachSinkId(event));
    // Initialise the app.
    mainApp.initialiseApplication(callClient, callClient.webRtcImp, state);
}
