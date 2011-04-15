/*
The MIT License

Copyright (c) 2011 Sebastian Herbermann

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/**
 * occi_root contains the URL to the OCCI-API. false if the given URL is invalid.
 */
var occi_root = false;

$(function() {
	/**
	 * Init
	 */
	$('div.loader').hide();
	
	/**
	 * Check OCCI root
	 */
	$('input[name="occi-endpoint"]').keyup(function(data, event) {
		if ($(this).attr('value').match(/^(http|https):\/\/[a-z0-9.]+(:\d+)?(\/.*)?$/i) != null) {
			$(this).removeClass('error');
			if ($(this).attr('value').charAt($(this).attr('value').length - 1) == "/") {
				occi_root = $(this).attr('value').substring(0, $(this).attr('value').length - 1);
			} else {
				occi_root = $(this).attr('value');
			}
		} else {
			$(this).addClass('error');
			occi_root = false;
		}
	});
	
	/**
	 * Query Interface
	 */
	$('button[name="query-get"]').click(function(event){
		occiRequest("GET", "/-/", ["Accept: text/plain"]);
	});
	
	/**
	 * Compute
	 */
	$('button[name="compute-get"]').click(function(event){
		occiRequest("GET", "/compute/", ["Accept: text/plain"]);
	});
	$('button[name="compute-post"]').click(function(event){
		occiRequest("POST", "/compute", ["X-OCCI-Attribute: occi.compute.Category=compute occi.compute.architecture=x86 occi.compute.cores=2 occi.compute.hostname=test occi.compute.memory=2.0 occi.compute.speed=2.4"]);
	});
});

/**
 * Sends a request to the OCCI server.
 * @param method
 * @param resource the resource to request, e.g. "/compute"
 * @param headers array of header-strings, e.g. ["Accept: text/plain"]
 * @param data
 * @returns {Boolean} true if request could be send
 */
function occiRequest(method, resource, headers, data) {
	// clear fields and show loader
	$("div#request pre").text("");
	$("div#response pre").text("");
	$("div#request div.loader").show();
	$("div#response div.loader").show();
	
	// render request
	renderRequest(method, resource, headers, data);
	
	// check if occi_root is a valid URL
	if (occi_root == false) {
		renderResponse("Request could not be send.");
		return false;
	}
	
	// add Content-Type header for POST requests to prevent Bad Request errors
	if (method == "POST" && typeof data == "undefined") {
		headers.push("Content-Type: text/plain");
	}
	
	// make request
	$.ajax(occi_root + resource, {
		type: method,
		data: data,
		beforeSend: function(xhr, settings) {
			if (headers != null) {
				for (var i in headers) {
					var name = $.trim(headers[i].substring(0, headers[i].indexOf(":")));
					var value = $.trim(headers[i].substring(headers[i].indexOf(":")+1));
					xhr.setRequestHeader(name, value);
				}
			}
		},
		error: function(xhr, status, error) {
			// The xhr.status will be zero if something is wrong.
			if (xhr.status == 0) {
				renderResponse("The server did not respond as expected.");
			} else {
				renderResponse("", status, xhr);
			}
		},
		success: function(data, status, xhr) {
			renderResponse(data, status, xhr);
		}
	});
	return true;
}

/**
 * Renders the request.
 * @param method
 * @param resource
 * @param headers
 * @param data
 */
function renderRequest(method, resource, headers, data) {
	$("div#request div.loader").hide();
	if (occi_root == false) {
		$("div#request pre").text("Invalid OCCI root URL.");
		return;
	}
	var request = 
		method + " " + resource + " HTTP/1.1 \n" +
		"Host: " + occi_root.substring(occi_root.indexOf(":") + 3) + "\n";
	for (var i in headers) {
		request = request + headers[i] + " \n";
	}
	if (typeof data != "undefined" && data != null) {
		request = 
			request + "Content-Type: application/x-www-form-urlencoded \n" + 
			"Content-Length: " + data.length + "\n" + 
			"\n" + 
			data  + "\n";
	}
	$("div#request pre").text(request);
}

/**
 * Renders the response. If only data is given, this can be used to display a simple message, e.g. <code>renderResponse("Message");</code>.
 * @param data
 * @param status
 * @param xhr
 */
function renderResponse(data, status, xhr) {
	$("div#response div.loader").hide();
	
	if (typeof status == "undefined") {
		$("div#response pre").text(data);
		return;
	}
	
	var response =
		"HTTP/1.1 " + xhr.status + " " + getHttpStatusText(xhr.status) + "\n" +
		xhr.getAllResponseHeaders() +
		"\n" +
		data;
	$("div#response pre").text(response);
}

/**
 * Converts the given HTTP status to the textual representation. Returns an empty string for invalid statuses.
 * @param status
 * @returns {String}
 */
function getHttpStatusText(status) {
	switch (status) {
		case 100: return "Continue";
		case 101: return "Switching Protocols";
		case 102: return "Processing";
		case 122: return "Request-URI too long";
		case 200: return "OK";
		case 201: return "Created";
		case 202: return "Accepted";
		case 203: return "Non-Authoritative Information";
		case 204: return "No Content";
		case 205: return "Reset Content";
		case 206: return "Partial Content";
		case 207: return "Multi-Status";
		case 226: return "IM Used";
		case 300: return "Multiple Choices";
		case 301: return "Moved Permanently";
		case 302: return "Found";
		case 303: return "See Other";
		case 304: return "Not Modified";
		case 305: return "Use Proxy";
		case 306: return "Switch Proxy";
		case 307: return "Temporary Redirect";
		case 400: return "Bad Request";
		case 401: return "Unauthorized";
		case 402: return "Payment Required";
		case 403: return "Forbidden";
		case 404: return "Not Found";
		case 405: return "Method Not Allowed";
		case 406: return "Not Acceptable";
		case 407: return "Proxy Authentication Required";
		case 408: return "Request Timeout";
		case 409: return "Conflict";
		case 410: return "Gone";
		case 411: return "Length Required";
		case 412: return "Precondition Failed";
		case 413: return "Request Entity Too Large";
		case 414: return "Request-URI Too Long";
		case 415: return "Unsupported Media Type";
		case 416: return "Requested Range Not Satisfiable";
		case 417: return "Expectation Failed";
		case 418: return "I'm a teapot";
		case 422: return "Unprocessable Entity";
		case 423: return "Locked";
		case 424: return "Failed Dependency";
		case 425: return "Unordered Collection";
		case 426: return "Upgrade Required";
		case 444: return "No Response";
		case 449: return "Retry With";
		case 450: return "Blocked by Windows Parental Controls";
		case 499: return "Client Closed Request";
		case 500: return "Internal Server Error";
		case 501: return "Not Implemented";
		case 502: return "Bad Gateway";
		case 503: return "Service Unavailable";
		case 504: return "Gateway Timeout";
		case 505: return "HTTP Version Not Supported";
		case 506: return "Variant Also Negotiates";
		case 507: return "Insufficient Storage";
		case 509: return "Bandwidth Limit Exceeded";
		case 510: return "Not Extended";
	}
	return "";
}