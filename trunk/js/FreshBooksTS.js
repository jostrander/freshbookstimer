// Copyright (c) 2008 2ndSite Inc. (www.freshbooks.com)
// Licenced under the MIT license (see MITLICENSE.txt).

	com.freshbooks.api.UA = "Project Timer";
	var bgpage = chrome.extension.getBackgroundPage();
	var debug = false; 
	var xmlTimeout = 15 * 1000; // Wait this many milliseconds for FreshBooks to reply before cancelling an XML call.

	function gotofreshbooks() {
		
		window.open("https://" + $("#logon_url").value + ".freshbooks.com");
	}

	function updateProjects(){

		bgpage.refreshCallback = function(){populateClients();};
		bgpage.loadClients();
		bgpage.loadProjects();
	}
	
	function populateClients()
	{
		// Get our combo box
		var cl = $("#Clients")[0];

		// Clear all previous values
		cl.options.length = 0;
		
		var sortedList = [];

		for (var id in bgpage.myClients) {
			sortedList.push({"id":id,"organization":bgpage.myClients[id].organization});
		}
		sortedList.sort(com.freshbooks.api.sortclient);
		
		// Need a fake "Internal" client to load internal projects 
		cl.options[0] = new Option("Internal", "internal");		// Add the new items
		
		for (var i in sortedList)
		{
			//if (debug) alert("Adding " + sortedList[i].id + " '" + sortedList[i].name + "'");
			cl.options[1 * i+1] = new Option(sortedList[i].organization, sortedList[i].id);
			
		}

		setProjectsFromClient();
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

	function setProjectsFromClient()
	{
		// Get our combo box
		var clientId = $("#Clients")[0].value;
		var pr = $("#Projects")[0];

		console.log("Loading projects for client id: " + clientId);
		if (clientId == "internal") clientId = "";
		
		// Clear all previous values
		pr.options.length = 0;
		
		var sortedList = [];

		for (var id in bgpage.myProjects) {
			if (bgpage.myProjects[id].client_id == clientId){
				sortedList.push({"id":id,"name":bgpage.myProjects[id].name});
			}
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
	
	function submitHours(time)
	{
	    var login = "";
		var token = "";

		if (localStorage.getItem("com.yogs.chrome.freshbooks.login_key") != null &&
				localStorage.getItem("com.yogs.chrome.freshbooks.login_key") != ""){
			token = localStorage.getItem("com.yogs.chrome.freshbooks.login_key");
		}
		if (localStorage.getItem("com.yogs.chrome.freshbooks.logon_url") != null &&
				localStorage.getItem("com.yogs.chrome.freshbooks.logon_url") !=""){
			login = localStorage.getItem("com.yogs.chrome.freshbooks.logon_url");
		}

		if (!validateLogin(login)) { alert("Invalid login"); return false; }
		if (!validateToken(token)) { alert("Invalid token"); return false; }
		
		var r = com.freshbooks.api.GetXMLHttpRequest(login, token, true);
	
		// Read Project
		var projectId = $("#Projects")[0].value;
	
		// Read Task
		var taskId = $("#Tasks")[0].value;
		if (taskId == "") {
			setStatus("status_1","You need to select a task");
			return false;
		}
	
		// Notify user that we're posting
		disableProjectsAndTasks();
		$("#submit")[0].disabled = true;
	
		function enableInputs() {
			enableProjectsAndTasks();
			$("#submit")[0].disabled = false;
		};
	
		var entryCreateTimeout = setTimeout( function () {
				alert( "Timed out. :(");
				r.abort();
				enableInputs();
				entryCreateTimeout = null;
			}, xmlTimeout);
	
		// Notify the user when we're done posting
		r.onreadystatechange = function () {
			if (r.readyState == 4 && r.status == 200)
			{
				if (entryCreateTimeout)
				{
					clearTimeout(entryCreateTimeout);
					entryCreateTimeout = null;
				}
				
				if (com.freshbooks.api.getResponseStatus(r.responseXML) == "ok") {
					enableInputs();
					
					reset();
					bgpage.reset();
	
					setStatus("status_1", "Hours submitted!");
					//$("#Notes")[0].value = "";
				} else {
					enableInputs();
					setStatus("status_1", $("error",r.responseXML).text());
				}
			}
		};
	
		var d = new Date();
		// Post hours
		r.send(com.freshbooks.api.Request("time_entry.create",
			{
				time_entry: {
					project_id: projectId,
					task_id: taskId,
					hours: time,
					notes: "",
					date: (""+d.getFullYear()+"-"+formatTwoDigits(d.getMonth()+1)+"-"+formatTwoDigits(d.getDate()))
				}
			}));
	}
	
	function getRoundedHours(minutes){
		var round, hours;
		
		if (debug) console.log("getRoundedHours::minutes=" + minutes );
		
		if (localStorage.getItem("com.yogs.chrome.freshbooks.round_time")!=null &&
				localStorage.getItem("com.yogs.chrome.freshbooks.round_time")!=""){
			round = localStorage.getItem("com.yogs.chrome.freshbooks.round_time");
		}

		if (debug) console.log("getRoundedHours::round=" + round );

		if (round == 0){
			hours = minutes/60;
		} else {
			if (debug) console.log("getRoundedHours::Mod=" + mod(Number(round) - Number(minutes), Number(round)));

			hours = (minutes +  mod(Number(round) - Number(minutes), Number(round)))/60;			
		}

		if (debug) console.log("getRoundedHours::hours=" + hours );

		return hours;
	}

	function disableProjectsAndTasks(){
		$("#Clients")[0].disabled    = true;
		$("#Projects")[0].disabled    = true;
		$("#Tasks")[0].disabled       = true;
	}
	function enableProjectsAndTasks(){
		$("#Clients")[0].disabled    = false;
		$("#Projects")[0].disabled    = false;
		$("#Tasks")[0].disabled       = false;
	}
	
	function mod(x, m) {
	    var r=x%m;	    
	    return r<0 ? r+m : r;
	}
	