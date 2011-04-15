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
	$('button.clear').live('click', function(event){
		$(this).hide();
		$(this).parent('div').children('div.item').remove();
	});
	
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
	$('button[name="compute-get"]').live('click', function(event){
		if ($(this).parents('div#resources').size() == 0) {
			// GET all resources
			occiRequest("GET", "/compute/", ["Accept: text/plain"], null, function(data, status, xhr) {
				$('div#resources-compute div.item').remove();
				jQuery.each(data.split(","), function(index, item){
					if (jQuery.trim(item).empty()) {
						return;
					}
					$('div#resources-compute').append(
						'<div class="item"><span class="link">'+item+'</span> ' +
						'<span class="item-actions"><button name="compute-get">GET</button> ' +
						'<button disabled="disabled" class="locked">PUT</button> ' +
						'<button disabled="disabled" class="locked">DELETE</button></span></div>'
					);
				});
				if ($('div#resources-compute div.item').size() > 0) {
					$('div#resources-compute button.clear').show();
				} else {
					$('div#resources-compute button.clear').hide();
				}
			});
		} else {
			// GET a specific resource
			occiRequest("GET", $(this).parents('div.item').children('span.link').text(), ["Accept: text/plain"]);
		}
	});
	$('button[name="compute-post"]').click(function(event){
		// ask for data
		// TODO: validate input 
		var attr = {
			architecture: promptSecure("Architecture", "x86"),
			cores: promptSecure("Cores", "2"),
			speed: promptSecure("Speed", "2.4"),
			hostname: promptSecure("Hostname", "compute-"+new Date().getTime()),
			memory: promptSecure("Memory", "2.0")
		};
		// send request
		occiRequest("POST", "/compute", ["Accept: text/plain", "X-OCCI-Attribute: occi.compute.Category=compute occi.compute.architecture="+attr.architecture+" occi.compute.cores="+attr.cores+" occi.compute.hostname="+attr.hostname+" occi.compute.memory="+attr.memory+" occi.compute.speed="+attr.speed]);
	});
});

/**
 * Sends a request to the OCCI server.
 * @param method
 * @param resource the resource to request, e.g. "/compute"
 * @param headers array of header-strings, e.g. ["Accept: text/plain"]
 * @param data
 * @param callback a callback function to be called after a successful request
 * @returns {Boolean} true if request could be send
 */
function occiRequest(method, resource, headers, data, callback) {
	// clear fields and show loader
	$("div#request pre").text("");
	$("div#response pre").text("");
	$("div#request div.loader").show();
	$("div#response div.loader").show();
	
	// strip occi_root from resource
	if (resource.indexOf(occi_root) == 0) {
		resource = resource.substring(occi_root.length);
	}
	
	// render request
	renderRequest(method, resource, headers, data);
	
	// check if occi_root is a valid URL
	if (occi_root == false) {
		renderResponse("Request could not be send.");
		return false;
	}
	
	// add Content-Type header for POST requests to prevent Bad Request errors
	if (method == "POST" && (typeof data == "undefined" || data == null)) {
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
			if (typeof callback == "function") {
				callback(data, status, xhr);
			}
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