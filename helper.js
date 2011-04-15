/**
 * Adds an empty() method to strings.
 * @returns {Boolean}
 */
String.prototype.empty = function() {
	return this.length == 0;
};

/**
 * Asks the user for input. Optional parameters may be ignored or be null.
 * @param description The description for the text to be entered.
 * @param defaultValue A default value (optional).
 * @param validator A function that validates the input (optional), e.g. <code>function(s) { return true; }</code>.
 * @param errorMessage A message to display if the value was not correct (optional).
 * @returns string
 */
function promptSecure(description, defaultValue, validator, errorMessage) {
	var firstRun = true;
	var s;
	
	if (typeof defaultValue == "undefined" || defaultValue == null) {
		defaultValue = "";
	}
	
	// no validator present
	if (typeof validator != "function") {
		s = prompt(description + (defaultValue.empty() ? "" : " (default: "+defaultValue+")"));
		if (s == null || s.empty()) {
			s = defaultValue;
		}
		return s;
	}
	
	// validator present
	do {
		if (!firstRun && typeof errorMessage != "undefined" && errorMessage != null) {
			s = prompt(description + (defaultValue.empty() ? "" : " (default: "+defaultValue+")") + "\n"+errorMessage);
			if (s == null || s.empty()) {
				s = defaultValue;
			}
		} else {
			s = prompt(description + (defaultValue.empty() ? "" : " (default: "+defaultValue+")"));
			if (s == null || s.empty()) {
				s = defaultValue;
			}
			firstRun = false;
		}
	} while (!validator(s));
	return s;
}