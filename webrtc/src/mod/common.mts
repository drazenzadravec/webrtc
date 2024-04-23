/**
 * logger.
 * @param {string} logtype	the log type.
 * @param {string} msg	the log type.
 * @param {object} event	the event data.
 */
export async function logger(logtype: string, msg: string, event: any): Promise<void> {
	let cp = new Promise(function (resolve, reject) {
		try {
			let logHeader: string = "WebRTC:";

			// select error type.
			switch (logtype.toLowerCase()) {

				case "log": {
					// information.
					console.log(logHeader + " log: " + msg + " : ", event);
					break;
				}
				case "warn": {
					// information.
					console.warn(logHeader + " warn: " + msg + " : ", event);
					break;
				}
				case "error": {
					// information.
					console.error(logHeader + " error: " + msg + " : ", event);
					break;
				}
				default: {
					// information.
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

/**
 * Write the trace to the console.
 * 
 * @param {string}      text        The text to write to the log.
 */
export function trace(text: string): void {
	if (text[text.length - 1] === "\n") {
		text = text.substring(0, text.length - 1);
	}
	// Write the log.
	logger("log", "Trace", text);
};

/**
 * Base 64 encode the string.
 * 
 * @param {string}     stringToEncode          The string to encode.
 * @return {string}     Base 64 encoded string.
 */
export function base64EncodeUnicode(stringToEncode: string): string {

    // First we use encodeURIComponent to get percent-encoded UTF-8,
    // then we convert the percent encodings into raw bytes which
    // can be fed into btoa.
    return btoa(encodeURIComponent(stringToEncode).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode(0x0 + p1);
        }));
}

/**
* Base 64 decode the string.
* 
* @param {string}     stringToDecode          The string to decode.
* @return {string}     The decoded Base 64 string.
*/
export function base64DecodeUnicode(stringToDecode: string): string {

    // Going backwards: from bytestream, to percent-encoding, to original string.
    return decodeURIComponent(atob(stringToDecode).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

}

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

/**
 * remote session details
 */
export interface RemoteSessionDetails {
    "tracks"?: Array<Track>;
    "remoteTracks"?: boolean;
    "sessionID"?: string;
    "hasVideoTracks"?: boolean;
    "hasAudioTracks"?: boolean;
    "countVideoTracks"?: number;
    "countAudioTracks"?: number;
}
