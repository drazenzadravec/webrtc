import * as util from './common.mjs';
import { ISignalling } from './signalling.mjs';
import { WebRtcAdapter } from './webrtcadapter.mjs';

import {
    Track
} from './common.mjs';

/**
 * Contact peer container, this holds information to one contact peer.
 */
export class ContactPeer {

    // Global.
    peerConnection: RTCPeerConnection;
    signalling: ISignalling;
    closed: boolean;
    uniqueID: string;
    applicationID: string;
    contactDetails: string;
    mediaRecorder: MediaRecorder;
    isData: boolean;
    fileName: string;
    fileSize: number;
    fileType: string;
    fileLastModified: number;
    fileToSend: File;
    receiveMedia: any;
    remoteStream: MediaStream;
    remoteStreamSenders: Array<RTCRtpSender>;
    remoteStreamTransceivers: Array<RTCRtpTransceiver>;
    remoteStreamVideoElement: any;
    receiveDataChannel: RTCDataChannel;
    sendDataChannel: RTCDataChannel;
    parent: WebRtcAdapter;

    // remote tracks
    private remoteTracks: Array<Track>;
    private sessionId: string;
    private sessionIdRemote: string;
    private mediaStreamTracks: Array<MediaStreamTrack>;

    /**
    * subscribe to the contact peer event handler.
    * {function} callback(eventName, eventDetails, this object, event)
    */
    private eventContactPeer: (eventName: string, eventDetails: string, object: ContactPeer, event: any) => void;

    /**
     * Contact peer prototype.
     *
     * @param {Object}   contactPeerOptions  A collection of options.
     *            
     * @example                      
     *  options = { 
     *      parent: WebRtcAdapter,
     *      signalling: Signalling,
     *      uniqueID: "uniqueID",
     *      applicationID: "applicationID",
     *      isData: false,
     *      receiveOfferMedia: {
     *          offerToReceiveAudio: 1,
     *          offerToReceiveVideo: 1
     *      } 
     *  }
     */
    constructor(public contactPeerOptions: any) {

        // local.
        let self = this;
        this.closed = false;
        let item;

        this.parent = contactPeerOptions.parent;

        // Get the singalling provider.
        this.signalling = contactPeerOptions.signalling;

        // MediaRecorder
        this.mediaRecorder = null;

        // Assign this contact details.
        this.uniqueID = contactPeerOptions.uniqueID;
        this.applicationID = contactPeerOptions.applicationID;
        this.contactDetails = '';

        // Store all channels.
        this.receiveDataChannel = null;
        this.sendDataChannel = null;

        let receiveBuffer = [];
        let receivedSize = 0;
        let sentSize = 0;

        this.isData = contactPeerOptions.isData;
        this.fileName = "";
        this.fileSize = 0;
        this.fileType = "";
        this.fileLastModified = 0;
        this.fileToSend = null;

        this.receiveMedia = contactPeerOptions.receiveOfferMedia;
        this.remoteStream = null;
        this.remoteStreamSenders = [];
        this.remoteStreamTransceivers = [];
        this.remoteStreamVideoElement = null;
        this.remoteTracks = [];
        this.sessionId = "";
        this.sessionIdRemote = "";
        this.mediaStreamTracks = [];

        try {
            // Create a new peer connection to the STUN and TURN servers
            // with the ICE configuration.
            this.peerConnection = new RTCPeerConnection(
                this.parent.config.peerConnectionConfiguration);
        }
        catch (e) {
            // Log the error.
            util.logger("error", "Error connecting to RTCPeerConnection", e);
        }

        // If created.
        if (this.peerConnection) {

            // Send any ice candidates to the other peers.
            this.peerConnection.onicecandidate = function (evt) {
                let config = {
                    data: evt,
                    signalling: self.signalling
                };

                // Send ICE candiate.
                self.onIceCandidateHandler(config);
                self.eventContactPeer('peerContactEventICECandidate', "Peer ICE candidate.", self, evt);
            };

            // ICE connection state change.
            this.peerConnection.oniceconnectionstatechange = function (evt) {
                self.eventContactPeer('peerContactEventICEStateChange', "Peer ICE connection state changed.", self, evt);
            };

            // ICE candidate error.
            this.peerConnection.onicecandidateerror = function (evt) {
                self.eventContactPeer('peerContactEventICECandidateError', "Peer ICE candidate error.", self, evt);
            };

            // Negotiation needed.
            this.peerConnection.onnegotiationneeded = function (evt) {
                self.eventContactPeer('peerContactEventNegotiationNeeded', "Peer negotiation needed.", self, evt);
            };

            // Signaling connection state change.
            this.peerConnection.onsignalingstatechange = function (evt) {
                self.eventContactPeer('peerContactEventSignalingStateChange', "Peer signaling connection state changed.", self, evt);
            };

            // Once remote stream arrives, show it in the remote video element.
            // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/track_event
            this.peerConnection.ontrack = function (evt) {
                // send the event
                self.eventContactPeer('peerContactEventAddStream', "Peer connection stream added.", self, evt);
            };

            // Data channel handler.
            this.peerConnection.ondatachannel = function (evt) {

                // Clear the buffer.
                receiveBuffer = [];
                receivedSize = 0;

                // Assign the receive channel.
                self.receiveDataChannel = evt.channel;
                self.receiveDataChannel.binaryType = "arraybuffer";

                // On data channel receive message callback.
                self.receiveDataChannel.onmessage = function (event) {

                    receiveBuffer.push(event.data);
                    receivedSize += event.data.byteLength;
                    self.eventContactPeer('peerContactEventDataChannelReceivedSize', "Peer connection data channel received size.", self, receivedSize);

                    // We are assuming that our signaling protocol told
                    // about the expected file size (and name, hash, etc).
                    if (receivedSize >= self.fileSize) {
                        self.eventContactPeer('peerContactEventDataChannelReceiveComplete', "Peer connection data channel received complete.", self, receiveBuffer);

                        receiveBuffer = [];
                        self.receiveDataChannel.close();
                        self.receiveDataChannel = null;
                    }
                };

                // Data channel open.
                self.receiveDataChannel.onopen = function () {
                    // If data channel is active.
                    if (self.receiveDataChannel) {
                        // Receive channel state.
                        var readyState = self.receiveDataChannel.readyState;
                        self.eventContactPeer('peerContactEventDataChannelOpen', "Peer connection data channel open.", self, readyState);
                    }
                };

                // Data channel close.
                self.receiveDataChannel.onclose = function () {
                    // If data channel is active.
                    if (self.receiveDataChannel) {
                        // Receive channel state.
                        var readyState = self.receiveDataChannel.readyState;
                        self.eventContactPeer('peerContactEventDataChannelClose', "Peer connection data channel close.", self, readyState);
                    }
                };

                // Data channel error.
                self.receiveDataChannel.onerror = function (error) {
                    self.eventContactPeer('peerContactEventDataChannelError', "Peer connection data channel error.", self, error);
                };
            };

            try {
                // Create a data channel from the peer connection.
                self.sendDataChannel = this.peerConnection.createDataChannel("sendReceiveDataChannel_" + this.uniqueID + "_" + this.applicationID);
                self.sendDataChannel.binaryType = "arraybuffer";

                // On open
                self.sendDataChannel.onopen = function () {

                    // Get the file.
                    var file = self.fileToSend;

                    // If file is size zero.
                    if (!file || file.size === 0) {
                        return;
                    }

                    // Set send size.
                    sentSize = 0;

                    // If data channel is active.
                    if (self.sendDataChannel) {

                        // Send channel state.
                        var readyState = self.sendDataChannel.readyState;
                        self.eventContactPeer('peerContactEventDataChannelOpen', "Peer connection data channel open.", self, readyState);

                        // Sent the file data in chunks
                        var chunkSize = 8096;
                        var sliceFile = function (offset) {

                            // Create a file reader.
                            var reader = new FileReader();

                            // When the file is opened.
                            reader.onload = (function (arg) {
                                return function (e) {
                                    // Send the file through the data channel.
                                    self.sendDataChannel.send(e.target.result as ArrayBuffer);

                                    // Create timeout.
                                    if (file.size > offset + (e.target.result as ArrayBuffer).byteLength) {
                                        window.setTimeout(sliceFile, 0, offset + chunkSize);
                                    }

                                    // Set the current sent size.
                                    sentSize = offset + (e.target.result as ArrayBuffer).byteLength;
                                    self.eventContactPeer('peerContactEventDataChannelSentSize', "Peer connection data channel sent size.", self, sentSize);

                                    // If all the data has been sent.
                                    if (sentSize >= file.size) {

                                        // Close the data channel.
                                        self.eventContactPeer('peerContactEventDataChannelSentComplete', "Peer connection data channel sent complete.", self, true);
                                    }
                                };

                            })(file);

                            // Read the file array into the buffer.
                            var slice = file.slice(offset, offset + chunkSize);
                            reader.readAsArrayBuffer(slice);
                        };

                        // Sent the file with no offset.
                        sliceFile(0);
                    }
                };

                // On close
                self.sendDataChannel.onclose = function () {
                    // If data channel is active.
                    if (self.sendDataChannel) {
                        // Sen channel state.
                        var readyState = self.sendDataChannel.readyState;
                        self.eventContactPeer('peerContactEventDataChannelClose', "Peer connection data channel close.", self, readyState);
                    }
                };

                // On error
                self.sendDataChannel.onerror = function (error) {
                    self.eventContactPeer('peerContactEventDataChannelError', "Peer connection data channel error.", self, error);
                };

                // On message.
                self.sendDataChannel.onmessage = function (event) {
                    // Close the data channel.
                    self.eventContactPeer('peerContactEventDataChannelSentMessage', "Peer connection data channel sent message.", self, event);
                };
            }
            catch (e) {
                // Edge does not support
                // createDataChannel on the
                // RTCPeerConnection object.
                // Log the error.
                util.logger("error", "Error creating data channel on RTCPeerConnection", e);
            }
        }
    }

    /**
     * set session id.
     * @param sessionId the session id.
     */
    setSessionId(sessionId: string): void {
        this.sessionId = sessionId;
    }

    /**
     * get session id.
     * @returns {string} the session id;
     */
    getSessionId(): string {
        return this.sessionId;
    }

    /**
     * set remote session id.
     * @param sessionId the session id.
     */
    setSessionIdRemote(sessionId: string): void {
        this.sessionIdRemote = sessionId;
    }

    /**
     * get remote session id.
     * @returns {string} the session id;
     */
    getSessionIdRemote(): string {
        return this.sessionIdRemote;
    }

    /**
     * get the tracks.
     * @returns {Array<Track>} the array of tracks;
     */
    getTracks(): Array<Track> {
        return this.remoteTracks;
    }

    /**
     * set the tracks.
     * @param tracks the tracks.
     */
    setTracks(tracks: Array<Track>): void {
        this.remoteTracks = tracks;
    }

    /**
    * subscribe to the contact peer event handler.
    * @param {function}	event callback(eventName, eventDetails, this object, event).
    */
    onContactPeerEventHandler(event: (eventName: string, eventDetails: string, object: ContactPeer, event: any) => void): void {
        // assign the event.
        this.eventContactPeer = event;
    }

    /**
     * Send a message to this contact.
     * 
     * @param {string}  message     The message to send to the contact.
     */
    sendMessage(message: string): void {

        // Get this contact details.
        let contactUniqueID = this.uniqueID;
        let contactApplicationID = this.applicationID;

        // Send the message through the signalling provider.
        this.signalling.sendMessage(contactUniqueID, contactApplicationID, message);
    }

    /**
     * Send the state to this contact.
     * 
     * @param {string}  state     The state to send to the contact.
     */
    sendState(state: string): void {

        // Get this contact details.
        let contactUniqueID = this.uniqueID;
        let contactApplicationID = this.applicationID;

        // Send the state through the signalling provider.
        this.signalling.sendClientState(contactUniqueID, contactApplicationID, state);
    }

    /**
     * Send the details to this contact.
     * 
     * @param {string}  details     The details to send to the contact.
     */
    sendDetails(details: string): void {

        // Get this contact details.
        let contactUniqueID = this.uniqueID;
        let contactApplicationID = this.applicationID;

        // Send the details through the signalling provider.
        this.signalling.sendClientDetails(contactUniqueID, contactApplicationID, details);
    }

    /**
     * Send do not want to answer to this contact.
     */
    noAnswer(): void {

        // Get this contact details.
        let contactUniqueID = this.uniqueID;
        let contactApplicationID = this.applicationID;

        // Send the message through the signalling provider.
        this.signalling.noAnswer(contactUniqueID, contactApplicationID);
    }

    /**
     * Send a request asking if this contact is available.
     */
    isAvailable(): void {

        // Get this contact details.
        let contactUniqueID = this.uniqueID;
        let contactApplicationID = this.applicationID;

        // Send the message through the signalling provider.
        this.signalling.contactAvailable(contactUniqueID, contactApplicationID)
    }

    /**
     * Send end call to this contact.
     */
    sendEndCall(): void {

        // Get this contact details.
        let contactUniqueID = this.uniqueID;
        let contactApplicationID = this.applicationID;

        // Send the message through the signalling provider.
        this.signalling.sendEndCallToContact(contactUniqueID, contactApplicationID)
    }

    /**
     * Set the contact information.
     * 
     * @param {string}  uniqueID        The contact unique id.
     * @param {string}  applicationID   The contact application id.
     */
    setContactInfo(uniqueID: string, applicationID: string): void {

        this.uniqueID = uniqueID;
        this.applicationID = applicationID;
    }

    /**
     * Get the contact unique id.
     * 
     * @return {string} Returns the contact unique id.
     */
    getUniqueID(): string {

        // Get this contact details.
        let contactUniqueID = this.uniqueID;
        return contactUniqueID;
    }

    /**
     * Get the contact application id.
     * 
     * @return {string} Returns the contact application id.
     */
    getApplicationID(): string {

        // Get this contact details.
        let contactApplicationID = this.applicationID;
        return contactApplicationID;
    }

    /**
     * Set the contact details.
     * 
     * @param {string}  details        The contact details.
     */
    setContactDetails(details: string): void {

        this.contactDetails = details;
    }

    /**
     * Get the contact details.
     * 
     * @return {string} Returns the contact details.
     */
    getContactDetails(): string {

        // Get this contact details.
        let contactDetails = this.contactDetails;
        return contactDetails;
    }

    /**
     * Set the remote stream to the video element.
     * 
     * @param {object}      videoElement    The remote video element.
     * @param {Array<MediaStream>}      streams     The remote video streams.
     * @return {boolean}    True if the stream has been added; else false.
     */
    setRemoteStreamToVideoElement(videoElement: any, streams: Array<MediaStream>): boolean {

        // if stream
        if (streams && streams.length > 0) {
            let self = this;

            // assign stream the first stream
            this.remoteStream = streams[0];

            // listen for remove stream.
            this.remoteStream.onremovetrack = (event) => {
                self.eventContactPeer('peerContactEventRemoveStream', "Peer connection stream removed.", self, event);
            };

            // Assign the video element.
            this.remoteStreamVideoElement = videoElement;
            this.remoteStreamVideoElement.srcObject = this.remoteStream;
            return true;
        }
        return false;
    }

    /**
     * Add track to video element after all track received.
     * @param {object}      videoElement    The remote video element.
     * @param {MediaStreamTrack}      track    The track video or audio.
     * @return {boolean}    True if the stream has been added; else false.
     */
    addTrackStreamToRemoteVideoElement(videoElement: any, track: MediaStreamTrack): boolean {

        // if media stream track
        if (track) {

            // get tracks.
            let tracks: Array<util.Track> = this.getTracks();
            if (tracks !== null && tracks !== undefined) {
                if (tracks.length > 0) {

                    // add track.
                    this.mediaStreamTracks.push(track);

                    // if we have all the tracks.
                    if (this.mediaStreamTracks.length == tracks.length) {

                        let self = this;

                        // create the media stream.
                        let stream: MediaStream = new MediaStream();

                        // for each track
                        for (var i = 0; i < this.mediaStreamTracks.length; i++) {
                            stream.addTrack(this.mediaStreamTracks[i]);
                        }

                        // listen for remove stream.
                        this.remoteStream = stream;
                        this.remoteStream.onremovetrack = (event) => {
                            self.eventContactPeer('peerContactEventRemoveStream', "Peer connection stream removed.", self, event);
                        };

                        // Assign the video element.
                        this.remoteStreamVideoElement = videoElement;
                        this.remoteStreamVideoElement.srcObject = this.remoteStream;
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * Set all the remote stream to the video element.
     * @param {object}      videoElement    The remote video element.
     * @param {MediaStreamTrack}      track    The track video or audio.
     * @param {Array<MediaStream>}      streams     The remote video streams.
     * @return {boolean}    True if the stream has been added; else false.
     */
    setAllRemoteStreamToVideoElement(videoElement: any, streams: Array<MediaStream>): boolean {

        // if media stream track
        if (streams && streams.length > 0) {

            // get tracks.
            let tracks: Array<util.Track> = this.getTracks();
            if (tracks !== null && tracks !== undefined) {
                if (tracks.length > 0) {

                    // for each track
                    for (var j = 0; j < streams.length; j++) {

                        // get all tracks in stream.
                        let tracks: Array<MediaStreamTrack> = streams[j].getTracks();
                        for (var k = 0; k < tracks.length; k++) {

                            // add track.
                            this.mediaStreamTracks.push(tracks[k]);
                        }
                    }

                    // if we have all the tracks.
                    if (this.mediaStreamTracks.length == tracks.length) {

                        let self = this;

                        // create the media stream.
                        let stream: MediaStream = new MediaStream();

                        // for each track
                        for (var i = 0; i < this.mediaStreamTracks.length; i++) {
                            stream.addTrack(this.mediaStreamTracks[i]);
                        }

                        // listen for remove stream.
                        this.remoteStream = stream;
                        this.remoteStream.onremovetrack = (event) => {
                            self.eventContactPeer('peerContactEventRemoveStream', "Peer connection stream removed.", self, event);
                        };

                        // Assign the video element.
                        this.remoteStreamVideoElement = videoElement;
                        this.remoteStreamVideoElement.srcObject = this.remoteStream;
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * Set the remote video element.
     * 
     * @param {object}      videoElement   The remote video element.
     */
    setRemoteVideoElement(videoElement: any): void {

        // Assign the video element.
        this.remoteStreamVideoElement = videoElement;
    }

    /**
     * Get the contact media stream.
     * 
     * @return {MediaStream} Returns the contact media stream.
     */
    getStream(): MediaStream {

        // Get this contact stream.
        let stream = this.remoteStream;
        return stream;
    }

    /**
     * Get the contact media stream senders.
     * 
     * @return {Array<RTCRtpSender>} Returns the contact media stream senders.
     */
    getStreamSenders(): Array<RTCRtpSender> {

        // Get this contact stream.
        let senders = this.remoteStreamSenders;
        return senders;
    }

    /**
     * Get the contact media stream transceivers.
     * 
     * @return {Array<RTCRtpTransceiver>} Returns the contact media stream transceivers.
     */
    getStreamTransceivers(): Array<RTCRtpTransceiver> {

        // Get this contact stream.
        let transceivers = this.remoteStreamTransceivers;
        return transceivers;
    }

    /**
     * Set the file transfer information.
     * 
     * @param {string}  name            The file name to send.
     * @param {number}  size            The file size.
     * @param {string}  type            The file type.
     * @param {number}  lastModified    The file last modified date.
     */
    setFileInfo(name: string, size: number, type: string, lastModified: number): void {

        this.fileName = name;
        this.fileSize = size;
        this.fileType = type;
        this.fileLastModified = lastModified;
    }

    /**
     * Close the contact peer connection.
     */
    close(): void {

        if (this.closed) return;
        this.closed = true;

        try {
            // Remove the stream.
            this.closeStream();
            this.closeReceiveDataChannel();
            this.closeSendDataChannel();
        }
        catch (e) {
            // Log the error.
            util.logger("error", "Error closing streams", e);
        }

        this.remoteStream = null;
        this.remoteStreamVideoElement = null;

        try {
            // for each sender.
            for (var i = 0; i < this.remoteStreamSenders.length; i++) {
                this.peerConnection.removeTrack(this.remoteStreamSenders[i]);
            }

            this.remoteStreamSenders = null;
            this.remoteStreamSenders = [];
        }
        catch (e) {
            // Log the error.
            util.logger("error", "Error closing RTCRtpSender", e);
        }

        try {
            this.remoteStreamTransceivers = null;
            this.remoteStreamTransceivers = [];
        }
        catch (e) {
            // Log the error.
            util.logger("error", "Error closing RTCRtpTransceiver", e);
        }

        try {
            this.remoteTracks = null;
            this.remoteTracks = [];
            this.mediaStreamTracks = null;
            this.mediaStreamTracks = [];
        }
        catch (e) {
            // Log the error.
            util.logger("error", "Error closing Tracks", e);
        }

        try {
            // Close peer connection.
            this.peerConnection.close();
            this.peerConnection = null;
        }
        catch (e) {
            // Log the error.
            util.logger("error", "Error closing RTCPeerConnection", e);
        }

        try {
            // Stop recording.
            this.stopRecording();
        }
        catch (e) {
            // Log the error.
            util.logger("error", "Error stopping recording", e);
        }

        // Call the peer stream removed event handler.
        this.eventContactPeer('peerContactEventClose', "Peer connection has been closed.", this, null);

        try {
            // Get the index of the current peer.
            let peerIndex = this.parent.contactPeers.indexOf(this);
            if (peerIndex > -1) {
                this.parent.contactPeers.splice(peerIndex, 1);
            }
        }
        catch (e) { }
    }

    /**
     * Close the contact media stream tracks.
     */
    closeMediaStreamTracks(): void {

        // If tracks exists.
        if (this.mediaStreamTracks) {
            this.mediaStreamTracks = null;
            this.mediaStreamTracks = [];
        }
    }

    /**
     * Close the contact receive data channel.
     */
    closeReceiveDataChannel(): void {

        // If data channel exists.
        if (this.receiveDataChannel) {
            this.receiveDataChannel.close();
            this.receiveDataChannel = null;
        }
    }

    /**
     * Close the contact send data channel.
     */
    closeSendDataChannel(): void {

        // If data channel exists.
        if (this.sendDataChannel) {
            this.sendDataChannel.close();
            this.sendDataChannel = null;
        }
    }

    /**
     * Add the local media stream to the contact.
     * https://developer.mozilla.org/docs/Web/API/RTCPeerConnection/addTrack
     * @param {MediaStream}     stream   Local media stream.
     */
    addStreamTracks(stream: MediaStream): void {

        // If stream exists.
        if (stream) {
            try {
                // If peer.
                if (this.peerConnection) {
                    let self = this;
                    let localPC = this.peerConnection;

                    // add the tracks.
                    stream.getTracks().forEach(function (track) {
                        self.remoteStreamSenders.push(localPC.addTrack(track, stream));
                    });
                }
            }
            catch (e) {
                // Log the error.
                util.logger("error", "Error adding stream tracks to RTCPeerConnection", e);
            }
        }
    }

    /**
     * Add the local media stream to the contact.
     * https://developer.mozilla.org/docs/Web/API/RTCPeerConnection/addTransceiver
     * @param {MediaStream}     stream   Local media stream.
     * @param {RTCRtpTransceiverInit}     init   transceiver init.
     */
    addStreamTracksToTransceiver(stream: MediaStream, init?: RTCRtpTransceiverInit): void {

        // If stream exists.
        if (stream) {
            try {
                // If peer.
                if (this.peerConnection) {
                    let self = this;
                    let localPC = this.peerConnection;

                    // add the tracks.
                    stream.getTracks().forEach(function (track) {
                        self.remoteStreamTransceivers.push(localPC.addTransceiver(track, init));
                    });
                }
            }
            catch (e) {
                // Log the error.
                util.logger("error", "Error adding stream tracks to RTCPeerConnection", e);
            }
        }
    }

    /**
     * Add the track to the contact.
     * https://developer.mozilla.org/docs/Web/API/RTCPeerConnection/addTransceiver
     * @param {string | MediaStreamTrack}     trackOrKind   track or name.
     * @param {RTCRtpTransceiverInit}     init   transceiver init.
     */
    addTracksToTransceiver(trackOrKind: string | MediaStreamTrack, init?: RTCRtpTransceiverInit): void {

        // If stream exists.
        if (trackOrKind) {
            try {
                // If peer.
                if (this.peerConnection) {
                    let self = this;
                    let localPC = this.peerConnection;

                    // add the tracks.
                    self.remoteStreamTransceivers.push(
                        localPC.addTransceiver(trackOrKind, init));
                }
            }
            catch (e) {
                // Log the error.
                util.logger("error", "Error adding stream tracks to RTCPeerConnection", e);
            }
        }
    }

    /**
     * Remove the local media stream from the contact.
     * https://developer.mozilla.org/docs/Web/API/RTCPeerConnection/removeTrack
     * @param {Array<RTCRtpSender>}     track   Local media sender.
     */
    removeStreamTracks(tracks: Array<RTCRtpSender>): void {

        // If tracks exists.
        if (tracks) {
            try {
                // If peer.
                if (this.peerConnection) {
                    let localPC = this.peerConnection;

                    // for each sender.
                    for (var i = 0; i < tracks.length; i++) {
                        // remove track
                        localPC.removeTrack(tracks[i]);
                    }
                }
            }
            catch (e) {
                // Log the error.
                util.logger("error", "Error removing stream tracks from RTCPeerConnection", e);
            }
        }
    }

    /**
     * Remove the local media stream from the contact.
     */
    removeStreamTransceiverTracks(): void {

        try {
            this.remoteStreamTransceivers = null;
            this.remoteStreamTransceivers = [];
        }
        catch (e) {
            // Log the error.
            util.logger("error", "Error closing RTCRtpTransceiver", e);
        }
    }

    /**
     * Set the contact session description.
     *
     * @param {RTCSessionDescription}     sdp   Session description.
     */
    setRemoteDescription(sdp: RTCSessionDescription): void {

        // If peer.
        if (this.peerConnection) {
            // Set the contact session description.
            this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
        }
    }

    /**
     * Set the contact session description.
     *
     * @param {RTCLocalSessionDescriptionInit}     sdp   Session description.
     */
    setLocalDescription(sdp: RTCLocalSessionDescriptionInit): void {

        // If peer.
        if (this.peerConnection) {
            // Set the contact session description.
            this.peerConnection.setLocalDescription(sdp);
        }
    }

    /**
     * Add the ICE candidate.
     *
     * @param {RTCIceCandidateInit}     candidate   Add candidate.
     */
    addIceCandidate(candidate: RTCIceCandidateInit): void {

        // If peer.
        if (this.peerConnection) {
            // Add the ICE candidate.
            this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
    }

    /**
     * On ICE candidate.
     *
     * @param {candidate}     evt   Add candidate.
     */
    onIceCandidateHandler(evt: any): void {

        // Get this contact details.
        let contactUniqueID = this.uniqueID;
        let contactApplicationID = this.applicationID;
        let isDataChannel = this.isData;

        // Send the message through the signalling provider.
        evt.signalling.iceCandidate(contactUniqueID, contactApplicationID, evt.data.candidate, isDataChannel)
    }

    /**
     * Mute the audio and video tracks in the media stream.
     *
     * @param {boolean}     mute   True to mute; else false.
     */
    muteAudioVideo(mute: boolean): void {

        // If peer.
        if (this.peerConnection) {
            // If a sender exists.
            if (this.peerConnection.getSenders) {
                // For each sender track.
                this.peerConnection.getSenders().forEach(function (sender) {
                    if (sender.track) {
                        // Disable-enable the sender track.
                        sender.track.enabled = !mute;
                    }
                });
            }
        }
    }

    /**
     * Close the contact media stream.
     */
    closeStream(): void {

        // If peer.
        if (this.peerConnection) {
            if (this.remoteStream) {

                // Stop all tracks.
                this.remoteStream.getTracks().forEach(
                    function (track) {
                        track.stop();
                    }
                );

                // If video element.
                if (this.remoteStreamVideoElement) {
                    this.remoteStreamVideoElement.srcObject = null;
                }
            }
        }
    }

    /**
     * Start recording remote stream.
     * 
     * @param {MediaRecorderOptions}      [recordingOptions]    The recording options.
     * @param {number}      timeInterval        The time interval (milliseconds).
     */
    startRecording(recordingOptions: MediaRecorderOptions, timeInterval: number): void {

        // If stream exists.
        if (this.remoteStream) {
            // Get this local stream.
            let stream = this.remoteStream;
            let self = this;

            // Recording mime type.
            let options = { mimeType: 'video/webm' };

            try {
                // Create media recorder.
                this.mediaRecorder = new MediaRecorder(stream, recordingOptions);
            }
            catch (e) {
                // Log the error.
                util.logger("error", "Error creating MediaRecorder", e);
            }

            // If media recorder created.
            if (this.mediaRecorder) {
                // On stop recording.
                this.mediaRecorder.onstop = function (evt) {
                    self.eventContactPeer('peerContactRecordingStopped', "Peer has stopped recording.", self, evt);
                };

                // Recorded data is available.
                this.mediaRecorder.ondataavailable = function (event) {
                    // If data exists.
                    if (event.data && event.data.size > 0) {
                        // Send the chunck on data.
                        self.eventContactPeer('peerContactRecordingData', "Peer has recording data.", self, event.data);
                    }
                };

                // Collect 10ms of data.
                this.mediaRecorder.start(timeInterval);
            }
        }
    }

    /**
     * Stop recording remote stream.
     */
    stopRecording(): void {

        // If media recorder created.
        if (this.mediaRecorder) {
            this.mediaRecorder.stop();
            this.mediaRecorder = null;
        }
    }

    /**
     * Pause recording local stream.
     */
    pauseRecording(): void {

        // If media recorder created.
        if (this.mediaRecorder) {
            this.mediaRecorder.pause();
        }
    }

    /**
     * Resume  recording local stream.
     */
    resumeRecording(): void {

        // If media recorder created.
        if (this.mediaRecorder) {
            this.mediaRecorder.resume();
        }
    }

    /**
     * Create the offer and send the call request.
     * @link https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createOffer
     */
    sendOfferRequest(): void {

        // Create local refs.
        let localUniqueID = this.uniqueID;
        let localApplicationID = this.applicationID;
        let localPC = this.peerConnection;
        let localSig = this.signalling;
        let localMedia = this.receiveMedia;

        // If peer.
        if (this.peerConnection) {
            this.peerConnection.createOffer(localMedia)
                .then((offer) => {

                    // Create a new RTC session.
                    let request: RTCSessionDescription = new RTCSessionDescription(offer);
                    return request;
                })
                .then((request) =>
                    localPC.setLocalDescription(request)
                        .then(() => {

                            // Set the response.
                            localSig.sendOffer(localUniqueID, localApplicationID, request);
                        })
                        .catch((error) => {

                            // Session error.
                            util.logger("error", "Failed to create session description", error);
                        })
                )
                .catch((error) => {

                    // Session error.
                    util.logger("error", "Failed to create session description", error);
                });
        }
    }

    /**
     * Create the answer and send the call response.
     * @link https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createAnswer
     */
    sendAnswerResponse(): void {

        // Create local refs.
        let localUniqueID = this.uniqueID;
        let localApplicationID = this.applicationID;
        let localPC = this.peerConnection;
        let localSig = this.signalling;

        // If peer.
        if (this.peerConnection) {
            this.peerConnection.createAnswer()
                .then((answer) => {

                    // Create a new RTC session.
                    let response: RTCSessionDescription = new RTCSessionDescription(answer);
                    return response;
                })
                .then((response) =>
                    localPC.setLocalDescription(response)
                        .then(() => {

                            // Set the response.
                            localSig.sendAnswer(localUniqueID, localApplicationID, response);
                        })
                        .catch((error) => {

                            // Session error.
                            util.logger("error", "Failed to create session description", error);
                        })
                )
                .catch((error) => {

                    // Session error.
                    util.logger("error", "Failed to create session description", error);
                });
        }
    }

    /**
     * Create the file transfer offer and send the call request.
     * @link https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createOffer
     * 
     * @param {File}     file   The file to send.
     */
    sendFileTransferOfferRequest(file: File): void {

        // Create local refs.
        let localUniqueID = this.uniqueID;
        let localApplicationID = this.applicationID;
        let localPC = this.peerConnection;
        let localSig = this.signalling;

        // If sent data channel exists.
        if (this.sendDataChannel) {
            // Set the file send.
            this.fileToSend = file;
        }

        // If peer.
        if (this.peerConnection) {
            this.peerConnection.createOffer()
                .then((offer) => {

                    // Create a new RTC session.
                    let request: RTCSessionDescription = new RTCSessionDescription(offer);
                    return request;
                })
                .then((request) =>
                    localPC.setLocalDescription(request)
                        .then(() => {

                            // Set the response.
                            localSig.sendFileTransferOffer(localUniqueID, localApplicationID, request,
                                file.name, file.size, file.type, file.lastModified);
                        })
                        .catch((error) => {

                            // Session error.
                            util.logger("error", "Failed to create session description", error);
                        })
                )
                .catch((error) => {

                    // Session error.
                    util.logger("error", "Failed to create session description", error);
                });
        }
    }

    /**
     * Create the file transfer answer and send the call response.
     * @link https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createAnswer
     */
    sendFileTransferAnswerResponse(): void {

        // Create local refs.
        let localUniqueID = this.uniqueID;
        let localApplicationID = this.applicationID;
        let localPC = this.peerConnection;
        let localSig = this.signalling;

        // If peer.
        if (this.peerConnection) {
            this.peerConnection.createAnswer()
                .then((answer) => {

                    // Create a new RTC session.
                    let response: RTCSessionDescription = new RTCSessionDescription(answer);
                    return response;
                })
                .then((response) =>
                    localPC.setLocalDescription(response)
                        .then(() => {

                            // Set the response.
                            localSig.sendFileTransferAnswer(localUniqueID, localApplicationID, response);
                        })
                        .catch((error) => {

                            // Session error.
                            util.logger("error", "Failed to create session description", error);
                        })
                )
                .catch((error) => {

                    // Session error.
                    util.logger("error", "Failed to create session description", error);
                });
        }
    }

    /**
     * Create the join conference offer and send the call request.
     * @link https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createOffer
     */
    sendJoinConferenceOfferRequest(): void {

        // Create local refs.
        let localUniqueID = this.uniqueID;
        let localApplicationID = this.applicationID;
        let localPC = this.peerConnection;
        let localSig = this.signalling;
        let localMedia = this.receiveMedia;

        // If peer.
        if (this.peerConnection) {
            this.peerConnection.createOffer(localMedia)
                .then((offer) => {

                    // Create a new RTC session.
                    let request: RTCSessionDescription = new RTCSessionDescription(offer);
                    return request;
                })
                .then((request) => 
                    localPC.setLocalDescription(request)
                        .then(() => {

                            // Set the response.
                            localSig.sendJoinConferenceOffer(localUniqueID, localApplicationID, request);
                        })
                        .catch((error) => {

                            // Session error.
                            util.logger("error", "Failed to create session description", error);
                        })
                )
                .catch((error) => {

                    // Session error.
                    util.logger("error", "Failed to create session description", error);
                });
        }
    }

    /**
     * Create the join conference answer and send the call response.
     * @link https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createAnswer
     */
    sendJoinConferenceAnswerResponse(): void {

        // Create local refs.
        let localUniqueID = this.uniqueID;
        let localApplicationID = this.applicationID;
        let localPC = this.peerConnection;
        let localSig = this.signalling;
        
        // If peer.
        if (this.peerConnection) {
            this.peerConnection.createAnswer()
                .then((answer) => {

                    // Create a new RTC session.
                    let response: RTCSessionDescription = new RTCSessionDescription(answer);
                    return response;
                })
                .then((response) =>
                    localPC.setLocalDescription(response)
                        .then(() => {

                            // Set the response.
                            localSig.sendJoinConferenceAnswer(localUniqueID, localApplicationID, response);
                        })
                        .catch((error) => {

                            // Session error.
                            util.logger("error", "Failed to create session description", error);
                        })
                )
                .catch((error) => {

                    // Session error.
                    util.logger("error", "Failed to create session description", error);
                });
        }
    }
}
