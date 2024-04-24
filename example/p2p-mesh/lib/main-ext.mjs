import * as util from '../mod/common.mjs';
/**
 * Initialise the application.
 * @param {WebRtc}    webRtc the implementation.
 * @param {object}    accessOptions  the access options.
 */
export function initialiseApplication(webRtc, accessOptions) {
    // init app.
    initialiseApplicationEx(webRtc, accessOptions);
    // Get audio and video source devices.
    getSourceDevices(webRtc);
}
/**
 * assign init contact
 * @param uniqueId  the unique contact id
 * @param applicationId the application id
 */
export function assignContact(uniqueId, applicationId) {
    uniqueID = uniqueId;
    conferenceAppID = applicationId;
}
/**
 * Initialise the application.
 * @param {WebRtc}    webRtc the implementation.
 * @param {object}    accessOptions  the access options.
 */
function initialiseApplicationEx(webRtc, accessOptions) {
    // The container div.
    containerDivElement = document.getElementById("container");
    conatinerDivRemoteVideoShow = document.getElementById("remoteVideoShow");
    // Assign the common conference application ID.
    conferenceApplicationID = conferenceAppID;
    // Get the client details.
    uniqueIDElement = document.getElementById("uniqueID");
    uniqueIDElement.value = uniqueID;
    applicationIDElement = document.getElementById("applicationID");
    availableElement = document.getElementById("available");
    broadcastElement = document.getElementById("broadcast");
    broadcastAppIDElement = document.getElementById("broadcastAppID");
    clientStateElement = document.getElementById("clientState");
    // Get the contact details.
    contactUniqueIDElement = document.getElementById("contactUniqueID");
    contactApplicationIDElement = document.getElementById("contactApplicationID");
    contactUniqueIDListButton = document.getElementById("contactUniqueIDListButton");
    contactApplicationIDListButton = document.getElementById("contactApplicationIDListButton");
    contactGroupListButton = document.getElementById("contactGroupListButton");
    alertTextList = document.getElementById("alertTextList");
    // Assign the conference ID.
    applicationIDElement.value = conferenceApplicationID;
    contactApplicationIDElement.value = conferenceApplicationID;
    // Assign the list of possible conference contacts.
    if (conferenceContactList) {
        conferenceContactList.push("fred");
        conferenceContactList.push("david");
        conferenceContactList.push("jack");
        conferenceContactList.push("taylor");
        conferenceContactList.push("holly");
        conferenceContactList.push("guest");
    }
    // For each conference contact.
    conferenceContactList.forEach(function (uniqueID) {
        // Create the conference contacts.
        createConferenceContact(webRtc, uniqueID, conferenceApplicationID);
        // Create a new contact.
        createNewContact(uniqueID, conferenceApplicationID);
    });
    // Assign the local video element.
    localVideoElement = document.getElementById("localVideo");
    alertTextElement = document.getElementById("alertText");
    alertTextBackElement = document.getElementById("alertTextBack");
    alertTextMessageElement = document.getElementById("alertTextMessage");
    contactSendMessageElement = document.getElementById("contactSendMessage");
    // Call and end call elements.
    startCamButton = document.getElementById("startCamButton");
    stopCamButton = document.getElementById("stopCamButton");
    toggleMuteAudioButton = document.getElementById("toggleMuteAudioButton");
    toggleMuteAllRemoteButton = document.getElementById("muteAllRemote");
    videoCallButton = document.getElementById("videoCallButton");
    endCallButton = document.getElementById("endCallButton");
    changeSettingsButton = document.getElementById("changeSettingsButton");
    contactAvailableButton = document.getElementById("contactAvailableButton");
    contactSendMessageButton = document.getElementById("contactSendMessageButton");
    contactSendMessageClearButton = document.getElementById("contactSendMessageClearButton");
    contactClearListButton = document.getElementById("contactClearListButton");
    startRecodingButton = document.getElementById("startRecodingButton");
    stopRecodingButton = document.getElementById("stopRecodingButton");
    clientStateButton = document.getElementById("clientStateButton");
    // Get the video audio parms.
    useVideoElement = document.getElementById("useVideo");
    useAudioElement = document.getElementById("useAudio");
    useScreenElement = document.getElementById("useScreen");
    useWindowElement = document.getElementById("useWindow");
    // Volume control.
    localVolumeControlElement = document.getElementById("localVolumeControl");
    // Selection.
    audioInputSelect = document.getElementById("audioSource");
    audioOutputSelect = document.getElementById("audioOutput");
    videoSelect = document.getElementById("videoSource");
    selectors = [audioInputSelect, audioOutputSelect, videoSelect];
    // File transfer.
    statusMessage = document.querySelector('span#status');
    fileInput = document.querySelector('input#fileInput');
    downloadAnchor = document.querySelector('a#download');
    sendReceiveProgress = document.querySelector('progress#sendReceiveProgress');
    fileInputStartTransferButton = document.querySelector('input#fileInputStartTransferButton');
    fileInputStopTransferButton = document.querySelector('input#fileInputStopTransferButton');
    changeSettingsButton.addEventListener("click", (e) => {
        // change settings.
        changeClientSettings(webRtc, accessOptions);
    });
    // File input event handler.
    fileInput.addEventListener('change', handleFileInputChange, false);
    fileInputStartTransferButton.addEventListener("click", (e) => {
        fileInputStartTransfer(webRtc.webrtc);
    });
    fileInputStopTransferButton.addEventListener("click", (e) => {
        fileInputStopTransfer(webRtc.webrtc);
    });
    // Start camera
    startCamButton.addEventListener("click", (e) => {
        startLocalVideo(webRtc);
    });
    stopCamButton.addEventListener("click", (e) => {
        closeLocalVideo(webRtc);
    });
    // Start recording
    startRecodingButton.addEventListener("click", (e) => {
        startRecording(webRtc);
    });
    stopRecodingButton.addEventListener("click", (e) => {
        stopRecording(webRtc);
    });
    // Start a new call.
    videoCallButton.addEventListener("click", (e) => {
        makeCall(webRtc);
    });
    // Add an end call handler.
    endCallButton.addEventListener("click", (e) => {
        endCall(webRtc);
    });
    // Add a change settings handler.
    clientStateButton.addEventListener("click", (e) => {
        changeClientState(webRtc);
    });
    // Add a contact available handler.
    contactAvailableButton.addEventListener("click", (e) => {
        contactAvailableRequest(webRtc.webrtc);
    });
    // Add a send message to contact handler.
    contactSendMessageButton.addEventListener("click", (e) => {
        contactSendMessage(webRtc.webrtc);
    });
    // Add a send message to contact handler.
    contactSendMessageClearButton.addEventListener("click", contactClearButton);
    // Add contact list items handler.
    contactUniqueIDListButton.addEventListener("click", (e) => {
        contactUniqueIDList(webRtc);
    });
    contactApplicationIDListButton.addEventListener("click", (e) => {
        contactApplicationIDList(webRtc);
    });
    contactGroupListButton.addEventListener("click", (e) => {
        contactGroupList(webRtc);
    });
    contactClearListButton.addEventListener("click", contactClearList);
    // Mute handler.
    toggleMuteAudioButton.addEventListener("click", (e) => {
        toggleMuteAudio(webRtc);
    });
    toggleMuteAllRemoteButton.addEventListener("click", (e) => {
        toggleMuteRemote(webRtc);
    });
    // Contact typing handler.
    contactSendMessageElement.addEventListener("focus", (e) => {
        contactTypingMessageStart(webRtc.webrtc);
    });
    contactSendMessageElement.addEventListener("blur", (e) => {
        contactTypingMessageStop(webRtc.webrtc);
    });
    // Volume control handlers
    localVolumeControlElement.addEventListener('change', setVolumeLocal);
    localVolumeControlElement.addEventListener('input', setVolumeLocal);
    // Set the local video volume to 0.
    localVolumeControlElement.value = 0;
    localVideoElement.volume = 0;
}
/**
 * Get audio and video source devices.
 * @param {WebRtc}    webRtc the implementation.
 */
function getSourceDevices(webRtc) {
    // Handles being called several times to update labels. Preserve values.
    var values = selectors.map(function (select) {
        return select.value;
    });
    selectors.forEach(function (select) {
        while (select.firstChild) {
            select.removeChild(select.firstChild);
        }
    });
    // List a  devices.
    webRtc.webrtc.getAudioInputSources(function (sources) {
        // For each audio input source.
        sources.forEach(function (info) {
            var option = document.createElement('option');
            option.value = info.deviceID;
            option.text = info.deviceText;
            audioInputSelect.appendChild(option);
        });
    });
    webRtc.webrtc.getAudioOutputSources(function (sources) {
        // For each audio output source.
        sources.forEach(function (info) {
            var option = document.createElement('option');
            option.value = info.deviceID;
            option.text = info.deviceText;
            audioOutputSelect.appendChild(option);
        });
    });
    webRtc.webrtc.getVideoInputSources(function (sources) {
        // For each video input source.
        sources.forEach(function (info) {
            var option = document.createElement('option');
            option.value = info.deviceID;
            option.text = info.deviceText;
            videoSelect.appendChild(option);
        });
    });
    selectors.forEach(function (select, selectorIndex) {
        if (Array.prototype.slice.call(select.childNodes).some(function (n) {
            return n.value === values[selectorIndex];
        })) {
            select.value = values[selectorIndex];
        }
    });
}
/**
 * onConnectionOpen
 * @param arg   the current event aruments.
 */
export function onConnectionOpen(arg) {
    alertTextElement.innerHTML = "Connection has opened.";
}
/**
 * onConnectionClose
 * @param arg   the current event aruments.
 */
export function onConnectionClose(arg) {
    alertTextElement.innerHTML = "Connection has closed.";
}
/**
 * onConnectionError
 * @param arg   the current event aruments.
 */
export function onConnectionError(arg) {
    alertTextElement.innerHTML = "Connection error: " + arg.data;
}
/**
 * onSignalError
 * @param arg   the current event aruments.
 */
export function onSignalError(arg) {
    alertTextElement.innerHTML = "Error encountered from signalling: " + arg.error;
}
/**
 * onSignalSettings
 * @param arg   the current event aruments.
 */
export function onSignalSettings(arg) {
    alertTextElement.innerHTML = "Client settings have been applied: " + arg.setting;
}
/**
 * onSignalSelfAvailable
 * @param arg   the current event aruments.
 */
export function onSignalSelfAvailable(arg) {
    alertTextBackElement.innerHTML = "The contact is available: " + arg.available;
}
/**
 * onSignalApplications
 * @param arg   the current event aruments.
 */
export function onSignalApplications(arg) {
    // Clear.
    alertTextList.innerHTML = "<b>ApplicationID</b><br>";
    var existsText = alertTextList.innerHTML;
    // For each item.
    for (var u in arg.list) {
        // Add item.
        alertTextList.innerHTML = existsText + arg.list[u].application + "<br>";
        existsText = alertTextList.innerHTML;
    }
}
/**
 * onSignalUniques
 * @param arg   the current event aruments.
 */
export function onSignalUniques(arg) {
    // Clear.
    alertTextList.innerHTML = "<b>UniqueID</b><br>";
    var existsText = alertTextList.innerHTML;
    // For each item.
    for (var u in arg.list) {
        // Add item.
        alertTextList.innerHTML = existsText + arg.list[u].unique + "<br>";
        existsText = alertTextList.innerHTML;
    }
}
/**
 * onSignalGroups
 * @param arg   the current event aruments.
 */
export function onSignalGroups(arg) {
    // Clear.
    alertTextList.innerHTML = "<b>UniqueID, ApplicationID</b><br>";
    var existsText = alertTextList.innerHTML;
    // For each item.
    for (var u in arg.list) {
        // Add item.
        alertTextList.innerHTML = existsText + arg.list[u].unique + ", " + arg.list[u].application + "<br>";
        existsText = alertTextList.innerHTML;
    }
}
/**
 * onSignalAvailable
 * @param arg   the current event aruments.
 */
export function onSignalAvailable(arg) {
    var contact = arg.contact;
    var uniqueID = contact.getUniqueID();
    var applicationID = contact.getApplicationID();
    // If available.
    if (arg.available === true) {
        let webrtc = arg.rtc;
        // The contact has sent a message
        // to the signalling server asking
        // if this client is available.
        // Add the local video stream to the contact stream.
        var localStream = webrtc.webrtcadapter.getStream();
        contact.addStreamTracks(localStream);
        // Create the call offer and send the call request.
        contact.sendJoinConferenceOfferRequest();
    }
}
/**
 * onSignalMessage
 * @param arg   the current event aruments.
 */
export function onSignalMessage(arg) {
    var contact = arg.contact;
    var uniqueID = contact.getUniqueID();
    var applicationID = contact.getApplicationID();
    // Show message.
    var existsText = alertTextMessageElement.innerHTML;
    alertTextMessageElement.innerHTML = existsText + "<b>" + uniqueID + " from " + applicationID + " wrote:</b> " + arg.message + "<br>";
}
/**
 * onSignalState
 * @param arg   the current event aruments.
 */
export function onSignalState(arg) {
    var contact = arg.contact;
    var uniqueID = contact.getUniqueID();
    var applicationID = contact.getApplicationID();
    var state = arg.state;
    // Get the contact video index.
    var peerIndex = conferenceContactList.indexOf(uniqueID);
    var remoteState = conferenceRemoteStateElement[peerIndex];
    // Set the contact state.
    remoteState.innerHTML = state;
}
/**
 * onSignalDetails
 * @param arg   the current event aruments.
 */
export function onSignalDetails(arg) {
    var contact = arg.contact;
    var uniqueID = contact.getUniqueID();
    var applicationID = contact.getApplicationID();
    var details = arg.details;
    // Get the contact video index.
    var peerIndex = conferenceContactList.indexOf(uniqueID);
    //TODO assign the details.
}
/**
 * onSignalNoAnswer
 * @param arg   the current event aruments.
 */
export function onSignalNoAnswer(arg) {
    var contact = arg.contact;
    var uniqueID = contact.getUniqueID();
    var applicationID = contact.getApplicationID();
    // Show did not answer.
    alertTextElement.innerHTML = uniqueID + " from " + applicationID + " is not available.";
}
/**
 * onSignalEndCall
 * @param arg   the current event aruments.
 */
export function onSignalEndCall(arg) {
    var contact = arg.contact;
    var uniqueID = contact.getUniqueID();
    var applicationID = contact.getApplicationID();
    // Remove the remote stream.
    contact.closeStream();
    // Remote contact ended the call.
    alertTextElement.innerHTML = uniqueID + " from " + applicationID + " ended the call.";
}
/**
 * onSignalTyping
 * @param arg   the current event aruments.
 */
export function onSignalTyping(arg) {
    var contact = arg.contact;
    var uniqueID = contact.getUniqueID();
    var applicationID = contact.getApplicationID();
    // If contact typing a message.
    if (arg.typing && arg.typing === true) {
        alertTextBackElement.innerHTML = uniqueID + " from " + applicationID + " is typing a message.";
    }
    else {
        alertTextBackElement.innerHTML = uniqueID + " from " + applicationID + " has stopped typing.";
    }
}
/**
 * onSignalOffer
 * @param arg   the current event aruments.
 */
export function onSignalOffer(arg) {
    let webrtc = arg.rtc;
    // Answer the contact call.
    let contact = arg.contact;
    answerCall(webrtc, contact);
}
/**
 * onSignalAnswer
 * @param arg   the current event aruments.
 */
export function onSignalAnswer(arg) {
    // Call answered for the contact call.
    var contact = arg.contact;
    var uniqueID = contact.getUniqueID();
    var applicationID = contact.getApplicationID();
    // Remote client answered the call.
    alertTextElement.innerHTML = uniqueID + " from " + applicationID + " accepted the call.";
}
/**
 * onSignalJoinConferenceOffer
 * @param arg   the current event aruments.
 */
export function onSignalJoinConferenceOffer(arg) {
    let webrtc = arg.rtc;
    // Answer the contact call.
    let contact = arg.contact;
    answerJoinConference(webrtc, contact);
}
/**
 * onSignalJoinConferenceAnswer
 * @param arg   the current event aruments.
 */
export function onSignalJoinConferenceAnswer(arg) {
    // Call answered for the contact call.
    var contact = arg.contact;
    var uniqueID = contact.getUniqueID();
    var applicationID = contact.getApplicationID();
    // Remote client answered the call.
    alertTextElement.innerHTML = uniqueID + " from " + applicationID + " has joined the conference.";
}
/**
 * onSignalFileOffer
 * @param arg   the current event aruments.
 */
export function onSignalFileOffer(arg) {
    // Answer the contact file call.
    var contact = arg.contact;
    answerFileTransfer(contact, arg.name, arg.size);
}
/**
 * onSignalFileAnswer
 * @param arg   the current event aruments.
 */
export function onSignalFileAnswer(arg) {
    // Call answered for the contact file call.
    var contact = arg.contact;
    var uniqueID = contact.getUniqueID();
    var applicationID = contact.getApplicationID();
    // Remote client answered the call.
    alertTextElement.innerHTML = uniqueID + " from " + applicationID + " accepted the file transfer.";
}
/**
 * onSignalIceCandidate
 * @param arg   the current event aruments.
 */
export function onSignalIceCandidate(arg) {
    var contact = arg.contact;
    // Set the ICE candidate.
    contact.addIceCandidate(arg.candidate);
}
/**
 * onSignalSDP
 * @param arg   the current event aruments.
 */
export function onSignalSDP(arg) {
    var contact = arg.contact;
    // Set the remote description.
    contact.setRemoteDescription(arg.sdp);
}
/**
 * onContactAddStream
 * @param arg   the current event aruments.
 */
export function onContactAddStream(arg) {
    // Assign this contact remote stream
    // to the remote video element.
    var contact = arg.contact;
    var uniqueID = contact.getUniqueID();
    var applicationID = contact.getApplicationID();
    // Get contact list.
    var contacts = isContactInList(contact);
    if (contacts.length <= 0) {
        // Add to list.
        conferenceContactList.push(contact.uniqueID);
        // Create the conference contacts.
        createNewContact(contact.uniqueID, contact.applicationID);
    }
    // Get the contact video index.
    var peerIndex = conferenceContactList.indexOf(uniqueID);
    var remoteVideo = conferenceRemoteVideoElement[peerIndex];
    // Set the stream to the video element.
    if (arg.add.streams) {
        contact.setRemoteStreamToVideoElement(remoteVideo, arg.add.streams);
    }
}
/**
 * onContactReceiveSize
 * @param arg   the current event aruments.
 */
export function onContactReceiveSize(arg) {
    // Contact details.
    var contact = arg.contact;
    // Set the current file progress.
    sendReceiveProgress.value = arg.size;
}
/**
 * onContactReceiveComplete
 * @param arg   the current event aruments.
 */
export function onContactReceiveComplete(arg) {
    // Contact details.
    var contact = arg.contact;
    // Contact receive file complete.
    receiveFileComplete(contact, arg.buffer);
}
/**
 * onContactReceiveClose
 * @param arg   the current event aruments.
 */
export function onContactReceiveClose(arg) {
}
/**
 * onContactReceiveError
 * @param arg   the current event aruments.
 */
export function onContactReceiveError(arg) {
}
/**
 * onContactReceiveOpen
 * @param arg   the current event aruments.
 */
export function onContactReceiveOpen(arg) {
}
/**
 * onContactRemoveStream
 * @param arg   the current event aruments.
 */
export function onContactRemoveStream(arg) {
}
/**
 * onContactSentSize
 * @param arg   the current event aruments.
 */
export function onContactSentSize(arg) {
    // Contact details.
    var contact = arg.contact;
    // Set the current file progress.
    sendReceiveProgress.value = arg.size;
}
/**
 * onContactSentComplete
 * @param arg   the current event aruments.
 */
export function onContactSentComplete(arg) {
    // Contact details.
    var contact = arg.contact;
    // Upload a completed.
    statusMessage.textContent = "File upload has completed";
}
/**
 * onContactSentMessage
 * @param arg   the current event aruments.
 */
export function onContactSentMessage(arg) {
}
/**
 * onContactClose
 * @param arg   the current event aruments.
 */
export function onContactClose(arg) {
}
/**
 * onContactICEStateChange
 * @param arg   the current event aruments.
 */
export function onContactICEStateChange(arg) {
}
/**
 * onContactICECandidateError
 * @param arg   the current event aruments.
 */
export function onContactICECandidateError(arg) {
}
/**
 * onContactICECandidate
 * @param arg   the current event aruments.
 */
export function onContactICECandidate(arg) {
}
/**
 * onContactSignalingStateChange
 * @param arg   the current event aruments.
 */
export function onContactSignalingStateChange(arg) {
}
/**
 * onContactNegotiationNeeded
 * @param arg   the current event aruments.
 */
export function onContactNegotiationNeeded(arg) {
}
/**
 * onContactSessionError
 * @param arg   the current event aruments.
 */
export function onContactSessionError(arg) {
}
/**
 * onContactRecordingData
 * @param arg   the current event aruments.
 */
export function onContactRecordingData(arg) {
}
/**
 * onContactRecordingStopped
 * @param arg   the current event aruments.
 */
export function onContactRecordingStopped(arg) {
}
/**
 * onRecordingData
 * @param arg   the current event aruments.
 */
export function onRecordingData(arg) {
    // If recording buffer.
    if (recordedBlobs) {
        recordedBlobs.push(arg.data);
    }
}
/**
 * onRecordingStopped
 * @param arg   the current event aruments.
 */
export function onRecordingStopped(arg) {
    // Create a Blob from the recorded data.
    var blob = new Blob(recordedBlobs, { type: 'video/webm' });
    var url = window.URL.createObjectURL(blob);
    // Create a new a element.
    var a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'recordedMedia.webm';
    // Add the a element.
    document.body.appendChild(a);
    a.click();
    // Set download timer.
    setTimeout(function () {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);
}
/**
 * onAttachSinkId
 * @param arg   the current event aruments.
 */
export function onAttachSinkId(arg) {
}
/**
 * Create a new contact.
 *
 * @param {string}          uniqueID        The uniqueID of the contact.
 * @param {applicationID}   applicationID   The applicationID of the contact.
 */
function createNewContact(uniqueID, applicationID) {
    // Create video elements.
    conferenceDialogVideoRemoteDiv.push(document.createElement("div"));
    conferenceDialogVideoRemoteDiv[conferenceIndex].id = "dialogVideoRemote" + conferenceIndex;
    conferenceResizableRemoteDiv.push(document.createElement("div"));
    conferenceResizableRemoteDiv[conferenceIndex].id = "resizableRemote" + conferenceIndex;
    conferenceRemoteVideoElement.push(document.createElement("video"));
    conferenceRemoteVideoElement[conferenceIndex].id = "remoteVideo" + conferenceIndex;
    conferenceRemoteVideoElement[conferenceIndex].autoplay = true;
    conferenceRemoteVideoElement[conferenceIndex].playsInline = true;
    conferenceRemoteVideoElement[conferenceIndex].controls = true;
    conferenceRemoteVideoElement[conferenceIndex].width = "380";
    conferenceRemoteVideoElement[conferenceIndex].height = "340";
    conferenceResizableRemoteDiv[conferenceIndex].appendChild(conferenceRemoteVideoElement[conferenceIndex]);
    conferenceDialogVideoRemoteDiv[conferenceIndex].appendChild(conferenceResizableRemoteDiv[conferenceIndex]);
    containerDivElement.appendChild(conferenceDialogVideoRemoteDiv[conferenceIndex]);
    conferenceRemoteShowElement.push(document.createElement("input"));
    conferenceRemoteShowElement[conferenceIndex].id = "videoRemoteShow" + conferenceIndex;
    conferenceRemoteShowElement[conferenceIndex].type = "button";
    conferenceRemoteShowElement[conferenceIndex].value = uniqueID;
    conferenceRemoteShowElement[conferenceIndex].className = "buttonContact ui-button ui-corner-all ui-widget";
    conferenceRemoteStateElement.push(document.createElement("div"));
    conferenceRemoteStateElement[conferenceIndex].id = "remoteState" + conferenceIndex;
    conferenceRemoteStateElement[conferenceIndex].innerHTML = "Unknown";
    conferenceRemoteStateElement[conferenceIndex].className = "remoteContactsStateClass";
    conferenceRemoteVolumeElement.push(document.createElement("input"));
    conferenceRemoteVolumeElement[conferenceIndex].id = "remoteVolume" + conferenceIndex;
    conferenceRemoteVolumeElement[conferenceIndex].type = "range";
    conferenceRemoteVolumeElement[conferenceIndex].min = "0";
    conferenceRemoteVolumeElement[conferenceIndex].max = "100";
    conferenceRemoteVolumeElement[conferenceIndex].step = "1";
    conferenceRemoteVolumeElement[conferenceIndex].innerHTML = uniqueID;
    conferenceRemoteVolumeElement[conferenceIndex].className = "remoteContactsClass";
    conferenceRemoteVolumeElement[conferenceIndex].addEventListener('change', setVolumeRemote);
    conferenceRemoteVolumeElement[conferenceIndex].addEventListener('input', setVolumeRemote);
    conferenceRemoteDiv.push(document.createElement("div"));
    conferenceRemoteDiv[conferenceIndex].id = "remoteDisplay" + conferenceIndex;
    conferenceRemoteDiv[conferenceIndex].className = "contactList";
    conferenceRemoteDiv[conferenceIndex].appendChild(conferenceRemoteShowElement[conferenceIndex]);
    conferenceRemoteDiv[conferenceIndex].appendChild(conferenceRemoteStateElement[conferenceIndex]);
    conferenceRemoteDiv[conferenceIndex].appendChild(conferenceRemoteVolumeElement[conferenceIndex]);
    conatinerDivRemoteVideoShow.appendChild(conferenceRemoteDiv[conferenceIndex]);
    // Add remote video.
    initRemoteVideo(conferenceResizableRemoteDiv[conferenceIndex].id, conferenceRemoteVideoElement[conferenceIndex].id, conferenceDialogVideoRemoteDiv[conferenceIndex].id, conferenceRemoteShowElement[conferenceIndex].id, uniqueID, applicationID);
    // Increment the count.
    conferenceIndex++;
}
/**
 * Start the video and audio.
 * @param {WebRtc}    webRtc the implementation.
 */
function startLocalVideo(webRtc) {
    // Add the local video element.
    webRtc.webrtc.setLocalVideoElement(localVideoElement);
    // if screen or window.
    if (useScreenElement.checked || useWindowElement.checked) {
        // use screen
        if (useScreenElement.checked) {
            // Capture constraints
            let constraints = {
                video: {
                    displaySurface: 'screen'
                },
                audio: true
            };
            webRtc.webrtc.createStreamCaptureEx(constraints);
        }
        else {
            // use window
            if (useWindowElement.checked) {
                // Capture constraints
                let constraints = {
                    video: {
                        displaySurface: 'window'
                    },
                    audio: true
                };
                webRtc.webrtc.createStreamCaptureEx(constraints);
            }
        }
    }
    else if (useAudioElement.checked || useVideoElement.checked) {
        // Start the local video.
        webRtc.webrtc.createStream(useAudioElement.checked, useVideoElement.checked);
    }
}
/**
 * Close the local stream.
 * @param {WebRtc}    webRtc the implementation.
 */
function closeLocalVideo(webRtc) {
    // Close the local stream.
    webRtc.webrtc.closeStream();
}
/**
 * Start recording local stream.
 * @param {WebRtc}    webRtc the implementation.
 */
function startRecording(webRtc) {
    // Clear the buffer.
    recordedBlobs = [];
    if (whatBrowser().toLowerCase().includes("firefox")) {
        // Recording mime type.
        var options = {
            mimeType: 'video/webm;codecs=vp8,opus'
        };
        // Is mime type supported.
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            util.trace(options.mimeType + ' is not supported');
        }
        else {
            // Collect 10ms of data.
            var timeInterval = 10;
            webRtc.webrtc.webrtcadapter.startRecording(options, timeInterval);
        }
    }
    if (whatBrowser().toLowerCase().includes("chrome")) {
        // Recording mime type.
        var options = {
            mimeType: 'video/webm;codecs=h264,opus'
        };
        // Is mime type supported.
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            util.trace(options.mimeType + ' is not supported');
        }
        else {
            // Collect 10ms of data.
            var timeInterval = 10;
            webRtc.webrtc.webrtcadapter.startRecording(options, timeInterval);
        }
    }
    if (whatBrowser().toLowerCase().includes("edge")) {
        // Recording mime type.
        var options = {
            mimeType: 'video/webm;codecs=h264,opus'
        };
        // Is mime type supported.
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            util.trace(options.mimeType + ' is not supported');
        }
        else {
            // Collect 10ms of data.
            var timeInterval = 10;
            webRtc.webrtc.webrtcadapter.startRecording(options, timeInterval);
        }
    }
    if (whatBrowser().toLowerCase().includes("safari")) {
        // Recording mime type.
        var options = {
            mimeType: 'video/webm;codecs=h264,opus'
        };
        // Is mime type supported.
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            util.trace(options.mimeType + ' is not supported');
        }
        else {
            // Collect 10ms of data.
            var timeInterval = 10;
            webRtc.webrtc.webrtcadapter.startRecording(options, timeInterval);
        }
    }
}
/**
 * Stop recording local stream.
 * @param {WebRtc}    webRtc the implementation.
 */
function stopRecording(webRtc) {
    webRtc.webrtc.webrtcadapter.stopRecording();
}
/**
 * Make a call to all the contacts.
 * @param {WebRtc}    webRtc the implementation.
 */
function makeCall(webRtc) {
    // If client details set.
    if (uniqueIDElement.value && applicationIDElement.value) {
        // Get all contact peers.
        var contacts = webRtc.webrtc.webrtcadapter.getContactPeers();
        // For each conference contact.
        contacts.forEach(function (contact) {
            var contUniqueID = contact.getUniqueID();
            var contApplicationID = contact.getApplicationID();
            // Not self.
            if (uniqueIDElement.value !== contUniqueID && applicationIDElement.value === contApplicationID) {
                // Is contact avaliable.
                contact.isAvailable();
            }
        });
        // Disable make call button.
        videoCallButton.disabled = true;
    }
}
/**
 * End the call to all the contacts.
 * @param {WebRtc}    webRtc the implementation.
 */
function endCall(webRtc) {
    // Send end call to all contacts,
    // and remove the contacts from the
    // list.
    webRtc.webrtc.webrtcadapter.sendEndCallToAllContacts();
    webRtc.webrtc.webrtcadapter.removeContactPeers();
    // For each conference contact.
    conferenceContactList.forEach(function (uniqueID) {
        // Create the conference contacts.
        createConferenceContact(webRtc, uniqueID, conferenceApplicationID);
    });
    // Enable make call button.
    videoCallButton.disabled = false;
}
/**
 * Change the client settings.
 * @param {WebRtc}    webRtc the implementation.
 * @param {object}    accessOptions  the access options.
 */
async function changeClientSettings(webRtc, accessOptions) {
    try {
        // use login auth.
        if (accessOptions.useLoginAuth) {
            // make the request.
            let response = await fetch(accessOptions.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: 'username=' + accessOptions.username + '&password=' + accessOptions.password
            });
            // get the data.
            let result = await response.json();
            let accessTokenAuth = result.access_token;
            accessOptions.accessToken = accessTokenAuth;
        }
        // Change the client settings.
        webRtc.webrtc.changeClientSettings(uniqueIDElement.value, applicationIDElement.value, availableElement.checked, broadcastElement.checked, broadcastAppIDElement.checked, accessOptions.accessToken);
    }
    catch (e) {
        util.trace("Can not get access token: " + e);
    }
}
/**
 * Change the client state.
 * @param {WebRtc}    webRtc the implementation.
 */
function changeClientState(webRtc) {
    // If client state set.
    if (clientStateElement.value) {
        // Send.
        var state = clientStateElement.value;
        webRtc.webrtc.webrtcadapter.sendStateToAllContacts(state);
    }
}
/**
 * Send a message to the contact.
 * @param {WebRtcApp}    webrtc     the webrtc app.
 */
function contactSendMessage(webrtc) {
    // Client wrote.
    var existsText = alertTextMessageElement.innerHTML;
    alertTextMessageElement.innerHTML = existsText + "<b>You wrote:</b> " + contactSendMessageElement.value + "<br>";
    // Get the contact.
    var contact = getContact(webrtc);
    // If contact details set.
    if (contactUniqueIDElement.value && contactApplicationIDElement.value) {
        // If no contact
        if (!contact) {
            // Create the contact.
            contact = createContact(webrtc);
        }
        // If the contact exists.
        if (contact) {
            // If a message text exists.
            if (contactSendMessageElement.value) {
                // Send the message.
                contact.sendMessage(contactSendMessageElement.value);
            }
        }
    }
}
/**
 * Check to see if the contact is avaliable.
 * @param {WebRtcApp}    webrtc     the webrtc app.
 */
function contactAvailableRequest(webrtc) {
    // Get the contact.
    var contact = getContact(webrtc);
    // If contact details set.
    if (contactUniqueIDElement.value && contactApplicationIDElement.value) {
        // If no contact
        if (!contact) {
            // Create the contact.
            contact = createContact(webrtc);
        }
        // If the contact exist.
        if (contact) {
            contact.isAvailable();
        }
    }
}
/**
 * Answer the call from the contact.
 *
 * @param {WebRtcApp}    webrtc     the webrtc app.
 * @param {ContactPeer}      contact   The contact.
 */
function answerCall(webrtc, contact) {
    var acceptCall = false;
    // Ask if the client wants to accept the call.
    acceptCall = window.confirm(contact.uniqueID + " from " + contact.applicationID +
        " is calling, would you like to accept the call?");
    // If accepted.
    if (acceptCall === true) {
        // Disable make call button.
        videoCallButton.disabled = true;
        // Add the local video stream to the contact stream.
        var localStream = webrtc.webrtcadapter.getStream();
        contact.addStreamTracks(localStream);
        // Send a call response to the contact.
        contact.sendAnswerResponse();
    }
    else {
        // Send no answer.
        contact.noAnswer();
    }
}
/**
 * Answer the call from the contact.
 *
 * @param {WebRtcApp}    webrtc     the webrtc app.
 * @param {ContactPeer}      contact   The contact.
 */
function answerJoinConference(webrtc, contact) {
    // Add the local video stream to the contact stream.
    var localStream = webrtc.webrtcadapter.getStream();
    contact.addStreamTracks(localStream);
    // Send a call response to the contact.
    contact.sendJoinConferenceAnswerResponse();
}
/**
 * Is the contact in the list.
 *
 * @param {ContactPeer}      contact   The contact.
 *
 * @return {Array} Returns the contacts; else null.
 */
function isContactInList(contact) {
    return conferenceContactList.filter(function (uniqueID) {
        // Return the contact.
        return (contact.uniqueID === uniqueID);
    });
}
/**
 * Create the contact.
 *
 * @param {WebRtcApp}    webrtc     the webrtc app.
 * @return {ContactPeer} Returns the contact; else null.
 */
function createContact(webrtc) {
    // Create the contact.
    var contact = webrtc.createContact(contactUniqueIDElement.value, contactApplicationIDElement.value);
    // If the contact exist.
    if (contact) {
        return contact;
    }
    else {
        return null;
    }
}
/**
 * Create the contact.
 *
 * @param {WebRtc}    webRtc the implementation.
 * @param {string}      uniqueID       The uniqueID.
 * @param {string}      applicationID  The applicationID.
 *
 * @return {ContactPeer} Returns the contact; else null.
 */
function createConferenceContact(webRtc, uniqueID, applicationID) {
    // Create the contact.
    var contact = webRtc.webrtc.createContact(uniqueID, applicationID);
    // If the contact exist.
    if (contact) {
        return contact;
    }
    else {
        return null;
    }
}
/**
 * Create the data contact.
 *
 * @param {WebRtcApp}    webrtc     the webrtc app.
 *
 * @return {ContactPeer} Returns the contact; else null.
 */
function createContactData(webrtc) {
    // Create the contact.
    var contact = webrtc.createContactData(contactUniqueIDElement.value, contactApplicationIDElement.value);
    // If the contact exist.
    if (contact) {
        return contact;
    }
    else {
        return null;
    }
}
/**
 * Get the contact.
 *
 * @param {WebRtcApp}    webrtc     the webrtc app.
 *
 * @return {ContactPeer} Returns the contact; else null.
 */
function getContact(webrtc) {
    // Get the contact.
    var contact = webrtc.webrtcadapter.getContactPeer(contactUniqueIDElement.value, contactApplicationIDElement.value, false);
    // If the contact exist.
    if (contact[0]) {
        return contact[0];
    }
    else {
        return null;
    }
}
/**
 * Get the data contact.
 * @param {WebRtcApp}    webrtc     the webrtc app.
 * @return {ContactPeer} Returns the contact; else null.
 */
function getContactData(webrtc) {
    // Get the contact.
    var contact = webrtc.webrtcadapter.getContactPeer(contactUniqueIDElement.value, contactApplicationIDElement.value, true);
    // If the contact exist.
    if (contact[0]) {
        return contact[0];
    }
    else {
        return null;
    }
}
/**
 * Clear the text send a message to the contact.
 */
function contactClearButton() {
    alertTextMessageElement.innerHTML = "";
}
/**
 * Clear the contact list.
 */
function contactClearList() {
    alertTextList.innerHTML = "";
}
/**
 * Get the contact unique list.
 * @param {WebRtc}    webRtc the implementation.
 */
function contactUniqueIDList(webRtc) {
    webRtc.webrtc.webrtcadapter.contactUniqueIDList();
}
/**
 * Get the contact application list.
 * @param {WebRtc}    webRtc the implementation.
 */
function contactApplicationIDList(webRtc) {
    webRtc.webrtc.webrtcadapter.contactApplicationIDList();
}
/**
 * Get the contact group list.
 * @param {WebRtc}    webRtc the implementation.
 */
function contactGroupList(webRtc) {
    webRtc.webrtc.webrtcadapter.contactGroupList();
}
/**
 * Send a message to the contact that this
 * client is typing a message to the contact.
 * @param {WebRtcApp}    webrtc     the webrtc app.
 */
function contactTypingMessageStart(webrtc) {
    // Get the contact.
    var contact = getContact(webrtc);
    // If contact details set.
    if (contactUniqueIDElement.value && contactApplicationIDElement.value) {
        // If no contact
        if (!contact) {
            // Create the contact.
            contact = createContact(webrtc);
        }
        // If the contact exist.
        if (contact) {
            var contUniqueID = contact.getUniqueID();
            var contApplicationID = contact.getApplicationID();
            // Send started typing.
            webrtc.webrtcadapter.startedTypingMessage(contUniqueID, contApplicationID);
        }
    }
}
/**
 * Send a message to the contact that this
 * client has stopped typing a message to the contact.
 * @param {WebRtcApp}    webrtc     the webrtc app.
 */
function contactTypingMessageStop(webrtc) {
    // Get the contact.
    var contact = getContact(webrtc);
    // If contact details set.
    if (contactUniqueIDElement.value && contactApplicationIDElement.value) {
        // If no contact
        if (!contact) {
            // Create the contact.
            contact = createContact(webrtc);
        }
        // If the contact exist.
        if (contact) {
            var contUniqueID = contact.getUniqueID();
            var contApplicationID = contact.getApplicationID();
            // Send stopped typing.
            webrtc.webrtcadapter.stoppedTypingMessage(contUniqueID, contApplicationID);
        }
    }
}
/**
 * Set the local video volume
 */
function setVolumeLocal(elem) {
    if (localVideoElement) {
        try {
            localVideoElement.volume = elem.currentTarget.value / 100;
        }
        catch (e) {
            util.trace("Error can not set the local volume: " + e);
        }
    }
}
/**
 * Set the remote video volume
 */
function setVolumeRemote(elem) {
    // Get the contact video index.
    var peerIndex = conferenceContactList.indexOf(elem.currentTarget.innerHTML);
    var remoteVideo = conferenceRemoteVideoElement[peerIndex];
    if (remoteVideo) {
        try {
            remoteVideo.volume = elem.currentTarget.value / 100;
        }
        catch (e) {
            util.trace("Error can not set the remote volume: " + e);
        }
    }
}
/**
 * Toggle mute audio and video.
 * @param {WebRtc}    webRtc the implementation.
 */
function toggleMuteAudio(webRtc) {
    var mute = toggleMuteAudioButton.checked;
    webRtc.webrtc.webrtcadapter.muteAudioVideo(mute);
}
/**
 * Toggle mute all remote audio.
 * @param {WebRtc}    webRtc the implementation.
 */
function toggleMuteRemote(webRtc) {
    var mute = toggleMuteAllRemoteButton.checked;
    // For each conference volumn.
    conferenceRemoteVolumeElement.forEach(function (elem) {
        // If mute.
        if (mute) {
            elem.value = 0;
        }
        else {
            elem.value = 50;
        }
        // Get the contact video index.
        var peerIndex = conferenceContactList.indexOf(elem.innerHTML);
        var remoteVideo = conferenceRemoteVideoElement[peerIndex];
        if (remoteVideo) {
            try {
                remoteVideo.volume = elem.value / 100;
            }
            catch (e) { }
        }
    });
}
/**
 * File input change handler.
 */
function handleFileInputChange() {
    // Get only the first file in the list.
    var file = fileInput.files[0];
    // No file.
    if (!file) {
        util.trace("No file has been chosen.");
    }
    else {
        // Re-enable the file select
        fileInputStartTransferButton.disabled = false;
        sendReceiveProgress.value = 0;
        sendReceiveProgress.max = file.size;
    }
}
/**
 * Start the file transfer.
 * @param {WebRtcApp}    webrtc     the webrtc app.
 */
function fileInputStartTransfer(webrtc) {
    // Get only the first file in the list.
    var file = fileInput.files[0];
    // No file.
    if (!file) {
        util.trace("No file has been chosen.");
    }
    else {
        // Handle 0 size files.
        statusMessage.textContent = "";
        downloadAnchor.textContent = "";
        // Get the contact.
        var contact = getContactData(webrtc);
        // If contact details set.
        if (contactUniqueIDElement.value && contactApplicationIDElement.value) {
            // If no contact
            if (!contact) {
                // Create the contact.
                contact = createContactData(webrtc);
            }
            // If the contact exists.
            if (contact) {
                // Create the call offer and send the call request.
                contact.sendFileTransferOfferRequest(file);
                // Disable the file select.
                fileInput.disabled = true;
                fileInputStartTransferButton.disabled = true;
            }
        }
    }
}
/**
 * Stop the file transfer.
 * @param {WebRtcApp}    webrtc     the webrtc app.
 */
function fileInputStopTransfer(webrtc) {
    util.trace("Stopped file transfer.");
    // Get the contact.
    var contact = getContactData(webrtc);
    // If contact details set.
    if (contactUniqueIDElement.value && contactApplicationIDElement.value) {
        // If the contact exists.
        if (contact) {
            // End the call local.
            contact.close();
        }
    }
    // Re-enable the file select
    sendReceiveProgress.value = 0;
    fileInput.disabled = false;
    fileInputStartTransferButton.disabled = false;
}
/**
 * Answer the file transfer from the contact.
 *
 * @param {ContactPeer}     contact   The contact.
 * @param {string}          fileName   The file name.
 * @param {number}          fileSize   The file size.
 */
function answerFileTransfer(contact, fileName, fileSize) {
    var acceptCall = false;
    // Ask if the client wants to accept the file transfer.
    acceptCall = window.confirm(contact.uniqueID + " from " + contact.applicationID +
        " would like to send you a file: " + [fileName, "size: " + fileSize.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")].join(", "));
    // If accept.
    if (acceptCall === true) {
        // Disable the file select
        fileInput.disabled = true;
        fileInputStartTransferButton.disabled = true;
        statusMessage.textContent = "";
        downloadAnchor.textContent = "";
        // Set progress max.
        sendReceiveProgress.max = fileSize;
        // Send a call response to the contact.
        contact.sendFileTransferAnswerResponse();
    }
    else {
        // Send no answer.
        contact.noAnswer();
    }
}
/**
 * Contact receive file complete.
 *
 * @param {ContactPeer}     contact     The contact.
 * @param {Array}           buffer      The data file buffer.
 */
function receiveFileComplete(contact, buffer) {
    // Createa blob stream.
    var received = new window.Blob(buffer);
    // Start
    downloadAnchor.href = URL.createObjectURL(received);
    downloadAnchor.download = contact.fileName;
    downloadAnchor.textContent = "Click to download \'" + contact.fileName + "\' (" + contact.fileSize.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " bytes)";
    downloadAnchor.style.display = 'block';
    statusMessage.textContent = "File download has completed";
}
