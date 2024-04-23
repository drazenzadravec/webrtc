import * as util from '../mod/common.mjs';
import { WebRtc, } from '../mod/webrtc.mjs';
import { ContactPeer } from '../mod/contactpeer.mjs';

import {
    CreateNewSessionResponse,
    CreateNewSessionRequest,
    AddNewTrackResponse,
    AddNewTrackRequest,
    RenegotiateSessionResponse,
    RenegotiateSessionRequest,
    CloseTrackResponse,
    CloseTrackRequest,
    GetSessionInformationResponse,
    GetSessionInformationRequest,
    SessionDescription,
    Track
} from '../mod/common.mjs';

/**
 * start the Call Client application.
 * @param {object}    options  the call client options.
 * @param {Function}    callback  the callback implementation, with state if any: (callClient: CallClient, state: any) => void.
 * @param {object}    state  any state data.
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
export function startCallClient(options: any, callback: (callClient: CallClient, state: any) => void, state?: any): void {

    let callClientImp: CallClient = null;
    try {

        // Create the Call Client interface.
        if (options.accessToken !== "" && options.signallingURL !== "") {
            callClientImp = new CallClient(options);
        }
        else {
            util.logger("warn", "Call Client Interface", "Has not been initialised, access token and signalling URL do not exist.");
        }
    }
    catch (e) {
        util.logger("Error", "Could not start the Call Client interface", e);
    }

    // If defined.
    if (callClientImp) {
        try {
            // call callback
            callback(callClientImp, state);
        } catch (e) {
            util.logger("Error", "Could not initialise the Call Client interface", e);
        }
    }
    else {
        util.logger("warn", "Call Client Interface", "Has not been initialised");
    }
}

/**
 * stop the Call Client application.
 * @param {CallClient}    callClientImp  the callback implementation.
 */
export function stopCallClient(callClientImp: CallClient): void {

    // If defined.
    if (callClientImp) {
        try {
            // Close the connection.
            callClientImp.webRtcImp.webrtc.close();
        }
        catch (e) {
            util.logger("Error", "Could not stop the Call Client interface", e);
        }
    }
    else {
        util.logger("warn", "Call Client Interface", "Has not been initialised");
    }
};

/**
 * Call implementation of cloudflare call client.
 */
export class CallClient {

    config: any;
    private baseURL: string;
    private sessionId: string;
    private remoteTracks: Array<Track>;
    webRtcImp: WebRtc;

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
    constructor(public callOptions: any) {

        // local.
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
                bundlePolicy: 'max-bundle'
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

        // assign
        this.sessionId = "";
        this.remoteTracks = [];
        this.baseURL = this.config.serviceBaseURL + "sessions/";

        try {
            // create the webrtc interface.
            this.webRtcImp = new WebRtc(this.config);
            this.webRtcImp.parent = self;
        }
        catch (e) {
            util.logger("Error", "Could not start the WebRTC interface", e);
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
     * get the remote tracks for this local contact.
     * @returns {Array<Track>} the array of tracks;
     */
    getTracksRemote(): Array<Track> {
        return this.remoteTracks;
    }

    /**
     * get the list of transceiver tracks.
     * @param {string}      uniqueID        The contact unique id.
     * @param {string}      applicationID   The contact application id.
     * @returns {Array<RTCRtpTransceiver>}   the array of tracks.
     */
    getTransceiverTracksLocal(uniqueID: string, applicationID: string): Array<RTCRtpTransceiver> {

        // Get the contact.
        let contacts: Array<ContactPeer> = this.webRtcImp.webrtc.webrtcadapter.getContactPeer(uniqueID, applicationID, false);
        let contact: ContactPeer = contacts[0];
        let tracks: Array<RTCRtpTransceiver> = contact.getStreamTransceivers();
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
    async initContactRemote(uniqueID: string, applicationID: string, tracks: Array<Track>, remoteSession: util.RemoteSessionDetails):
        Promise<{ result: boolean, info: any }> {

        let result: boolean = false;
        let info: any = { error: null, response: null, valid: result };
        let progress: boolean = false;

        try {
         
            // Get the contact.
            let contacts: Array<ContactPeer> = this.webRtcImp.webrtc.webrtcadapter.getContactPeer(uniqueID, applicationID, false);
            let contact: ContactPeer = contacts[0];

            // set remote tracks
            contact.setTracks(tracks);
            contact.setSessionIdRemote(remoteSession.sessionID);

            // if audio track exists
            if (remoteSession.hasAudioTracks) {
                contact.addTracksToTransceiver('audio', { direction: 'inactive' });
            }

            // if video track exists
            if (remoteSession.hasVideoTracks) {
                contact.addTracksToTransceiver('video', { direction: 'inactive' });
            }

            // Send the first offer and create a session. The returned sessionId is required 
            // to retrieve any track published by this peer
            await contact.peerConnection.setLocalDescription(await contact.peerConnection.createOffer());

            // create a new session
            let { validresult, sessionID, info } = await this.newSessionLocal(uniqueID, applicationID, contact.peerConnection.localDescription)

            // assign the result.
            result = validresult;
            info = { "error": info.error, response: sessionID, valid: result };

            // if valid
            if (result) {
                progress = false;

                // make sure the peer connection was established
                await new Promise((resolve, reject) => {
                    contact.peerConnection.addEventListener('iceconnectionstatechange', ev => {
                        if ((ev.target as any).iceConnectionState === 'connected') {

                            // a connection was established
                            progress = true;
                            resolve(true);
                        }

                        // set a timeout
                        setTimeout(reject, 5000, 'connect timeout');
                    });
                });

                // if valid
                if (progress) {
                    progress = false;

                    // Get local description, create a new track, set remote description with the response
                    await contact.peerConnection.setLocalDescription(await contact.peerConnection.createOffer());

                    // add remote tracks
                    let { result, info } = await this.addTrackRemote(sessionID, uniqueID, applicationID, tracks);
                    info = { "error": info.error, response: sessionID, valid: result };

                    // if valid
                    progress = result;
                    if (progress) {
                        result = progress;
                    }
                }
            }
        } catch (e) {
            result = false;
            info = { error: e, response: null, valid: result };
        }
        finally {
            //await;
            if (info && info.error) {
                util.logger("Error", "Failed to initialise the remote contact", info);
            }
        }

        // return
        return {
            result, info
        };
    }

    /**
     * initialise the local contact
     * @param {string}      uniqueID        The contact unique id.
     * @param {string}      applicationID   The contact application id.
     * @param {MediaStream}      stream   The local stream.
     * @returns {boolean}   true if create else false.
     */
    async initContactLocal(uniqueID: string, applicationID: string, stream: MediaStream):
        Promise<{ result: boolean, info: any }> {

        let result: boolean = false;
        let info: any = { error: null, response: null, valid: result };
        let progress: boolean = false;

        try {
            // Get the contact.
            let contacts: Array<ContactPeer> = this.webRtcImp.webrtc.webrtcadapter.getContactPeer(uniqueID, applicationID, false);
            let contact: ContactPeer = contacts[0];

            // add the tracks to the contact.
            contact.addStreamTracksToTransceiver(stream, { direction: 'sendonly' });

            // if stream has been added
            if (this.getTransceiverTracksLocal(uniqueID, applicationID).length > 0) {

                // Send the first offer and create a session. The returned sessionId is required 
                // to retrieve any track published by this peer
                await contact.peerConnection.setLocalDescription(await contact.peerConnection.createOffer());

                // create a new session
                let { validresult, sessionID, info } = await this.newSessionLocal(uniqueID, applicationID, contact.peerConnection.localDescription)

                // assign the result.
                result = validresult;
                info = { "error": info.error, response: sessionID, valid: result };

                // if valid
                if (result) {
                    progress = false;

                    // make sure the peer connection was established
                    await new Promise((resolve, reject) => {
                        contact.peerConnection.addEventListener('iceconnectionstatechange', ev => {
                            if ((ev.target as any).iceConnectionState === 'connected') {

                                // a connection was established
                                progress = true;
                                resolve(true);
                            }

                            // set a timeout
                            setTimeout(reject, 5000, 'connect timeout');
                        });
                    });

                    // if valid
                    if (progress) {
                        progress = false;

                        // Get local description, create a new track, set remote description with the response
                        await contact.peerConnection.setLocalDescription(await contact.peerConnection.createOffer());

                        // add local tracks
                        let {result, info } = await this.addTrackLocal(sessionID, uniqueID, applicationID,
                            contact.peerConnection.localDescription, this.getTransceiverTracksLocal(uniqueID, applicationID));

                        // assign
                        info = { "error": info.error, response: sessionID, valid: result };

                        // if valid
                        progress = result;
                        if (progress) {
                            // At this point in code, we are successfully sending local stream to Cloudflare Calls.

                            // get transceiver tracks
                            let transceivers: Array<RTCRtpTransceiver> = this.getTransceiverTracksLocal(uniqueID, applicationID);

                            // get all local tracks.
                            let tracks: Array<Track> = transceivers.map(transceiver => {
                                return {
                                    location: 'local',
                                    mid: transceiver.mid,
                                    trackName: transceiver.sender.track.id
                                };
                            });

                            // set local tracks
                            contact.setTracks(tracks);

                            // assign remote tracks.
                            this.remoteTracks = tracks.map(track => {
                                return {
                                    location: 'remote',
                                    mid: track.mid,
                                    sessionId: sessionID,
                                    trackName: track.trackName
                                };
                            });

                            // result
                            this.sessionId = sessionID;
                            result = progress;
                        }
                    }
                }
            }
        } catch (e) {
            result = false;
            info = { error: e, response: null, valid: result };
        }
        finally {
            //await;
            if (info && info.error) {
                util.logger("Error", "Failed to initialise the remote contact", info);
            }
        }

        // return
        return {
            result, info
        };
    }

    /**
     * create a new local session.
     * @param {string}      uniqueID        The contact unique id.
     * @param {string}      applicationID   The contact application id.
     * @param {RTCSessionDescription}      sdpOffer   The sdp.
     * @returns {boolean}   true if create else false.
     */
    async newSessionLocal(uniqueID: string, applicationID: string, sdpOffer: RTCSessionDescription):
        Promise<{ validresult: boolean, sessionID: string, info: any }> {

        let validresult: boolean = false;
        let info: any = { error: null, response: null, valid: validresult };
        let sessionID: string = "";

        try {

            // Get the contact.
            let contacts: Array<ContactPeer> = this.webRtcImp.webrtc.webrtcadapter.getContactPeer(uniqueID, applicationID, false);
            let contact: ContactPeer = contacts[0];

            // create a new request.
            let request: CreateNewSessionRequest = {
                sessionDescription: {
                    type: "offer",
                    sdp: sdpOffer.sdp
                }
            };

            // create a new session.
            let { valid, newSessionResponse, error } = await this.serviceCreateNewSession(request);

            // assign the result.
            validresult = valid;
            info = { "error": error, response: newSessionResponse, valid: validresult };

            // if valid
            if (valid) {

                // assign session id
                sessionID = newSessionResponse.sessionId;

                // set the contact session id
                contact.setSessionId(newSessionResponse.sessionId);

                // create remote description
                contact.setRemoteDescription(new RTCSessionDescription(newSessionResponse.sessionDescription as RTCSessionDescription));
            }
            
        } catch (e) {
            validresult = false;
            info = { error: e, response: null, valid: validresult };
        }
        finally {
            //await;
            if (info && info.error) {
                util.logger("Error", "Failed to initialise the remote contact", info);
            }
        }

        // return
        return {
            validresult, sessionID, info
        };
    }

    /**
     * get session information.
     * @param {string}      sessionId        The local session id.
     * @returns {boolean}   true if create else false.
     */
    async sessionInformation(sessionId: string): Promise<{ result: boolean, response: GetSessionInformationResponse, info: any }> {

        let result: boolean = false;
        let info: any = { error: null, response: null, valid: result };
        let response: GetSessionInformationResponse = null;

        try {
            // create a new request.
            let request: GetSessionInformationRequest = {};

            // get session info.
            let { valid, getSessionInformationResponse, error } = await this.serviceGetSessionInformation(sessionId, request);

            // assign the result.
            result = valid;
            info = { "error": error, response: getSessionInformationResponse, valid: result };
            
        } catch (e) {
            result = false;
            info = { error: e, response: null, valid: result };
        }
        finally {
            //await;
            if (info && info.error) {
                util.logger("Error", "Failed to initialise the remote contact", info);
            }
        }

        // return
        return {
            result, response, info
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
    async addTrackLocal(sessionId: string, uniqueID: string, applicationID: string,
        sdpOffer: RTCSessionDescription, transceivers: Array<RTCRtpTransceiver>): Promise<{ result: boolean, info: any }> {

        let result: boolean = false;
        let info: any = { error: null, response: null, valid: result };

        try {
            // Get the contact.
            let contacts: Array<ContactPeer> = this.webRtcImp.webrtc.webrtcadapter.getContactPeer(uniqueID, applicationID, false);
            let contact: ContactPeer = contacts[0];

            // get all local tracks.
            let tracks: Array<Track> = transceivers.map(transceiver => {
                return {
                    location: 'local',
                    mid: transceiver.mid,
                    trackName: transceiver.sender.track.id
                };
            });

            // set local tracks
            contact.setTracks(tracks);

            // create a new request.
            let request: AddNewTrackRequest = {
                sessionDescription: {
                    type: "offer",
                    sdp: sdpOffer.sdp
                },
                tracks: tracks
            };

            // add tracks.
            let { valid, newTrackResponse, error } = await this.serviceAddNewTrack(sessionId, request);

            // assign the result.
            result = valid;
            info = { "error": error, response: newTrackResponse, valid: result };
            if (valid) {
                // add remote
                contact.setRemoteDescription(new RTCSessionDescription(newTrackResponse.sessionDescription as RTCSessionDescription));
            }
            
        } catch (e) {
            result = false;
            info = { error: e, response: null, valid: result };
        }
        finally {
            //await;
            if (info && info.error) {
                util.logger("Error", "Failed to initialise the remote contact", info);
            }
        }

        // return
        return {
            result, info
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
    async addTrackRemote(sessionId: string, uniqueID: string, applicationID: string, tracks: Array<Track>):
        Promise<{ result: boolean, info: any }> {

        let result: boolean = false;
        let info: any = { error: null, response: null, valid: result };

        try {
            // Get the contact.
            let contacts: Array<ContactPeer> = this.webRtcImp.webrtc.webrtcadapter.getContactPeer(uniqueID, applicationID, false);
            let contact: ContactPeer = contacts[0];

            // set remote tracks
            contact.setTracks(tracks);

            // create a new request.
            let request: AddNewTrackRequest = {
                tracks: tracks
            };

            // add tracks.
            let { valid, newTrackResponse, error } = await this.serviceAddNewTrack(sessionId, request);

            // assign the result.
            result = valid;
            info = { "error": error, response: newTrackResponse, valid: result };

            // if valid
            if (valid) {

                // if requires immediate renegotiation
                if (newTrackResponse.requiresImmediateRenegotiation) {

                    // select
                    switch (newTrackResponse.sessionDescription.type) {

                        case 'offer':
                            // we let Cloudflare know we're ready to receive the tracks
                            await contact.setRemoteDescription(
                                new RTCSessionDescription(newTrackResponse.sessionDescription as RTCSessionDescription));
                            await contact.peerConnection.setLocalDescription(await contact.peerConnection.createAnswer());

                            // renegotiate session.
                            let { result, info } = await this.renegotiateSession(sessionId, contact.peerConnection.localDescription);
                            let infoIn: any = info;

                            // if invalid.
                            if (!result) {
                                throw new Error('Unable to renegotiate session. ' + infoIn.error);
                            }
                            break;

                        case 'answer':
                            throw new Error('An offer SDP was expected');
                    }
                }
            }

        } catch (e) {
            result = false;
            info = { error: e, response: null, valid: result };
        }
        finally {
            //await;
            if (info && info.error) {
                util.logger("Error", "Failed to initialise the remote contact", info);
            }
        }

        // return
        return {
            result, info
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
    async closeTrack(sessionId: string, uniqueID: string, applicationID: string,
        tracks: Array<Track>, sdpOffer: RTCSessionDescription): Promise<{ result: boolean, info: any }> {

        let result: boolean = false;
        let info: any = { error: null, response: null, valid: result };

        try {

            // Get the contact.
            let contacts: Array<ContactPeer> = this.webRtcImp.webrtc.webrtcadapter.getContactPeer(uniqueID, applicationID, false);
            let contact: ContactPeer = contacts[0];

            // new track list
            let newTracks: Array<Track> = tracks.map(track => {
                return {
                    mid: track.mid
                };
            });

            // create a new request.
            let request: CloseTrackRequest = {
                force: false,
                sessionDescription: {
                    type: "offer",
                    sdp: sdpOffer.sdp
                },
                tracks: newTracks
            };

            // close tracks.
            let { valid, closeTrackResponse, error } = await this.serviceCloseTrack(sessionId, request);

            // assign the result.
            result = valid;
            info = { "error": error, response: closeTrackResponse, valid: result };
            if (valid) {

                // remove tracks from contact.
                contact.removeStreamTransceiverTracks();
            }

        } catch (e) {
            result = false;
            info = { error: e, response: null, valid: result };
        }
        finally {
            //await;
            if (info && info.error) {
                util.logger("Error", "Failed to initialise the remote contact", info);
            }
        }

        // return
        return {
            result, info
        };
    }

    /**
     * renegotiate an existing session.
     * @param sessionId the session Id.
     * @param {RTCSessionDescription}      sdpAnswer   The sdp.
     * @returns {boolean}   true if create else false.
     */
    async renegotiateSession(sessionId: string, sdpAnswer: RTCSessionDescription): Promise<{ result: boolean, info: any }> {

        let result: boolean = false;
        let info: any = { error: null, response: null, valid: result };

        try {
            // create a new request.
            let request: RenegotiateSessionRequest = {
                sessionDescription: {
                    type: 'answer',
                    sdp: sdpAnswer.sdp
                }
            };

            // renegotiate session.
            let { valid, renegotiateSessionResponse, error } = await this.serviceRenegotiateSession(sessionId, request);

            // assign the result.
            result = valid;
            info = { "error": error, response: renegotiateSessionResponse, valid: result };

        } catch (e) {
            result = false;
            info = { error: e, response: null, valid: result };
        }
        finally {
            //await;
            if (info && info.error) {
                util.logger("Error", "Failed to initialise the remote contact", info);
            }
        }

        // return
        return {
            result, info
        };
    }

    /**
     * Initiates a new session on the Cloudflare Calls WebRTC server, 
     * establishing a PeerConnection on the client side.
     * @param newSessionRequest the new session request.
     * @return {valid: boolean, newSessionResponse: CreateNewSessionResponse}    true if valid else false.
     */
    async serviceCreateNewSession(newSessionRequest: CreateNewSessionRequest):
        Promise<{ valid: boolean, newSessionResponse: CreateNewSessionResponse, error }> {

        let valid: boolean = false;
        let error: any = null;
        let newSessionResponse: CreateNewSessionResponse = null;

        try {
            let self = this;

            // create the request.
            let request = {
                method: 'POST',
                headers: {
                    "Content-type": "application/json",
                    Authorization: 'Bearer ' + this.config.accessToken
                },
                body: JSON.stringify(newSessionRequest)
            };

            // create a promise.
            const waitGetSession = new Promise(async (resolve, reject) => {
                try {
                    // send the request.
                    this.jsonRequest(this.baseURL + "new", request,
                        (data) => {
                            resolve(data);
                        },
                        (error) => {
                            reject(error);
                        });

                } catch (ex) {
                    reject(ex);
                }
            });

            // await on complete.
            await Promise.all([waitGetSession]).then((value) => {
                valid = (value[0] as any).valid as boolean;
                error = (value[0] as any).error;
                newSessionResponse = (value[0] as any).result as CreateNewSessionResponse;
            }).catch((reason) => {
                valid = false;
                error = reason;
            });

        } catch (e) {
            valid = false;
            error = e;
            util.logger("Service Error", "Failed to create new session", e);
        }
        finally {
            //await;
        }

        // return the result.
        return { valid, newSessionResponse, error };
    }

    /**
     * Adds a media track (audio or video) to an existing session
     * @param sessionId the session Id.
     * @param newTrackRequest the new track request.
     * @return {valid: boolean, newTrackResponse: AddNewTrackResponse}    true if valid else false.
     */
    async serviceAddNewTrack(sessionId: string, newTrackRequest: AddNewTrackRequest):
        Promise<{ valid: boolean, newTrackResponse: AddNewTrackResponse, error }> {

        let valid: boolean = false;
        let error: any = null;
        let newTrackResponse: AddNewTrackResponse = null;

        try {
            let self = this;

            // create the request.
            let request = {
                method: 'POST',
                headers: {
                    "Content-type": "application/json",
                    Authorization: 'Bearer ' + this.config.accessToken
                },
                body: JSON.stringify(newTrackRequest)
            };

            // create a promise.
            const waitAddTrack = new Promise(async (resolve, reject) => {
                try {
                    // send the request.
                    this.jsonRequest(this.baseURL + "add/" + sessionId, request,
                        (data) => {
                            resolve(data);
                        },
                        (error) => {
                            reject(error);
                        });

                } catch (ex) {
                    reject(ex);
                }
            });

            // await on complete.
            await Promise.all([waitAddTrack]).then((value) => {
                valid = (value[0] as any).valid as boolean;
                error = (value[0] as any).error;
                newTrackResponse = (value[0] as any).result as AddNewTrackResponse;
            }).catch((reason) => {
                valid = false;
                error = reason;
            });

        } catch (e) {
            valid = false;
            error = e;
            util.logger("Service Error", "Failed to add new track", e);
        }
        finally {
            //await;
        }

        // return the result.
        return { valid, newTrackResponse, error };
    }

    /**
     * Updates the session’s negotiation state to accommodate new tracks or 
     * changes in the existing ones.
     * @param sessionId the session Id.
     * @param renegotiateSessionRequest the new track request.
     * @return {valid: boolean, renegotiateSessionResponse: RenegotiateSessionResponse}    true if valid else false.
     */
    async serviceRenegotiateSession(sessionId: string, renegotiateSessionRequest: RenegotiateSessionRequest):
        Promise<{ valid: boolean, renegotiateSessionResponse: RenegotiateSessionResponse, error }> {

        let valid: boolean = false;
        let error: any = null;
        let renegotiateSessionResponse: RenegotiateSessionResponse = null;

        try {
            let self = this;

            // create the request.
            let request = {
                method: 'PUT',
                headers: {
                    "Content-type": "application/json",
                    Authorization: 'Bearer ' + this.config.accessToken
                },
                body: JSON.stringify(renegotiateSessionRequest)
            };

            // create a promise.
            const waitRenegotiateSession = new Promise(async (resolve, reject) => {
                try {
                    // send the request.
                    this.jsonRequest(this.baseURL + "reneg/" + sessionId, request,
                        (data) => {
                            resolve(data);
                        },
                        (error) => {
                            reject(error);
                        });

                } catch (ex) {
                    reject(ex);
                }
            });

            // await on complete.
            await Promise.all([waitRenegotiateSession]).then((value) => {
                valid = (value[0] as any).valid as boolean;
                error = (value[0] as any).error;
                renegotiateSessionResponse = (value[0] as any).result as RenegotiateSessionResponse;
            }).catch((reason) => {
                valid = false;
                error = reason;
            });

        } catch (e) {
            valid = false;
            error = e;
            util.logger("Service Error", "Failed to renegotiate session", e);
        }
        finally {
            //await;
        }

        // return the result.
        return { valid, renegotiateSessionResponse, error };
    }

    /**
     * Removes a specified track from the session.
     * @param sessionId the session Id.
     * @param closeTrackRequest the close track request.
     * @return {valid: boolean, closeTrackResponse: CloseTrackResponse}    true if valid else false.
     */
    async serviceCloseTrack(sessionId: string, closeTrackRequest: CloseTrackRequest):
        Promise<{ valid: boolean, closeTrackResponse: CloseTrackResponse, error }> {

        let valid: boolean = false;
        let error: any = null;
        let closeTrackResponse: CloseTrackResponse = null;

        try {
            let self = this;

            // create the request.
            let request = {
                method: 'PUT',
                headers: {
                    "Content-type": "application/json",
                    Authorization: 'Bearer ' + this.config.accessToken
                },
                body: JSON.stringify(closeTrackRequest)
            };

            // create a promise.
            const waitCloseTrack = new Promise(async (resolve, reject) => {
                try {
                    // send the request.
                    this.jsonRequest(this.baseURL + "close/" + sessionId, request,
                        (data) => {
                            resolve(data);
                        },
                        (error) => {
                            reject(error);
                        });

                } catch (ex) {
                    reject(ex);
                }
            });

            // await on complete.
            await Promise.all([waitCloseTrack]).then((value) => {
                valid = (value[0] as any).valid as boolean;
                error = (value[0] as any).error;
                closeTrackResponse = (value[0] as any).result as CloseTrackResponse;
            }).catch((reason) => {
                valid = false;
                error = reason;
            });

        } catch (e) {
            valid = false;
            error = e;
            util.logger("Service Error", "Failed to close track", e);
        }
        finally {
            //await;
        }

        // return the result.
        return { valid, closeTrackResponse, error };
    }

    /**
     * Gets detailed information about a specific session.
     * @param sessionId the session Id.
     * @param getSessionInformationRequest the close track request.
     * @return {valid: boolean, getSessionInformationResponse: GetSessionInformationResponse}    true if valid else false.
     */
    async serviceGetSessionInformation(sessionId: string, getSessionInformationRequest: GetSessionInformationRequest):
        Promise<{ valid: boolean, getSessionInformationResponse: GetSessionInformationResponse, error }> {

        let valid: boolean = false;
        let error: any = null;
        let getSessionInformationResponse: GetSessionInformationResponse = null;

        try {
            let self = this;

            // create the request.
            let request = {
                method: 'GET',
                headers: {
                    "Content-type": "application/json",
                    Authorization: 'Bearer ' + this.config.accessToken
                }
            };

            // create a promise.
            const waitGetSessionInformation = new Promise(async (resolve, reject) => {
                try {
                    // send the request.
                    this.jsonRequest(this.baseURL + "info/" + sessionId, request,
                        (data) => {
                            resolve(data);
                        },
                        (error) => {
                            reject(error);
                        });

                } catch (ex) {
                    reject(ex);
                }
            });

            // await on complete.
            await Promise.all([waitGetSessionInformation]).then((value) => {
                valid = (value[0] as any).valid as boolean;
                error = (value[0] as any).error;
                getSessionInformationResponse = (value[0] as any).result as GetSessionInformationResponse;
            }).catch((reason) => {
                valid = false;
                error = reason;
            });

        } catch (e) {
            valid = false;
            error = e;
            util.logger("Service Error", "Failed to get session information", e);
        }
        finally {
            //await;
        }

        // return the result.
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
    jsonRequest(url: string, config: any, resultAction: any, errorAction: any): void {

        // make the request.
        fetch(url, config)
            .then(this.responseAction)
            .then(this.jsonResponse)
            .then(resultAction)
            .catch(errorAction);
    }

    /**
     * json response from a fetch API request.
     *
     * @param {Response}	response   the fetch API response.
     * @return {Promise<any>}	the promise interface.
     */
    jsonResponse(response: Response): Promise<any> {

        // return the promise.
        return response.json();
    }

    /**
     * Response action from a fetch API request.
     *
     * @param {Response}	response   the fetch API response.
     * @return {Promise}	the promise interface; either the response or the error message.
     */
    responseAction(response: Response): Promise<any> {

        // if successful request.
        if (response.status >= 200 && response.status < 300) {

            // return the promise response.
            return Promise.resolve(response)
        } else {

            // return the promise with error.
            return Promise.reject(new Error(response.statusText))
        }
    }
}
