/*
* Copyright 2010 Paul Kinlan.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.

*/

function EventProxy(method, context) {
  return function(e) { method.call(context, e) };
}

var Builder = new (function () {
  
  // The manifest that we are building.
  var manifest = {};
  // A collection of languages and local information.
  var locales = {};
  
  this.start = function(url, successCallback, errorCallback) {        
    // Fetch site information
    clearIconMessage();
    fetch(url, successCallback, errorCallback);
  };
  
  this.parseManifest = function(e) {
    try {
      var manifestData = JSON.parse(e.target.value);
      if(manifestData) {
        if(validateManifest(manifestData)) {
          manifest = manifestData;
          updateUI();
        }
      }
    } catch(error) { 
//// handled error?    
    }
  };
  
  this.toggleOfflineEnabled = function(e) {
    manifest.offline_enabled = offlineEnabledTrue.checked === true;   
    updateUI();
  };
  
   this.togglePermission = function(e) {
    if(e.target.checked) {
      manifest.permissions.push(e.target.id);
    }
    else {
      var idx = manifest.permissions.indexOf(e.target.id);
      manifest.permissions = manifest.permissions.filter(function(i) {
       if(i != e.target.id) return true;
       else return false; 
      });
    }
    
    if (e.target.id === "background" && e.target.checked === false) {
    	delete manifest.background_page;
    }
    
    updateUI();
    var outputElement = document.getElementById("output");
    outputElement.classList.remove("updated");
    setTimeout(function(){outputElement.classList.add("updated")}, 1);
  };
  
   this.toggleRequirement = function(e) {
    if(e.target.checked) {
      manifest.requirements["3D"].features.push(e.target.id); // will need to update...
    }
    else {
      var idx = manifest.requirements["3D"].features.indexOf(e.target.id);
      manifest.requirements["3D"].features = manifest.requirements["3D"].features.filter(function(i) {
       if(i != e.target.id) return true;
       else return false; 
      });
    }        
    updateUI();
    var outputElement = document.getElementById("output");
    outputElement.classList.remove("updated");
    setTimeout(function(){outputElement.classList.add("updated")}, 1);
  };
  
  this.toggleLaunch = function(e) {
    manifest.app.launch.container = e.target.value;  
    updateUI();
  };

  this.dragZip = function(e) {
    e.dataTransfer.setData("DownloadURL", "application/zip:" + manifest.name  +":data:image/png;base64," + Builder.output({"binary": false}));
  };
  
  this.updateLanguages = function() {
    
  };
  
  // Outputs the zip file
  this.output = function(options) {
    var outputImage = document.getElementById("output");
    var zip = new JSZip();
    zip.add("appmator128.png", imageToBase64("128"), {base64: true});
    var formatter = new goog.format.JsonPrettyPrinter();
    zip.add("manifest.json",  formatter.format(JSON.stringify(manifest)));
    
    // Render all the files
    for(var l in locales) {
      zip.add("_locales/"+ l +"/messages.json", localeToText(l))
    }
    
    // output the data.
    
    var data = "";
    data = zip.generate(options.binary);
    
    return data;
  };
  
  // Converts the locale to string.  Could be a seperate local object but no need for now.
  var localeToText = function(locale) {
    return JSON.stringify(locales[locale]);
  }
  
  var iconMessage = function(message) {
  	if (message === "") {
  		message = "<p>&nbsp;</p>"; // !!!hack: to cover file input message
  	}; 
	var el = document.getElementById("iconMessage");
	el.classList.remove("warningPulse"); // so animation occurs every time      
	el.innerHTML = message;
  }
  
  var iconWarning = function(message) {
	iconMessage(message);
	var el = document.getElementById("iconMessage");
	el.classList.remove("warningPulse"); // so animation occurs every time      
	setTimeout(function(){el.classList.add("warningPulse");}, 1);      
  }
  
  var clearIconMessage = function() {
	iconMessage("");      
  }
  
//// change variable name icon to iconSize?
  var imageToBase64 = function(icon) {
    var canvas = document.getElementById("c" + icon);
    
    var data = canvas.toDataURL();
    return data.replace("data:image/png;base64,","");
  };
  
  // Loads an image into a canvas
/// change icon to iconSize?
  var loadImage = function(iconSize,  url) {
    var canvas = document.getElementById("c" + iconSize);
    var context = canvas.getContext("2d");
    var image = new Image();

	if (typeof url === "undefined") {
		context.clearRect(0, 0, canvas.width, canvas.height);
		iconMessage("");
		canvas.style.borderStyle = "dashed"; //
	} else {
		image.src = "/api/image?url=" + url; // Use the proxy so not tainted.
			
		image.addEventListener("load", function() {
			if (this.width != iconSize || this.width != iconSize) {
				canvas.style.borderStyle = "dashed";
				iconWarning("<p>The app icon size should be " + iconSize + "x" + iconSize + 
					"px.</p><p>The retrieved " + this.width + "x" + this.height + "px image has been scaled.</p><p>You may want to select a different image.<p>");
			} else {
				var urlSplit = url.split("/");
				iconMessage("<p>" + urlSplit[urlSplit.length - 1] + "</p>");
				canvas.style.borderStyle = "solid";
			}
			document.getElementById("details").style.display = "block";
			context.drawImage(image, 0, 0, iconSize, iconSize); // rescale the image
		});
	}
    
  };
  
  // Reads an image from the file system
  this.readImage = function(e) {
//// what if other sizes?
    if(e.target.id == "file128") {
      id = "c128";
      size = 128;
    }
    
    var canvas = document.getElementById(id);
    var context = canvas.getContext("2d");
    
    for(var i = 0, file; file=e.target.files[i]; i++) {
      var reader = new FileReader();
      reader.onload = function(evt) {
		var fileType = evt.target.result.substring(5,14);
		if (fileType !== "image/png" && fileType !== "image/jpg" && fileType !== "image/jpe") {
			e.target.value = null;	
			iconWarning("<p>The icon image must be a PNG or JPEG file.</p><p>Please try again.</p>");
			canvas.style.borderStyle = "dashed"; //
			return;
		}
        var img = new Image();        
        img.addEventListener("load", function() {
		context.clearRect(0, 0, size, size);
		if (this.width !== size || this.height !== size) {
			e.target.value = null;	
			iconWarning("<p>The icon image must be " + size + "x" + size + 
				"px. </p><p>The image you selected is " + this.width + "x" + this.height + "px.</p><p>Please try again.</p>");
			canvas.style.borderStyle = "dashed"; //
			return;
		} else {
			clearIconMessage();
			canvas.style.borderStyle = "solid"; //
			document.getElementById("details").style.display = "block";
		}
          context.drawImage(img, 0, 0, size, size); // rescale the image
        });
        
        img.src = evt.target.result;
        
      };
      reader.readAsDataURL(file)
    }
  };
  
  //Build a valid manifest
  var parseInfo = function(inf) {
    manifest.app = {};
    manifest.offline_enabled = false;
    manifest.permissions = [];
    manifest.requirements = {};
    manifest.requirements["3D"] = {}; // will need to change this...
    manifest.requirements["3D"].features = [];
    manifest.app.launch = {};
    manifest.icons = {
      "128": "128.png"
    };
    
    if(inf.name) {
if (inf.name.length > 45) {
	manifest.name = inf.name.substring(0,45);
	//// warning message
} else {
	manifest.name = inf.name;
}
    }
    
/* 
    if(inf.description) {
      manifest.description = inf.description;
    }
 */
 
	manifest.description = inf.description || "";    
    manifest.version = "1.0.0.0"
    manifest.app.launch.urls = inf.urls;
    manifest.app.launch.web_url = inf.web_url
    manifest.app.launch.container = "tab"; // explicitly set to default
    
    // bit of a hack, but works for the moment...
	loadImage(128, inf.icons[128]);
  };
  
  // Validates the manifest.  Making sure all the correct fields are present.
  var validateManifest = function(m) {
    // Required fields: name, version
    if(!!m.name == false) 
      return null;
      
    if(!!m.version == false) 
      return null;
      
    if(!!m.app.launch.web_url == false)
      return null;
    
    // It is valid so return the document.
    return m;
  };
  
  this.updateManifest = function() {
    var name = document.getElementById("name");
    var description = document.getElementById("description");
    var version = document.getElementById("version");
    var offlineEnabledTrue = document.getElementById("offlineEnabledTrue");
    var backgroundPage = document.getElementById("backgroundPage");
    var output = document.getElementById("output");  
   
   	output.classList.remove("updated");
	setTimeout(function(){output.classList.add("updated")}, 1);
    
//// do in one loop?
/*
 var props = ["description", "name", "version", "background_page"]
 for prop in props {
 	var value = document.getElementById(prop).value;
 	if (value == "") {
 		delete manifest[prop];
 	} else {
 		manifest[prop] = value; 
 	}
}
*/
    
    if(name.value == "")
      delete manifest.name;
    else
      manifest.name = name.value;
    
    if(description.value == "")
      delete manifest.description;
    else 
      manifest.description = description.value;
      
    if(version.value == "")
      delete manifest.version
    else
      manifest.version = version.value;
 
	if (backgroundPage.value == "") {
		delete manifest.background_page;	
		manifest.permissions.splice(manifest.permissions.indexOf('background'), 1);
    } else {
		manifest.background_page = backgroundPage.value;
		if (manifest.permissions.indexOf("background") == -1) {
			manifest.permissions.push("background");
		}
	}	
      
	manifest.offline_enabled = offlineEnabledTrue.checked;
    
    renderManifest();
    
    //Save the manifest 
    var output = document.getElementById("output");
    output.href = "data:image/png;base64," + Builder.output({"binary": false});
  }
  
  // Update the UI based on the manifest.
  var updateUI = function() {
  	//// add Element to variable names?
    var app = document.getElementById("app");
    var download = document.getElementById("download");
    var info = document.getElementById("info");
    var name = document.getElementById("name");
    var description = document.getElementById("description");
    var version = document.getElementById("version");
    var launch = document.getElementById("launch");
    
    // Offline Enabled options
    var offlineEnabledFalse = document.getElementById("offlineEnabledFalse");
    var offlineEnabledTrue = document.getElementById("offlineEnabledTrue");
    
    // Permissions
    var permissions = {};
    permissions["geolocation"] = document.getElementById("geolocation");
    permissions["notifications"] = document.getElementById("notifications");
    permissions["unlimitedStorage"] = document.getElementById("unlimitedStorage");
    permissions["background"] = document.getElementById("background");

    // Requirements
    var requirements = {};
    requirements["css3d"] = document.getElementById("css3d");
    requirements["webgl"] = document.getElementById("webgl");

    var background = document.getElementById("background");
    var backgroundPage = document.getElementById("backgroundPage");
    
    // Container type: tab, window or panel
    var launcher = document.getElementById("launcher");
    
    // The url selector
    var urls = document.getElementById("urls");
    
    // Start updating the UI
	//// put these all in one loop (and move definitions from above)?    
    if(manifest.name)
      name.value = manifest.name;
    else 
      name.value = "";
    
    if(manifest.description)
      description.value = manifest.description;
    else 
      description.value = "";
      
    if(manifest.version)
      version.value = manifest.description;	//// ???
   
    version.value = manifest.version; 		//// ???
    launch.value = manifest.app.launch.web_url;
    
    // Add in the urls that belong to the app.
    urls.options = [];
    
    for (var i = urls.options.length-1; i>=0; i--) {
        urls.removeChild(urls.options[i]);
    }
    
    for(var url in manifest.app.launch.urls) {
      var urlString = manifest.app.launch.urls[url];
      var option = new Option(urlString, urlString);
      urls.options.add(option);
    }
    
    // Toggle permissions
    for (var p in permissions) {
        permissions[p].checked = false;
    }
    
    // Toggle requirements
    for (var requirement in requirements) {
        requirements[requirement].checked = false;
    }
    
	if (backgroundPage.value === "") {
		background.checked = false;
	} else {
		background.checked = true;		
	};

    if (manifest.permissions.indexOf("background") == -1) {
		backgroundPage.value = "";
    }
    
    // Select the correct launch type
    if (manifest.offline_enabled === true) {
    	offlineEnabledTrue.checked = true;
    	offlineEnabledFalse.checked = false;
    } else {
    	offlineEnabledTrue.checked = false;
    	offlineEnabledFalse.checked = true;
    };
    
    for (var permission in manifest.permissions) {
      var permName =  manifest.permissions[permission];
      permissions[permName].checked = true;
    }
    
    for (var requirement in manifest.requirements["3D"].features) {
      var requirementName =  manifest.requirements["3D"].features[requirement];
      requirements[requirementName].checked = true;
    }
    
    // Select the correct launch type
    launcher.value = manifest.app.launch.container;
    
/* 
    if(app.classList.contains("visible") == false)
      app.classList.toggle("visible");
      
    if(download.classList.contains("visible") == false)
      download.classList.toggle("visible");

 */
      
    renderManifest();

  };
  
  // Renders the manifest from the information provided.
  var renderManifest = function() {
    // Should simply pretty print the JSON.
    var manifestContainer = document.getElementById("manifest");
    var formatter = new goog.format.JsonPrettyPrinter();
    manifestContainer.value = formatter.format(manifest);
  };
  
  var fetch = function(url, successCallback, failureCallback) {
    var request = new XMLHttpRequest();
    request.open("GET", "/api/fetch?url=" + encodeURI(url), true);
    request.onreadystatechange = function (e) {
      if(request.status == 200 && request.readyState == 4) {
        var object = JSON.parse(request.responseText);
        parseInfo(object);
        updateUI();
        successCallback(object);
      }
      else if(request.status != 200) {
        failureCallback();
      }
    };
    request.send();
  };
})();