import { AppSettings } from './cfappsettings';
import { IncomingMessage, ServerResponse } from "http";
import { CallService } from './callservice';

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
	GetSessionInformationRequest
} from './calltypes';

/**
 * Application Server implementation.
 */
export class ApplicationServer {

	apiConfig: any;
	appSettings: AppSettings = null;

	/**
	 * Application Server implementation.
	 *
	 * @param {Object}   apiOptions  A collection of options.
	 *
	 * @example
	 *  apiOptions = {
	 *		debug: true
	 *	};
	 */
	constructor(public apiOptions: any) {

		let itemApi;
		let localThis = this;

		// ac api client options.
		let optionsApi = apiOptions || {};
		let apiConfig = this.apiConfig = {
			debug: true
		};

		// set our config from options
		for (itemApi in optionsApi) {
			if (optionsApi.hasOwnProperty(itemApi)) {
				this.apiConfig[itemApi] = optionsApi[itemApi];
			}
		}

		// set allowed list.
		this.appSettings = this.apiConfig.appSettings;
	}

	/**
	* process request.
	* @param {IncomingMessage} req	The request.
	* @param {ServerResponse} res	The response.
	* @return {Promise}    The Promise true if success: else false.
	*/
	async processRequestAsync(req: IncomingMessage, res: ServerResponse): Promise<boolean> {

		let result: boolean = false;
		let thisLocal: ApplicationServer = this;

		try {
			// create a promise.
			const waitprocessRequest = new Promise(async (resolve, reject) => {

				try {
					// process request.
					await thisLocal.processRequest(req, res);
					resolve(true);

				} catch (e) {
					reject(e.message);
				}
			});

			// await on complete.
			await Promise.all([waitprocessRequest]).then((value) => {
				result = true;
			}).catch((reason) => {
				result = false;
			});
		} catch (e) {
			result = false;
		}
		return result;
	}

	/**
	* process request.
	* @param {IncomingMessage} req	The request.
	* @param {ServerResponse} res	The response.
	*/
	async processRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {

		// assign app id and secret
		let appid: string = this.appSettings.AppID;
		let appsecret: string = this.appSettings.AppSecret;
		let callbaseurl: string = this.appSettings.CallBaseUrl;

		// assign a route
		if (req.method.toUpperCase() === "GET" &&
			req.url.startsWith("/api/cf/call/sessions/info")) {

			// get the url path
			const { pathname } = new URL("http://localhost" + req.url);

			// /api/cf/call/sessions/info/{sessionId}
			let sessionId: string = pathname.split("/")[6];

			// create call service.
			let callservice: CallService = new CallService({
				appID: appid,
				appSecret: appsecret,
				callBaseURL: callbaseurl,
				debug: true
			});

			// create the request
			let getSessionInformationRequest: GetSessionInformationRequest = {};

			// get the session information
			let { valid, getSessionInformationResponse, error } =
				await callservice.getSessionInformation(sessionId, getSessionInformationRequest);

			// send the response.
			res.writeHead(200,
				{
					"Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*"
				});
			res.write(JSON.stringify({
				result: getSessionInformationResponse,
				valid: valid,
				error: error
			}), 'utf8');
			res.end();
		}
		else if (req.method.toUpperCase() === "OPTIONS" &&
			(req.url.startsWith("/api/cf/call/sessions/info"))) {

			// send the response.
			res.writeHead(204,
				{
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "OPTIONS, GET",
					"Access-Control-Allow-Headers": "Authorization, Content-Type",
				});
			res.end();
		}
		else if (req.method.toUpperCase() === "PUT" &&
			req.url.startsWith("/api/cf/call/sessions/close")) {

			// get the url path
			const { pathname } = new URL("http://localhost" + req.url);

			// /api/cf/call/sessions/info/{sessionId}
			let sessionId: string = pathname.split("/")[6];

			// create call service.
			let callservice: CallService = new CallService({
				appID: appid,
				appSecret: appsecret,
				callBaseURL: callbaseurl,
				debug: true
			});

			// get the body.
			this.processPostRequest(req, res, async (payload) => {

				// create the request
				let closeTrackRequest: CloseTrackRequest = JSON.parse(payload) as CloseTrackRequest;

				// get the session information
				let { valid, closeTrackResponse, error } = await callservice.closeTrack(sessionId, closeTrackRequest);

				// send the response.
				res.writeHead(200,
					{
						"Content-Type": "application/json",
						"Access-Control-Allow-Origin": "*"
					});
				res.write(JSON.stringify({
					result: closeTrackResponse,
					valid: valid,
					error: error
				}), 'utf8');
				res.end();
			});
		}
		else if (req.method.toUpperCase() === "OPTIONS" &&
			(req.url.startsWith("/api/cf/call/sessions/close"))) {

			// send the response.
			res.writeHead(204,
				{
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "OPTIONS, PUT",
					"Access-Control-Allow-Headers": "Authorization, Content-Type",
				});
			res.end();
		}
		else if (req.method.toUpperCase() === "PUT" &&
			req.url.startsWith("/api/cf/call/sessions/reneg")) {

			// get the url path
			const { pathname } = new URL("http://localhost" + req.url);

			// /api/cf/call/sessions/info/{sessionId}
			let sessionId: string = pathname.split("/")[6];

			// create call service.
			let callservice: CallService = new CallService({
				appID: appid,
				appSecret: appsecret,
				callBaseURL: callbaseurl,
				debug: true
			});

			// get the body.
			this.processPostRequest(req, res, async (payload) => {

				// create the request
				let renegotiateSessionRequest: RenegotiateSessionRequest = JSON.parse(payload) as RenegotiateSessionRequest;

				// get the session information
				let { valid, renegotiateSessionResponse, error } =
					await callservice.renegotiateSession(sessionId, renegotiateSessionRequest);

				// send the response.
				res.writeHead(200,
					{
						"Content-Type": "application/json",
						"Access-Control-Allow-Origin": "*"
					});
				res.write(JSON.stringify({
					result: renegotiateSessionResponse,
					valid: valid,
					error: error
				}), 'utf8');
				res.end();
			});
		}
		else if (req.method.toUpperCase() === "OPTIONS" &&
			(req.url.startsWith("/api/cf/call/sessions/reneg"))) {

			// send the response.
			res.writeHead(204,
				{
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "OPTIONS, PUT",
					"Access-Control-Allow-Headers": "Authorization, Content-Type",
				});
			res.end();
		}
		else if (req.method.toUpperCase() === "POST" &&
			req.url.startsWith("/api/cf/call/sessions/add")) {

			// get the url path
			const { pathname } = new URL("http://localhost" + req.url);

			// /api/cf/call/sessions/info/{sessionId}
			let sessionId: string = pathname.split("/")[6];

			// create call service.
			let callservice: CallService = new CallService({
				appID: appid,
				appSecret: appsecret,
				callBaseURL: callbaseurl,
				debug: true
			});

			// get the body.
			this.processPostRequest(req, res, async (payload) => {

				// create the request
				let addNewTrackRequest: AddNewTrackRequest = JSON.parse(payload) as AddNewTrackRequest;

				// get the session information
				let { valid, newTrackResponse, error } = await callservice.addNewTrack(sessionId, addNewTrackRequest);

				// send the response.
				res.writeHead(200,
					{
						"Content-Type": "application/json",
						"Access-Control-Allow-Origin": "*"
					});
				res.write(JSON.stringify({
					result: newTrackResponse,
					valid: valid,
					error: error
				}), 'utf8');
				res.end();
			});
		}
		else if (req.method.toUpperCase() === "OPTIONS" &&
			(req.url.startsWith("/api/cf/call/sessions/add"))) {

			// send the response.
			res.writeHead(204,
				{
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "OPTIONS, POST",
					"Access-Control-Allow-Headers": "Authorization, Content-Type",
				});
			res.end();
		}
		else if (req.method.toUpperCase() === "POST" &&
			req.url.startsWith("/api/cf/call/sessions/new")) {

			// create call service.
			let callservice: CallService = new CallService({
				appID: appid,
				appSecret: appsecret,
				callBaseURL: callbaseurl,
				debug: true
			});

			// get the body.
			this.processPostRequest(req, res, async (payload) => {

				// create the request
				let createNewSessionRequest: CreateNewSessionRequest = JSON.parse(payload) as CreateNewSessionRequest;

				// get the session information
				let { valid, newSessionResponse, error } = await callservice.createNewSession(createNewSessionRequest);

				// send the response.
				res.writeHead(200,
					{
						"Content-Type": "application/json",
						"Access-Control-Allow-Origin": "*"
					});
				res.write(JSON.stringify({
					result: newSessionResponse,
					valid: valid,
					error: error
				}), 'utf8');
				res.end();
			});
		}
		else if (req.method.toUpperCase() === "OPTIONS" &&
			(req.url.startsWith("/api/cf/call/sessions/new"))) {

			// send the response.
			res.writeHead(204,
				{
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "OPTIONS, POST",
					"Access-Control-Allow-Headers": "Authorization, Content-Type",
				});
			res.end();
		}
		else {
			// send the response.
			res.writeHead(400, { 'Content-Type': 'application/json' });
			res.write("{\"result\":\"Access Denied\"}", 'utf8');
			res.end();
		}
	}

	/**
	* process the POST request.
	* @param {IncomingMessage} req	The request.
	* @param {ServerResponse} res	The response.
	* @param {Function} callback	The callback (payload).
	* @return {string}    The result.
	*/
	processPostRequest(req: IncomingMessage, res: ServerResponse, callback: (payload: any) => void): string {

		let body = [];
		let errorResult = "";

		// on request.
		req.on('error', (err) => {

			// request error.
			errorResult = err.message;

		}).on('data', (chunk) => {

			// on chunk data, add.
			body.push(chunk);

		}).on('end', () => {

			// request has ended.
			var payload = Buffer.concat(body).toString();

			// At this point, we have the headers, method, url and body, and can now
			// do whatever we need to in order to respond to this request.
			callback(payload);
		});

		// return the error.
		return errorResult;
	}
}