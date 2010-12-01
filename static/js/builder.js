function EventProxy(method, context) {
  return function(e) { method.call(context, e) };
}

var Builder = new (function () {
  
  // The manifest that we are building.
  var manifest = {};
  
  this.start = function(e) {
    var url = document.getElementById("url");
    
    // Fetch Site information
    fetch(url.value);
  };
  
  this.parseManifest = function(e) {
    try {
      var manifestData = JSON.parse(e.target.textContent);
      if(manifestData) {
        if(validateManifest(manifestData)) {
          manifest = manifestData;
          updateUI();
        }
      }
      
    } catch(error) { 
    
    }
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
    
    updateUI();
  };
  
  this.dropImage = function(e) {
    
  };
  
  // Validate that the image is the correct dimension
  this.validateImage = function(e) {
    
  };
  
  //
  this.dragZip = function(e) {
    e.dataTransfer.setData("DownloadURL", "application/zip:" + manifest.name  +":data:image/png;base64," + Builder.output());
  };
  
  // Outputs the zip file
  this.output = function() {
    var outputImage = document.getElementById("output");
    var zip = new JSZip();
    zip.add("16.png", imageToBase64("16"), {base64: true});
    zip.add("128.png", imageToBase64("128"), {base64: true});
    zip.add("manifest.json", JSON.stringify(manifest));
    
    // output the data.
    this.data = zip.generate();
    return this.data;
  };
  
  var imageToBase64 = function(icon) {
    var canvas = document.getElementById("c" + icon);
    
    var data = canvas.toDataURL();
    return data.replace("data:image/png;base64,","");
  };
  
  // Loads an image into the canvas
  var loadImage = function(icon,  url) {
    var canvas = document.getElementById("c" + icon);
    var context = canvas.getContext("2d");
    var image = new Image();
    image.src = "/api/image?url=" + url; // Use the proxy so not tainted.
        
    image.addEventListener("load", function() {
      context.drawImage(image, 0, 0, icon, icon); // rescale the image
    });
  };
  
  //Build a valid manifest
  var parseInfo = function(inf) {
    manifest.app = {};
    manifest.app.launch = {};
    manifest.permissions = [];
    manifest.icons = {
      "16": "16.png",
      "128": "128.png"
    };
    
    if(inf.name) {
      manifest.name = inf.name;
    }
    
    if(inf.description) {
      manifest.description = inf.description;
    }
    
    manifest.version = "0.0.0.1"
    
    for(var icon in inf.icons) {
      // Don't perform any validation just yet.
      loadImage(icon, inf.icons[icon]);
    }
    
    manifest.app.launch.urls = inf.urls;
    manifest.app.launch.web_url = inf.web_url
    manifest.app.launch.container = "tab"; // set it to the default, but clearly
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

    // Check that the icons are only 16 or 128.  No others allowed.
    
    // It is valid so return the document.
    return m;
  };
  
  var formatManifest = function() {
    
  };
  
  // Updates the User Interface based on the manifest.
  var updateUI = function() {
    var app = document.getElementById("app");
    var download = document.getElementById("download");
    var info = document.getElementById("info");
    var download = document.getElementById("download");
    var name = document.getElementById("name");
    var description = document.getElementById("description");
    var version = document.getElementById("version");
    var launch = document.getElementById("launch");
    
    // Launcher options
    var options = {};
    options["window"] = document.getElementById("newwindow");
    options["tab"] = document.getElementById("newtab");
    options["panel"] = document.getElementById("newpanel");
    
    // Permissions
    var permissions = {};
    permissions["geo"] = document.getElementById("geo");
    permissions["notifications"] = document.getElementById("notifications");
    permissions["unlimitedStorage"] = document.getElementById("unlimitedStorage");
    
    // The urls selection
    
    var urls = document.getElementById("urls");
    
    // Start updating the UI
    
    if(manifest.name)
      name.value = manifest.name;
    
    if(manifest.description)
      description.value = manifest.description;
      
    if(manifest.version)
      version.value = manifest.description;
    
    version.value = manifest.version;
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
    
    // Toggle the permissions
    for(var permission in manifest.permissions) {
      var permName =  manifest.permissions[permission];
      permissions[permName].checked = true;
    }
    
    // Select the correct launch type
    var container = manifest.app.launch.container;
    options[container].checked = true;
    
    // Show the class list
    if(app.classList.contains("visible") == false)
      app.classList.toggle("visible");
      
    if(download.classList.contains("visible") == false)
      download.classList.toggle("visible");
      
    renderManifest();
  };
  
  // Renders the manifest from the information provided.
  var renderManifest = function() {
    // Should simply pretty print the JSON.
    var manifestContainer = document.getElementById("manifest");
    manifestContainer.innerText = JSON.stringify(manifest);
  };
  
  var fetch = function(url) {
    var request = new XMLHttpRequest();
    request.open("GET", "/api/fetch?url=" + url, true);
    request.onreadystatechange = function (e) {
      if(request.status == 200 && request.readyState == 4) {
        var object = JSON.parse(request.responseText);
        parseInfo(object);
        updateUI();
      }
    };
    request.send();
  };
})();