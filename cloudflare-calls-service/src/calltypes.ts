/**
 * create new session response
 */
export interface CreateNewSessionResponse {
    "sessionDescription"?: SessionDescription;
    "sessionId"?: string;
}

/**
 * create new session request
 */
export interface CreateNewSessionRequest {
    "sessionDescription"?: SessionDescription;
}

/**
 * add new track response
 */
export interface AddNewTrackResponse {
    "sessionDescription"?: SessionDescription;
    "tracks"?: Array<Track>;
    "requiresImmediateRenegotiation"?: boolean;
}

/**
 * add new track request
 */
export interface AddNewTrackRequest {
    "sessionDescription"?: SessionDescription;
    "tracks"?: Array<Track>;
}

/**
 * renegotiate session request
 */
export interface RenegotiateSessionRequest {
    "sessionDescription"?: SessionDescription;
}

/**
 * renegotiate session response
 */
export interface RenegotiateSessionResponse {
    "sessionDescription"?: SessionDescription;
}

/**
 * close track response
 */
export interface CloseTrackResponse {
    "sessionDescription"?: SessionDescription;
    "tracks"?: Array<Track>;
    "requiresImmediateRenegotiation"?: boolean;
}

/**
 * close track request
 */
export interface CloseTrackRequest {
    "sessionDescription"?: SessionDescription;
    "tracks"?: Array<Track>;
    "force"?: boolean;
}

/**
 * get session information response
 */
export interface GetSessionInformationResponse {
    "tracks"?: Array<Track>;
}

/**
 * get session information request
 */
export interface GetSessionInformationRequest { }

/**
 * session description
 */
export interface SessionDescription {
    "type"?: string;
    "sdp"?: string;
}

/**
 * track
 */
export interface Track {
    "location"?: string;
    "mid"?: string;
    "sessionId"?: string;
    "trackName"?: string;
    "status"?: string;
}