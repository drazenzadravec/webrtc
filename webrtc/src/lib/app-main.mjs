// main

// async fetch.
var asyncFetch = new AsyncFetch();

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
