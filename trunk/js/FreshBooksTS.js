// Copyright (c) 2008 2ndSite Inc. (www.freshbooks.com)
// Licenced under the MIT license (see MITLICENSE.txt).

com.freshbooks.api.UA = "FreshBooks Google Chrome Extension 0.1";
	var bgpage = chrome.extension.getBackgroundPage();
	var debug = true; 
	var xmlTimeout = 15 * 1000; // Wait this many milliseconds for FreshBooks to reply before cancelling an XML call.

	function gotofreshbooks() {
		
		window.open("https://" + $("#logon_url").value + ".freshbooks.com");
	}

	function updateProjects(){

		bgpage.refreshCallback = function(){populateProjects();};
		bgpage.loadProjects();
	}
	
	function populateProjects()
	{
		// Get our combo box
		var pr = $("#Projects")[0];

		// Clear all previous values
		pr.options.length = 0;
		
		var sortedList = [];

		for (var id in bgpage.myProjects) {
			sortedList.push({"id":id,"name":bgpage.myProjects[id].name});
		}
		sortedList.sort(com.freshbooks.api.sortproject);
		
		// Add the new items
		for (var i in sortedList)
		{
			//if (debug) alert("Adding " + sortedList[i].id + " '" + sortedList[i].name + "'");
			pr.options[i] = new Option(sortedList[i].name, sortedList[i].id);
		}

		setTasksFromProject();
	}

	function setTasksFromProject(event) {
		// Set the Tasks combo box based on the currently-selected value of the Project combo box
		var projects = $("#Projects")[0];
		var tasks = $("#Tasks")[0];
		
		//while (tasks.length > 0) tasks.remove(0);
		tasks.options.length = 0;
		
		var taskList = bgpage.myProjects[projects.options[projects.selectedIndex].value].tasks;
		
		var sortedList = [];
		for (var tid in taskList) {
			sortedList.push({"id":tid,"name":taskList[tid].name});
		}
		sortedList.sort(com.freshbooks.api.sorttask);

		for (var i in sortedList)
		{
			tasks.options[i] = new Option(sortedList[i].name, sortedList[i].id);
		}

		return true;
	}

	function validateLogin(login) {
		if (login.length == 0 || login.search(/[^a-zA-Z0-9-]/) > -1) return false;
		return true;
	}
	function validateToken(token) {
		if (token.length != 32 || token.search(/[^a-f0-9]/) > -1) return false;
		return true;
	}

	function errorLoading(list) {
		if (debug) console.log(list);
		if (list.status.text == "Timeout") {
			alert("Connection timed out.  Check your password!");
		} else if (list.status.text == "HTTP status 400") {
			alert("Check your login and/or password!");
		} else if (list.status.text == "HTTP status 404") {
			alert("Check your login!");
		} else {
			alert(list.status.text);
		}
	}

	//
	// Function: formatTwoDigits(number)
	// Format a number as one or two digits with a leading zero if needed
	//
	// number: The number to format
	//
	// Returns the formatted number as a string.
	//
	function formatTwoDigits(number)
	{
	    var digits = number.toString(10);

	    // Add a leading zero if it's only one digit long
	    if (digits.length == 1) {
	        digits = "0" + digits;
	    }
	    
	    return digits;
	}
	
	//
	// Provide fade effects for status lines.
	// (id of status text div,
	//  message to display,
	//  [whether you want it to fade in or just *bam*
	//   [, how long it should stay on the screen]])
	var setStatus = (function () {
		var timeoutSet = {};
		return function (which,msg,instant,timeout) {
			tag = "#"+which;
			instant = instant || false;
			timeout = timeout || 3000; // Default to 5 seconds
			// New effect now, so cancel whatever was happening before.
			$(tag).queue("fx",[]);
			if (timeoutSet[which]) {
				// Cancel any previous things we had queued
				clearTimeout(timeoutSet[which]);
				// Fade out current content before fading in the new stuff
				if (!instant) $(tag).fadeOut();
			}
			$(tag).queue(function(){
				if (instant) $(tag).css("display","block");
				else $(tag).css("display", "none").fadeIn();
				$(tag)[0].innerHTML = msg;
				$(tag).dequeue();
				});
			timeoutSet[which] = setTimeout(
				function () {
					$(tag).fadeOut();
					timeoutSet[which] = null;
				},timeout);
		};
	})();
	

	