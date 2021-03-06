/*jslint eqeqeq: true, undef: true */
/*global document, TouchLayer_Controller, setTimeout, clearTimeout */
/*
 * Borrows Heavily from Sencha Touch v1.1.1 Tap.js
 * @author andyjamesdavies
 * @created 2012-02-06 
 */
var TouchLayer_TapController = function (options) {

	if (!options.eventName || !options.el || !options.callback) {
		return;
	}

	var mainController = new TouchLayer_Controller(),
	runOnBubble = false,
	preventSingleTap = false,
	singleTapThreshold = 400,
	doubleTapThreshold = 800,
	holdThreshold = 1000,
	cancelThreshold = 10,
	lastTapTime = null,
	timeout = null,
	startX = null,
	startY = null,
	touchCancelled = false,
	preventDefault = true;
	
	if (options.preventDefault !== undefined) {
		preventDefault = options.preventDefault;
	}

	var fireTapEvent = function (e) {

		if (options.eventName === 'tap') {
			var data = mainController.makeReturnData(e, options.el);
			mainController.fire('tap', options.callback, data);
		}

		if (e.event) {
			e = e.event;
		}

		var currTarget = (e.changedTouches ? e.changedTouches[0] : e).target;

		if (!currTarget.disabled && this.fireClickEvent) {
			var clickEvent = document.createEvent("MouseEvent");
			clickEvent.initMouseEvent('click', e.bubbles, e.cancelable, document.defaultView, e.detail, e.screenX, e.screenY, e.clientX,
					e.clientY, e.ctrlKey, e.altKey, e.shiftKey, e.metaKey, e.metaKey, e.button, e.relatedTarget);
			clickEvent.isSimulated = true;

			currTarget.dispatchEvent(clickEvent);
		}
	};

	var isCancel = function (e) {

		var ePageX = 0,
			ePageY = 0;
		if (e.touches !== undefined) {
			ePageX = e.touches[0].pageX;
			ePageY = e.touches[0].pageY;
		} else if (e.pageX && e.pageY) {
			ePageX = e.pageX;
			ePageY = e.pageY;
		}
		
		return (
				Math.abs(ePageX - startX) >= cancelThreshold ||
				Math.abs(ePageY - startY) >= cancelThreshold
		);
	};

	var onTouchStart = function (e) {

		if (e.originalEvent) {
			e = e.originalEvent;
		}

		if (preventDefault) {
			e.preventDefault();
			e.stopPropagation();		
		}
		
		if (e.touches !== undefined) {
			startX = e.touches[0].pageX;
			startY = e.touches[0].pageY;
		} else if (e.pageX && e.pageY) {
			startX = e.pageX;
			startY = e.pageY;
		}
		touchCancelled = false;

		if (options.eventName === 'tapstart') {
			var data = mainController.makeReturnData(e, options.el);
			mainController.fire('tapstart', options.callback, data);
		}

		if (options.eventName === 'taphold') {
			timeout = setTimeout(function () {
				var data = mainController.makeReturnData(e, options.el);
				mainController.fire('taphold', options.callback, data);
				timeout = null;
			}, holdThreshold);            
		}
	};

	var onTouchMove = function (e) {

		if (e.originalEvent) {
			e = e.originalEvent;
		}
		
		if (preventDefault) {
			e.preventDefault();
			e.stopPropagation();		
		}

		if (isCancel(e) && !touchCancelled && ((startX + startY) > 0)) {
			if (options.eventName === 'tapcancel') {
				var data = mainController.makeReturnData(e, options.el);
				mainController.fire('tapcancel', options.callback, data);
			}
			if (timeout) {
				clearTimeout(timeout);
				timeout = null;
			}
			touchCancelled = true;
		}
	};

	var onTouchEnd = function (e) {
		if (e.originalEvent) {
			e = e.originalEvent;
		}
		
		if (preventDefault) {
			e.preventDefault();
			e.stopPropagation();		
		}
		
		if (!touchCancelled) {

			fireTapEvent(e);

			if (lastTapTime && e.timeStamp - lastTapTime <= doubleTapThreshold) {
				lastTapTime = null;
				
				if (options.eventName === 'doubletap') {
					var dataDbl = mainController.makeReturnData(e, options.el);
					mainController.fire('doubletap', options.callback, dataDbl);
				}
			} else {
				lastTapTime = e.timeStamp;
			}

			if (singleTapThreshold && !preventSingleTap) {
				if (options.eventName === 'singletap') {
					var dataSgl = mainController.makeReturnData(e, options.el);
					mainController.fire('singletap', options.callback, dataSgl);
				}
				preventSingleTap = true;
				setTimeout(function () {
					preventSingleTap = false;
				}, singleTapThreshold);
			}

			if (timeout) {
				clearTimeout(timeout);
				timeout = null;
			}
		}
		touchCancelled = true; //stops mouse move unnecessarily firing tapcancel
	};

	mainController.bind(options.el, 'touchstart', onTouchStart, runOnBubble);
	mainController.bind(options.el, 'touchmove', onTouchMove, runOnBubble);
	mainController.bind(options.el, 'touchend', onTouchEnd, runOnBubble);
	
	return {
		unbind: function  () {
			mainController.unbind(options.el, 'touchstart', onTouchStart);
			mainController.unbind(options.el, 'touchmove', onTouchMove);
			mainController.unbind(options.el, 'touchend', onTouchEnd);
		}
	};
};
