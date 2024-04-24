
// dialog-control
/**
 * Init the dialog control.
 *
 * @param {string}	dialogFrameDiv  the frame element.
 * @param {string}	dialogHeaderDiv  the header element.
 * @param {string}	dialogContentDiv  the content element.
 * @param {string}	dialogResizerDiv  the resizer element.
 * @param {number}	widthDiff  the content width difference.
 * @param {number}	heightDiff  the content height difference.
 */
function initDialogControl(dialogFrameDiv, dialogHeaderDiv, dialogContentDiv, dialogResizerDiv, widthDiff, heightDiff) {

	var startX, startY, startWidth, startHeight;

	var frameDiv = document.getElementById(dialogFrameDiv);
	var contentDiv = document.getElementById(dialogContentDiv);

	var resizerDiv = document.getElementById(dialogResizerDiv);
	resizerDiv.addEventListener('mousedown', initDrag, false);

	// start the drag init.
	dragElement(frameDiv);

	/**
	* Init the drag frame control.
	*
	* @param {object}	elmnt  the frame element.
	*/
	function dragElement(elmnt) {

		var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

		if (document.getElementById(dialogHeaderDiv)) {
			/* if present, the header is where you move the DIV from:*/
			document.getElementById(dialogHeaderDiv).onmousedown = dragMouseDown;
		} else {
			/* otherwise, move the DIV from anywhere inside the DIV:*/
			elmnt.onmousedown = dragMouseDown;
		}

		/**
		* Start the mouse down header control.
		*
		* @param {object}	e  the frame element.
		*/
		function dragMouseDown(e) {
			e = e || window.event;
			e.preventDefault();

			// get the mouse cursor position at startup:
			pos3 = e.clientX;
			pos4 = e.clientY;

			document.onmouseup = closeDragElement;
			// call a function whenever the cursor moves:
			document.onmousemove = elementDrag;
		}

		/**
		* Start the drag header control.
		*
		* @param {object}	e  the frame element.
		*/
		function elementDrag(e) {
			e = e || window.event;
			e.preventDefault();

			// calculate the new cursor position:
			pos1 = pos3 - e.clientX;
			pos2 = pos4 - e.clientY;
			pos3 = e.clientX;
			pos4 = e.clientY;

			// set the element's new position:
			elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
			elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
		}

		/**
		* Close the drag header control.
		*/
		function closeDragElement() {
			/* stop moving when mouse button is released:*/
			document.onmouseup = null;
			document.onmousemove = null;
		}
	}

	/**
	* Init the resizer control.
	*
	* @param {object}	e  the resizer element.
	*/
	function initDrag(e) {
		startX = e.clientX;
		startY = e.clientY;
		startWidth = parseInt(document.defaultView.getComputedStyle(frameDiv).width, 10);
		startHeight = parseInt(document.defaultView.getComputedStyle(frameDiv).height, 10);
		document.documentElement.addEventListener('mousemove', doDrag, false);
		document.documentElement.addEventListener('mouseup', stopDrag, false);
	}

	/**
	* Start the drag resizer control.
	*
	* @param {object}	e  the resizer element.
	*/
	function doDrag(e) {
		frameDiv.style.width = (startWidth + e.clientX - startX) + 'px';
		frameDiv.style.height = (startHeight + e.clientY - startY) + 'px';

		contentDiv.style.width = (startWidth + e.clientX - startX - widthDiff) + 'px';
		contentDiv.style.height = (startHeight + e.clientY - startY - heightDiff) + 'px';
	}

	/**
	* Stop the drag resizer control.
	*
	* @param {object}	e  the resizer element.
	*/
	function stopDrag(e) {
		document.documentElement.removeEventListener('mousemove', doDrag, false);
		document.documentElement.removeEventListener('mouseup', stopDrag, false);
	}
}

/**
 * Init the dialog control.
 *
 * @param {string}	dialogFrameDiv  the frame element.
 * @param {string}	dialogHeaderDiv  the header element.
 * @param {string}	dialogContentDiv  the content element.
 * @param {string}	dialogResizerDiv  the resizer element.
 * @param {number}	widthDiff  the content width difference.
 * @param {number}	heightDiff  the content height difference.
 */
function initDialogControlSnap(dialogFrameDiv, dialogHeaderDiv, dialogContentDiv, dialogResizerDiv, widthDiff, heightDiff) {

	// Minimum resizable area
	var minWidth = 10;
	var minHeight = 10;

	// Thresholds
	var FULLSCREEN_MARGINS = -10;
	var MARGINS = 4;

	// End of what's configurable.
	var clicked = null;
	var onRightEdge, onBottomEdge, onLeftEdge, onTopEdge;

	var rightScreenEdge, bottomScreenEdge;

	var preSnapped;

	var b, x, y;

	var redraw = false;

	var pane = document.getElementById(dialogFrameDiv);
	var ghostpane = document.getElementById(dialogResizerDiv);
	var contentDiv = document.getElementById(dialogContentDiv);

	/**
	* set the bounds resizer control.
	*
	* @param {object}	element  the resizer element.
    * @param {number}	x  the left.
    * @param {number}	y  the top.
    * @param {number}	w  the width.
    * @param {number}	h  the height.
	*/
	function setBounds(element, x, y, w, h) {
		element.style.left = x + 'px';
		element.style.top = y + 'px';
		element.style.width = w + 'px';
		element.style.height = h + 'px';
	}

	/**
	* hide the resizer.
	*/
	function hintHide() {
		setBounds(ghostpane, b.left, b.top, b.width, b.height);
		ghostpane.style.opacity = 0;

		// var b = ghostpane.getBoundingClientRect();
		// ghostpane.style.top = b.top + b.height / 2;
		// ghostpane.style.left = b.left + b.width / 2;
		// ghostpane.style.width = 0;
		// ghostpane.style.height = 0;
	}


	// Mouse events
	pane.addEventListener('mousedown', onMouseDown);
	document.addEventListener('mousemove', onMove);
	document.addEventListener('mouseup', onUp);

	// Touch events	
	pane.addEventListener('touchstart', onTouchDown);
	document.addEventListener('touchmove', onTouchMove);
	document.addEventListener('touchend', onTouchEnd);

	/**
	* on resizer control touch down.
	*
	* @param {object}	e  the resizer element.
	*/
	function onTouchDown(e) {
		onDown(e.touches[0]);
		e.preventDefault();
	}

	/**
	* on resizer control touch move.
	*
	* @param {object}	e  the resizer element.
	*/
	function onTouchMove(e) {
		onMove(e.touches[0]);
	}

	/**
	* on resizer control touch end.
	*
	* @param {object}	e  the resizer element.
	*/
	function onTouchEnd(e) {
		if (e.touches.length === 0) onUp(e.changedTouches[0]);
	}

	/**
	* on resizer control mouse down.
	*
	* @param {object}	e  the resizer element.
	*/
	function onMouseDown(e) {
		onDown(e);
		e.preventDefault();
	}

	/**
	* on resizer control down action.
	*
	* @param {object}	e  the resizer element.
	*/
	function onDown(e) {
		calc(e);

		var isResizing = onRightEdge || onBottomEdge || onTopEdge || onLeftEdge;

		clicked = {
			x: x,
			y: y,
			cx: e.clientX,
			cy: e.clientY,
			w: b.width,
			h: b.height,
			isResizing: isResizing,
			isMoving: !isResizing && canMove(),
			onTopEdge: onTopEdge,
			onLeftEdge: onLeftEdge,
			onRightEdge: onRightEdge,
			onBottomEdge: onBottomEdge
		};
	}

	/**
	* on resizer control can move action.
    * @returns {boolean} true or false.
	*/
	function canMove() {
		return x > 0 && x < b.width && y > 0 && y < b.height
			&& y < 30;
	}

	/**
	* calculate the resizer margins.
	*
	* @param {object}	e  the resizer element.
	*/
	function calc(e) {
		b = pane.getBoundingClientRect();
		x = e.clientX - b.left;
		y = e.clientY - b.top;

		onTopEdge = y < MARGINS;
		onLeftEdge = x < MARGINS;
		onRightEdge = x >= b.width - MARGINS;
		onBottomEdge = y >= b.height - MARGINS;

		rightScreenEdge = window.innerWidth - MARGINS;
		bottomScreenEdge = window.innerHeight - MARGINS;
	}

	var e;

	/**
	* on move control.
	*
	* @param {object}	ee  the resizer element.
	*/
	function onMove(ee) {
		calc(ee);

		e = ee;
		redraw = true;
	}

	/**
	* animate the snap-in.
	*/
	function animate() {

		requestAnimationFrame(animate);

		if (!redraw) return;

		redraw = false;

		if (clicked && clicked.isResizing) {

			if (clicked.onRightEdge) {
				pane.style.width = Math.max(x, minWidth) + 'px';
				contentDiv.style.width = Math.max(x - widthDiff, minWidth) + 'px';
			}

			if (clicked.onBottomEdge) {
				pane.style.height = Math.max(y, minHeight) + 'px';
				contentDiv.style.height = Math.max(y - heightDiff, minHeight) + 'px';
			}

			if (clicked.onLeftEdge) {
				var currentWidth = Math.max(clicked.cx - e.clientX + clicked.w, minWidth);
				if (currentWidth > minWidth) {
					pane.style.width = currentWidth + 'px';
					pane.style.left = e.clientX + 'px';

					contentDiv.style.width = currentWidth - widthDiff + 'px';
					contentDiv.style.left = e.clientX + 'px';
				}
			}

			if (clicked.onTopEdge) {
				var currentHeight = Math.max(clicked.cy - e.clientY + clicked.h, minHeight);
				if (currentHeight > minHeight) {
					pane.style.height = currentHeight + 'px';
					pane.style.top = e.clientY + 'px';

					contentDiv.style.height = currentHeight - heightDiff + 'px';
					contentDiv.style.top = e.clientY + 'px';
				}
			}

			hintHide();

			return;
		}

		if (clicked && clicked.isMoving) {

			if (preSnapped) {
				setBounds(pane,
					e.clientX - preSnapped.width / 2,
					e.clientY - Math.min(clicked.y, preSnapped.height),
					preSnapped.width,
					preSnapped.height
				);
				return;
			}

			// moving
			pane.style.top = (e.clientY - clicked.y) + 'px';
			pane.style.left = (e.clientX - clicked.x) + 'px';

			contentDiv.style.top = (e.clientY - clicked.y) + 'px';
			contentDiv.style.left = (e.clientX - clicked.x) + 'px';

			return;
		}

		// This code executes when mouse moves without clicking

		// style cursor
		if (onRightEdge && onBottomEdge || onLeftEdge && onTopEdge) {
			pane.style.cursor = 'nwse-resize';
		} else if (onRightEdge && onTopEdge || onBottomEdge && onLeftEdge) {
			pane.style.cursor = 'nesw-resize';
		} else if (onRightEdge || onLeftEdge) {
			pane.style.cursor = 'ew-resize';
		} else if (onBottomEdge || onTopEdge) {
			pane.style.cursor = 'ns-resize';
		} else if (canMove()) {
			pane.style.cursor = 'move';
		} else {
			pane.style.cursor = 'default';
		}
	}

	animate();

	/**
	* on up control.
	*
	* @param {object}	e  the resizer element.
	*/
	function onUp(e) {
		calc(e);

		if (clicked && clicked.isMoving) {
			// Snap
			var snapped = {
				width: b.width,
				height: b.height
			};

			hintHide();

		}
		clicked = null;
	}
}﻿
// async-fetch
/**
 * Async fetch implementation.
 */
class AsyncFetch {

	/**
     * Async fetch implementation.
     */
	constructor() {
	}

	/**
	 * Upload a file to the URL with a general response from a fetch API request.
	 *
	 * @param {File}	file   the file.
	 * @param {string}	filename   the file name.
	 * @param {string}	url   the url.
	 * @param {Function}	resultAction   the result function.
	 * @param {Function}	errorAction   the error function.
	 *
	 * @example
	 *	uploadFile(
	 *		File,
	 *		'filename.zip',
	 *		'https://domain/api/1',
	 *		function(data) { ... },
	 *		function(error) { ... }
	 *  );
	 */
	uploadFile(file, filename, url, resultAction, errorAction) {

		// create the form data.
		let formData = new FormData();
		formData.append(filename, file);

		// make the request.
		fetch(url, { method: "POST", body: formData })
			.then(this.responseAction)
			.then(resultAction)
			.catch(errorAction);
	}

	/**
	 * Download a file from the URL with a blob response from a fetch API request.
	 *
	 * @param {string}	url   the url.
	 * @param {object}	config   the configuration object.
	 * @param {Function}	resultAction   the result function.
	 * @param {Function}	errorAction   the error function.
	 *
	 * @example
	 *	downloadFile(
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
	downloadFile(url, config, resultAction, errorAction) {
		// make the request.
		fetch(url, config)
			.then(this.responseAction)
			.then(this.blobResponse)
			.then(resultAction)
			.catch(errorAction);
	}

	/**
	* ArrayBuffer response from a fetch API request.
	*
	* @param {Response}	response   the fetch API response.
	* @return {Promise}	the promise interface.
	*/
	arrayResponse(response) {
		// return the promise.
		return response.arrayBuffer();
	}

	/**
	 * Blob response from a fetch API request.
	 *
	 * @param {Response}	response   the fetch API response.
	 * @return {Promise}	the promise interface.
	 */
	blobResponse(response) {
		// return the promise.
		return response.blob();
	}

	/**
	 * form data response from a fetch API request.
	 *
	 * @param {Response}	response   the fetch API response.
	 * @return {Promise}	the promise interface.
	 */
	formResponse(response) {
		// return the promise.
		return response.formData();
	}

	/**
	 * text response from a fetch API request.
	 *
	 * @param {Response}	response   the fetch API response.
	 * @return {Promise}	the promise interface.
	 */
	textResponse(response) {
		// return the promise.
		return response.text();
	}

	/**
	 * json response from a fetch API request.
	 *
	 * @param {Response}	response   the fetch API response.
	 * @return {Promise}	the promise interface.
	 */
	jsonResponse(response) {
		// return the promise.
		return response.json();
	}

	/**
	 * Response action from a fetch API request.
	 *
	 * @param {Response}	response   the fetch API response.
	 * @return {Promise}	the promise interface; either the response or the error message.
	 */
	responseAction(response) {
		// if successful request.
		if (response.status >= 200 && response.status < 300) {
			// return the promise response.
			return Promise.resolve(response);
		}
		else {
			// return the promise with error.
			return Promise.reject(new Error(response.statusText));
		}
	}

	/**
	 * Make a request with a general response from a fetch API request.
	 *
	 * @param {string}	url   the url.
	 * @param {object}	config   the configuration object.
	 * @param {Function}	resultAction   the result function.
	 * @param {Function}	errorAction   the error function.
	 *
	 * @example
	 *	generalRequest(
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
	generalRequest(url, config, resultAction, errorAction) {
		// make the request.
		fetch(url, config)
			.then(this.responseAction)
			.then(resultAction)
			.catch(errorAction);
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
		// make the request.
		fetch(url, config)
			.then(this.responseAction)
			.then(this.jsonResponse)
			.then(resultAction)
			.catch(errorAction);
	}

	/**
	 * Make a request with a form data response from a fetch API request.
	 *
	 * @param {string}	url   the url.
	 * @param {object}	config   the configuration object.
	 * @param {Function}	resultAction   the result function.
	 * @param {Function}	errorAction   the error function.
	 *
	 * @example
	 *	formRequest(
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
	formRequest(url, config, resultAction, errorAction) {
		// make the request.
		fetch(url, config)
			.then(this.responseAction)
			.then(this.formResponse)
			.then(resultAction)
			.catch(errorAction);
	}

	/**
	 * Make a request with a blob response from a fetch API request.
	 *
	 * @param {string}	url   the url.
	 * @param {object}	config   the configuration object.
	 * @param {Function}	resultAction   the result function.
	 * @param {Function}	errorAction   the error function.
	 *
	 * @example
	 *	blobRequest(
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
	blobRequest(url, config, resultAction, errorAction) {
		// make the request.
		fetch(url, config)
			.then(this.responseAction)
			.then(this.blobResponse)
			.then(resultAction)
			.catch(errorAction);
	}

	/**
	 * Make a request with a array response from a fetch API request.
	 *
	 * @param {string}	url   the url.
	 * @param {object}	config   the configuration object.
	 * @param {Function}	resultAction   the result function.
	 * @param {Function}	errorAction   the error function.
	 *
	 * @example
	 *	arrayRequest(
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
	arrayRequest(url, config, resultAction, errorAction) {
		// make the request.
		fetch(url, config)
			.then(this.responseAction)
			.then(this.arrayResponse)
			.then(resultAction)
			.catch(errorAction);
	}

	/**
	 * Make a request with a text response from a fetch API request.
	 *
	 * @param {string}	url   the url.
	 * @param {object}	config   the configuration object.
	 * @param {Function}	resultAction   the result function.
	 * @param {Function}	errorAction   the error function.
	 *
	 * @example
	 *	textRequest(
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
	textRequest(url, config, resultAction, errorAction) {
		// make the request.
		fetch(url, config)
			.then(this.responseAction)
			.then(this.textResponse)
			.then(resultAction)
			.catch(errorAction);
	}
}﻿
// lake-utils
/**
* Get the current local date.
*
* @return {string}	the local date (2019-10-29).
*/
function getLocalDate() {

	var now = new Date();
	var month = now.getMonth() + 1;
	var day = now.getDate();

	if (month < 10)
		month = "0" + month;

	if (day < 10)
		day = "0" + day;

	// Convert
	var today = now.getFullYear() + '-' + month + '-' + day;
	return today;
}

/**
* Get the current local time.
*
* @return {string}	the local date (09:50:48).
*/
function getLocalTime() {

	var now = new Date();
	var hours = addZero(now.getHours());
	var minutes = addZero(now.getMinutes());
	var seconds = addZero(now.getSeconds());

	var todayTime = hours + ":" + minutes + ":" + seconds;
	return todayTime;
}

/**
* Add zero to the start time.
*
* @param {number}	i   the current value to add zero to.
* @return {string}	the prefixed 0.
*/
function addZero(i) {
	if (i < 10) {
		i = "0" + i;
	}
	return i;
}

/**
* Get the cookie.
*
* @param {string}	name   the cookie name.
* @return {object}	the cookie object.
*/
function getCookie(name) {

	var v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
	return v ? v[2] : null;
}

/**
* Set the cookie.
*
* @param {string}	name   the cookie name.
* @param {string}	value   the cookie value.
* @param {number}	days   the number of days the cookie expires.
*/
function setCookie(name, value, days) {

	var d = new Date();
	d.setTime(d.getTime() + 24 * 60 * 60 * 1000 * days);
	document.cookie = name + "=" + value + ";path=/;expires=" + d.toGMTString();
}

/**
* Delete the cookie.
*
* @param {string}	name   the cookie name.
*/
function deleteCookie(name) {
	setCookie(name, '', -1);
}

/**
* Merge two objects.
*
* @param {object}	obj1   the first object.
* @param {object}	obj2   the second object.
* @return {object}	the merged object.
*/
function mergeObjects(obj1, obj2) {

	let item;
	let optionsObj1 = obj1 || {};
	let optionsObj2 = obj2 || {};

	// set our config from options
	for (item in optionsObj1) {
		if (optionsObj1.hasOwnProperty(item)) {
			optionsObj2[item] = optionsObj1[item];
		}
	}

	// return the merged objects.
	return optionsObj2;
}

/**
* Detect if Caps Lock is on.
*
* @param {string}	inputElementId   the id of the element to test.
* @param {string}	warningElementid   the id of the element to display a warning in.
*/
function detectCapsLock(inputElementId, warningElementid) {

	// Get the input field
	var input = document.getElementById(inputElementId);

	// Get the warning text
	var text = document.getElementById(warningElementid);

	// When the user presses any key on the keyboard, run the function.
	input.addEventListener("keyup", function (event) {

		// If "caps lock" is pressed, display the warning text
		if (event.getModifierState("CapsLock")) {
			text.style.display = "block";
		} else {
			text.style.display = "none";
		}
	}); 
}

/**
* Copy the text to the clipboard.
*
* @param {string}	inputElementId   the id of the element to copy the text from.
* @return {boolean}	true if the action completed; else false.
*/
function copyTextToClipboard(inputElementId) {

	// Get the text field.
	var copyText = document.getElementById(inputElementId);

	// Select the text field.
	copyText.select();
	copyText.setSelectionRange(0, 99999); // For mobile devices.

	// Copy the text inside the text field.
	return document.execCommand("copy");
}

/**
* Get element in iframe.
*
* @param {string}	iframeElementId   the first object.
* @param {string}	iframeElementTagName   the second object.
* @return {Element}	the iframe element.
*/
function getIframeElement(iframeElementId, iframeElementTagName) {

	var iframe = document.getElementById(iframeElementId);
	var elmnt = iframe.contentWindow.document.getElementsByTagName(iframeElementTagName)[0];
	return elmnt;
}

/**
* Accepts a string value and returns it back with an ellipsis if the string length 
* is greater than the max length specified. Otherwise, return the original string.
* 
* @param {string}	str   the string to test.
* @param {number}	max   the max string to return.
* @return {string}	the sub-string.
 */
function summarize(str, max) {

	if (str.length <= max)
		return str;

	const subString = str.substring(0, max - 1);
	return subString.substring(0, subString.lastIndexOf(" ")) + "...";
}

/**
* Accepts a string value and returns it back with an ellipsis if the string length
* is greater than the max length specified. Otherwise, return the original string.
*
* @param {Array}	arr   the array og objects.
* @param {string}	key   the key name in the array.
* @return {Array}	the grouped array.
 */
function groupArrayByKey(arr, key) {

	return arr.reduce((acc, i) => {
		(acc[i[key]] = acc[i[key]] || []).push(i);
		return acc;
	}, {});
}

/**
* Reverse the string.
*
* @param {string}	s   the string to reverse.
* @return {string}	the reversed string.
*/
function reverseString(s) {
	return s.split('').reverse().join('');
}

/**
* Convert decimal to binary.
*
* @param {string}	dec   the decimal.
* @return {string}	the binary.
*/
function decToBin(dec) {
	return baseConvert(dec, 10, 2); // parseInt(dec, 10).toString(2)
}

/**
* Convert binary to decimal.
*
* @param {string}	bin   the binary.
* @return {string}	the decimal.
*/
function binTDec(bin) {
	return baseConvert(bin, 2, 10); // parseInt(bin, 2)
}

/**
* Convert decimal to hexadecimal.
*
* @param {string}	dec   the decimal.
* @return {string}	the hexadecimal.
*/
function decToHex(dec) {
	return baseConvert(dec, 10, 16); // parseInt(dec, 10).toString(16)
}

/**
* Convert hexadecimal to decimal.
*
* @param {string}	hex   the hexadecimal.
* @return {string}	the decimal.
*/
function hexToDec(hex) {
	return baseConvert(hex, 16, 10); // parseInt(hex, 16)
}

/**
* Convert function.
*
* @param {string}	num   the value.
* @param {string}	b1   the value.
* @param {string}	b2   the value.
* @return {string}	the decimal.
*/
function baseConvert(num, b1, b2) {
	return parseInt(num, b1).toString(b2);
}

/**
* Convert ASCII to binary.
*
* @param {string}	ascii   the ASCII.
* @return {string}	the binary.
*/
function asciiToBin(ascii) {
	if (ascii.length === 0) return;
	var bin = '';
	for (var i = 0; i < ascii.length; i++) {
		bin += ('00000000' + ascii.charCodeAt(i).toString(2)).slice(-8);
	}
	return bin;
}

/**
* Convert ASCII to hexadecimal.
*
* @param {string}	ascii   the ASCII.
* @return {string}	the hexadecimal.
*/
function asciiToHex(ascii) {
	if (ascii.length === 0) return;
	var hex = '';
	for (var i = 0; i < ascii.length; i++) {
		hex += ('0000' + ascii.charCodeAt(i).toString(16)).slice(-4);
	}
	return hex;
}

/**
* Convert hexadecimal to ASCII.
*
* @param {string}	hex   the hexadecimal.
* @return {string}	the ASCII.
*/
function hexToAscii(hex) {
	hex = hex.match(/[0-9A-Fa-f]{4}/g);
	if (hex.length === 0) return;
	var ascii = '';
	for (var i = 0; i < hex.length; i++) {
		ascii += String.fromCharCode(parseInt(hex[i], 16));
	}
	return ascii;
}

/**
* Convert ASCII to base64.
*
* @param {string}	dec   the ASCII.
* @return {string}	the base64.
*/
function asciiToBase64(dec) {
	return btoa(dec);
}

/**
* Convert base64 to ASCII.
*
* @param {string}	num   the base64.
* @return {string}	the ASCII.
*/
function base64ToAscii(num) {
	return atob(num);
}﻿
// popup-chat