import * as util from './common.mjs';
import { ContactPeer } from './contactpeer.mjs';
import { Signalling, ISignalling } from './signalling.mjs';

/**
 * WebRTC adapter controls the interaction between the
 * signalling provider and the contact peers 
 * implementation.
 */
export class WebRtcAdapter {

    // Global.
    closed: boolean;
    contactPeers: Array<ContactPeer>;
    signalling: ISignalling;
    config: any;
    uniqueID: string;
    applicationID: string;
    mediaRecorder: MediaRecorder;
    localStream: MediaStream;
    localStreamVideoElement: any;

    /**
    * subscribe to the WebRtc Adapter event handler.
    * {function} callback(eventName, eventDetails, this object, event)
    */
    private eventWebRtcAdapter: (eventName: string, eventDetails: string, object: WebRtcAdapter, event: any) => void;

    /**
    * subscribe to the signalling event handler.
    * {function} callback(eventName, eventDetails, this object, event)
    */
    private eventWebRtcAdapterSignalling: (eventName: string, eventDetails: string, object: Signalling, event: any) => void;

    /**
   * subscribe to the contact peer event handler.
   * {function} callback(eventName, eventDetails, this object, event)
   */
    private eventWebRtcAdapterContactPeer: (eventName: string, eventDetails: string, object: ContactPeer, event: any) => void;

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
    constructor(public webRtcOptions) {

        // local.
        let self = this;
        this.closed = false;
        let item;

        // Set the webRTC options.
        let options = webRtcOptions || {};

        // Assign this contact details.
        this.uniqueID = webRtcOptions.uniqueID;
        this.applicationID = webRtcOptions.applicationID;

        // Store all contact peers.
        this.contactPeers = [];

        // The local stream.
        this.localStream = null;
        this.localStreamVideoElement = null;

        // MediaRecorder
        this.mediaRecorder = null;

        // Configuration.
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

        // Set options, override existing.
        for (item in options) {
            if (options.hasOwnProperty(item)) {
                this.config[item] = options[item];
            }
        }

        // Signalling configuration.
        let configSignalling = {
            signallingURL: config.signallingURL
        };

        // Create the websocket signalling provider.
        this.signalling = new Signalling(configSignalling);
        this.signalling.onSignallingEventHandler((eventName, eventDetails, object, event) => {
            self.eventWebRtcAdapterSignalling(eventName, eventDetails, object, event);
        });
    }

    /**
    * subscribe to the WebRtc Adapter event handler.
    * @param {function}	event callback(eventName, eventDetails, this object, event).
    */
    onWebRtcAdapterEventHandler(event: (eventName: string, eventDetails: string, object: WebRtcAdapter, event: any) => void): void {
        // assign the event.
        this.eventWebRtcAdapter = event;
    }

    /**
    * subscribe to the contact peer event handler.
    * @param {function}	event callback(eventName, eventDetails, this object, event).
    */
    onContactPeerEventHandler(event: (eventName: string, eventDetails: string, object: ContactPeer, event: any) => void): void {
        // assign the event.
        this.eventWebRtcAdapterContactPeer = event;
    }

    /**
    * subscribe to the signalling event handler.
    * @param {function}	event callback(eventName, eventDetails, this object, event).
    */
    onSignallingEventHandler(event: (eventName: string, eventDetails: string, object: Signalling, event: any) => void): void {
        // assign the event.
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
    changeClientSettings(uniqueID: string, applicationID: string, available: boolean, broadcast: boolean, broadcastAppID: boolean, accessToken: string): void {

        // Assign this client details.
        this.uniqueID = uniqueID;
        this.applicationID = applicationID;

        // Change client settings
        this.signalling.changeClientSettings(uniqueID, applicationID, available, broadcast, broadcastAppID, accessToken);
    }

    /**
     * Get the client unique id.
     * 
     * @return {string} Returns the client unique id.
     */
    getUniqueID(): string {

        // Get this contact details.
        let contactUniqueID = this.uniqueID;
        return contactUniqueID;
    }

    /**
     * Get the client application id.
     * 
     * @return {string} Returns the client application id.
     */
    getApplicationID(): string {

        // Get this contact details.
        let contactApplicationID = this.applicationID;
        return contactApplicationID;
    }

    /**
     * Send started typing to contact.
     * 
     * @param {string}  uniqueID        The contact unique id.
     * @param {string}  applicationID   The contact application id.
     */
    startedTypingMessage(uniqueID: string, applicationID: string): void {

        // Send the message to the peer.
        this.signalling.startedTypingMessage(uniqueID, applicationID);
    }

    /**
     * Send stopped typing to contact.
     * 
     * @param {string}  uniqueID        The contact unique id.
     * @param {string}  applicationID   The contact application id.
     */
    stoppedTypingMessage(uniqueID: string, applicationID: string): void {

        // Send the message to the peer.
        this.signalling.stoppedTypingMessage(uniqueID, applicationID);
    }

    /**
     * Get the contact unique list.
     */
    contactUniqueIDList(): void {

        this.signalling.contactUniqueIDList();
    }

    /**
     * Get the contact application list.
     */
    contactApplicationIDList(): void {

        this.signalling.contactApplicationIDList();
    }

    /**
     * Get the contact group list.
     */
    contactGroupList(): void {

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
    createContactPeer(opts: any): ContactPeer {

        let self = this;
        opts.parent = self;
        opts.signalling = this.signalling;

        // Create a contact peer.
        let peer: ContactPeer = new ContactPeer(opts);
        peer.onContactPeerEventHandler((eventName, eventDetails, object, event) => {
            self.eventWebRtcAdapterContactPeer(eventName, eventDetails, object, event);
        });

        // Add the contact peer to the collection
        // of contact peers.
        this.contactPeers.push(peer);

        // Return the current contact peer.
        return peer;
    }

    /**
     * Remove all contacts.
     */
    removeContactPeers(): void {

        // Get all peers.
        this.getContactPeers().forEach(function (peer) {

            // Close the connection.
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
    removeContactPeer(uniqueID: string, applicationID: string, isData: boolean): void {

        // Get all peers.
        this.getContactPeers().forEach(function (peer) {
            if (peer.uniqueID === uniqueID && peer.applicationID === applicationID && peer.isData === isData) {

                // Close the connection.
                peer.close();
            }
        });
    }

    /**
     * Get all contacts.
     * 
     * @return {Array} Returns the contact list.
     */
    getContactPeers(): Array<ContactPeer> {
        return this.contactPeers.filter(function (peer) {

            // Return the peers.
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
    getContactPeer(uniqueID: string, applicationID: string, isData: boolean): Array<ContactPeer> {
        return this.contactPeers.filter(function (peer) {

            // Return the contact.
            return (peer.uniqueID === uniqueID && peer.applicationID === applicationID && peer.isData === isData);
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
    isContactPeer(uniqueID: string, applicationID: string): Array<ContactPeer> {
        return this.contactPeers.filter(function (peer) {

            // Return the contact.
            return (peer.uniqueID === uniqueID && peer.applicationID === applicationID);
        });
    }

    /**
     * Send the client state to all contacts.
     * 
     * @param {string}  state         The state to sent.
     */
    sendStateToAllContacts(state: string): void {
        this.contactPeers.forEach(function (peer) {

            // Send the state to the peer.
            peer.sendState(state);
        });
    }

    /**
     * Send a message to all contacts.
     * 
     * @param {string}  message         The message to sent.
     */
    sendMessageToAllContacts(message: string): void {
        this.contactPeers.forEach(function (peer) {

            // Send the message to the peer.
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
    sendMessageToContact(uniqueID: string, applicationID: string, message: string, isData: boolean): void {
        this.contactPeers.forEach(function (peer) {
            if (peer.uniqueID === uniqueID && peer.applicationID === applicationID && peer.isData === isData) {

                // Send the message to the peer.
                peer.sendMessage(message);
            }
        });
    }

    /**
     * Send a details to all contacts.
     * 
     * @param {string}  details         The details to sent.
     */
    sendDetailsToAllContacts(details: string): void {
        this.contactPeers.forEach(function (peer) {

            // Send the details to the peer.
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
    sendDetailsToContact(uniqueID: string, applicationID: string, details: string, isData: boolean): void {
        this.contactPeers.forEach(function (peer) {
            if (peer.uniqueID === uniqueID && peer.applicationID === applicationID && peer.isData === isData) {

                // Send the details to the peer.
                peer.sendDetails(details);
            }
        });
    }

    /**
     * Send end of call to all contacts.
     */
    sendEndCallToAllContacts(): void {
        this.contactPeers.forEach(function (peer) {

            // Send the message to the peer.
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
    sendEndCallToContact(uniqueID: string, applicationID: string, isData: boolean): void {
        this.contactPeers.forEach(function (peer) {
            if (peer.uniqueID === uniqueID && peer.applicationID === applicationID && peer.isData === isData) {

                // Send the message to the peer.
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
    setContactFileInfo(uniqueID: string, applicationID: string, isData: boolean, fileName: string, fileSize: number, fileType: string, fileLastModified: number) {
        this.contactPeers.forEach(function (peer) {
            if (peer.uniqueID === uniqueID && peer.applicationID === applicationID && peer.isData === isData) {

                // Send the message to the peer.
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
    isContactAvailable(uniqueID: string, applicationID: string, isData: boolean): void {
        this.contactPeers.forEach(function (peer) {
            if (peer.uniqueID === uniqueID && peer.applicationID === applicationID && peer.isData === isData) {

                // Send the message to the peer.
                peer.isAvailable();
            }
        });
    }

    /**
     * Close this adapter.
     */
    close(): void {

        if (this.closed) return;
        this.closed = true;

        try {
            // Close the local stream.
            this.closeStream();
            this.localStream = null;
            this.localStreamVideoElement = null;
        }
        catch (e) {
            // Log the error.
            util.logger("error", "Error closing stream", e);
        }

        try {
            // Close the singalling
            this.signalling.close();
            this.signalling = null;
        }
        catch (e) {
            // Log the error.
            util.logger("error", "Error closing signalling", e);
        }

        try {
            // Stop recording.
            this.stopRecording();
        }
        catch (e) {
            // Log the error.
            util.logger("error", "Error stopping recording", e);
        }

        // Close all contacts
        this.removeContactPeers();
    }

    /**
     * Mute the audio and video tracks for the local stream.
     *
     * @param {boolean}     mute   True to mute; else false.
     */
    muteAudioVideo(mute: boolean): void {

        // For each contact.
        this.contactPeers.forEach(function (peer) {

            // Mute the local stream.
            peer.muteAudioVideo(mute);
        });
    }

    /**
     * Close the local stream.
     */
    closeStream(): void {

        // If local stream.
        if (this.localStream) {

            // Stop all tracks.
            this.localStream.getTracks().forEach(
                function (track) {
                    track.stop();
                }
            );

            // If video element.
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
    createStream(audio: boolean, video: boolean): void {
        let self = this;

        // Get the local stream.
        navigator.mediaDevices.getUserMedia({ "audio": audio, "video": video }).then(
            function (stream) {
                // Init the local video stream.
                self.localStream = stream;
                self.localStreamVideoElement.srcObject = self.localStream;

            }).catch(
                function (error) {
                    util.logger("error", "Error could not create stream", error);
                });
    }

    /**
     * Create a local capture media, screen or application window: no audio.
     *
     * @param {string}     captureMediaSource   The capture media source ('screen' or 'window').
     * @link  https://developer.mozilla.org/docs/Web/API/MediaDevices/getDisplayMedia
     * @link https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API/Using_Screen_Capture
     */
    createStreamCapture(captureMediaSource: string): void {
        let self = this;

        // Capture constraints
        let constraints: DisplayMediaStreamOptions = {
            video: {
                displaySurface: captureMediaSource
            },
            audio: false
        };

        // Get the local stream.
        navigator.mediaDevices.getDisplayMedia(constraints).then(
            function (stream) {
                // Init the local video stream.
                self.localStream = stream;
                self.localStreamVideoElement.srcObject = self.localStream;

            }).catch(
                function (error) {
                    util.logger("error", "Error could not create capture stream", error);
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
    createStreamEx(constraints: MediaStreamConstraints): void {
        let self = this;

        // Get the local stream.
        navigator.mediaDevices.getUserMedia(constraints).then(
            function (stream) {
                // Init the local video stream.
                self.localStream = stream;
                self.localStreamVideoElement.srcObject = self.localStream;

            }).catch(
                function (error) {
                    util.logger("error", "Error could not create stream", error);
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
    createStreamCaptureEx(constraints: DisplayMediaStreamOptions): void {
        let self = this;

        // Get the local stream.
        navigator.mediaDevices.getDisplayMedia(constraints).then(
            function (stream) {
                // Init the local video stream.
                self.localStream = stream;
                self.localStreamVideoElement.srcObject = self.localStream;

            }).catch(
                function (error) {
                    util.logger("error", "Error could not create capture stream", error);
                });
    }

    /**
     * Set the local stream to the video element.
     * 
     * @param {object}      videoElement   The local video element.
     * 
     * @return {boolean}    True if the stream has been added; else false.
     */
    setLocalStreamToVideoElement(videoElement: any): boolean {

        // If stream exists.
        if (this.localStream) {

            // Assign the video element.
            this.localStreamVideoElement = videoElement;
            this.localStreamVideoElement.srcObject = this.localStream;
            return true;
        }
        else {
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
    getAudioInputDevices(callback: (deviceList: Array<MediaDeviceInfo>) => void): void {

        // Create local refs.
        let devices: Array<MediaDeviceInfo> = [];

        // Get the local devices.
        navigator.mediaDevices.enumerateDevices().then(
            function (deviceInfos) {

                // For each device.
                for (var i = 0; i !== deviceInfos.length; ++i) {
                    // Current device.
                    let deviceInfo = deviceInfos[i];

                    // If audio input.
                    if (deviceInfo.kind === 'audioinput') {
                        devices.push(deviceInfo);
                    }
                }

                // Send callback.
                callback(devices);

            }).catch(
                function (error) {
                    util.logger("error", "Error could not get audio input devices", error);
                });
    }

    /**
     * Get all audio output devices.
     * 
     * @param {Function}     callback   (deviceList: Array<MediaDeviceInfo>)
     * @link https://developer.mozilla.org/docs/Web/API/MediaDeviceInfo/kind
     * @link https://developer.mozilla.org/docs/Web/API/MediaDevices/enumerateDevices
     */
    getAudioOutputDevices(callback: (deviceList: Array<MediaDeviceInfo>) => void): void {

        // Create local refs.
        let devices: Array<MediaDeviceInfo> = [];

        // Get the local devices.
        navigator.mediaDevices.enumerateDevices().then(
            function (deviceInfos) {

                // For each device.
                for (var i = 0; i !== deviceInfos.length; ++i) {
                    // Current device.
                    let deviceInfo = deviceInfos[i];

                    // If audio output.
                    if (deviceInfo.kind === 'audiooutput') {
                        devices.push(deviceInfo);
                    }
                }

                // Send callback.
                callback(devices);

            }).catch(
                function (error) {
                    util.logger("error", "Error could not get audio output devices", error);
                });
    }

    /**
     * Get all video input devices.
     * 
     * @param {Function}     callback   (deviceList: Array<MediaDeviceInfo>)
     * @link https://developer.mozilla.org/docs/Web/API/MediaDeviceInfo/kind
     * @link https://developer.mozilla.org/docs/Web/API/MediaDevices/enumerateDevices
     */
    getVideoInputDevices(callback: (deviceList: Array<MediaDeviceInfo>) => void): void {

        // Create local refs.
        let devices: Array<MediaDeviceInfo> = [];

        // Get the local devices.
        navigator.mediaDevices.enumerateDevices().then(
            function (deviceInfos) {

                // For each device.
                for (var i = 0; i !== deviceInfos.length; ++i) {
                    // Current device.
                    let deviceInfo = deviceInfos[i];

                    // If video input.
                    if (deviceInfo.kind === 'videoinput') {
                        devices.push(deviceInfo);
                    }
                }

                // Send callback.
                callback(devices);

            }).catch(
                function (error) {
                    util.logger("error", "Error could not get video input devices", error);
                });
    }

    /**
     * Set the local video element.
     * 
     * @param {object}      videoElement   The local video element.
     */
    setLocalVideoElement(videoElement: any): void {

        // Assign the video element.
        this.localStreamVideoElement = videoElement;
    }

    /**
     * Get the local stream.
     * 
     * @return {MediaStream} Returns the local stream.
     */
    getStream(): MediaStream {

        // Get this local stream.
        let stream = this.localStream;
        return stream;
    }

    /**
     * Set the local stream.
     * 
     * @param {MediaStream}      stream   The media stream.
     */
    setStream(stream: MediaStream): void {

        // Get this local stream.
        this.localStream = stream;
    }

    /**
     * Start recording local stream.
     * 
     * @param {MediaRecorderOptions}      [recordingOptions]    The recording options.
     * @param {number}      timeInterval        The time interval (milliseconds).
     */
    startRecording(recordingOptions: MediaRecorderOptions, timeInterval: number): void {

        // If stream exists.
        if (this.localStream) {
            // Get this local stream.
            var stream = this.localStream;

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
                // Create local refs.
                let self = this;

                // On stop recording.
                this.mediaRecorder.onstop = function (evt) {
                    self.eventWebRtcAdapter('adapterRecordingStopped', "Adapter has stopped recording.", self, evt);
                };

                // Recorded data is available.
                this.mediaRecorder.ondataavailable = function (event) {
                    // If data exists.
                    if (event.data && event.data.size > 0) {
                        // Send the chunck on data.
                        self.eventWebRtcAdapter('adapterRecordingData', "Adapter has recording data.", self, event.data);
                    }
                };

                // Collect 10ms of data.
                this.mediaRecorder.start(timeInterval);
            }
        }
    }

    /**
     * Stop recording local stream.
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
}