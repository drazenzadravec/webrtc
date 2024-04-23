import * as util from '../mod/common.mjs';
import { CallClient } from './callclient.mjs';
import { ContactPeer } from '../mod/contactpeer.mjs';
import { WebRtcApp } from '../mod/webrtcapp.mjs';
import { WebRtc } from '../mod/webrtc.mjs';

/**
 * Initialise the application.
 * @param {CallClient}    callClient the implementation.
 * @param {WebRtc}    webRtc the implementation.
 * @param {object}    accessOptions  the access options.
 */
export function initialiseApplication(callClient: CallClient, webRtc: WebRtc, accessOptions: any): void {
}

/**
 * assign init contact
 * @param uniqueId  the unique contact id
 * @param applicationId the application id
 */
export function assignContact(uniqueId: string, applicationId: string): void {
}

/**
 * onConnectionOpen
 * @param arg   the current event aruments.
 */
export function onConnectionOpen(arg: any): void { }

/**
 * onConnectionClose
 * @param arg   the current event aruments.
 */
export function onConnectionClose(arg: any): void { }

/**
 * onConnectionError
 * @param arg   the current event aruments.
 */
export function onConnectionError(arg: any): void { }

/**
 * onSignalError
 * @param arg   the current event aruments.
 */
export function onSignalError(arg: any): void { }

/**
* onSignalApplications
* @param arg   the current event aruments.
*/
export function onSignalApplications(arg: any): void { }

/**
 * onSignalUniques
 * @param arg   the current event aruments.
 */
export function onSignalUniques(arg: any): void { }

/**
 * onSignalGroups
 * @param arg   the current event aruments.
 */
export function onSignalGroups(arg: any): void { }

/**
 * onSignalAvailable
 * @param arg   the current event aruments.
 */
export function onSignalAvailable(arg: any): void { }

/**
 * onSignalSettings
 * @param arg   the current event aruments.
 */
export function onSignalSettings(arg: any): void { }

/**
* onSignalSelfAvailable
* @param arg   the current event aruments.
*/
export function onSignalSelfAvailable(arg: any): void { }

/**
* onSignalMessage
* @param arg   the current event aruments.
*/
export function onSignalMessage(arg: any): void { }

/**
 * onSignalState
 * @param arg   the current event aruments.
 */
export function onSignalState(arg: any): void { }

/**
 * onSignalDetails
 * @param arg   the current event aruments.
 */
export function onSignalDetails(arg: any): void { }

/**
 * onSignalNoAnswer
 * @param arg   the current event aruments.
 */
export function onSignalNoAnswer(arg: any): void { }

/**
 * onSignalEndCall
 * @param arg   the current event aruments.
 */
export function onSignalEndCall(arg: any): void { }

/**
 * onSignalTyping
 * @param arg   the current event aruments.
 */
export function onSignalTyping(arg: any): void { }

/**
 * onSignalOffer
 * @param arg   the current event aruments.
 */
export function onSignalOffer(arg: any): void { }

/**
 * onSignalAnswer
 * @param arg   the current event aruments.
 */
export function onSignalAnswer(arg: any): void { }

/**
* onSignalJoinConferenceOffer
* @param arg   the current event aruments.
*/
export function onSignalJoinConferenceOffer(arg: any): void { }

/**
 * onSignalJoinConferenceAnswer
 * @param arg   the current event aruments.
 */
export function onSignalJoinConferenceAnswer(arg: any): void { }

/**
 * onSignalFileOffer
 * @param arg   the current event aruments.
 */
export function onSignalFileOffer(arg: any): void { }

/**
 * onSignalFileAnswer
 * @param arg   the current event aruments.
 */
export function onSignalFileAnswer(arg: any): void { }

/**
 * onSignalIceCandidate
 * @param arg   the current event aruments.
 */
export function onSignalIceCandidate(arg: any): void { }

/**
 * onSignalSDP
 * @param arg   the current event aruments.
 */
export function onSignalSDP(arg: any): void { }

/**
 * onContactAddStream
 * @param arg   the current event aruments.
 */
export function onContactAddStream(arg: any): void { }

/**
* onContactReceiveSize
* @param arg   the current event aruments.
*/
export function onContactReceiveSize(arg: any): void { }

/**
 * onContactReceiveComplete
 * @param arg   the current event aruments.
 */
export function onContactReceiveComplete(arg: any): void { }

/**
 * onContactReceiveClose
 * @param arg   the current event aruments.
 */
export function onContactReceiveClose(arg: any): void { }

/**
 * onContactReceiveError
 * @param arg   the current event aruments.
 */
export function onContactReceiveError(arg: any): void { }

/**
 * onContactReceiveOpen
 * @param arg   the current event aruments.
 */
export function onContactReceiveOpen(arg: any): void { }

/**
 * onContactRemoveStream
 * @param arg   the current event aruments.
 */
export function onContactRemoveStream(arg: any): void { }

/**
 * onContactSentSize
 * @param arg   the current event aruments.
 */
export function onContactSentSize(arg: any): void { }

/**
 * onContactSentComplete
 * @param arg   the current event aruments.
 */
export function onContactSentComplete(arg: any): void { }

/**
 * onContactSentMessage
 * @param arg   the current event aruments.
 */
export function onContactSentMessage(arg: any): void { }

/**
 * onContactClose
 * @param arg   the current event aruments.
 */
export function onContactClose(arg: any): void { }

/**
 * onContactICEStateChange
 * @param arg   the current event aruments.
 */
export function onContactICEStateChange(arg: any): void { }

/**
* onContactICECandidateError
* @param arg   the current event aruments.
*/
export function onContactICECandidateError(arg: any): void { }

/**
 * onContactICECandidate
 * @param arg   the current event aruments.
 */
export function onContactICECandidate(arg: any): void { }

/**
 * onContactSignalingStateChange
 * @param arg   the current event aruments.
 */
export function onContactSignalingStateChange(arg: any): void { }

/**
 * onContactNegotiationNeeded
 * @param arg   the current event aruments.
 */
export function onContactNegotiationNeeded(arg: any): void { }

/**
 * onContactSessionError
 * @param arg   the current event aruments.
 */
export function onContactSessionError(arg: any): void { }

/**
 * onContactRecordingData
 * @param arg   the current event aruments.
 */
export function onContactRecordingData(arg: any): void { }

/**
 * onContactRecordingStopped
 * @param arg   the current event aruments.
 */
export function onContactRecordingStopped(arg: any): void { }

/**
 * onRecordingData
 * @param arg   the current event aruments.
 */
export function onRecordingData(arg: any): void { }

/**
 * onRecordingStopped
 * @param arg   the current event aruments.
 */
export function onRecordingStopped(arg: any): void { }

/**
 * onAttachSinkId
 * @param arg   the current event aruments.
 */
export function onAttachSinkId(arg: any): void { }
