// main

// async fetch.
var asyncFetch = new AsyncFetch();

/**
* get current access token.
* @param {string}	url   the url or path
* @param {Function}	resultAction   the token else empty. (token: string) => void
*/
export function getCurrentAccessToken(url, resultAction) {
	// get current time.
	getJsonRequest(url, (data) => {
		try {
			// if from aws api
			if (data.isawsapi && data.issignedin) {
				// get token
				resultAction(data.token);
			}
			else {
				// no token
				resultAction("");
			}
		}
		catch (e) {
			// could not find element
			console.warn(e);
			resultAction("");
		}
	}, (error) => {
		console.error(error);
		resultAction("");
	});
}

/**
* get the json request.
*
* @param {string}	url   the url.
* @param {Function}	resultAction   the result function. (data: any) => void
* @param {Function}	errorAction   the error function. (error: any) => void
*/
export function getJsonRequest(url, resultAction, errorAction) {

	// get the report data.
	asyncFetch.jsonRequest(url,
		{
			method: 'GET'
		},
		function (data) {
			// send data complete.
			resultAction(data);
		},
		function (error) {
			// send error
			errorAction(error);
		}
	);
}

/**
* get the json request.
*
* @param {string}	url   the url.
* @param {string}	auth   the authorization header e.g. Bearer [access token].
* @param {Function}	resultAction   the result function. (data: any) => void
* @param {Function}	errorAction   the error function. (error: any) => void
*/
export function getJsonRequestAuth(url, auth, resultAction, errorAction) {

	// get the report data.
	asyncFetch.jsonRequest(url,
		{
			method: 'GET',
			headers: {
				"Authorization": auth
			}
		},
		function (data) {
			// send data complete.
			resultAction(data);
		},
		function (error) {
			// send error
			errorAction(error);
		}
	);
}

/**
* post the json request.
*
* @param {string}	url   the url.
* @param {string}	body   the body.
* @param {Function}	resultAction   the result function. (data: any) => void
* @param {Function}	errorAction   the error function. (error: any) => void
*/
export function postJsonRequest(url, body, resultAction, errorAction) {

	// get the report data.
	asyncFetch.jsonRequest(url,
		{
			method: 'POST',
			headers: {
				"Content-Type": "application/json"
			},
			body: body
		},
		function (data) {
			// send data complete.
			resultAction(data);
		},
		function (error) {
			// send error
			errorAction(error);
		}
	);
}

/**
* post the json request.
*
* @param {string}	url   the url.
* @param {string}	body   the body.
* @param {string}	auth   the authorization header e.g. Bearer [access token].
* @param {Function}	resultAction   the result function. (data: any) => void
* @param {Function}	errorAction   the error function. (error: any) => void
*/
export function postJsonRequestAuth(url, body, auth, resultAction, errorAction) {

	// get the report data.
	asyncFetch.jsonRequest(url,
		{
			method: 'POST',
			headers: {
				"Content-Type": "application/json",
				"Authorization": auth
			},
			body: body
		},
		function (data) {
			// send data complete.
			resultAction(data);
		},
		function (error) {
			// send error
			errorAction(error);
		}
	);
}
