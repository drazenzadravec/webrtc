// ../mod/common.mjs
async function logger(logtype, msg, event) {
  let cp = new Promise(function(resolve, reject) {
    try {
      let logHeader = "WebRTC:";
      switch (logtype.toLowerCase()) {
        case "log": {
          console.log(logHeader + " log: " + msg + " : ", event);
          break;
        }
        case "warn": {
          console.warn(logHeader + " warn: " + msg + " : ", event);
          break;
        }
        case "error": {
          console.error(logHeader + " error: " + msg + " : ", event);
          break;
        }
        default: {
          console.info(logHeader + " info: " + msg + " : ", event);
          break;
        }
      }
      resolve("ok");
    } catch (e) {
      reject(e);
    }
  });
  var result = await cp;
}

// ../mod/contactpeer.mjs
var ContactPeer = class {
  contactPeerOptions;
  // Global.
  peerConnection;
  signalling;
  closed;
  uniqueID;
  applicationID;
  contactDetails;
  mediaRecorder;
  isData;
  fileName;
  fileSize;
  fileType;
  fileLastModified;
  fileToSend;
  receiveMedia;
  remoteStream;
  remoteStreamSenders;
  remoteStreamTransceivers;
  remoteStreamVideoElement;
  receiveDataChannel;
  sendDataChannel;
  parent;
  // remote tracks
  remoteTracks;
  sessionId;
  sessionIdRemote;
  mediaStreamTracks;
  /**
  * subscribe to the contact peer event handler.
  * {function} callback(eventName, eventDetails, this object, event)
  */
  eventContactPeer;
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
  constructor(contactPeerOptions) {
    this.contactPeerOptions = contactPeerOptions;
    let self = this;
    this.closed = false;
    let item;
    this.parent = contactPeerOptions.parent;
    this.signalling = contactPeerOptions.signalling;
    this.mediaRecorder = null;
    this.uniqueID = contactPeerOptions.uniqueID;
    this.applicationID = contactPeerOptions.applicationID;
    this.contactDetails = "";
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
      this.peerConnection = new RTCPeerConnection(this.parent.config.peerConnectionConfiguration);
    } catch (e) {
      logger("error", "Error connecting to RTCPeerConnection", e);
    }
    if (this.peerConnection) {
      this.peerConnection.onicecandidate = function(evt) {
        let config = {
          data: evt,
          signalling: self.signalling
        };
        self.onIceCandidateHandler(config);
        self.eventContactPeer("peerContactEventICECandidate", "Peer ICE candidate.", self, evt);
      };
      this.peerConnection.oniceconnectionstatechange = function(evt) {
        self.eventContactPeer("peerContactEventICEStateChange", "Peer ICE connection state changed.", self, evt);
      };
      this.peerConnection.onicecandidateerror = function(evt) {
        self.eventContactPeer("peerContactEventICECandidateError", "Peer ICE candidate error.", self, evt);
      };
      this.peerConnection.onnegotiationneeded = function(evt) {
        self.eventContactPeer("peerContactEventNegotiationNeeded", "Peer negotiation needed.", self, evt);
      };
      this.peerConnection.onsignalingstatechange = function(evt) {
        self.eventContactPeer("peerContactEventSignalingStateChange", "Peer signaling connection state changed.", self, evt);
      };
      this.peerConnection.ontrack = function(evt) {
        self.eventContactPeer("peerContactEventAddStream", "Peer connection stream added.", self, evt);
      };
      this.peerConnection.ondatachannel = function(evt) {
        receiveBuffer = [];
        receivedSize = 0;
        self.receiveDataChannel = evt.channel;
        self.receiveDataChannel.binaryType = "arraybuffer";
        self.receiveDataChannel.onmessage = function(event) {
          receiveBuffer.push(event.data);
          receivedSize += event.data.byteLength;
          self.eventContactPeer("peerContactEventDataChannelReceivedSize", "Peer connection data channel received size.", self, receivedSize);
          if (receivedSize >= self.fileSize) {
            self.eventContactPeer("peerContactEventDataChannelReceiveComplete", "Peer connection data channel received complete.", self, receiveBuffer);
            receiveBuffer = [];
            self.receiveDataChannel.close();
            self.receiveDataChannel = null;
          }
        };
        self.receiveDataChannel.onopen = function() {
          if (self.receiveDataChannel) {
            var readyState = self.receiveDataChannel.readyState;
            self.eventContactPeer("peerContactEventDataChannelOpen", "Peer connection data channel open.", self, readyState);
          }
        };
        self.receiveDataChannel.onclose = function() {
          if (self.receiveDataChannel) {
            var readyState = self.receiveDataChannel.readyState;
            self.eventContactPeer("peerContactEventDataChannelClose", "Peer connection data channel close.", self, readyState);
          }
        };
        self.receiveDataChannel.onerror = function(error) {
          self.eventContactPeer("peerContactEventDataChannelError", "Peer connection data channel error.", self, error);
        };
      };
      try {
        self.sendDataChannel = this.peerConnection.createDataChannel("sendReceiveDataChannel_" + this.uniqueID + "_" + this.applicationID);
        self.sendDataChannel.binaryType = "arraybuffer";
        self.sendDataChannel.onopen = function() {
          var file = self.fileToSend;
          if (!file || file.size === 0) {
            return;
          }
          sentSize = 0;
          if (self.sendDataChannel) {
            var readyState = self.sendDataChannel.readyState;
            self.eventContactPeer("peerContactEventDataChannelOpen", "Peer connection data channel open.", self, readyState);
            var chunkSize = 8096;
            var sliceFile = function(offset) {
              var reader = new FileReader();
              reader.onload = /* @__PURE__ */ function(arg) {
                return function(e) {
                  self.sendDataChannel.send(e.target.result);
                  if (file.size > offset + e.target.result.byteLength) {
                    window.setTimeout(sliceFile, 0, offset + chunkSize);
                  }
                  sentSize = offset + e.target.result.byteLength;
                  self.eventContactPeer("peerContactEventDataChannelSentSize", "Peer connection data channel sent size.", self, sentSize);
                  if (sentSize >= file.size) {
                    self.eventContactPeer("peerContactEventDataChannelSentComplete", "Peer connection data channel sent complete.", self, true);
                  }
                };
              }(file);
              var slice = file.slice(offset, offset + chunkSize);
              reader.readAsArrayBuffer(slice);
            };
            sliceFile(0);
          }
        };
        self.sendDataChannel.onclose = function() {
          if (self.sendDataChannel) {
            var readyState = self.sendDataChannel.readyState;
            self.eventContactPeer("peerContactEventDataChannelClose", "Peer connection data channel close.", self, readyState);
          }
        };
        self.sendDataChannel.onerror = function(error) {
          self.eventContactPeer("peerContactEventDataChannelError", "Peer connection data channel error.", self, error);
        };
        self.sendDataChannel.onmessage = function(event) {
          self.eventContactPeer("peerContactEventDataChannelSentMessage", "Peer connection data channel sent message.", self, event);
        };
      } catch (e) {
        logger("error", "Error creating data channel on RTCPeerConnection", e);
      }
    }
  }
  /**
   * set session id.
   * @param sessionId the session id.
   */
  setSessionId(sessionId) {
    this.sessionId = sessionId;
  }
  /**
   * get session id.
   * @returns {string} the session id;
   */
  getSessionId() {
    return this.sessionId;
  }
  /**
   * set remote session id.
   * @param sessionId the session id.
   */
  setSessionIdRemote(sessionId) {
    this.sessionIdRemote = sessionId;
  }
  /**
   * get remote session id.
   * @returns {string} the session id;
   */
  getSessionIdRemote() {
    return this.sessionIdRemote;
  }
  /**
   * get the tracks.
   * @returns {Array<Track>} the array of tracks;
   */
  getTracks() {
    return this.remoteTracks;
  }
  /**
   * set the tracks.
   * @param tracks the tracks.
   */
  setTracks(tracks) {
    this.remoteTracks = tracks;
  }
  /**
  * subscribe to the contact peer event handler.
  * @param {function}	event callback(eventName, eventDetails, this object, event).
  */
  onContactPeerEventHandler(event) {
    this.eventContactPeer = event;
  }
  /**
   * Send a message to this contact.
   *
   * @param {string}  message     The message to send to the contact.
   */
  sendMessage(message) {
    let contactUniqueID = this.uniqueID;
    let contactApplicationID = this.applicationID;
    this.signalling.sendMessage(contactUniqueID, contactApplicationID, message);
  }
  /**
   * Send the state to this contact.
   *
   * @param {string}  state     The state to send to the contact.
   */
  sendState(state) {
    let contactUniqueID = this.uniqueID;
    let contactApplicationID = this.applicationID;
    this.signalling.sendClientState(contactUniqueID, contactApplicationID, state);
  }
  /**
   * Send the details to this contact.
   *
   * @param {string}  details     The details to send to the contact.
   */
  sendDetails(details) {
    let contactUniqueID = this.uniqueID;
    let contactApplicationID = this.applicationID;
    this.signalling.sendClientDetails(contactUniqueID, contactApplicationID, details);
  }
  /**
   * Send do not want to answer to this contact.
   */
  noAnswer() {
    let contactUniqueID = this.uniqueID;
    let contactApplicationID = this.applicationID;
    this.signalling.noAnswer(contactUniqueID, contactApplicationID);
  }
  /**
   * Send a request asking if this contact is available.
   */
  isAvailable() {
    let contactUniqueID = this.uniqueID;
    let contactApplicationID = this.applicationID;
    this.signalling.contactAvailable(contactUniqueID, contactApplicationID);
  }
  /**
   * Send end call to this contact.
   */
  sendEndCall() {
    let contactUniqueID = this.uniqueID;
    let contactApplicationID = this.applicationID;
    this.signalling.sendEndCallToContact(contactUniqueID, contactApplicationID);
  }
  /**
   * Set the contact information.
   *
   * @param {string}  uniqueID        The contact unique id.
   * @param {string}  applicationID   The contact application id.
   */
  setContactInfo(uniqueID, applicationID) {
    this.uniqueID = uniqueID;
    this.applicationID = applicationID;
  }
  /**
   * Get the contact unique id.
   *
   * @return {string} Returns the contact unique id.
   */
  getUniqueID() {
    let contactUniqueID = this.uniqueID;
    return contactUniqueID;
  }
  /**
   * Get the contact application id.
   *
   * @return {string} Returns the contact application id.
   */
  getApplicationID() {
    let contactApplicationID = this.applicationID;
    return contactApplicationID;
  }
  /**
   * Set the contact details.
   *
   * @param {string}  details        The contact details.
   */
  setContactDetails(details) {
    this.contactDetails = details;
  }
  /**
   * Get the contact details.
   *
   * @return {string} Returns the contact details.
   */
  getContactDetails() {
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
  setRemoteStreamToVideoElement(videoElement, streams) {
    if (streams && streams.length > 0) {
      let self = this;
      this.remoteStream = streams[0];
      this.remoteStream.onremovetrack = (event) => {
        self.eventContactPeer("peerContactEventRemoveStream", "Peer connection stream removed.", self, event);
      };
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
  addTrackStreamToRemoteVideoElement(videoElement, track) {
    if (track) {
      let tracks = this.getTracks();
      if (tracks !== null && tracks !== void 0) {
        if (tracks.length > 0) {
          this.mediaStreamTracks.push(track);
          if (this.mediaStreamTracks.length == tracks.length) {
            let self = this;
            let stream = new MediaStream();
            for (var i = 0; i < this.mediaStreamTracks.length; i++) {
              stream.addTrack(this.mediaStreamTracks[i]);
            }
            this.remoteStream = stream;
            this.remoteStream.onremovetrack = (event) => {
              self.eventContactPeer("peerContactEventRemoveStream", "Peer connection stream removed.", self, event);
            };
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
  setAllRemoteStreamToVideoElement(videoElement, streams) {
    if (streams && streams.length > 0) {
      let tracks = this.getTracks();
      if (tracks !== null && tracks !== void 0) {
        if (tracks.length > 0) {
          for (var j = 0; j < streams.length; j++) {
            let tracks2 = streams[j].getTracks();
            for (var k = 0; k < tracks2.length; k++) {
              this.mediaStreamTracks.push(tracks2[k]);
            }
          }
          if (this.mediaStreamTracks.length == tracks.length) {
            let self = this;
            let stream = new MediaStream();
            for (var i = 0; i < this.mediaStreamTracks.length; i++) {
              stream.addTrack(this.mediaStreamTracks[i]);
            }
            this.remoteStream = stream;
            this.remoteStream.onremovetrack = (event) => {
              self.eventContactPeer("peerContactEventRemoveStream", "Peer connection stream removed.", self, event);
            };
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
  setRemoteVideoElement(videoElement) {
    this.remoteStreamVideoElement = videoElement;
  }
  /**
   * Get the contact media stream.
   *
   * @return {MediaStream} Returns the contact media stream.
   */
  getStream() {
    let stream = this.remoteStream;
    return stream;
  }
  /**
   * Get the contact media stream senders.
   *
   * @return {Array<RTCRtpSender>} Returns the contact media stream senders.
   */
  getStreamSenders() {
    let senders = this.remoteStreamSenders;
    return senders;
  }
  /**
   * Get the contact media stream transceivers.
   *
   * @return {Array<RTCRtpTransceiver>} Returns the contact media stream transceivers.
   */
  getStreamTransceivers() {
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
  setFileInfo(name, size, type, lastModified) {
    this.fileName = name;
    this.fileSize = size;
    this.fileType = type;
    this.fileLastModified = lastModified;
  }
  /**
   * Close the contact peer connection.
   */
  close() {
    if (this.closed)
      return;
    this.closed = true;
    try {
      this.closeStream();
      this.closeReceiveDataChannel();
      this.closeSendDataChannel();
    } catch (e) {
      logger("error", "Error closing streams", e);
    }
    this.remoteStream = null;
    this.remoteStreamVideoElement = null;
    try {
      for (var i = 0; i < this.remoteStreamSenders.length; i++) {
        this.peerConnection.removeTrack(this.remoteStreamSenders[i]);
      }
      this.remoteStreamSenders = null;
      this.remoteStreamSenders = [];
    } catch (e) {
      logger("error", "Error closing RTCRtpSender", e);
    }
    try {
      this.remoteStreamTransceivers = null;
      this.remoteStreamTransceivers = [];
    } catch (e) {
      logger("error", "Error closing RTCRtpTransceiver", e);
    }
    try {
      this.remoteTracks = null;
      this.remoteTracks = [];
      this.mediaStreamTracks = null;
      this.mediaStreamTracks = [];
    } catch (e) {
      logger("error", "Error closing Tracks", e);
    }
    try {
      this.peerConnection.close();
      this.peerConnection = null;
    } catch (e) {
      logger("error", "Error closing RTCPeerConnection", e);
    }
    try {
      this.stopRecording();
    } catch (e) {
      logger("error", "Error stopping recording", e);
    }
    this.eventContactPeer("peerContactEventClose", "Peer connection has been closed.", this, null);
    try {
      let peerIndex = this.parent.contactPeers.indexOf(this);
      if (peerIndex > -1) {
        this.parent.contactPeers.splice(peerIndex, 1);
      }
    } catch (e) {
    }
  }
  /**
   * Close the contact media stream tracks.
   */
  closeMediaStreamTracks() {
    if (this.mediaStreamTracks) {
      this.mediaStreamTracks = null;
      this.mediaStreamTracks = [];
    }
  }
  /**
   * Close the contact receive data channel.
   */
  closeReceiveDataChannel() {
    if (this.receiveDataChannel) {
      this.receiveDataChannel.close();
      this.receiveDataChannel = null;
    }
  }
  /**
   * Close the contact send data channel.
   */
  closeSendDataChannel() {
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
  addStreamTracks(stream) {
    if (stream) {
      try {
        if (this.peerConnection) {
          let self = this;
          let localPC = this.peerConnection;
          stream.getTracks().forEach(function(track) {
            self.remoteStreamSenders.push(localPC.addTrack(track, stream));
          });
        }
      } catch (e) {
        logger("error", "Error adding stream tracks to RTCPeerConnection", e);
      }
    }
  }
  /**
   * Add the local media stream to the contact.
   * https://developer.mozilla.org/docs/Web/API/RTCPeerConnection/addTransceiver
   * @param {MediaStream}     stream   Local media stream.
   * @param {RTCRtpTransceiverInit}     init   transceiver init.
   */
  addStreamTracksToTransceiver(stream, init) {
    if (stream) {
      try {
        if (this.peerConnection) {
          let self = this;
          let localPC = this.peerConnection;
          stream.getTracks().forEach(function(track) {
            self.remoteStreamTransceivers.push(localPC.addTransceiver(track, init));
          });
        }
      } catch (e) {
        logger("error", "Error adding stream tracks to RTCPeerConnection", e);
      }
    }
  }
  /**
   * Add the track to the contact.
   * https://developer.mozilla.org/docs/Web/API/RTCPeerConnection/addTransceiver
   * @param {string | MediaStreamTrack}     trackOrKind   track or name.
   * @param {RTCRtpTransceiverInit}     init   transceiver init.
   */
  addTracksToTransceiver(trackOrKind, init) {
    if (trackOrKind) {
      try {
        if (this.peerConnection) {
          let self = this;
          let localPC = this.peerConnection;
          self.remoteStreamTransceivers.push(localPC.addTransceiver(trackOrKind, init));
        }
      } catch (e) {
        logger("error", "Error adding stream tracks to RTCPeerConnection", e);
      }
    }
  }
  /**
   * Remove the local media stream from the contact.
   * https://developer.mozilla.org/docs/Web/API/RTCPeerConnection/removeTrack
   * @param {Array<RTCRtpSender>}     track   Local media sender.
   */
  removeStreamTracks(tracks) {
    if (tracks) {
      try {
        if (this.peerConnection) {
          let localPC = this.peerConnection;
          for (var i = 0; i < tracks.length; i++) {
            localPC.removeTrack(tracks[i]);
          }
        }
      } catch (e) {
        logger("error", "Error removing stream tracks from RTCPeerConnection", e);
      }
    }
  }
  /**
   * Remove the local media stream from the contact.
   */
  removeStreamTransceiverTracks() {
    try {
      this.remoteStreamTransceivers = null;
      this.remoteStreamTransceivers = [];
    } catch (e) {
      logger("error", "Error closing RTCRtpTransceiver", e);
    }
  }
  /**
   * Set the contact session description.
   *
   * @param {RTCSessionDescription}     sdp   Session description.
   */
  setRemoteDescription(sdp) {
    if (this.peerConnection) {
      this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
    }
  }
  /**
   * Set the contact session description.
   *
   * @param {RTCLocalSessionDescriptionInit}     sdp   Session description.
   */
  setLocalDescription(sdp) {
    if (this.peerConnection) {
      this.peerConnection.setLocalDescription(sdp);
    }
  }
  /**
   * Add the ICE candidate.
   *
   * @param {RTCIceCandidateInit}     candidate   Add candidate.
   */
  addIceCandidate(candidate) {
    if (this.peerConnection) {
      this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }
  /**
   * On ICE candidate.
   *
   * @param {candidate}     evt   Add candidate.
   */
  onIceCandidateHandler(evt) {
    let contactUniqueID = this.uniqueID;
    let contactApplicationID = this.applicationID;
    let isDataChannel = this.isData;
    evt.signalling.iceCandidate(contactUniqueID, contactApplicationID, evt.data.candidate, isDataChannel);
  }
  /**
   * Mute the audio and video tracks in the media stream.
   *
   * @param {boolean}     mute   True to mute; else false.
   */
  muteAudioVideo(mute) {
    if (this.peerConnection) {
      if (this.peerConnection.getSenders) {
        this.peerConnection.getSenders().forEach(function(sender) {
          if (sender.track) {
            sender.track.enabled = !mute;
          }
        });
      }
    }
  }
  /**
   * Close the contact media stream.
   */
  closeStream() {
    if (this.peerConnection) {
      if (this.remoteStream) {
        this.remoteStream.getTracks().forEach(function(track) {
          track.stop();
        });
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
  startRecording(recordingOptions, timeInterval) {
    if (this.remoteStream) {
      let stream = this.remoteStream;
      let self = this;
      let options = { mimeType: "video/webm" };
      try {
        this.mediaRecorder = new MediaRecorder(stream, recordingOptions);
      } catch (e) {
        logger("error", "Error creating MediaRecorder", e);
      }
      if (this.mediaRecorder) {
        this.mediaRecorder.onstop = function(evt) {
          self.eventContactPeer("peerContactRecordingStopped", "Peer has stopped recording.", self, evt);
        };
        this.mediaRecorder.ondataavailable = function(event) {
          if (event.data && event.data.size > 0) {
            self.eventContactPeer("peerContactRecordingData", "Peer has recording data.", self, event.data);
          }
        };
        this.mediaRecorder.start(timeInterval);
      }
    }
  }
  /**
   * Stop recording remote stream.
   */
  stopRecording() {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }
  }
  /**
   * Pause recording local stream.
   */
  pauseRecording() {
    if (this.mediaRecorder) {
      this.mediaRecorder.pause();
    }
  }
  /**
   * Resume  recording local stream.
   */
  resumeRecording() {
    if (this.mediaRecorder) {
      this.mediaRecorder.resume();
    }
  }
  /**
   * Create the offer and send the call request.
   * @link https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createOffer
   */
  sendOfferRequest() {
    let localUniqueID = this.uniqueID;
    let localApplicationID = this.applicationID;
    let localPC = this.peerConnection;
    let localSig = this.signalling;
    let localMedia = this.receiveMedia;
    if (this.peerConnection) {
      this.peerConnection.createOffer(localMedia).then((offer) => {
        let request = new RTCSessionDescription(offer);
        return request;
      }).then((request) => localPC.setLocalDescription(request).then(() => {
        localSig.sendOffer(localUniqueID, localApplicationID, request);
      }).catch((error) => {
        logger("error", "Failed to create session description", error);
      })).catch((error) => {
        logger("error", "Failed to create session description", error);
      });
    }
  }
  /**
   * Create the answer and send the call response.
   * @link https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createAnswer
   */
  sendAnswerResponse() {
    let localUniqueID = this.uniqueID;
    let localApplicationID = this.applicationID;
    let localPC = this.peerConnection;
    let localSig = this.signalling;
    if (this.peerConnection) {
      this.peerConnection.createAnswer().then((answer) => {
        let response = new RTCSessionDescription(answer);
        return response;
      }).then((response) => localPC.setLocalDescription(response).then(() => {
        localSig.sendAnswer(localUniqueID, localApplicationID, response);
      }).catch((error) => {
        logger("error", "Failed to create session description", error);
      })).catch((error) => {
        logger("error", "Failed to create session description", error);
      });
    }
  }
  /**
   * Create the file transfer offer and send the call request.
   * @link https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createOffer
   *
   * @param {File}     file   The file to send.
   */
  sendFileTransferOfferRequest(file) {
    let localUniqueID = this.uniqueID;
    let localApplicationID = this.applicationID;
    let localPC = this.peerConnection;
    let localSig = this.signalling;
    if (this.sendDataChannel) {
      this.fileToSend = file;
    }
    if (this.peerConnection) {
      this.peerConnection.createOffer().then((offer) => {
        let request = new RTCSessionDescription(offer);
        return request;
      }).then((request) => localPC.setLocalDescription(request).then(() => {
        localSig.sendFileTransferOffer(localUniqueID, localApplicationID, request, file.name, file.size, file.type, file.lastModified);
      }).catch((error) => {
        logger("error", "Failed to create session description", error);
      })).catch((error) => {
        logger("error", "Failed to create session description", error);
      });
    }
  }
  /**
   * Create the file transfer answer and send the call response.
   * @link https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createAnswer
   */
  sendFileTransferAnswerResponse() {
    let localUniqueID = this.uniqueID;
    let localApplicationID = this.applicationID;
    let localPC = this.peerConnection;
    let localSig = this.signalling;
    if (this.peerConnection) {
      this.peerConnection.createAnswer().then((answer) => {
        let response = new RTCSessionDescription(answer);
        return response;
      }).then((response) => localPC.setLocalDescription(response).then(() => {
        localSig.sendFileTransferAnswer(localUniqueID, localApplicationID, response);
      }).catch((error) => {
        logger("error", "Failed to create session description", error);
      })).catch((error) => {
        logger("error", "Failed to create session description", error);
      });
    }
  }
  /**
   * Create the join conference offer and send the call request.
   * @link https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createOffer
   */
  sendJoinConferenceOfferRequest() {
    let localUniqueID = this.uniqueID;
    let localApplicationID = this.applicationID;
    let localPC = this.peerConnection;
    let localSig = this.signalling;
    let localMedia = this.receiveMedia;
    if (this.peerConnection) {
      this.peerConnection.createOffer(localMedia).then((offer) => {
        let request = new RTCSessionDescription(offer);
        return request;
      }).then((request) => localPC.setLocalDescription(request).then(() => {
        localSig.sendJoinConferenceOffer(localUniqueID, localApplicationID, request);
      }).catch((error) => {
        logger("error", "Failed to create session description", error);
      })).catch((error) => {
        logger("error", "Failed to create session description", error);
      });
    }
  }
  /**
   * Create the join conference answer and send the call response.
   * @link https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createAnswer
   */
  sendJoinConferenceAnswerResponse() {
    let localUniqueID = this.uniqueID;
    let localApplicationID = this.applicationID;
    let localPC = this.peerConnection;
    let localSig = this.signalling;
    if (this.peerConnection) {
      this.peerConnection.createAnswer().then((answer) => {
        let response = new RTCSessionDescription(answer);
        return response;
      }).then((response) => localPC.setLocalDescription(response).then(() => {
        localSig.sendJoinConferenceAnswer(localUniqueID, localApplicationID, response);
      }).catch((error) => {
        logger("error", "Failed to create session description", error);
      })).catch((error) => {
        logger("error", "Failed to create session description", error);
      });
    }
  }
};

// ../mod/signalling.mjs
var Signalling = class {
  signalOptions;
  // Global.
  webSocket;
  closed;
  config;
  /**
  * subscribe to the signalling event handler.
  * {function} callback(eventName, eventDetails, this object, event)
  */
  eventSignalling;
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
  constructor(signalOptions) {
    this.signalOptions = signalOptions;
    let self = this;
    this.closed = false;
    let item;
    let options = signalOptions || {};
    let config = this.config = {
      signallingURL: "wss://127.0.0.1:443"
    };
    for (item in options) {
      if (options.hasOwnProperty(item)) {
        config[item] = options[item];
      }
    }
    try {
      this.webSocket = new WebSocket(config.signallingURL);
    } catch (e) {
      logger("error", "Error connecting to WebSocket", e);
    }
    if (this.webSocket) {
      this.webSocket.onopen = function(openEvent) {
        self.eventSignalling("signallingEventOpen", "Signalling has opened.", self, openEvent);
      };
      this.webSocket.onerror = function(errorEvent) {
        self.eventSignalling("signallingEventError", "Signalling has encountered and unknown error.", self, errorEvent);
      };
      this.webSocket.onclose = function(closeEvent) {
        self.eventSignalling("signallingEventClose", "Signalling has closed.", self, closeEvent);
      };
      this.webSocket.onmessage = function(messageEvent) {
        let signal = null;
        signal = JSON.parse(messageEvent.data);
        if (signal.response) {
          if (signal.error) {
            self.eventSignalling("signallingEventErrorDetails", "Signalling has encountered an error.", self, signal.error);
          } else if (signal.applications) {
            self.eventSignalling("signallingEventApplications", "Signalling has applications", self, signal.applications);
          } else if (signal.uniques) {
            self.eventSignalling("signallingEventUniques", "Signalling has uniques", self, signal.uniques);
          } else if (signal.groups) {
            self.eventSignalling("signallingEventGroups", "Signalling has groups", self, signal.groups);
          } else {
            if (signal.settings && signal.settings === true) {
              self.eventSignalling("signallingEventSettings", "Signalling settings have been applied.", self, signal.settings);
            } else if (signal.contactAvailable) {
              let uniqueID = signal.contactUniqueID;
              let applicationID = signal.contactApplicationID;
              let details = {
                contactUniqueID: uniqueID,
                contactApplicationID: applicationID,
                contactAvailable: signal.contactAvailable
              };
              self.eventSignalling("signallingEventAvailable", "Signalling contact available.", self, details);
            } else if (signal.contactMessage) {
              let uniqueID = signal.contactUniqueID;
              let applicationID = signal.contactApplicationID;
              let details = {
                contactUniqueID: uniqueID,
                contactApplicationID: applicationID,
                contactMessage: signal.contactMessage
              };
              self.eventSignalling("signallingEventMessage", "Signalling contact message.", self, details);
            } else if (signal.clientState) {
              let uniqueID = signal.contactUniqueID;
              let applicationID = signal.contactApplicationID;
              let details = {
                contactUniqueID: uniqueID,
                contactApplicationID: applicationID,
                contactState: signal.state
              };
              self.eventSignalling("signallingEventState", "Signalling contact state.", self, details);
            } else if (signal.clientDetails) {
              let uniqueID = signal.contactUniqueID;
              let applicationID = signal.contactApplicationID;
              let details = {
                contactUniqueID: uniqueID,
                contactApplicationID: applicationID,
                clientDetails: signal.details
              };
              self.eventSignalling("signallingEventDetails", "Signalling contact details.", self, details);
            } else {
              if (signal.available && signal.available === true) {
                let uniqueID = signal.contactUniqueID;
                let applicationID = signal.contactApplicationID;
                let isDataChannel = false;
                if (signal.fileTransferOffer || signal.fileTransferAnswer || signal.isData) {
                  isDataChannel = true;
                }
                if (signal.sdp) {
                  let details = {
                    contactUniqueID: uniqueID,
                    contactApplicationID: applicationID,
                    sdp: signal.sdp,
                    isData: isDataChannel
                  };
                  self.eventSignalling("signallingEventSDP", "Signalling an SDP signal has been received.", self, details);
                }
                if (signal.candidate) {
                  let details = {
                    contactUniqueID: uniqueID,
                    contactApplicationID: applicationID,
                    candidate: signal.candidate,
                    type: signal.type,
                    isData: isDataChannel
                  };
                  self.eventSignalling("signallingEventCandidate", "Signalling a candidate signal has been received.", self, details);
                }
                if (signal.callOffer) {
                  let details = {
                    contactUniqueID: uniqueID,
                    contactApplicationID: applicationID
                  };
                  self.eventSignalling("signallingEventOffer", "Signalling an offer signal has been received.", self, details);
                }
                if (signal.callAnswer) {
                  let details = {
                    contactUniqueID: uniqueID,
                    contactApplicationID: applicationID
                  };
                  self.eventSignalling("signallingEventAnswer", "Signalling an answer signal has been received.", self, details);
                }
                if (signal.joinConferenceOffer) {
                  let details = {
                    contactUniqueID: uniqueID,
                    contactApplicationID: applicationID,
                    conference: signal.conferenceCall
                  };
                  self.eventSignalling("signallingEventJoinConferenceOffer", "Signalling a join conference offer signal has been received.", self, details);
                }
                if (signal.joinConferenceAnswer) {
                  let details = {
                    contactUniqueID: uniqueID,
                    contactApplicationID: applicationID,
                    conference: signal.conferenceCall
                  };
                  self.eventSignalling("signallingEventJoinConferenceAnswer", "Signalling a join conference answer signal has been received.", self, details);
                }
                if (signal.fileTransferOffer) {
                  let details = {
                    contactUniqueID: uniqueID,
                    contactApplicationID: applicationID,
                    name: signal.name,
                    size: signal.size,
                    type: signal.type,
                    lastModified: signal.lastModified,
                    fileTransfer: signal.fileTransferOffer
                  };
                  self.eventSignalling("signallingEventFileOffer", "Signalling a file transfer offer signal has been received.", self, details);
                }
                if (signal.fileTransferAnswer) {
                  let details = {
                    contactUniqueID: uniqueID,
                    contactApplicationID: applicationID,
                    fileTransfer: signal.fileTransferAnswer
                  };
                  self.eventSignalling("signallingEventFileAnswer", "Signalling a file answer signal has been received.", self, details);
                }
                if (signal.noanswer) {
                  let details = {
                    contactUniqueID: uniqueID,
                    contactApplicationID: applicationID,
                    noanswer: signal.noanswer
                  };
                  self.eventSignalling("signallingEventNoAnswer", "Signalling the peer contact did not answer.", self, details);
                }
                if (signal.endCallRemote) {
                  let details = {
                    contactUniqueID: uniqueID,
                    contactApplicationID: applicationID,
                    endCallRemote: signal.endCallRemote
                  };
                  self.eventSignalling("signallingEventEndCall", "Signalling the peer contact ended the call.", self, details);
                }
                if (signal.contactTypingMessage) {
                  let details = {
                    contactUniqueID: uniqueID,
                    contactApplicationID: applicationID,
                    contactTypingMessage: signal.contactTypingMessage,
                    typing: signal.typing
                  };
                  if (signal.typing && signal.typing === true) {
                    self.eventSignalling("signallingEventTypingMessage", "Signalling the contact is typing a message.", self, details);
                  } else {
                    self.eventSignalling("signallingEventTypingMessage", "Signalling the contact has stopped typing.", self, details);
                  }
                } else {
                  let details = {
                    contactAvailable: signal.available
                  };
                  self.eventSignalling("signallingEventSelfAvailable", "Signalling the contact is available.", self, details);
                }
              } else {
                let details = {
                  contactAvailable: signal.available
                };
                self.eventSignalling("signallingEventSelfAvailable", "Signalling the contact is not available.", self, details);
              }
            }
          }
        } else {
          self.eventSignalling("signallingEventErrorDetails", "Signalling has encountered an unknown error.", self, null);
        }
      };
    }
    ;
  }
  /**
  * subscribe to the signalling event handler.
  * @param {function}	event callback(eventName, eventDetails, this object, event).
  */
  onSignallingEventHandler(event) {
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
  changeClientSettings(uniqueID, applicationID, available, broadcast, broadcastAppID, accessToken) {
    if (this.webSocket.readyState !== this.webSocket.OPEN)
      return;
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
    if (this.webSocket.readyState !== this.webSocket.OPEN)
      return;
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
    if (this.webSocket.readyState !== this.webSocket.OPEN)
      return;
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
    if (this.webSocket.readyState !== this.webSocket.OPEN)
      return;
    this.webSocket.send(JSON.stringify({
      "contactUniqueID": contactUniqueID,
      "contactApplicationID": contactApplicationID,
      "contactMessage": message
    }));
  }
  /**
   * Send ICE candidate details to this contact.
   *
   * @param {string}  contactUniqueID         The contact unique id.
   * @param {string}  contactApplicationID    The contact application id.
   * @param {string}  candidate               The candidate details.
   * @param {boolean} isData                  Is the candidate a data channel.
   */
  iceCandidate(contactUniqueID, contactApplicationID, candidate, isData) {
    if (this.webSocket.readyState !== this.webSocket.OPEN)
      return;
    this.webSocket.send(JSON.stringify({
      "contactUniqueID": contactUniqueID,
      "contactApplicationID": contactApplicationID,
      "candidate": candidate,
      "type": "candidate",
      "isData": isData
    }));
  }
  /**
   * Send do not want to answer to this contact.
   *
   * @param {string}  contactUniqueID         The contact unique id.
   * @param {string}  contactApplicationID    The contact application id.
   */
  noAnswer(contactUniqueID, contactApplicationID) {
    if (this.webSocket.readyState !== this.webSocket.OPEN)
      return;
    this.webSocket.send(JSON.stringify({
      "contactUniqueID": contactUniqueID,
      "contactApplicationID": contactApplicationID,
      "noanswer": true
    }));
  }
  /**
   * Send end of call to this contact.
   *
   * @param {string}  contactUniqueID         The contact unique id.
   * @param {string}  contactApplicationID    The contact application id.
   */
  sendEndCallToContact(contactUniqueID, contactApplicationID) {
    if (this.webSocket.readyState !== this.webSocket.OPEN)
      return;
    this.webSocket.send(JSON.stringify({
      "contactUniqueID": contactUniqueID,
      "contactApplicationID": contactApplicationID,
      "endCallRemote": true
    }));
  }
  /**
   * Send a request asking if the contact is available.
   *
   * @param {string}  contactUniqueID         The contact unique id.
   * @param {string}  contactApplicationID    The contact application id.
   */
  contactAvailable(contactUniqueID, contactApplicationID) {
    if (this.webSocket.readyState !== this.webSocket.OPEN)
      return;
    this.webSocket.send(JSON.stringify({
      "contactUniqueID": contactUniqueID,
      "contactApplicationID": contactApplicationID,
      "contactAvailable": true
    }));
  }
  /**
   * Send the offer to this contact.
   *
   * @param {string}                  contactUniqueID         The contact unique id.
   * @param {string}                  contactApplicationID    The contact application id.
   * @param {RTCSessionDescription}   sdpOfferRequest         The SDP offer.
   */
  sendOffer(contactUniqueID, contactApplicationID, sdpOfferRequest) {
    if (this.webSocket.readyState !== this.webSocket.OPEN)
      return;
    this.webSocket.send(JSON.stringify({
      "contactUniqueID": contactUniqueID,
      "contactApplicationID": contactApplicationID,
      "callOffer": true,
      "sdp": sdpOfferRequest
    }));
  }
  /**
   * Send the answer to this contact.
   *
   * @param {string}                  contactUniqueID         The contact unique id.
   * @param {string}                  contactApplicationID    The contact application id.
   * @param {RTCSessionDescription}   sdpAnswerResponse       The SDP answer.
   */
  sendAnswer(contactUniqueID, contactApplicationID, sdpAnswerResponse) {
    if (this.webSocket.readyState !== this.webSocket.OPEN)
      return;
    this.webSocket.send(JSON.stringify({
      "contactUniqueID": contactUniqueID,
      "contactApplicationID": contactApplicationID,
      "callAnswer": true,
      "sdp": sdpAnswerResponse
    }));
  }
  /**
   * Send to the contact a message indicating that this client is joining the conference.
   *
   * @param {string}                  contactUniqueID         The contact unique id.
   * @param {string}                  contactApplicationID    The contact application id.
   * @param {RTCSessionDescription}   sdpOfferRequest         The SDP offer.
   */
  sendJoinConferenceOffer(contactUniqueID, contactApplicationID, sdpOfferRequest) {
    if (this.webSocket.readyState !== this.webSocket.OPEN)
      return;
    this.webSocket.send(JSON.stringify({
      "contactUniqueID": contactUniqueID,
      "contactApplicationID": contactApplicationID,
      "joinConferenceOffer": true,
      "conferenceCall": true,
      "sdp": sdpOfferRequest
    }));
  }
  /**
   * Send to the contact a message indicating that this client has joined the conference.
   *
   * @param {string}                  contactUniqueID         The contact unique id.
   * @param {string}                  contactApplicationID    The contact application id.
   * @param {RTCSessionDescription}   sdpAnswerResponse       The SDP answer.
   */
  sendJoinConferenceAnswer(contactUniqueID, contactApplicationID, sdpAnswerResponse) {
    if (this.webSocket.readyState !== this.webSocket.OPEN)
      return;
    this.webSocket.send(JSON.stringify({
      "contactUniqueID": contactUniqueID,
      "contactApplicationID": contactApplicationID,
      "joinConferenceAnswer": true,
      "conferenceCall": true,
      "sdp": sdpAnswerResponse
    }));
  }
  /**
   * Send a message to the contact that this contact has started typing.
   *
   * @param {string}     contactUniqueID          The contact unique id.
   * @param {string}     contactApplicationID     The contact application id.
   */
  startedTypingMessage(contactUniqueID, contactApplicationID) {
    if (this.webSocket.readyState !== this.webSocket.OPEN)
      return;
    this.webSocket.send(JSON.stringify({
      "contactUniqueID": contactUniqueID,
      "contactApplicationID": contactApplicationID,
      "contactTypingMessage": true,
      "typing": true
    }));
  }
  /**
   * Send a message to the contact that this contact has stopped typing.
   *
   * @param {string}     contactUniqueID          The contact unique id.
   * @param {string}     contactApplicationID     The contact application id.
   */
  stoppedTypingMessage(contactUniqueID, contactApplicationID) {
    if (this.webSocket.readyState !== this.webSocket.OPEN)
      return;
    this.webSocket.send(JSON.stringify({
      "contactUniqueID": contactUniqueID,
      "contactApplicationID": contactApplicationID,
      "contactTypingMessage": true,
      "typing": false
    }));
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
  sendFileTransferOffer(contactUniqueID, contactApplicationID, sdpOfferRequest, fileName, fileSize, fileType, fileLastModified) {
    if (this.webSocket.readyState !== this.webSocket.OPEN)
      return;
    this.webSocket.send(JSON.stringify({
      "contactUniqueID": contactUniqueID,
      "contactApplicationID": contactApplicationID,
      "fileTransferOffer": true,
      "name": fileName,
      "size": fileSize,
      "type": fileType,
      "lastModified": fileLastModified,
      "sdp": sdpOfferRequest
    }));
  }
  /**
   * Send the file transfer answer to this contact.
   *
   * @param {string}                  contactUniqueID         The contact unique id.
   * @param {string}                  contactApplicationID    The contact application id.
   * @param {RTCSessionDescription}   sdpAnswerResponse       The SDP answer.
   */
  sendFileTransferAnswer(contactUniqueID, contactApplicationID, sdpAnswerResponse) {
    if (this.webSocket.readyState !== this.webSocket.OPEN)
      return;
    this.webSocket.send(JSON.stringify({
      "contactUniqueID": contactUniqueID,
      "contactApplicationID": contactApplicationID,
      "fileTransferAnswer": true,
      "sdp": sdpAnswerResponse
    }));
  }
  /**
   * Send do not want the file transfer answer to this contact.
   *
   * @param {string}     contactUniqueID          The contact unique id.
   * @param {string}     contactApplicationID     The contact application id.
   */
  noFileTransferAnswer(contactUniqueID, contactApplicationID) {
    if (this.webSocket.readyState !== this.webSocket.OPEN)
      return;
    this.webSocket.send(JSON.stringify({
      "contactUniqueID": contactUniqueID,
      "contactApplicationID": contactApplicationID,
      "noanswer": true
    }));
  }
  /**
   * Sent a request to get the list of uniques.
   */
  contactUniqueIDList() {
    if (this.webSocket.readyState !== this.webSocket.OPEN)
      return;
    this.webSocket.send("uniqueids");
  }
  /**
   * Sent a request to get the list of applications.
   */
  contactApplicationIDList() {
    if (this.webSocket.readyState !== this.webSocket.OPEN)
      return;
    this.webSocket.send("applicationids");
  }
  /**
   * Sent a request to get the list of groups.
  */
  contactGroupList() {
    if (this.webSocket.readyState !== this.webSocket.OPEN)
      return;
    this.webSocket.send("uniqueapplication");
  }
  /**
   * Close the current signalling connection.
  */
  close() {
    if (this.closed)
      return;
    this.closed = true;
    if (this.webSocket) {
      if (this.webSocket.readyState !== this.webSocket.OPEN)
        return;
      try {
        this.webSocket.close();
        this.webSocket = null;
      } catch (e) {
        logger("error", "Error closing signalling", e);
      }
    }
  }
};

// ../mod/webrtcadapter.mjs
var WebRtcAdapter = class {
  webRtcOptions;
  // Global.
  closed;
  contactPeers;
  signalling;
  config;
  uniqueID;
  applicationID;
  mediaRecorder;
  localStream;
  localStreamVideoElement;
  /**
  * subscribe to the WebRtc Adapter event handler.
  * {function} callback(eventName, eventDetails, this object, event)
  */
  eventWebRtcAdapter;
  /**
  * subscribe to the signalling event handler.
  * {function} callback(eventName, eventDetails, this object, event)
  */
  eventWebRtcAdapterSignalling;
  /**
  * subscribe to the contact peer event handler.
  * {function} callback(eventName, eventDetails, this object, event)
  */
  eventWebRtcAdapterContactPeer;
  /**
   * WebRTC adapter prototype.
   *
   * @param {Object}   webRtcOptions  A collection of options.
   *
   * @example
   *  options = {
   *      uniqueID: "uniqueID",
   *      applicationID: "applicationID",
   *      signallingURL: "wss://127.0.0.1:443",
   *      peerConnectionConfiguration: {
   *          iceServers: [
   *		        {
   *                  "urls": "stun:stun.l.google.com:19302"
   *			    },
   *              {
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
  constructor(webRtcOptions) {
    this.webRtcOptions = webRtcOptions;
    let self = this;
    this.closed = false;
    let item;
    let options = webRtcOptions || {};
    this.uniqueID = webRtcOptions.uniqueID;
    this.applicationID = webRtcOptions.applicationID;
    this.contactPeers = [];
    this.localStream = null;
    this.localStreamVideoElement = null;
    this.mediaRecorder = null;
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
      signallingURL: "wss://127.0.0.1:443"
    };
    for (item in options) {
      if (options.hasOwnProperty(item)) {
        this.config[item] = options[item];
      }
    }
    let configSignalling = {
      signallingURL: config.signallingURL
    };
    this.signalling = new Signalling(configSignalling);
    this.signalling.onSignallingEventHandler((eventName, eventDetails, object, event) => {
      self.eventWebRtcAdapterSignalling(eventName, eventDetails, object, event);
    });
  }
  /**
  * subscribe to the WebRtc Adapter event handler.
  * @param {function}	event callback(eventName, eventDetails, this object, event).
  */
  onWebRtcAdapterEventHandler(event) {
    this.eventWebRtcAdapter = event;
  }
  /**
  * subscribe to the contact peer event handler.
  * @param {function}	event callback(eventName, eventDetails, this object, event).
  */
  onContactPeerEventHandler(event) {
    this.eventWebRtcAdapterContactPeer = event;
  }
  /**
  * subscribe to the signalling event handler.
  * @param {function}	event callback(eventName, eventDetails, this object, event).
  */
  onSignallingEventHandler(event) {
    this.eventWebRtcAdapterSignalling = event;
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
  changeClientSettings(uniqueID, applicationID, available, broadcast, broadcastAppID, accessToken) {
    this.uniqueID = uniqueID;
    this.applicationID = applicationID;
    this.signalling.changeClientSettings(uniqueID, applicationID, available, broadcast, broadcastAppID, accessToken);
  }
  /**
   * Get the client unique id.
   *
   * @return {string} Returns the client unique id.
   */
  getUniqueID() {
    let contactUniqueID = this.uniqueID;
    return contactUniqueID;
  }
  /**
   * Get the client application id.
   *
   * @return {string} Returns the client application id.
   */
  getApplicationID() {
    let contactApplicationID = this.applicationID;
    return contactApplicationID;
  }
  /**
   * Send started typing to contact.
   *
   * @param {string}  uniqueID        The contact unique id.
   * @param {string}  applicationID   The contact application id.
   */
  startedTypingMessage(uniqueID, applicationID) {
    this.signalling.startedTypingMessage(uniqueID, applicationID);
  }
  /**
   * Send stopped typing to contact.
   *
   * @param {string}  uniqueID        The contact unique id.
   * @param {string}  applicationID   The contact application id.
   */
  stoppedTypingMessage(uniqueID, applicationID) {
    this.signalling.stoppedTypingMessage(uniqueID, applicationID);
  }
  /**
   * Get the contact unique list.
   */
  contactUniqueIDList() {
    this.signalling.contactUniqueIDList();
  }
  /**
   * Get the contact application list.
   */
  contactApplicationIDList() {
    this.signalling.contactApplicationIDList();
  }
  /**
   * Get the contact group list.
   */
  contactGroupList() {
    this.signalling.contactGroupList();
  }
  /**
   * Create a new contact.
   *
   * @param {Object}   opts       A collection of options.
   *
   * @example
   *  options = {
   *      uniqueID: "uniqueID",
   *      applicationID: "applicationID",
   *      isData: false,
   *      receiveOfferMedia: {
   *          offerToReceiveAudio: 1,
   *          offerToReceiveVideo: 1
   *      }
   *  }
   *
   * @return {ContactPeer} Returns the contact.
   */
  createContactPeer(opts) {
    let self = this;
    opts.parent = self;
    opts.signalling = this.signalling;
    let peer = new ContactPeer(opts);
    peer.onContactPeerEventHandler((eventName, eventDetails, object, event) => {
      self.eventWebRtcAdapterContactPeer(eventName, eventDetails, object, event);
    });
    this.contactPeers.push(peer);
    return peer;
  }
  /**
   * Remove all contacts.
   */
  removeContactPeers() {
    this.getContactPeers().forEach(function(peer) {
      peer.close();
    });
  }
  /**
   * Remove the contact.
   *
   * @param {string}  uniqueID        The contact unique id.
   * @param {string}  applicationID   The contact application id.
   * @param {boolean}  isData         True if contact is only data channel; else false.
   */
  removeContactPeer(uniqueID, applicationID, isData) {
    this.getContactPeers().forEach(function(peer) {
      if (peer.uniqueID === uniqueID && peer.applicationID === applicationID && peer.isData === isData) {
        peer.close();
      }
    });
  }
  /**
   * Get all contacts.
   *
   * @return {Array} Returns the contact list.
   */
  getContactPeers() {
    return this.contactPeers.filter(function(peer) {
      return true;
    });
  }
  /**
   * Get the contact.
   *
   * @param {string}  uniqueID        The contact unique id.
   * @param {string}  applicationID   The contact application id.
   * @param {boolean}  isData         True if contact is only data channel; else false.
   *
   * @return {ContactPeer} Returns the contact.
   */
  getContactPeer(uniqueID, applicationID, isData) {
    return this.contactPeers.filter(function(peer) {
      return peer.uniqueID === uniqueID && peer.applicationID === applicationID && peer.isData === isData;
    });
  }
  /**
   * Is the contact in the contact list.
   *
   * @param {string}  uniqueID        The contact unique id.
   * @param {string}  applicationID   The contact application id.
   *
   * @return {ContactPeer} Returns the contact; else null.
   */
  isContactPeer(uniqueID, applicationID) {
    return this.contactPeers.filter(function(peer) {
      return peer.uniqueID === uniqueID && peer.applicationID === applicationID;
    });
  }
  /**
   * Send the client state to all contacts.
   *
   * @param {string}  state         The state to sent.
   */
  sendStateToAllContacts(state) {
    this.contactPeers.forEach(function(peer) {
      peer.sendState(state);
    });
  }
  /**
   * Send a message to all contacts.
   *
   * @param {string}  message         The message to sent.
   */
  sendMessageToAllContacts(message) {
    this.contactPeers.forEach(function(peer) {
      peer.sendMessage(message);
    });
  }
  /**
   * Send a message to the contact.
   *
   * @param {string}  uniqueID        The contact unique id.
   * @param {string}  applicationID   The contact application id.
   * @param {string}  message         The message to sent.
   * @param {boolean}  isData         True if contact is only data channel; else false.
   */
  sendMessageToContact(uniqueID, applicationID, message, isData) {
    this.contactPeers.forEach(function(peer) {
      if (peer.uniqueID === uniqueID && peer.applicationID === applicationID && peer.isData === isData) {
        peer.sendMessage(message);
      }
    });
  }
  /**
   * Send a details to all contacts.
   *
   * @param {string}  details         The details to sent.
   */
  sendDetailsToAllContacts(details) {
    this.contactPeers.forEach(function(peer) {
      peer.sendDetails(details);
    });
  }
  /**
   * Send a details to the contact.
   *
   * @param {string}  uniqueID        The contact unique id.
   * @param {string}  applicationID   The contact application id.
   * @param {string}  details         The details to sent.
   * @param {boolean}  isData         True if contact is only data channel; else false.
   */
  sendDetailsToContact(uniqueID, applicationID, details, isData) {
    this.contactPeers.forEach(function(peer) {
      if (peer.uniqueID === uniqueID && peer.applicationID === applicationID && peer.isData === isData) {
        peer.sendDetails(details);
      }
    });
  }
  /**
   * Send end of call to all contacts.
   */
  sendEndCallToAllContacts() {
    this.contactPeers.forEach(function(peer) {
      peer.sendEndCall();
    });
  }
  /**
   * Send end of call to the contact.
   *
   * @param {string}  uniqueID         The contact unique id.
   * @param {string}  applicationID    The contact application id.
   * @param {boolean}  isData          True if contact is only data channel; else false.
   */
  sendEndCallToContact(uniqueID, applicationID, isData) {
    this.contactPeers.forEach(function(peer) {
      if (peer.uniqueID === uniqueID && peer.applicationID === applicationID && peer.isData === isData) {
        peer.sendEndCall();
      }
    });
  }
  /**
   * Set the file transfer information for the contact.
   *
   * @param {string}  uniqueID            The contact unique id.
   * @param {string}  applicationID       The contact application id.
   * @param {boolean}  isData             True if contact is only data channel; else false.
   * @param {string}  fileName            The file name to send.
   * @param {number}  fileSize            The file size.
   * @param {string}  fileType            The file type.
   * @param {number}  fileLastModified    The file last modified date.
   */
  setContactFileInfo(uniqueID, applicationID, isData, fileName, fileSize, fileType, fileLastModified) {
    this.contactPeers.forEach(function(peer) {
      if (peer.uniqueID === uniqueID && peer.applicationID === applicationID && peer.isData === isData) {
        peer.setFileInfo(fileName, fileSize, fileType, fileLastModified);
      }
    });
  }
  /**
   * Send is contact avaliable request.
   *
   * @param {string}  uniqueID         The contact unique id.
   * @param {string}  applicationID    The contact application id.
   * @param {boolean}  isData          True if contact is only data channel; else false.
   */
  isContactAvailable(uniqueID, applicationID, isData) {
    this.contactPeers.forEach(function(peer) {
      if (peer.uniqueID === uniqueID && peer.applicationID === applicationID && peer.isData === isData) {
        peer.isAvailable();
      }
    });
  }
  /**
   * Close this adapter.
   */
  close() {
    if (this.closed)
      return;
    this.closed = true;
    try {
      this.closeStream();
      this.localStream = null;
      this.localStreamVideoElement = null;
    } catch (e) {
      logger("error", "Error closing stream", e);
    }
    try {
      this.signalling.close();
      this.signalling = null;
    } catch (e) {
      logger("error", "Error closing signalling", e);
    }
    try {
      this.stopRecording();
    } catch (e) {
      logger("error", "Error stopping recording", e);
    }
    this.removeContactPeers();
  }
  /**
   * Mute the audio and video tracks for the local stream.
   *
   * @param {boolean}     mute   True to mute; else false.
   */
  muteAudioVideo(mute) {
    this.contactPeers.forEach(function(peer) {
      peer.muteAudioVideo(mute);
    });
  }
  /**
   * Close the local stream.
   */
  closeStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(function(track) {
        track.stop();
      });
      if (this.localStreamVideoElement) {
        this.localStreamVideoElement.srcObject = null;
      }
    }
  }
  /**
   * Create the local audio and video stream.
   *
   * @param {boolean}     audio   True to enable audio in local stream; else false.
   * @param {boolean}     video   True to enable video in local stream; else false.
   */
  createStream(audio, video) {
    let self = this;
    navigator.mediaDevices.getUserMedia({ "audio": audio, "video": video }).then(function(stream) {
      self.localStream = stream;
      self.localStreamVideoElement.srcObject = self.localStream;
    }).catch(function(error) {
      logger("error", "Error could not create stream", error);
    });
  }
  /**
   * Create a local capture media, screen or application window: no audio.
   *
   * @param {string}     captureMediaSource   The capture media source ('screen' or 'window').
   * @link  https://developer.mozilla.org/docs/Web/API/MediaDevices/getDisplayMedia
   * @link https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API/Using_Screen_Capture
   */
  createStreamCapture(captureMediaSource) {
    let self = this;
    let constraints = {
      video: {
        displaySurface: captureMediaSource
      },
      audio: false
    };
    navigator.mediaDevices.getDisplayMedia(constraints).then(function(stream) {
      self.localStream = stream;
      self.localStreamVideoElement.srcObject = self.localStream;
    }).catch(function(error) {
      logger("error", "Error could not create capture stream", error);
    });
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
  createStreamEx(constraints) {
    let self = this;
    navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
      self.localStream = stream;
      self.localStreamVideoElement.srcObject = self.localStream;
    }).catch(function(error) {
      logger("error", "Error could not create stream", error);
    });
  }
  /**
  * Create the local media stream from the display media selection.
  *
  * @param {DisplayMediaStreamOptions}     constraints   The media constraints.
  * @link  https://developer.mozilla.org/docs/Web/API/MediaDevices/getDisplayMedia
  * @link https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API/Using_Screen_Capture
  *
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
  createStreamCaptureEx(constraints) {
    let self = this;
    navigator.mediaDevices.getDisplayMedia(constraints).then(function(stream) {
      self.localStream = stream;
      self.localStreamVideoElement.srcObject = self.localStream;
    }).catch(function(error) {
      logger("error", "Error could not create capture stream", error);
    });
  }
  /**
   * Set the local stream to the video element.
   *
   * @param {object}      videoElement   The local video element.
   *
   * @return {boolean}    True if the stream has been added; else false.
   */
  setLocalStreamToVideoElement(videoElement) {
    if (this.localStream) {
      this.localStreamVideoElement = videoElement;
      this.localStreamVideoElement.srcObject = this.localStream;
      return true;
    } else {
      return false;
    }
  }
  /**
   * Get all audio input devices.
   *
   * @param {Function}     callback   (deviceList: Array<MediaDeviceInfo>)
   * @link https://developer.mozilla.org/docs/Web/API/MediaDeviceInfo/kind
   * @link https://developer.mozilla.org/docs/Web/API/MediaDevices/enumerateDevices
   */
  getAudioInputDevices(callback) {
    let devices = [];
    navigator.mediaDevices.enumerateDevices().then(function(deviceInfos) {
      for (var i = 0; i !== deviceInfos.length; ++i) {
        let deviceInfo = deviceInfos[i];
        if (deviceInfo.kind === "audioinput") {
          devices.push(deviceInfo);
        }
      }
      callback(devices);
    }).catch(function(error) {
      logger("error", "Error could not get audio input devices", error);
    });
  }
  /**
   * Get all audio output devices.
   *
   * @param {Function}     callback   (deviceList: Array<MediaDeviceInfo>)
   * @link https://developer.mozilla.org/docs/Web/API/MediaDeviceInfo/kind
   * @link https://developer.mozilla.org/docs/Web/API/MediaDevices/enumerateDevices
   */
  getAudioOutputDevices(callback) {
    let devices = [];
    navigator.mediaDevices.enumerateDevices().then(function(deviceInfos) {
      for (var i = 0; i !== deviceInfos.length; ++i) {
        let deviceInfo = deviceInfos[i];
        if (deviceInfo.kind === "audiooutput") {
          devices.push(deviceInfo);
        }
      }
      callback(devices);
    }).catch(function(error) {
      logger("error", "Error could not get audio output devices", error);
    });
  }
  /**
   * Get all video input devices.
   *
   * @param {Function}     callback   (deviceList: Array<MediaDeviceInfo>)
   * @link https://developer.mozilla.org/docs/Web/API/MediaDeviceInfo/kind
   * @link https://developer.mozilla.org/docs/Web/API/MediaDevices/enumerateDevices
   */
  getVideoInputDevices(callback) {
    let devices = [];
    navigator.mediaDevices.enumerateDevices().then(function(deviceInfos) {
      for (var i = 0; i !== deviceInfos.length; ++i) {
        let deviceInfo = deviceInfos[i];
        if (deviceInfo.kind === "videoinput") {
          devices.push(deviceInfo);
        }
      }
      callback(devices);
    }).catch(function(error) {
      logger("error", "Error could not get video input devices", error);
    });
  }
  /**
   * Set the local video element.
   *
   * @param {object}      videoElement   The local video element.
   */
  setLocalVideoElement(videoElement) {
    this.localStreamVideoElement = videoElement;
  }
  /**
   * Get the local stream.
   *
   * @return {MediaStream} Returns the local stream.
   */
  getStream() {
    let stream = this.localStream;
    return stream;
  }
  /**
   * Set the local stream.
   *
   * @param {MediaStream}      stream   The media stream.
   */
  setStream(stream) {
    this.localStream = stream;
  }
  /**
   * Start recording local stream.
   *
   * @param {MediaRecorderOptions}      [recordingOptions]    The recording options.
   * @param {number}      timeInterval        The time interval (milliseconds).
   */
  startRecording(recordingOptions, timeInterval) {
    if (this.localStream) {
      var stream = this.localStream;
      try {
        this.mediaRecorder = new MediaRecorder(stream, recordingOptions);
      } catch (e) {
        logger("error", "Error creating MediaRecorder", e);
      }
      if (this.mediaRecorder) {
        let self = this;
        this.mediaRecorder.onstop = function(evt) {
          self.eventWebRtcAdapter("adapterRecordingStopped", "Adapter has stopped recording.", self, evt);
        };
        this.mediaRecorder.ondataavailable = function(event) {
          if (event.data && event.data.size > 0) {
            self.eventWebRtcAdapter("adapterRecordingData", "Adapter has recording data.", self, event.data);
          }
        };
        this.mediaRecorder.start(timeInterval);
      }
    }
  }
  /**
   * Stop recording local stream.
   */
  stopRecording() {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }
  }
  /**
   * Pause recording local stream.
   */
  pauseRecording() {
    if (this.mediaRecorder) {
      this.mediaRecorder.pause();
    }
  }
  /**
   * Resume  recording local stream.
   */
  resumeRecording() {
    if (this.mediaRecorder) {
      this.mediaRecorder.resume();
    }
  }
};

// ../mod/webrtcapp.mjs
var WebRtcApp = class {
  webRtcOptions;
  // Global.
  webrtcadapter;
  closed;
  config;
  parent;
  /**
  * subscribe to the WebRtc event handler.
  * {function} callback(eventName, eventDetails, object, event)
  */
  eventWebRtc;
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
  constructor(webRtcOptions) {
    this.webRtcOptions = webRtcOptions;
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
    for (item in options) {
      if (options.hasOwnProperty(item)) {
        this.config[item] = options[item];
      }
    }
    this.webrtcadapter = new WebRtcAdapter(this.config);
    this.webrtcadapter.onWebRtcAdapterEventHandler((eventName, eventDetails, object, event) => {
      switch (eventName) {
        case "adapterRecordingData": {
          let argum = {
            data: event,
            text: eventDetails,
            object,
            objectName: "WebRtcAdapter",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("recordingData", argum);
          break;
        }
        case "adapterRecordingStopped": {
          let argum = {
            evt: event,
            text: eventDetails,
            object,
            objectName: "WebRtcAdapter",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("recordingStopped", argum);
          break;
        }
      }
    });
    this.webrtcadapter.onContactPeerEventHandler((eventName, eventDetails, object, event) => {
      switch (eventName) {
        case "peerContactEventICEStateChange": {
          let argum = {
            contact: object,
            state: event,
            text: eventDetails,
            object,
            objectName: "ContactPeer",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("contactICEStateChange", argum);
          break;
        }
        case "peerContactEventICECandidateError": {
          let argum = {
            contact: object,
            error: event,
            text: eventDetails,
            object,
            objectName: "ContactPeer",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("contactICECandidateError", argum);
          break;
        }
        case "peerContactEventICECandidate": {
          let argum = {
            contact: object,
            message: event,
            text: eventDetails,
            object,
            objectName: "ContactPeer",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("contactICECandidate", argum);
          break;
        }
        case "peerContactEventSignalingStateChange": {
          let argum = {
            contact: object,
            state: event,
            text: eventDetails,
            object,
            objectName: "ContactPeer",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("contactSignalingStateChange", argum);
          break;
        }
        case "peerContactEventNegotiationNeeded": {
          let argum = {
            contact: object,
            state: event,
            text: eventDetails,
            object,
            objectName: "ContactPeer",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("contactNegotiationNeeded", argum);
          break;
        }
        case "peerContactEventRemoveStream": {
          let argum = {
            contact: object,
            remove: event,
            text: eventDetails,
            object,
            objectName: "ContactPeer",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("contactRemoveStream", argum);
          break;
        }
        case "peerContactEventAddStream": {
          let argum = {
            contact: object,
            add: event,
            text: eventDetails,
            object,
            objectName: "ContactPeer",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("contactAddStream", argum);
          break;
        }
        case "peerContactEventAddTrack": {
          let argum = {
            contact: object,
            add: event,
            text: eventDetails,
            object,
            objectName: "ContactPeer",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("contactAddStream", argum);
          break;
        }
        case "peerContactEventDataChannelReceivedSize": {
          let argum = {
            contact: object,
            size: event,
            text: eventDetails,
            object,
            objectName: "ContactPeer",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("contactReceiveSize", argum);
          break;
        }
        case "peerContactEventDataChannelReceiveComplete": {
          let argum = {
            contact: object,
            buffer: event,
            text: eventDetails,
            object,
            objectName: "ContactPeer",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("contactReceiveComplete", argum);
          break;
        }
        case "peerContactEventDataChannelOpen": {
          let argum = {
            contact: object,
            open: event,
            text: eventDetails,
            object,
            objectName: "ContactPeer",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("contactReceiveOpen", argum);
          break;
        }
        case "peerContactEventDataChannelClose": {
          let argum = {
            contact: object,
            close: event,
            text: eventDetails,
            object,
            objectName: "ContactPeer",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("contactReceiveClose", argum);
          break;
        }
        case "peerContactEventDataChannelError": {
          let argum = {
            contact: object,
            error: event,
            text: eventDetails,
            object,
            objectName: "ContactPeer",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("contactReceiveError", argum);
          break;
        }
        case "peerContactEventDataChannelSentSize": {
          let argum = {
            contact: object,
            size: event,
            text: eventDetails,
            object,
            objectName: "ContactPeer",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("contactSentSize", argum);
          break;
        }
        case "peerContactEventDataChannelSentComplete": {
          let argum = {
            contact: object,
            buffer: event,
            text: eventDetails,
            object,
            objectName: "ContactPeer",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("contactSentComplete", argum);
          break;
        }
        case "peerContactEventDataChannelSentMessage": {
          let argum = {
            contact: object,
            message: event,
            text: eventDetails,
            object,
            objectName: "ContactPeer",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("contactSentMessage", argum);
          break;
        }
        case "peerContactEventClose": {
          let argum = {
            contact: object,
            session: event,
            text: eventDetails,
            object,
            objectName: "ContactPeer",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("contactClose", argum);
          break;
        }
        case "peerContactEventSessionError": {
          let argum = {
            contact: object,
            session: event,
            text: eventDetails,
            object,
            objectName: "ContactPeer",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("contactSessionError", argum);
          break;
        }
        case "peerContactRecordingData": {
          let argum = {
            contact: object,
            data: event,
            text: eventDetails,
            object,
            objectName: "ContactPeer",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("contactRecordingData", argum);
          break;
        }
        case "peerContactRecordingStopped": {
          let argum = {
            contact: object,
            evt: event,
            text: eventDetails,
            object,
            objectName: "ContactPeer",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("contactRecordingStopped", argum);
          break;
        }
      }
    });
    this.webrtcadapter.onSignallingEventHandler((eventName, eventDetails, object, event) => {
      switch (eventName) {
        case "signallingEventOpen": {
          let argum = {
            open: true,
            text: eventDetails,
            object,
            objectName: "Signalling",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("connectionOpen", argum);
          break;
        }
        case "signallingEventError": {
          let argum = {
            error: true,
            data: event.data,
            text: eventDetails,
            object,
            objectName: "Signalling",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("connectionError", argum);
          break;
        }
        case "signallingEventClose": {
          let argum = {
            close: true,
            text: eventDetails,
            object,
            objectName: "Signalling",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("connectionClose", argum);
          break;
        }
        case "signallingEventErrorDetails": {
          let argum = {
            error: event,
            text: eventDetails,
            object,
            objectName: "Signalling",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("signalError", argum);
          break;
        }
        case "signallingEventApplications": {
          let argum = {
            list: event,
            text: eventDetails,
            object,
            objectName: "Signalling",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("signalApplications", argum);
          break;
        }
        case "signallingEventUniques": {
          let argum = {
            list: event,
            text: eventDetails,
            object,
            objectName: "Signalling",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("signalUniques", argum);
          break;
        }
        case "signallingEventGroups": {
          let argum = {
            list: event,
            text: eventDetails,
            object,
            objectName: "Signalling",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("signalGroups", argum);
          break;
        }
        case "signallingEventSettings": {
          let argum = {
            setting: event,
            text: eventDetails,
            object,
            objectName: "Signalling",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("signalSettings", argum);
          break;
        }
        case "signallingEventAvailable": {
          let contact = self.createContact(event.contactUniqueID, event.contactApplicationID);
          let argum = {
            contact,
            available: event.contactAvailable,
            text: eventDetails,
            object,
            objectName: "Signalling",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("signalAvailable", argum);
          break;
        }
        case "signallingEventSelfAvailable": {
          let argum = {
            available: event.contactAvailable,
            text: eventDetails,
            object,
            objectName: "Signalling",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("signalSelfAvailable", argum);
          break;
        }
        case "signallingEventMessage": {
          let contact = self.createContact(event.contactUniqueID, event.contactApplicationID);
          let argum = {
            contact,
            message: event.contactMessage,
            text: eventDetails,
            object,
            objectName: "Signalling",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("signalMessage", argum);
          break;
        }
        case "signallingEventState": {
          let contact = self.createContact(event.contactUniqueID, event.contactApplicationID);
          let argum = {
            contact,
            state: event.contactState,
            text: eventDetails,
            object,
            objectName: "Signalling",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("signalState", argum);
          break;
        }
        case "signallingEventDetails": {
          let contact = self.createContact(event.contactUniqueID, event.contactApplicationID);
          contact.setContactDetails(event.clientDetails);
          let argum = {
            contact,
            details: event.clientDetails,
            text: eventDetails,
            object,
            objectName: "Signalling",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("signalDetails", argum);
          break;
        }
        case "signallingEventJoinConferenceOffer": {
          let contact = self.createContact(event.contactUniqueID, event.contactApplicationID);
          let argum = {
            contact,
            conference: event.conference,
            text: eventDetails,
            object,
            objectName: "Signalling",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("signalJoinConferenceOffer", argum);
          break;
        }
        case "signallingEventJoinConferenceAnswer": {
          let contact = self.createContact(event.contactUniqueID, event.contactApplicationID);
          let argum = {
            contact,
            conference: event.conference,
            text: eventDetails,
            object,
            objectName: "Signalling",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("signalJoinConferenceAnswer", argum);
          break;
        }
        case "signallingEventSDP": {
          let contact = null;
          if (event.isData) {
            contact = self.createContactData(event.contactUniqueID, event.contactApplicationID);
          } else {
            contact = self.createContact(event.contactUniqueID, event.contactApplicationID);
          }
          let argum = {
            contact,
            text: eventDetails,
            isData: event.isData,
            sdp: event.sdp,
            object,
            objectName: "Signalling",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("signalSDP", argum);
          break;
        }
        case "signallingEventCandidate": {
          let contact = null;
          if (event.isData) {
            contact = self.createContactData(event.contactUniqueID, event.contactApplicationID);
          } else {
            contact = self.createContact(event.contactUniqueID, event.contactApplicationID);
          }
          let argum = {
            contact,
            text: eventDetails,
            isData: event.isData,
            candidate: event.candidate,
            object,
            objectName: "Signalling",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("signalIceCandidate", argum);
          break;
        }
        case "signallingEventOffer": {
          let contact = self.createContact(event.contactUniqueID, event.contactApplicationID);
          let argum = {
            contact,
            text: eventDetails,
            object,
            objectName: "Signalling",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("signalOffer", argum);
          break;
        }
        case "signallingEventAnswer": {
          let contact = self.createContact(event.contactUniqueID, event.contactApplicationID);
          let argum = {
            contact,
            text: eventDetails,
            object,
            objectName: "Signalling",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("signalAnswer", argum);
          break;
        }
        case "signallingEventFileOffer": {
          let contact = self.createContactData(event.contactUniqueID, event.contactApplicationID);
          contact.setFileInfo(event.name, event.size, event.type, event.lastModified);
          let argum = {
            contact,
            name: event.name,
            size: event.size,
            type: event.type,
            lastModified: event.lastModified,
            text: eventDetails,
            object,
            objectName: "Signalling",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("signalFileOffer", argum);
          break;
        }
        case "signallingEventFileAnswer": {
          let contact = self.createContactData(event.contactUniqueID, event.contactApplicationID);
          let argum = {
            contact,
            text: eventDetails,
            object,
            objectName: "Signalling",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("signalFileAnswer", argum);
          break;
        }
        case "signallingEventNoAnswer": {
          let contact = self.createContact(event.contactUniqueID, event.contactApplicationID);
          let argum = {
            contact,
            text: eventDetails,
            object,
            objectName: "Signalling",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("signalNoAnswer", argum);
          break;
        }
        case "signallingEventEndCall": {
          let contact = self.createContact(event.contactUniqueID, event.contactApplicationID);
          let argum = {
            contact,
            text: eventDetails,
            object,
            objectName: "Signalling",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("signalEndCall", argum);
          break;
        }
        case "signallingEventTypingMessage": {
          let contact = self.createContact(event.contactUniqueID, event.contactApplicationID);
          let argum = {
            contact,
            typing: event.typing,
            text: eventDetails,
            object,
            objectName: "Signalling",
            objectEvent: event,
            rtc: self
          };
          self.eventWebRtc("signalTyping", argum);
          break;
        }
      }
    });
  }
  /**
  * subscribe to the WebRtc Adapter event handler.
  * @param {function}	event callback(eventName, event).
  */
  onWebRtcEventHandler(event) {
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
  createContact(contactUniqueID, contactApplicationID) {
    let contact = this.webrtcadapter.getContactPeer(contactUniqueID, contactApplicationID, false);
    if (contact[0]) {
      return contact[0];
    } else {
      var options = {
        uniqueID: contactUniqueID,
        applicationID: contactApplicationID,
        isData: false
      };
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
  createContactData(contactUniqueID, contactApplicationID) {
    var contact = this.webrtcadapter.getContactPeer(contactUniqueID, contactApplicationID, true);
    if (contact[0]) {
      return contact[0];
    } else {
      var options = {
        uniqueID: contactUniqueID,
        applicationID: contactApplicationID,
        isData: true
      };
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
  removeContact(contactUniqueID, contactApplicationID) {
    let contact = this.webrtcadapter.getContactPeer(contactUniqueID, contactApplicationID, false);
    if (contact[0]) {
      this.webrtcadapter.removeContactPeer(contactUniqueID, contactApplicationID, false);
    }
  }
  /**
   * Remove the data contact if it exists.
   *
   * @param {string}      contactUniqueID        The contact unique id.
   * @param {string}      contactApplicationID   The contact application id.
   */
  removeContactData(contactUniqueID, contactApplicationID) {
    let contact = this.webrtcadapter.getContactPeer(contactUniqueID, contactApplicationID, true);
    if (contact[0]) {
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
  isContactPeer(contactUniqueID, contactApplicationID) {
    let contact = this.webrtcadapter.isContactPeer(contactUniqueID, contactApplicationID);
    if (contact[0]) {
      return true;
    } else {
      return false;
    }
  }
  /**
   * Close the webRTC interface.
   */
  close() {
    if (this.closed)
      return;
    this.closed = true;
    try {
      this.webrtcadapter.close();
    } catch (e) {
      logger("error", "Error closing the WebRTC interface", e);
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
  changeClientSettings(uniqueID, applicationID, available, broadcast, broadcastAppID, accessToken) {
    this.webrtcadapter.changeClientSettings(uniqueID, applicationID, available, broadcast, broadcastAppID, accessToken);
  }
  /**
   * Create the local audio and video stream.
   *
   * @param {boolean}     audio   True to enable audio in local stream; else false.
   * @param {boolean}     video   True to enable video in local stream; else false.
   */
  createStream(audio, video) {
    this.webrtcadapter.createStream(audio, video);
  }
  /**
   * Create the local media stream.
   *
   * @param {string}      audioSource   The audio source.
   * @param {string}      videoSource   The video source.
   */
  createStreamSource(audioSource, videoSource) {
    let constraints = {
      audio: { deviceId: audioSource ? { exact: audioSource } : void 0 },
      video: { deviceId: videoSource ? { exact: videoSource } : void 0 }
    };
    this.webrtcadapter.createStreamEx(constraints);
  }
  /**
   * Create a local capture media, screen or application window: no audio.
   *
   * @param {string}     captureMediaSource   The capture media source ('screen' or 'window').
   */
  createStreamCapture(captureMediaSource) {
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
  createStreamEx(constraints) {
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
  createStreamCaptureEx(constraints) {
    this.webrtcadapter.createStreamCaptureEx(constraints);
  }
  /**
   * Set the local video element.
   *
   * @param {object}      videoElement   The local video element.
   */
  setLocalVideoElement(videoElement) {
    this.webrtcadapter.setLocalVideoElement(videoElement);
  }
  /**
   * Set the local stream to the video element.
   *
   * @param {object}      videoElement   The local video element.
   */
  setLocalStreamToVideoElement(videoElement) {
    this.webrtcadapter.setLocalStreamToVideoElement(videoElement);
  }
  /**
   * Get all audio input sources.
   *
   * @param {Function}     callback   (sourceList: Array<{ deviceID: string, deviceText : string }>)
   */
  getAudioInputSources(callback) {
    let deviceIndex = 1;
    let sources = [];
    this.webrtcadapter.getAudioInputDevices(function(devices) {
      devices.forEach(function(device) {
        let info = {
          deviceID: device.deviceId,
          deviceText: device.label || "microphone " + deviceIndex
        };
        sources.push(info);
        deviceIndex++;
      });
      callback(sources);
    });
  }
  /**
   * Get all audio output sources.
   *
   * @param {Function}     callback   (sourceList: Array<{ deviceID: string, deviceText : string }>)
   */
  getAudioOutputSources(callback) {
    let deviceIndex = 1;
    let sources = [];
    this.webrtcadapter.getAudioOutputDevices(function(devices) {
      devices.forEach(function(device) {
        let info = {
          deviceID: device.deviceId,
          deviceText: device.label || "speaker " + deviceIndex
        };
        sources.push(info);
        deviceIndex++;
      });
      callback(sources);
    });
  }
  /**
   * Get all video input sources.
   *
   * @param {Function}     callback   (sourceList: Array<{ deviceID: string, deviceText : string }>)
   */
  getVideoInputSources(callback) {
    let deviceIndex = 1;
    let sources = [];
    this.webrtcadapter.getVideoInputDevices(function(devices) {
      devices.forEach(function(device) {
        let info = {
          deviceID: device.deviceId,
          deviceText: device.label || "camera " + deviceIndex
        };
        sources.push(info);
        deviceIndex++;
      });
      callback(sources);
    });
  }
  /**
   * Attach audio output device to video element using device/sink ID.
   *
   * @param {object}      videoElement    The video element.
   * @param {string}      deviceID        The source device id.
   */
  attachSinkIdVideoElement(videoElement, deviceID) {
    if (typeof videoElement.sinkId !== "undefined") {
      let self = this;
      videoElement.setSinkId(deviceID).then(function() {
        let argum = {
          data: deviceID,
          text: "App has attached to Sink Id.",
          object: self,
          objectName: "WebRtcApp",
          rtc: self
        };
        self.eventWebRtc("attachSinkId", argum);
      }).catch(function(e) {
        logger("error", "Error assigning device ID", e);
      });
    } else {
      logger("error", "Browser does not support output device selection.", null);
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
  takePicture(videoElement, canvasElement) {
    let data = null;
    let width = videoElement.videoWidth;
    let height = videoElement.videoHeight;
    let context = canvasElement.getContext("2d");
    canvasElement.width = width;
    canvasElement.height = height;
    context.drawImage(videoElement, 0, 0, width, height);
    data = canvasElement.toDataURL("image/png");
    return data;
  }
  /**
   * Close the local stream.
   */
  closeStream() {
    this.webrtcadapter.closeStream();
  }
};

// ../mod/webrtc.mjs
var WebRtc = class {
  webRtcOptions;
  // Global.
  webrtc;
  config;
  parent;
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
  constructor(webRtcOptions) {
    this.webRtcOptions = webRtcOptions;
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
    for (item in options) {
      if (options.hasOwnProperty(item)) {
        this.config[item] = options[item];
      }
    }
    this.webrtc = new WebRtcApp(this.config);
    this.webrtc.parent = self;
    this.webrtc.onWebRtcEventHandler((eventName, event) => {
      if (self.config.debug) {
        logger("info", "Event: " + eventName, event);
      }
      try {
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
        logger("error", "Error:", e);
      }
    });
  }
  connectionOpen;
  /**
  * subscribe to the connectionOpen event handler.
  * @param {function}	event callback(event).
  */
  onConnectionOpen(event) {
    this.connectionOpen = event;
  }
  connectionError;
  /**
  * subscribe to the connectionError event handler.
  * @param {function}	event callback(event).
  */
  onConnectionError(event) {
    this.connectionError = event;
  }
  connectionClose;
  /**
  * subscribe to the connectionClose event handler.
  * @param {function}	event callback(event).
  */
  onConnectionClose(event) {
    this.connectionClose = event;
  }
  signalError;
  /**
  * subscribe to the signalError event handler.
  * @param {function}	event callback(event).
  */
  onSignalError(event) {
    this.signalError = event;
  }
  signalApplications;
  /**
  * subscribe to the signalApplications event handler.
  * @param {function}	event callback(event).
  */
  onSignalApplications(event) {
    this.signalApplications = event;
  }
  signalUniques;
  /**
  * subscribe to the signalUniques event handler.
  * @param {function}	event callback(event).
  */
  onSignalUniques(event) {
    this.signalUniques = event;
  }
  signalGroups;
  /**
  * subscribe to the signalGroups event handler.
  * @param {function}	event callback(event).
  */
  onSignalGroups(event) {
    this.signalGroups = event;
  }
  signalSettings;
  /**
  * subscribe to the signalSettings event handler.
  * @param {function}	event callback(event).
  */
  onSignalSettings(event) {
    this.signalSettings = event;
  }
  signalAvailable;
  /**
  * subscribe to the signalAvailable event handler.
  * @param {function}	event callback(event).
  */
  onSignalAvailable(event) {
    this.signalAvailable = event;
  }
  signalSelfAvailable;
  /**
  * subscribe to the signalSelfAvailable event handler.
  * @param {function}	event callback(event).
  */
  onSignalSelfAvailable(event) {
    this.signalSelfAvailable = event;
  }
  signalMessage;
  /**
  * subscribe to the signalMessage event handler.
  * @param {function}	event callback(event).
  */
  onSignalMessage(event) {
    this.signalMessage = event;
  }
  signalState;
  /**
  * subscribe to the signalState event handler.
  * @param {function}	event callback(event).
  */
  onSignalState(event) {
    this.signalState = event;
  }
  signalDetails;
  /**
  * subscribe to the signalDetails event handler.
  * @param {function}	event callback(event).
  */
  onSignalDetails(event) {
    this.signalDetails = event;
  }
  signalJoinConferenceOffer;
  /**
  * subscribe to the signalJoinConferenceOffer event handler.
  * @param {function}	event callback(event).
  */
  onSignalJoinConferenceOffer(event) {
    this.signalJoinConferenceOffer = event;
  }
  signalJoinConferenceAnswer;
  /**
  * subscribe to the signalJoinConferenceAnswer event handler.
  * @param {function}	event callback(event).
  */
  onSignalJoinConferenceAnswer(event) {
    this.signalJoinConferenceAnswer = event;
  }
  signalSDP;
  /**
  * subscribe to the signalSDP event handler.
  * @param {function}	event callback(event).
  */
  onSignalSDP(event) {
    this.signalSDP = event;
  }
  signalIceCandidate;
  /**
  * subscribe to the signalIceCandidate event handler.
  * @param {function}	event callback(event).
  */
  onSignalIceCandidate(event) {
    this.signalIceCandidate = event;
  }
  signalOffer;
  /**
  * subscribe to the signalOffer event handler.
  * @param {function}	event callback(event).
  */
  onSignalOffer(event) {
    this.signalOffer = event;
  }
  signalAnswer;
  /**
  * subscribe to the signalAnswer event handler.
  * @param {function}	event callback(event).
  */
  onSignalAnswer(event) {
    this.signalAnswer = event;
  }
  signalFileOffer;
  /**
  * subscribe to the signalFileOffer event handler.
  * @param {function}	event callback(event).
  */
  onSignalFileOffer(event) {
    this.signalFileOffer = event;
  }
  signalFileAnswer;
  /**
  * subscribe to the signalFileAnswer event handler.
  * @param {function}	event callback(event).
  */
  onSignalFileAnswer(event) {
    this.signalFileAnswer = event;
  }
  signalNoAnswer;
  /**
  * subscribe to the signalNoAnswer event handler.
  * @param {function}	event callback(event).
  */
  onSignalNoAnswer(event) {
    this.signalNoAnswer = event;
  }
  signalEndCall;
  /**
  * subscribe to the signalEndCall event handler.
  * @param {function}	event callback(event).
  */
  onSignalEndCall(event) {
    this.signalEndCall = event;
  }
  signalTyping;
  /**
  * subscribe to the signalTyping event handler.
  * @param {function}	event callback(event).
  */
  onSignalTyping(event) {
    this.signalTyping = event;
  }
  contactICEStateChange;
  /**
  * subscribe to the contactICEStateChange event handler.
  * @param {function}	event callback(event).
  */
  onContactICEStateChange(event) {
    this.contactICEStateChange = event;
  }
  contactICECandidateError;
  /**
  * subscribe to the contactICECandidateError event handler.
  * @param {function}	event callback(event).
  */
  onContactICECandidateError(event) {
    this.contactICECandidateError = event;
  }
  contactICECandidate;
  /**
  * subscribe to the contactICECandidate event handler.
  * @param {function}	event callback(event).
  */
  onContactICECandidate(event) {
    this.contactICECandidate = event;
  }
  contactSignalingStateChange;
  /**
  * subscribe to the contactSignalingStateChange event handler.
  * @param {function}	event callback(event).
  */
  onContactSignalingStateChange(event) {
    this.contactSignalingStateChange = event;
  }
  contactNegotiationNeeded;
  /**
  * subscribe to the contactNegotiationNeeded event handler.
  * @param {function}	event callback(event).
  */
  onContactNegotiationNeeded(event) {
    this.contactNegotiationNeeded = event;
  }
  contactRemoveStream;
  /**
  * subscribe to the contactRemoveStream event handler.
  * @param {function}	event callback(event).
  */
  onContactRemoveStream(event) {
    this.contactRemoveStream = event;
  }
  contactAddStream;
  /**
  * subscribe to the contactAddStream event handler.
  * @param {function}	event callback(event).
  */
  onContactAddStream(event) {
    this.contactAddStream = event;
  }
  contactReceiveSize;
  /**
  * subscribe to the contactReceiveSize event handler.
  * @param {function}	event callback(event).
  */
  onContactReceiveSize(event) {
    this.contactReceiveSize = event;
  }
  contactReceiveComplete;
  /**
  * subscribe to the contactReceiveComplete event handler.
  * @param {function}	event callback(event).
  */
  onContactReceiveComplete(event) {
    this.contactReceiveComplete = event;
  }
  contactReceiveOpen;
  /**
  * subscribe to the contactReceiveOpen event handler.
  * @param {function}	event callback(event).
  */
  onContactReceiveOpen(event) {
    this.contactReceiveOpen = event;
  }
  contactReceiveClose;
  /**
  * subscribe to the contactReceiveClose event handler.
  * @param {function}	event callback(event).
  */
  onContactReceiveClose(event) {
    this.contactReceiveClose = event;
  }
  contactReceiveError;
  /**
  * subscribe to the contactReceiveError event handler.
  * @param {function}	event callback(event).
  */
  onContactReceiveError(event) {
    this.contactReceiveError = event;
  }
  contactSentSize;
  /**
  * subscribe to the contactSentSize event handler.
  * @param {function}	event callback(event).
  */
  onContactSentSize(event) {
    this.contactSentSize = event;
  }
  contactSentComplete;
  /**
  * subscribe to the contactSentComplete event handler.
  * @param {function}	event callback(event).
  */
  onContactSentComplete(event) {
    this.contactSentComplete = event;
  }
  contactSentMessage;
  /**
  * subscribe to the contactSentMessage event handler.
  * @param {function}	event callback(event).
  */
  onContactSentMessage(event) {
    this.contactSentMessage = event;
  }
  contactClose;
  /**
  * subscribe to the contactClose event handler.
  * @param {function}	event callback(event).
  */
  onContactClose(event) {
    this.contactClose = event;
  }
  contactSessionError;
  /**
  * subscribe to the contactSessionError event handler.
  * @param {function}	event callback(event).
  */
  onContactSessionError(event) {
    this.contactSessionError = event;
  }
  contactRecordingData;
  /**
  * subscribe to the contactRecordingData event handler.
  * @param {function}	event callback(event).
  */
  onContactRecordingData(event) {
    this.contactRecordingData = event;
  }
  contactRecordingStopped;
  /**
  * subscribe to the contactRecordingStopped event handler.
  * @param {function}	event callback(event).
  */
  onContactRecordingStopped(event) {
    this.contactRecordingStopped = event;
  }
  recordingData;
  /**
  * subscribe to the recordingData event handler.
  * @param {function}	event callback(event).
  */
  onRecordingData(event) {
    this.recordingData = event;
  }
  recordingStopped;
  /**
  * subscribe to the recordingStopped event handler.
  * @param {function}	event callback(event).
  */
  onRecordingStopped(event) {
    this.recordingStopped = event;
  }
  attachSinkId;
  /**
  * subscribe to the attachSinkId event handler.
  * @param {function}	event callback(event).
  */
  onAttachSinkId(event) {
    this.attachSinkId = event;
  }
};

// ../cloudflare/callclient.mjs
function startCallClient(options, callback, state) {
  let callClientImp = null;
  try {
    if (options.accessToken !== "" && options.signallingURL !== "") {
      callClientImp = new CallClient(options);
    } else {
      logger("warn", "Call Client Interface", "Has not been initialised, access token and signalling URL do not exist.");
    }
  } catch (e) {
    logger("Error", "Could not start the Call Client interface", e);
  }
  if (callClientImp) {
    try {
      callback(callClientImp, state);
    } catch (e) {
      logger("Error", "Could not initialise the Call Client interface", e);
    }
  } else {
    logger("warn", "Call Client Interface", "Has not been initialised");
  }
}
function stopCallClient(callClientImp) {
  if (callClientImp) {
    try {
      callClientImp.webRtcImp.webrtc.close();
    } catch (e) {
      logger("Error", "Could not stop the Call Client interface", e);
    }
  } else {
    logger("warn", "Call Client Interface", "Has not been initialised");
  }
}
var CallClient = class {
  callOptions;
  config;
  baseURL;
  sessionId;
  remoteTracks;
  webRtcImp;
  /**
  * Call implementation of cloudflare call client.
  * @param {Object}   callOptions  A collection of options.
  * @example
  *  options = {
  *      debug: false,
  *      accessToken: "fdhjhjhjhjfd.................................",
  *      serviceBaseURL: "https://127.0.0.1/awsapi/api/cf/call/",
  *      signallingURL: "wss://127.0.0.1:443",
  *      peerConnectionConfiguration: {
  *          iceServers: [
  *		        {
  *                  "urls": "stun:stun.cloudflare.com:3478"
  *			    },
  *               {
  *			        "urls": "turns:turn.cloudflare.com:443?transport=tcp",
  *			        "username": "username",
  *			        "credential": "password"
  *		        },
  *		        {
  *			        "urls": "turn:turn.cloudflare.com:3478?transport=tcp",
  *			        "username": "username",
  *			        "credential": "password"
  *		        }
  *	        ],
  *           bundlePolicy: 'max-bundle'
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
  constructor(callOptions) {
    this.callOptions = callOptions;
    let self = this;
    let item;
    let options = callOptions || {};
    let config = this.config = {
      debug: false,
      accessToken: "",
      serviceBaseURL: "https://127.0.0.1/awsapi/api/cf/call/",
      // Peer connection configuration.
      peerConnectionConfiguration: {
        iceServers: [
          {
            "urls": "stun:stun.cloudflare.com:3478"
          }
        ],
        bundlePolicy: "max-bundle"
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
    for (item in options) {
      if (options.hasOwnProperty(item)) {
        this.config[item] = options[item];
      }
    }
    this.sessionId = "";
    this.remoteTracks = [];
    this.baseURL = this.config.serviceBaseURL + "sessions/";
    try {
      this.webRtcImp = new WebRtc(this.config);
      this.webRtcImp.parent = self;
    } catch (e) {
      logger("Error", "Could not start the WebRTC interface", e);
    }
  }
  /**
   * set session id.
   * @param sessionId the session id.
   */
  setSessionId(sessionId) {
    this.sessionId = sessionId;
  }
  /**
   * get session id.
   * @returns {string} the session id;
   */
  getSessionId() {
    return this.sessionId;
  }
  /**
   * get the remote tracks for this local contact.
   * @returns {Array<Track>} the array of tracks;
   */
  getTracksRemote() {
    return this.remoteTracks;
  }
  /**
   * get the list of transceiver tracks.
   * @param {string}      uniqueID        The contact unique id.
   * @param {string}      applicationID   The contact application id.
   * @returns {Array<RTCRtpTransceiver>}   the array of tracks.
   */
  getTransceiverTracksLocal(uniqueID, applicationID) {
    let contacts = this.webRtcImp.webrtc.webrtcadapter.getContactPeer(uniqueID, applicationID, false);
    let contact = contacts[0];
    let tracks = contact.getStreamTransceivers();
    return tracks;
  }
  /**
   * initialise the remote contact
   * @param {string}      uniqueID        The contact unique id.
   * @param {string}      applicationID   The contact application id.
   * @param {Array<Track>} tracks   the remote tracks.
   * @param {RemoteSessionDetails} remoteSession   the remote session.
   * @returns {boolean}   true if create else false.
   */
  async initContactRemote(uniqueID, applicationID, tracks, remoteSession) {
    let result = false;
    let info = { error: null, response: null, valid: result };
    let progress = false;
    try {
      let contacts = this.webRtcImp.webrtc.webrtcadapter.getContactPeer(uniqueID, applicationID, false);
      let contact = contacts[0];
      contact.setTracks(tracks);
      contact.setSessionIdRemote(remoteSession.sessionID);
      if (remoteSession.hasAudioTracks) {
        contact.addTracksToTransceiver("audio", { direction: "inactive" });
      }
      if (remoteSession.hasVideoTracks) {
        contact.addTracksToTransceiver("video", { direction: "inactive" });
      }
      await contact.peerConnection.setLocalDescription(await contact.peerConnection.createOffer());
      let { validresult, sessionID, info: info2 } = await this.newSessionLocal(uniqueID, applicationID, contact.peerConnection.localDescription);
      result = validresult;
      info2 = { "error": info2.error, response: sessionID, valid: result };
      if (result) {
        progress = false;
        await new Promise((resolve, reject) => {
          contact.peerConnection.addEventListener("iceconnectionstatechange", (ev) => {
            if (ev.target.iceConnectionState === "connected") {
              progress = true;
              resolve(true);
            }
            setTimeout(reject, 5e3, "connect timeout");
          });
        });
        if (progress) {
          progress = false;
          await contact.peerConnection.setLocalDescription(await contact.peerConnection.createOffer());
          let { result: result2, info: info3 } = await this.addTrackRemote(sessionID, uniqueID, applicationID, tracks);
          info3 = { "error": info3.error, response: sessionID, valid: result2 };
          progress = result2;
          if (progress) {
            result2 = progress;
          }
        }
      }
    } catch (e) {
      result = false;
      info = { error: e, response: null, valid: result };
    } finally {
      if (info && info.error) {
        logger("Error", "Failed to initialise the remote contact", info);
      }
    }
    return {
      result,
      info
    };
  }
  /**
   * initialise the local contact
   * @param {string}      uniqueID        The contact unique id.
   * @param {string}      applicationID   The contact application id.
   * @param {MediaStream}      stream   The local stream.
   * @returns {boolean}   true if create else false.
   */
  async initContactLocal(uniqueID, applicationID, stream) {
    let result = false;
    let info = { error: null, response: null, valid: result };
    let progress = false;
    try {
      let contacts = this.webRtcImp.webrtc.webrtcadapter.getContactPeer(uniqueID, applicationID, false);
      let contact = contacts[0];
      contact.addStreamTracksToTransceiver(stream, { direction: "sendonly" });
      if (this.getTransceiverTracksLocal(uniqueID, applicationID).length > 0) {
        await contact.peerConnection.setLocalDescription(await contact.peerConnection.createOffer());
        let { validresult, sessionID, info: info2 } = await this.newSessionLocal(uniqueID, applicationID, contact.peerConnection.localDescription);
        result = validresult;
        info2 = { "error": info2.error, response: sessionID, valid: result };
        if (result) {
          progress = false;
          await new Promise((resolve, reject) => {
            contact.peerConnection.addEventListener("iceconnectionstatechange", (ev) => {
              if (ev.target.iceConnectionState === "connected") {
                progress = true;
                resolve(true);
              }
              setTimeout(reject, 5e3, "connect timeout");
            });
          });
          if (progress) {
            progress = false;
            await contact.peerConnection.setLocalDescription(await contact.peerConnection.createOffer());
            let { result: result2, info: info3 } = await this.addTrackLocal(sessionID, uniqueID, applicationID, contact.peerConnection.localDescription, this.getTransceiverTracksLocal(uniqueID, applicationID));
            info3 = { "error": info3.error, response: sessionID, valid: result2 };
            progress = result2;
            if (progress) {
              let transceivers = this.getTransceiverTracksLocal(uniqueID, applicationID);
              let tracks = transceivers.map((transceiver) => {
                return {
                  location: "local",
                  mid: transceiver.mid,
                  trackName: transceiver.sender.track.id
                };
              });
              contact.setTracks(tracks);
              this.remoteTracks = tracks.map((track) => {
                return {
                  location: "remote",
                  mid: track.mid,
                  sessionId: sessionID,
                  trackName: track.trackName
                };
              });
              this.sessionId = sessionID;
              result2 = progress;
            }
          }
        }
      }
    } catch (e) {
      result = false;
      info = { error: e, response: null, valid: result };
    } finally {
      if (info && info.error) {
        logger("Error", "Failed to initialise the remote contact", info);
      }
    }
    return {
      result,
      info
    };
  }
  /**
   * create a new local session.
   * @param {string}      uniqueID        The contact unique id.
   * @param {string}      applicationID   The contact application id.
   * @param {RTCSessionDescription}      sdpOffer   The sdp.
   * @returns {boolean}   true if create else false.
   */
  async newSessionLocal(uniqueID, applicationID, sdpOffer) {
    let validresult = false;
    let info = { error: null, response: null, valid: validresult };
    let sessionID = "";
    try {
      let contacts = this.webRtcImp.webrtc.webrtcadapter.getContactPeer(uniqueID, applicationID, false);
      let contact = contacts[0];
      let request = {
        sessionDescription: {
          type: "offer",
          sdp: sdpOffer.sdp
        }
      };
      let { valid, newSessionResponse, error } = await this.serviceCreateNewSession(request);
      validresult = valid;
      info = { "error": error, response: newSessionResponse, valid: validresult };
      if (valid) {
        sessionID = newSessionResponse.sessionId;
        contact.setSessionId(newSessionResponse.sessionId);
        contact.setRemoteDescription(new RTCSessionDescription(newSessionResponse.sessionDescription));
      }
    } catch (e) {
      validresult = false;
      info = { error: e, response: null, valid: validresult };
    } finally {
      if (info && info.error) {
        logger("Error", "Failed to initialise the remote contact", info);
      }
    }
    return {
      validresult,
      sessionID,
      info
    };
  }
  /**
   * get session information.
   * @param {string}      sessionId        The local session id.
   * @returns {boolean}   true if create else false.
   */
  async sessionInformation(sessionId) {
    let result = false;
    let info = { error: null, response: null, valid: result };
    let response = null;
    try {
      let request = {};
      let { valid, getSessionInformationResponse, error } = await this.serviceGetSessionInformation(sessionId, request);
      result = valid;
      info = { "error": error, response: getSessionInformationResponse, valid: result };
    } catch (e) {
      result = false;
      info = { error: e, response: null, valid: result };
    } finally {
      if (info && info.error) {
        logger("Error", "Failed to initialise the remote contact", info);
      }
    }
    return {
      result,
      response,
      info
    };
  }
  /**
   * add new local tracks, to send to call services.
   * @param {string}      sessionId        The local session id.
   * @param {string}      uniqueID        The contact unique id.
   * @param {string}      applicationID   The contact application id.
   * @param {RTCSessionDescription}      sdpOffer   The sdp.
   * @param {Array<RTCRtpTransceiver>} transceivers   the transceiver tracks.
   * @returns {boolean}   true if create else false.
   */
  async addTrackLocal(sessionId, uniqueID, applicationID, sdpOffer, transceivers) {
    let result = false;
    let info = { error: null, response: null, valid: result };
    try {
      let contacts = this.webRtcImp.webrtc.webrtcadapter.getContactPeer(uniqueID, applicationID, false);
      let contact = contacts[0];
      let tracks = transceivers.map((transceiver) => {
        return {
          location: "local",
          mid: transceiver.mid,
          trackName: transceiver.sender.track.id
        };
      });
      contact.setTracks(tracks);
      let request = {
        sessionDescription: {
          type: "offer",
          sdp: sdpOffer.sdp
        },
        tracks
      };
      let { valid, newTrackResponse, error } = await this.serviceAddNewTrack(sessionId, request);
      result = valid;
      info = { "error": error, response: newTrackResponse, valid: result };
      if (valid) {
        contact.setRemoteDescription(new RTCSessionDescription(newTrackResponse.sessionDescription));
      }
    } catch (e) {
      result = false;
      info = { error: e, response: null, valid: result };
    } finally {
      if (info && info.error) {
        logger("Error", "Failed to initialise the remote contact", info);
      }
    }
    return {
      result,
      info
    };
  }
  /**
   * add new remote tracks, to recieve from call services.
   * @param {string}      sessionId        The local session id.
   * @param {string}      uniqueID        The contact unique id.
   * @param {string}      applicationID   The contact application id.
   * @param {Array<Track>} tracks   the remote tracks.
   * @returns {boolean}   true if create else false.
   */
  async addTrackRemote(sessionId, uniqueID, applicationID, tracks) {
    let result = false;
    let info = { error: null, response: null, valid: result };
    try {
      let contacts = this.webRtcImp.webrtc.webrtcadapter.getContactPeer(uniqueID, applicationID, false);
      let contact = contacts[0];
      contact.setTracks(tracks);
      let request = {
        tracks
      };
      let { valid, newTrackResponse, error } = await this.serviceAddNewTrack(sessionId, request);
      result = valid;
      info = { "error": error, response: newTrackResponse, valid: result };
      if (valid) {
        if (newTrackResponse.requiresImmediateRenegotiation) {
          switch (newTrackResponse.sessionDescription.type) {
            case "offer":
              await contact.setRemoteDescription(new RTCSessionDescription(newTrackResponse.sessionDescription));
              await contact.peerConnection.setLocalDescription(await contact.peerConnection.createAnswer());
              let { result: result2, info: info2 } = await this.renegotiateSession(sessionId, contact.peerConnection.localDescription);
              let infoIn = info2;
              if (!result2) {
                throw new Error("Unable to renegotiate session. " + infoIn.error);
              }
              break;
            case "answer":
              throw new Error("An offer SDP was expected");
          }
        }
      }
    } catch (e) {
      result = false;
      info = { error: e, response: null, valid: result };
    } finally {
      if (info && info.error) {
        logger("Error", "Failed to initialise the remote contact", info);
      }
    }
    return {
      result,
      info
    };
  }
  /**
   * close tracks.
   * @param {string}      sessionId        The local session id.
   * @param {string}      uniqueID        The contact unique id.
   * @param {string}      applicationID   The contact application id.
   * @param {Array<Track>} tracks   the tracks.
   * @param {RTCSessionDescription}      sdpOffer   The sdp.
   * @returns {boolean}   true if create else false.
   */
  async closeTrack(sessionId, uniqueID, applicationID, tracks, sdpOffer) {
    let result = false;
    let info = { error: null, response: null, valid: result };
    try {
      let contacts = this.webRtcImp.webrtc.webrtcadapter.getContactPeer(uniqueID, applicationID, false);
      let contact = contacts[0];
      let newTracks = tracks.map((track) => {
        return {
          mid: track.mid
        };
      });
      let request = {
        force: false,
        sessionDescription: {
          type: "offer",
          sdp: sdpOffer.sdp
        },
        tracks: newTracks
      };
      let { valid, closeTrackResponse, error } = await this.serviceCloseTrack(sessionId, request);
      result = valid;
      info = { "error": error, response: closeTrackResponse, valid: result };
      if (valid) {
        contact.removeStreamTransceiverTracks();
      }
    } catch (e) {
      result = false;
      info = { error: e, response: null, valid: result };
    } finally {
      if (info && info.error) {
        logger("Error", "Failed to initialise the remote contact", info);
      }
    }
    return {
      result,
      info
    };
  }
  /**
   * renegotiate an existing session.
   * @param sessionId the session Id.
   * @param {RTCSessionDescription}      sdpAnswer   The sdp.
   * @returns {boolean}   true if create else false.
   */
  async renegotiateSession(sessionId, sdpAnswer) {
    let result = false;
    let info = { error: null, response: null, valid: result };
    try {
      let request = {
        sessionDescription: {
          type: "answer",
          sdp: sdpAnswer.sdp
        }
      };
      let { valid, renegotiateSessionResponse, error } = await this.serviceRenegotiateSession(sessionId, request);
      result = valid;
      info = { "error": error, response: renegotiateSessionResponse, valid: result };
    } catch (e) {
      result = false;
      info = { error: e, response: null, valid: result };
    } finally {
      if (info && info.error) {
        logger("Error", "Failed to initialise the remote contact", info);
      }
    }
    return {
      result,
      info
    };
  }
  /**
   * Initiates a new session on the Cloudflare Calls WebRTC server,
   * establishing a PeerConnection on the client side.
   * @param newSessionRequest the new session request.
   * @return {valid: boolean, newSessionResponse: CreateNewSessionResponse}    true if valid else false.
   */
  async serviceCreateNewSession(newSessionRequest) {
    let valid = false;
    let error = null;
    let newSessionResponse = null;
    try {
      let self = this;
      let request = {
        method: "POST",
        headers: {
          "Content-type": "application/json",
          Authorization: "Bearer " + this.config.accessToken
        },
        body: JSON.stringify(newSessionRequest)
      };
      const waitGetSession = new Promise(async (resolve, reject) => {
        try {
          this.jsonRequest(this.baseURL + "new", request, (data) => {
            resolve(data);
          }, (error2) => {
            reject(error2);
          });
        } catch (ex) {
          reject(ex);
        }
      });
      await Promise.all([waitGetSession]).then((value) => {
        valid = value[0].valid;
        error = value[0].error;
        newSessionResponse = value[0].result;
      }).catch((reason) => {
        valid = false;
        error = reason;
      });
    } catch (e) {
      valid = false;
      error = e;
      logger("Service Error", "Failed to create new session", e);
    } finally {
    }
    return { valid, newSessionResponse, error };
  }
  /**
   * Adds a media track (audio or video) to an existing session
   * @param sessionId the session Id.
   * @param newTrackRequest the new track request.
   * @return {valid: boolean, newTrackResponse: AddNewTrackResponse}    true if valid else false.
   */
  async serviceAddNewTrack(sessionId, newTrackRequest) {
    let valid = false;
    let error = null;
    let newTrackResponse = null;
    try {
      let self = this;
      let request = {
        method: "POST",
        headers: {
          "Content-type": "application/json",
          Authorization: "Bearer " + this.config.accessToken
        },
        body: JSON.stringify(newTrackRequest)
      };
      const waitAddTrack = new Promise(async (resolve, reject) => {
        try {
          this.jsonRequest(this.baseURL + "add/" + sessionId, request, (data) => {
            resolve(data);
          }, (error2) => {
            reject(error2);
          });
        } catch (ex) {
          reject(ex);
        }
      });
      await Promise.all([waitAddTrack]).then((value) => {
        valid = value[0].valid;
        error = value[0].error;
        newTrackResponse = value[0].result;
      }).catch((reason) => {
        valid = false;
        error = reason;
      });
    } catch (e) {
      valid = false;
      error = e;
      logger("Service Error", "Failed to add new track", e);
    } finally {
    }
    return { valid, newTrackResponse, error };
  }
  /**
   * Updates the session�s negotiation state to accommodate new tracks or
   * changes in the existing ones.
   * @param sessionId the session Id.
   * @param renegotiateSessionRequest the new track request.
   * @return {valid: boolean, renegotiateSessionResponse: RenegotiateSessionResponse}    true if valid else false.
   */
  async serviceRenegotiateSession(sessionId, renegotiateSessionRequest) {
    let valid = false;
    let error = null;
    let renegotiateSessionResponse = null;
    try {
      let self = this;
      let request = {
        method: "PUT",
        headers: {
          "Content-type": "application/json",
          Authorization: "Bearer " + this.config.accessToken
        },
        body: JSON.stringify(renegotiateSessionRequest)
      };
      const waitRenegotiateSession = new Promise(async (resolve, reject) => {
        try {
          this.jsonRequest(this.baseURL + "reneg/" + sessionId, request, (data) => {
            resolve(data);
          }, (error2) => {
            reject(error2);
          });
        } catch (ex) {
          reject(ex);
        }
      });
      await Promise.all([waitRenegotiateSession]).then((value) => {
        valid = value[0].valid;
        error = value[0].error;
        renegotiateSessionResponse = value[0].result;
      }).catch((reason) => {
        valid = false;
        error = reason;
      });
    } catch (e) {
      valid = false;
      error = e;
      logger("Service Error", "Failed to renegotiate session", e);
    } finally {
    }
    return { valid, renegotiateSessionResponse, error };
  }
  /**
   * Removes a specified track from the session.
   * @param sessionId the session Id.
   * @param closeTrackRequest the close track request.
   * @return {valid: boolean, closeTrackResponse: CloseTrackResponse}    true if valid else false.
   */
  async serviceCloseTrack(sessionId, closeTrackRequest) {
    let valid = false;
    let error = null;
    let closeTrackResponse = null;
    try {
      let self = this;
      let request = {
        method: "PUT",
        headers: {
          "Content-type": "application/json",
          Authorization: "Bearer " + this.config.accessToken
        },
        body: JSON.stringify(closeTrackRequest)
      };
      const waitCloseTrack = new Promise(async (resolve, reject) => {
        try {
          this.jsonRequest(this.baseURL + "close/" + sessionId, request, (data) => {
            resolve(data);
          }, (error2) => {
            reject(error2);
          });
        } catch (ex) {
          reject(ex);
        }
      });
      await Promise.all([waitCloseTrack]).then((value) => {
        valid = value[0].valid;
        error = value[0].error;
        closeTrackResponse = value[0].result;
      }).catch((reason) => {
        valid = false;
        error = reason;
      });
    } catch (e) {
      valid = false;
      error = e;
      logger("Service Error", "Failed to close track", e);
    } finally {
    }
    return { valid, closeTrackResponse, error };
  }
  /**
   * Gets detailed information about a specific session.
   * @param sessionId the session Id.
   * @param getSessionInformationRequest the close track request.
   * @return {valid: boolean, getSessionInformationResponse: GetSessionInformationResponse}    true if valid else false.
   */
  async serviceGetSessionInformation(sessionId, getSessionInformationRequest) {
    let valid = false;
    let error = null;
    let getSessionInformationResponse = null;
    try {
      let self = this;
      let request = {
        method: "GET",
        headers: {
          "Content-type": "application/json",
          Authorization: "Bearer " + this.config.accessToken
        }
      };
      const waitGetSessionInformation = new Promise(async (resolve, reject) => {
        try {
          this.jsonRequest(this.baseURL + "info/" + sessionId, request, (data) => {
            resolve(data);
          }, (error2) => {
            reject(error2);
          });
        } catch (ex) {
          reject(ex);
        }
      });
      await Promise.all([waitGetSessionInformation]).then((value) => {
        valid = value[0].valid;
        error = value[0].error;
        getSessionInformationResponse = value[0].result;
      }).catch((reason) => {
        valid = false;
        error = reason;
      });
    } catch (e) {
      valid = false;
      error = e;
      logger("Service Error", "Failed to get session information", e);
    } finally {
    }
    return { valid, getSessionInformationResponse, error };
  }
  /**
   * Make a request with a json response from a fetch API request.
   *
   * @param {string}	url   the url.
   * @param {object}	config   the configuration object.
   * @param {Function}	resultAction   the result function.
   * @param {Function}	errorAction   the error function.
   *
   * @example
   *	jsonRequest(
   *		'https://domain/api/1',
   *		{
   *			mode: 'cors',					// no-cors, *cors, same-origin
   *			method: 'post',					// *GET, POST, PUT, DELETE, etc..
   *			cache: 'no-cache',				// *default, no-cache, reload, force-cache, only-if-cached
   *			redirect: 'follow',				// manual, *follow, error
   *			referrer: 'no-referrer',		// no-referrer, *client
   *			body: 'foo=bar&lorem=ipsum',	// JSON.stringify(data), body data type must match "Content-Type" header
   *			credentials: 'include',			// include, same-origin, omit
   *			headers: {
   *				"Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
   *			}
   *		},
   *		function(data) { ... },
   *		function(error) { ... }
   *  );
   */
  jsonRequest(url, config, resultAction, errorAction) {
    fetch(url, config).then(this.responseAction).then(this.jsonResponse).then(resultAction).catch(errorAction);
  }
  /**
   * json response from a fetch API request.
   *
   * @param {Response}	response   the fetch API response.
   * @return {Promise<any>}	the promise interface.
   */
  jsonResponse(response) {
    return response.json();
  }
  /**
   * Response action from a fetch API request.
   *
   * @param {Response}	response   the fetch API response.
   * @return {Promise}	the promise interface; either the response or the error message.
   */
  responseAction(response) {
    if (response.status >= 200 && response.status < 300) {
      return Promise.resolve(response);
    } else {
      return Promise.reject(new Error(response.statusText));
    }
  }
};
export {
  CallClient,
  startCallClient,
  stopCallClient
};
