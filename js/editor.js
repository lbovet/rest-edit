function reformat() {
    try {
        var pos = editor.getCursorPosition();
        var json = JSON.parse(editor.getSession());
        editor.getSession().setValue(JSON.stringify(json, null, 2));    
        editor.navigateTo(pos.row, pos.column);
    } catch(err) {
        // ignore
    }
}

function logReq(text) {
    log('<pre class="info">'+text+'</pre>');
}

function logOk(text) {
    log('<pre class="ok">'+text+'</pre><br>');
}

function logError(text) {
    log('<pre class="error">'+$('<div/>').text(text).html()+'</pre><br>');
}

function log(html) {
    $("#log").append(html);
    $("#log").scrollTop($("#log")[0].scrollHeight);
}

function get() {
    logReq("GET "+uri);
    var p = $.ajax(uri, { dataType:"text", headers: getHeaders() });        
    p.done( function(data, status, xhr) 
        { 
            $("#title").css({ "font-style": "normal" });
            logOk(xhr.status+" "+xhr.statusText);
            var type=xhr.getResponseHeader("Content-Type");
            if(type && type.indexOf("application/json") != -1) {
				editor.getSession().setMode("ace/mode/json");
				editor.getSession().setValue(data);
				reformat();
            } else {
				var mimeType = mimeTypes[type.split(';')[0]];
				var path;
				if(mimeType && type.split(';')[0] != "text/plain") {
					if(mimeType[2]) {
						if(binary) {
							document.getElementById("frame").contentDocument.location.reload(true);
						} else {
							setBinary(true, true);	
						}
						return;
					} else {
						if(mimeType[1]) {
							path=".xml";
						} else {
							path="."+mimeType[0];
						}
					}
				} else {
					path=uri.split('?')[0];
				}
				var mode = getModeFromPath(path);				
				console.log(mode);
				if(mode) {
					editor.getSession().setMode(mode.mode);
				} else {
					editor.getSession().setMode("ace/mode/text");
				}
				$("#reformat").hide();
				editor.getSession().setValue(data);
            }            
        });
    p.fail( function(xhr, status, err) 
        { 
            $("#title").css({ "font-style": "italic" });
            logError(xhr.status+" "+xhr.statusText+"\n");                  
            initEmpty();
        });                
}

function put() {
	var d = $.Deferred();
	if(postMode) {
		logError("Use Ctrl-Enter to post");	
		return;
	}
    logReq("PUT "+uri);
    var p = $.ajax(uri, { 
        method: "PUT", 
        data: binary ? blob: editor.getSession().getValue(),
        contentType: defaultType,
        processData: false,
        headers: getHeaders()
    });        
    p.done( function(data, status, xhr) 
        { 
            $("#title").css({ "font-style": "normal" });
            logOk(xhr.status+" "+xhr.statusText);
            d.resolve();
        });
    p.fail( function(xhr, status, err) 
        { 
            logError(xhr.status+" "+xhr.statusText+"\n"+ ((status==400 || status >= 500) ? xhr.responseText : ""));               
            d.reject();
        });           
    return d.promise();
}

function post() {
    logReq("POST "+uri);
    var p = $.ajax(uri, { 
        method: "POST", 
        data: binary ? blob: editor.getSession().getValue(),
        contentType: defaultType,
        processData: false,
        headers: getHeaders()
    });        
    p.done( function(data, status, xhr) 
        { 
            logOk(xhr.status+" "+xhr.statusText);
        });
    p.fail( function(xhr, status, err) 
        { 
            logError(xhr.status+" "+xhr.statusText+"\n"+ ((status==400 || status >= 500) ? xhr.responseText : ""));               
        });           
}

function del() {
    $.confirm("Are you sure you want to delete this resource?", "Confirm Delete", 
        function() {
            logReq("DELETE "+uri);
            var p = $.ajax(uri, { 
                method: "DELETE", 
                headers: getHeaders()
            });        
            p.done( function(data, status, xhr) 
                { 
                    $("#title").css({ "font-style": "italic" });
                    logOk(xhr.status+" "+xhr.statusText);
                });
            p.fail( function(xhr, status, err) 
                { 
                    logError(xhr.status+" "+xhr.statusText+"\n");            
                });                   
        });
}

function openHeader() {
	$("#header-button").hide();
	$("#new-header-container").show();
	$("#new-header").focus();
}

function closeHeader() {
	$("#header-button").show();
	$("#new-header-container").hide();
	return false;
}

function addHeader(header, star) {
	$("#new-header-form").submit();
	$("#headers").append('<div class="header"><i class="icon-star'+ (!star ? '-empty' : '') +' header-star"></i><span title="Edit Header" class="header-value">'+header+'</span><i class="icon-remove del-header"></i></div>');
	$(".del-header").unbind("click");
	$(".del-header").click( function() {
		$(this).parent().remove();	
		updateHeaderBar();
	});
	$(".header-star").unbind("click");
	$(".header-star").click( function() {
		toggleStar($(this).parent());
	});	
	$(".header-value").click( function() {
		$("#new-header").val($(this).text());
		removeStar($(this).text());
		$(this).parent().remove();
		openHeader();
		updateHeaderBar();		
	});
	$("#editor").css("top", "80px");	
}

function toggleStar(headerElement) {
	var header = headerElement.children(".header-value").text();
	var star = headerElement.children(".header-star");
	star.toggleClass("icon-star");
	star.toggleClass("icon-star-empty");
	var headers = $.cookie("headers") || [];			
	if(star.hasClass("icon-star")) {
		removeStar(header);
	} else {
		var pos = $.inArray(header, headers);
		if(pos != -1) {
			headers.splice(pos, 1);
			$.cookie("headers", headers);
		}
	}	
}

function removeStar(header) {
	var headers = $.cookie("headers") || [];			
	if($.inArray(header, headers)==-1) {
		headers.push(header);
		$.cookie("headers", headers);
	}
}

function updateHeaderBar() {
	if($("#headers").children().length === 0) {
		$("#editor").css("top", "48px");
	}	
}

function getHeaders() {
	var result = {};
	$("#headers").find(".header-value").each(function() {
		var splitted = $(this).text().split(":");
		result[splitted[0]]=splitted[1];
	});
	return result;
}

function switchMode() {
	window.onhashchange = function() {};
	if(!postMode) {
		window.location.assign(window.location.href.replace(/\??.[^#]*#/, "?mode=post#"));	
	} else {		
		window.location.assign(window.location.href.replace(/mode=post/, ""));	
	}
}

function setBinary(value, load) {
	var editorElement;
	
	if(value && !binary) {
		var frame = $('<iframe id="frame" />');
		frame.css("height", "100%");
		frame.css("overflow", "scroll");		
		frame.height($("#editor").height());
		frame.width($("#editor").width());
		frame.css("border", "0");		
		if(load) {
			frame.attr('src', uri); 
		}
		$("#editor").html(frame);		
		$("#reformat").hide();
		$("#save").remove();
		$("#mode-switch").hide();
	} 
	binary = value;
}

function initEmpty() {				
	var mimeType = mimeTypes[defaultType];
	var path;
	if(mimeType) {
		if(mimeType[2]) {
			if(binary) {
				document.getElementById("frame").contentDocument.location.reload(true);
			} else {
				setBinary(true);	
			}
			return;
		} else {
			if(mimeType[1]) {
				path=".xml";
			} else {
				path="."+mimeType[0];
			}
		}
	} else {
		path=uri.split('?')[0];
	}
	var mode = getModeFromPath(path);				
	if(mode && mode.mode!="ace/mode/json") {
		editor.getSession().setMode(mode.mode);
	} else {
		editor.getSession().setMode("ace/mode/json");
		editor.getSession().setValue("{\n\t\n}");
		editor.navigateTo(1, 1);   
	}
	$("#reformat").hide();
	$("#title").css({ "font-style": "italic" });
}

function init() {
	$.cookie.json = true;
	uri = window.location.hash;
	if(uri) {
	    uri = uri.substring(1,uri.length);
	    var tokens = uri.split("?")[0].split(".");
	    var extension = tokens[tokens.length-1];
	    defaultType = mimeTypesByExtension[extension];
	    if(!defaultType) {
			defaultType = "application/json";
	    }
	    var lastSlash;
	    if(uri.lastIndexOf("/") == uri.length-1) {
	        lastSlash = uri.substring(0,uri.length-1).lastIndexOf("/");
	    } else {        
	        lastSlash = uri.lastIndexOf("/");
	    }
	    if(lastSlash == -1) {
	        lastSlash=0;
	    }
	    var docName = uri.substring(lastSlash+1);
	    document.title = docName;    
		var create = window.location.search.indexOf("new=true") != -1;
	    postMode = window.location.search.indexOf("mode=post") != -1;

		var logSize = $.cookie("log-size");
		if(logSize) {
			if(logSize > $(window).height() -100) {
				logSize = $(window).height() -100;
			}
			$("#log-container").css("height", logSize);		
			$("#splitter").css("top", 0);
			$("#log").css("top", $("#splitter").height());
			$("#editor").css("bottom", logSize);
		}
		
		$("#frame").remove();
		editor = ace.edit("editor");
		editor.setTheme("ace/theme/textmate");
		editor.getSession().setTabSize(2);
		editor.getSession().setUseSoftTabs(true);

		if(logSize) {	
			editor.resize();
		}
		
	    $("#title").attr("href", uri);
	    $("#title").html(docName.split("?")[0]);
	    $("#splitter").draggable({
			axis: "y",
			containment: "window",
			drag: function( event, ui ) {	
				logSize = $("#log-container").height()-ui.position.top;
				if(logSize>=$(window).height()) {
					return false;
				}
				$("#log").css("top", ui.position.top);			
				$("#editor").css("bottom", logSize);				
				if(binary) {
					$("#frame").css("height", $("#editor").css("height"));
				} else {
					editor.resize();
				}
			},
			stop: function() {
				var size=$("#editor").position().top;
				$("log-container").height(logSize);
				$.cookie("log-size", logSize);	
			}
		});
	    if(!create && !postMode) {
			editor.getSession().setValue("");
			get();		
		}
		if(postMode) {
			$(".mode-normal").hide();
			$(".mode-post").show();
			$("#mode-switch").addClass("active");
			editor.commands.addCommand({
			    name: "post",
			    bindKey: {win: "Ctrl-Enter", mac: "Command-Enter"},
			    exec: post
			});
			initEmpty();
	    } else {
			editor.commands.addCommand({
				name: "refresh",
				bindKey: {win: "Ctrl-R", mac: "Command-R"},
				exec: get
			});			
	    }
		editor.commands.addCommand({
			name: "save",
			bindKey: {win: "Ctrl-S", mac: "Command-S"},
			exec: put
		});	    
		editor.commands.addCommand({
			name: "reformat",
			bindKey: {win: "Ctrl-Shift-F", mac: "Command-Shift-F"},
			exec: reformat
		});
		if(create) {
	        var p = $.ajax(uri, { dataType:"text" });        
	        p.done( function(data, status, xhr) 
	            { 
	                logError("Resource already exists");
	                editor.getSession().setValue(data);
	                reformat();
	            });
	        p.fail( function(xhr, status, err) 
	            { 
	               initEmpty();
	            });
	    }
	    editor.focus();
	    $("#headers").text("");
	    $.each($.cookie("headers") || [], function(pos, header) {
			addHeader(header, true);
	    });	
	    updateHeaderBar();
	    
	    $.event.props.push('dataTransfer');
		var body = $('body')
			.bind( 'dragenter dragover', false)
			.bind( 'drop', function( e ) {
				e.stopPropagation();
				e.preventDefault();		
				$.each( e.dataTransfer.files, function(index, file){
					var fileReader = new FileReader();
					if(!binary) {
						fileReader.onload = function(e) {
							editor.getSession().setValue(fileReader.result);
						};					
						fileReader.readAsText(file);
					} else {
						fileReader.onload = function(e) {
							blob = fileReader.result;
							put().done(function() {
								$("#frame").get(0).contentDocument.location.reload(true);
							});
						};					
						fileReader.readAsArrayBuffer(file);						
					}
				});
			});
	} else {
	    logError("Please specify the resource URI after a # in the address bar. Example: "+window.location+"#/mypath/myresource");
	}
}

$.extend({
    confirm: function(message, title, okAction) {
        $("<div></div>").dialog({
            open: function(event, ui) { $(".ui-dialog-titlebar-close").hide(); }, 
            buttons: {
                "Ok": function() {
                    $(this).dialog("close");
                    okAction();
                },
                "Cancel": function() {
                    $(this).dialog("close");
                }
            },
            close: function(event, ui) { $(this).remove(); },
            resizable: false,
            title: title,
            modal: true
        }).text(message);
    }
});

$().ready(function() {
	    $("#reformat").click(reformat);    
	    $("#reload").click(get);    
	    $("#save").click(put);    
	    $("#post").click(post);    
	    $("#delete").click(del);   
	    $("#mode-switch").click(switchMode);
	    $("#header-button").click(openHeader);   
	    $("#header-button-active").click(closeHeader);
	    $("#new-header").keypress(function(ev) {
			var keycode = (ev.keyCode ? ev.keyCode : ev.which);
		    if((keycode == 13) && $("#new-header").val()) {
				ev.preventDefault();
		        addHeader($("#new-header").val());
		        $("#new-header").val("");
		    }
		});	
		init();
	}); 
window.onhashchange = function() {
	if(binary) {
		document.location.reload();
	} else {
		init();
	}
};

var editor;
var postMode;
var binary;
var blob;
var uri;
var defaultType;

var modes = [];
function getModeFromPath(path) {
    var mode;
    var fileName = path.split(/[\/\\]/).pop();
    for (var i = 0; i < modes.length; i++) {
        if (modes[i].supportsFile(fileName)) {
            mode = modes[i];
            break;
        }
    }
    return mode;
}

var Mode = function(name, desc, extensions) {
    this.name = name;
    this.desc = desc;
    this.mode = "ace/mode/" + name;
    var re;
    if (/\^/.test(extensions)) {
        re = extensions.replace(/\|(\^)?/g, function(a, b){
            return "$|" + (b ? "^" : "^.*\\.");
        }) + "$";
    } else {
        re = "^.*\\.(" + extensions + ")$";
    }   

    this.extRe = new RegExp(re, "gi");
};

Mode.prototype.supportsFile = function(filename) {
    return filename.match(this.extRe);
};

var modesByName = {
    abap:       ["ABAP"         , "abap"],
    asciidoc:   ["AsciiDoc"     , "asciidoc"],
    c9search:   ["C9Search"     , "c9search_results"],
    coffee:     ["CoffeeScript" , "^Cakefile|coffee|cf|cson"],
    coldfusion: ["ColdFusion"   , "cfm"],
    csharp:     ["C#"           , "cs"],
    css:        ["CSS"          , "css"],
    curly:      ["Curly"        , "curly"],
    dart:       ["Dart"         , "dart"],
    diff:       ["Diff"         , "diff|patch"],
    dot:        ["Dot"          , "dot"],
    ftl:        ["FreeMarker"   , "ftl"],
    glsl:       ["Glsl"         , "glsl|frag|vert"],
    golang:     ["Go"           , "go"],
    groovy:     ["Groovy"       , "groovy"],
    haxe:       ["haXe"         , "hx"],
    haml:       ["HAML"         , "haml"],
    html:       ["HTML"         , "htm|html|xhtml"],
    c_cpp:      ["C/C++"        , "c|cc|cpp|cxx|h|hh|hpp"],
    clojure:    ["Clojure"      , "clj"],
    jade:       ["Jade"         , "jade"],
    java:       ["Java"         , "java"],
    jsp:        ["JSP"          , "jsp"],
    javascript: ["JavaScript"   , "js"],
    json:       ["JSON"         , "json"],
    jsx:        ["JSX"          , "jsx"],
    latex:      ["LaTeX"        , "latex|tex|ltx|bib"],
    less:       ["LESS"         , "less"],
    lisp:       ["Lisp"         , "lisp"],
    scheme:     ["Scheme"       , "scm|rkt"],
    liquid:     ["Liquid"       , "liquid"],
    livescript: ["LiveScript"   , "ls"],
    logiql:     ["LogiQL"       , "logic|lql"],
    lua:        ["Lua"          , "lua"],
    luapage:    ["LuaPage"      , "lp"], 
    lucene:     ["Lucene"       , "lucene"],
    lsl:        ["LSL"          , "lsl"],
    makefile:   ["Makefile"     , "^GNUmakefile|^makefile|^Makefile|^OCamlMakefile|make"],
    markdown:   ["Markdown"     , "md|markdown"],
    objectivec: ["Objective-C"  , "m"],
    ocaml:      ["OCaml"        , "ml|mli"],
    pascal:     ["Pascal"       , "pas|p"],
    perl:       ["Perl"         , "pl|pm"],
    pgsql:      ["pgSQL"        , "pgsql"],
    php:        ["PHP"          , "php|phtml"],
    powershell: ["Powershell"   , "ps1"],
    python:     ["Python"       , "py"],
    r:          ["R"            , "r"],
    rdoc:       ["RDoc"         , "Rd"],
    rhtml:      ["RHTML"        , "Rhtml"],
    ruby:       ["Ruby"         , "ru|gemspec|rake|rb"],
    scad:       ["OpenSCAD"     , "scad"],
    scala:      ["Scala"        , "scala"],
    scss:       ["SCSS"         , "scss"],
    sass:       ["SASS"         , "sass"],
    sh:         ["SH"           , "sh|bash|bat"],
    sql:        ["SQL"          , "sql"],
    stylus:     ["Stylus"       , "styl|stylus"],
    svg:        ["SVG"          , "svg"],
    tcl:        ["Tcl"          , "tcl"],
    tex:        ["Tex"          , "tex"],
    text:       ["Text"         , "txt"],
    textile:    ["Textile"      , "textile"],
    tm_snippet: ["tmSnippet"    , "tmSnippet"],
    toml:       ["toml"         , "toml"],
    typescript: ["Typescript"   , "typescript|ts|str"],
    vbscript:   ["VBScript"     , "vbs"],
    xml:        ["XML"          , "xml|rdf|rss|wsdl|xslt|atom|mathml|mml|xul|xbl"],
    xquery:     ["XQuery"       , "xq"],
    yaml:       ["YAML"         , "yaml"]
};

for (var n in modesByName) {
    var mode = modesByName[n];
    mode = new Mode(n, mode[0], mode[1]);
    modesByName[n] = mode;
    modes.push(mode);
}

var mimeTypes = {
	"text/vnd.in3d.3dml": [ "3dml", true, false ],
	"video/3gpp2": [ "3g2", false, true ],
	"video/3gpp": [ "3gp", false, true ],
	"application/x-7z-compressed": [ "7z", false, true ],
	"application/x-authorware-bin": [ "aab", false, true ],
	"audio/x-aac": [ "aac", false, true ],
	"application/x-authorware-map": [ "aam", false, false ],
	"application/x-authorware-seg": [ "aas", false, false ],
	"application/x-abiword": [ "abw", false, true ],
	"application/pkix-attr-cert": [ "ac", false, false ],
	"application/vnd.americandynamics.acc": [ "acc", false, false ],
	"application/x-ace-compressed": [ "ace", false, false ],
	"application/vnd.acucobol": [ "acu", false, false ],
	"audio/adpcm": [ "adp", false, false ],
	"application/vnd.audiograph": [ "aep", false, false ],
	"application/vnd.ibm.modcap": [ "afp", false, false ],
	"application/vnd.ahead.space": [ "ahead", false, true ],
	"application/postscript": [ "ai", false, false ],
	"audio/x-aiff": [ "aif", false, false ],
	"application/vnd.adobe.air-application-installer-package+zip": [ "air", false, true ],
	"application/vnd.dvb.ait": [ "ait", false, true ],
	"application/vnd.amiga.ami": [ "ami", false, true ],
	"application/vnd.android.package-archive": [ "apk", false, true ],
	"application/x-ms-application": [ "application", false, true ],
	"application/vnd.lotus-approach": [ "apr", false, true ],
	"video/x-ms-asf": [ "asf", false, true ],
	"application/vnd.accpac.simply.aso": [ "aso", false, false ],
	"application/vnd.acucorp": [ "atc", false, false ],
	"application/atomcat+xml": [ "atomcat", true, false ],
	"application/atomsvc+xml": [ "atomsvc", true, false ],
	"application/atom+xml": [ "atom, xml", true, false ],
	"application/vnd.antix.game-component": [ "atx", false, false ],
	"audio/basic": [ "au", false, true ],
	"video/x-msvideo": [ "avi", false, true ],
	"application/applixware": [ "aw", false, true ],
	"application/vnd.airzip.filesecure.azf": [ "azf", false, true ],
	"application/vnd.airzip.filesecure.azs": [ "azs", false, true ],
	"application/vnd.amazon.ebook": [ "azw", false, true ],
	"application/x-bcpio": [ "bcpio", false, true ],
	"application/x-font-bdf": [ "bdf", false, true ],
	"application/vnd.syncml.dm+wbxml": [ "bdm", true, false ],
	"application/vnd.realvnc.bed": [ "bed", false, true ],
	"application/vnd.fujitsu.oasysprs": [ "bh2", false, true ],
	"application/octet-stream": [ "bin", false, true ],
	"application/vnd.bmi": [ "bmi", false, true ],
	"image/bmp": [ "bmp", false, true ],
	"application/vnd.previewsystems.box": [ "box", false, true ],
	"image/prs.btif": [ "btif", false, true ],
	"application/x-bzip": [ "bz", false, true ],
	"application/x-bzip2": [ "bz2", false, true ],
	"text/x-c": [ "c", false, false ],
	"application/vnd.cluetrust.cartomobile-config": [ "c11amc", false, false ],
	"application/vnd.cluetrust.cartomobile-config-pkg": [ "c11amz", false, false ],
	"application/vnd.clonk.c4group": [ "c4g", false, true ],
	"application/vnd.ms-cab-compressed": [ "cab", false, true ],
	"application/vnd.curl.car": [ "car", false, false ],
	"application/vnd.ms-pki.seccat": [ "cat", false, false ],
	"application/ccxml+xml,": [ "ccxml", true, false ],
	"application/vnd.contact.cmsg": [ "cdbcmsg", false, false ],
	"application/vnd.mediastation.cdkey": [ "cdkey", false, false ],
	"application/cdmi-capability": [ "cdmia", false, false ],
	"application/cdmi-container": [ "cdmic", false, false ],
	"application/cdmi-domain": [ "cdmid", false, false ],
	"application/cdmi-object": [ "cdmio", false, false ],
	"application/cdmi-queue": [ "cdmiq", false, false ],
	"chemical/x-cdx": [ "cdx", false, false ],
	"application/vnd.chemdraw+xml": [ "cdxml", true, false ],
	"application/vnd.cinderella": [ "cdy", false, false ],
	"application/pkix-cert": [ "cer", false, true ],
	"image/cgm": [ "cgm", false, false ],
	"application/x-chat": [ "chat", false, false ],
	"application/vnd.ms-htmlhelp": [ "chm", false, false ],
	"application/vnd.kde.kchart": [ "chrt", false, false ],
	"chemical/x-cif": [ "cif", false, false ],
	"application/vnd.anser-web-certificate-issue-initiation": [ "cii", false, false ],
	"application/vnd.ms-artgalry": [ "cil", false, true ],
	"application/vnd.claymore": [ "cla", false, false ],
	"application/java-vm": [ "class", false, true ],
	"application/vnd.crick.clicker.keyboard": [ "clkk", false, true ],
	"application/vnd.crick.clicker.palette": [ "clkp", false, true ],
	"application/vnd.crick.clicker.template": [ "clkt", false, true ],
	"application/vnd.crick.clicker.wordbank": [ "clkw", false, true ],
	"application/vnd.crick.clicker": [ "clkx", false, true ],
	"application/x-msclip": [ "clp", false, true ],
	"application/vnd.cosmocaller": [ "cmc", false, false ],
	"chemical/x-cmdf": [ "cmdf", false, false ],
	"chemical/x-cml": [ "cml", false, false ],
	"application/vnd.yellowriver-custom-menu": [ "cmp", false, false ],
	"image/x-cmx": [ "cmx", false, true ],
	"application/vnd.rim.cod": [ "cod", false, false ],
	"application/x-cpio": [ "cpio", false, false ],
	"application/mac-compactpro": [ "cpt", false, false ],
	"application/x-mscardfile": [ "crd", false, false ],
	"application/pkix-crl": [ "crl", false, false ],
	"application/vnd.rig.cryptonote": [ "cryptonote", false, false ],
	"application/x-csh": [ "csh", false, false ],
	"chemical/x-csml": [ "csml", false, false ],
	"application/vnd.commonspace": [ "csp", false, true ],
	"text/css": [ "css", false, false ],
	"text/csv": [ "csv", false, false ],
	"application/cu-seeme": [ "cu", false, false ],
	"text/vnd.curl": [ "curl", false, false ],
	"application/prs.cww": [ "cww", false, false ],
	"model/vnd.collada+xml": [ "dae", true, false ],
	"application/vnd.mobius.daf": [ "daf", false, false ],
	"application/davmount+xml": [ "davmount", true, false ],
	"text/vnd.curl.dcurl": [ "dcurl", false, false ],
	"application/vnd.oma.dd2+xml": [ "dd2", true, false ],
	"application/vnd.fujixerox.ddd": [ "ddd", false, false ],
	"application/x-debian-package": [ "deb", false, false ],
	"application/x-x509-ca-cert": [ "der", false, false ],
	"application/vnd.dreamfactory": [ "dfac", false, false ],
	"application/x-director": [ "dir", false, true ],
	"application/vnd.mobius.dis": [ "dis", false, false ],
	"image/vnd.djvu": [ "djvu", false, false ],
	"application/vnd.dna": [ "dna", false, false ],
	"application/msword": [ "doc", false, false ],
	"application/vnd.ms-word.document.macroenabled.12": [ "docm", false, false ],
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": [ "docx", false, false ],
	"application/vnd.ms-word.template.macroenabled.12": [ "dotm", false, false ],
	"application/vnd.openxmlformats-officedocument.wordprocessingml.template": [ "dotx", false, false ],
	"application/vnd.osgi.dp": [ "dp", false, false ],
	"application/vnd.dpgraph": [ "dpg", false, false ],
	"audio/vnd.dra": [ "dra", false, false ],
	"text/prs.lines.tag": [ "dsc", false, false ],
	"application/dssc+der": [ "dssc", false, false ],
	"application/x-dtbook+xml": [ "dtb", false, false ],
	"application/xml-dtd": [ "dtd", false, false ],
	"audio/vnd.dts": [ "dts", false, false ],
	"audio/vnd.dts.hd": [ "dtshd", false, false ],
	"application/x-dvi": [ "dvi", false, false ],
	"model/vnd.dwf": [ "dwf", false, false ],
	"image/vnd.dwg": [ "dwg", false, false ],
	"image/vnd.dxf": [ "dxf", false, false ],
	"application/vnd.spotfire.dxp": [ "dxp", false, false ],
	"audio/vnd.nuera.ecelp4800": [ "ecelp4800", false, false ],
	"audio/vnd.nuera.ecelp7470": [ "ecelp7470", false, false ],
	"audio/vnd.nuera.ecelp9600": [ "ecelp9600", false, false ],
	"application/vnd.novadigm.edm": [ "edm", false, false ],
	"application/vnd.novadigm.edx": [ "edx", false, false ],
	"application/vnd.picsel": [ "efif", false, false ],
	"application/vnd.pg.osasli": [ "ei6", false, false ],
	"message/rfc822": [ "eml", false, false ],
	"application/emma+xml": [ "emma", true, false ],
	"audio/vnd.digital-winds": [ "eol", false, false ],
	"application/vnd.ms-fontobject": [ "eot", false, false ],
	"application/epub+zip": [ "epub", false, true ],
	"application/ecmascript": [ "es", false, false ],
	"application/vnd.eszigno3+xml": [ "es3", false, false ],
	"application/vnd.epson.esf": [ "esf", false, false ],
	"text/x-setext": [ "etx", false, false ],
	"application/x-msdownload": [ "exe", false, false ],
	"application/exi": [ "exi", false, false ],
	"application/vnd.novadigm.ext": [ "ext", false, false ],
	"application/vnd.ezpix-album": [ "ez2", false, false ],
	"application/vnd.ezpix-package": [ "ez3", false, false ],
	"text/x-fortran": [ "f", false, false ],
	"video/x-f4v": [ "f4v", false, true ],
	"image/vnd.fastbidsheet": [ "fbs", false, false ],
	"application/vnd.isac.fcs": [ "fcs", false, false ],
	"application/vnd.fdf": [ "fdf", false, false ],
	"application/vnd.denovo.fcselayout-link": [ "fe_launch", false, false ],
	"application/vnd.fujitsu.oasysgp": [ "fg5", false, false ],
	"image/x-freehand": [ "fh", false, false ],
	"application/x-xfig": [ "fig", false, false ],
	"video/x-fli": [ "fli", false, false ],
	"application/vnd.micrografx.flo": [ "flo", false, false ],
	"video/x-flv": [ "flv", false, false ],
	"application/vnd.kde.kivio": [ "flw", false, false ],
	"text/vnd.fmi.flexstor": [ "flx", false, false ],
	"text/vnd.fly": [ "fly", false, false ],
	"application/vnd.framemaker": [ "fm", false, false ],
	"application/vnd.frogans.fnc": [ "fnc", false, false ],
	"image/vnd.fpx": [ "fpx", false, false ],
	"application/vnd.fsc.weblaunch": [ "fsc", false, false ],
	"image/vnd.fst": [ "fst", false, false ],
	"application/vnd.fluxtime.clip": [ "ftc", false, false ],
	"application/vnd.anser-web-funds-transfer-initiation": [ "fti", false, false ],
	"video/vnd.fvt": [ "fvt", false, false ],
	"application/vnd.adobe.fxp": [ "fxp", false, false ],
	"application/vnd.fuzzysheet": [ "fzs", false, false ],
	"application/vnd.geoplan": [ "g2w", false, false ],
	"image/g3fax": [ "g3", false, false ],
	"application/vnd.geospace": [ "g3w", false, false ],
	"application/vnd.groove-account": [ "gac", false, false ],
	"model/vnd.gdl": [ "gdl", false, false ],
	"application/vnd.dynageo": [ "geo", false, false ],
	"application/vnd.geometry-explorer": [ "gex", false, false ],
	"application/vnd.geogebra.file": [ "ggb", false, false ],
	"application/vnd.geogebra.tool": [ "ggt", false, false ],
	"application/vnd.groove-help": [ "ghf", false, false ],
	"image/gif": [ "gif", false, true ],
	"application/vnd.groove-identity-message": [ "gim", false, false ],
	"application/vnd.gmx": [ "gmx", false, false ],
	"application/x-gnumeric": [ "gnumeric", false, true ],
	"application/vnd.flographit": [ "gph", false, false ],
	"application/vnd.grafeq": [ "gqf", false, false ],
	"application/srgs": [ "gram", false, false ],
	"application/vnd.groove-injector": [ "grv", false, false ],
	"application/srgs+xml": [ "grxml", false, false ],
	"application/x-font-ghostscript": [ "gsf", false, false ],
	"application/x-gtar": [ "gtar", false, false ],
	"application/vnd.groove-tool-message": [ "gtm", false, false ],
	"model/vnd.gtw": [ "gtw", false, false ],
	"text/vnd.graphviz": [ "gv", false, false ],
	"application/vnd.geonext": [ "gxt", false, false ],
	"video/h261": [ "h261", false, true ],
	"video/h263": [ "h263", false, true ],
	"video/h264": [ "h264", false, true ],
	"application/vnd.hal+xml": [ "hal", true, false ],
	"application/vnd.hbci": [ "hbci", false, false ],
	"application/x-hdf": [ "hdf", false, false ],
	"application/winhlp": [ "hlp", false, false ],
	"application/vnd.hp-hpgl": [ "hpgl", false, false ],
	"application/vnd.hp-hpid": [ "hpid", false, false ],
	"application/vnd.hp-hps": [ "hps", false, false ],
	"application/mac-binhex40": [ "hqx", false, false ],
	"application/vnd.kenameaapp": [ "htke", false, false ],
	"text/html": [ "html", false, false ],
	"application/vnd.yamaha.hv-dic": [ "hvd", false, false ],
	"application/vnd.yamaha.hv-voice": [ "hvp", false, false ],
	"application/vnd.yamaha.hv-script": [ "hvs", false, false ],
	"application/vnd.intergeo": [ "i2g", false, false ],
	"application/vnd.iccprofile": [ "icc", false, false ],
	"x-conference/x-cooltalk": [ "ice", false, false ],
	"image/x-icon": [ "ico", false, true ],
	"text/calendar": [ "ics", false, false ],
	"image/ief": [ "ief", false, false ],
	"application/vnd.shana.informed.formdata": [ "ifm", false, false ],
	"application/vnd.igloader": [ "igl", false, false ],
	"application/vnd.insors.igm": [ "igm", false, false ],
	"model/iges": [ "igs", false, false ],
	"application/vnd.micrografx.igx": [ "igx", false, false ],
	"application/vnd.shana.informed.interchange": [ "iif", false, false ],
	"application/vnd.accpac.simply.imp": [ "imp", false, false ],
	"application/vnd.ms-ims": [ "ims", false, false ],
	"application/ipfix": [ "ipfix", false, false ],
	"application/vnd.shana.informed.package": [ "ipk", false, false ],
	"application/vnd.ibm.rights-management": [ "irm", false, false ],
	"application/vnd.irepository.package+xml": [ "irp", true, false ],
	"application/vnd.shana.informed.formtemplate": [ "itp", false, false ],
	"application/vnd.immervision-ivp": [ "ivp", false, false ],
	"application/vnd.immervision-ivu": [ "ivu", false, false ],
	"text/vnd.sun.j2me.app-descriptor": [ "jad", false, false ],
	"application/vnd.jam": [ "jam", false, false ],
	"application/java-archive": [ "jar", false, false ],
	"text/x-java-source,java": [ "java", false, false ],
	"application/vnd.jisp": [ "jisp", false, false ],
	"application/vnd.hp-jlyt": [ "jlt", false, false ],
	"application/x-java-jnlp-file": [ "jnlp", false, false ],
	"application/vnd.joost.joda-archive": [ "joda", false, false ],
	"image/jpeg": [ "jpg", false, true ],
	"video/jpeg": [ "jpgv", false, true ],
	"video/jpm": [ "jpm", false, true ],
	"application/javascript": [ "js", false, false ],
	"application/json": [ "json", false, false ],
	"application/vnd.kde.karbon": [ "karbon", false, false ],
	"application/vnd.kde.kformula": [ "kfo", false, false ],
	"application/vnd.kidspiration": [ "kia", false, false ],
	"application/vnd.google-earth.kml+xml": [ "kml", true, false ],
	"application/vnd.google-earth.kmz": [ "kmz", false, true ],
	"application/vnd.kinar": [ "kne", false, false ],
	"application/vnd.kde.kontour": [ "kon", false, false ],
	"application/vnd.kde.kpresenter": [ "kpr", false, false ],
	"application/vnd.kde.kspread": [ "ksp", false, false ],
	"image/ktx": [ "ktx", false, false ],
	"application/vnd.kahootz": [ "ktz", false, false ],
	"application/vnd.kde.kword": [ "kwd", false, false ],
	"application/vnd.las.las+xml": [ "lasxml", true, false ],
	"application/x-latex": [ "latex", false, false ],
	"application/vnd.llamagraphics.life-balance.desktop": [ "lbd", false, false ],
	"application/vnd.llamagraphics.life-balance.exchange+xml": [ "lbe", true, false ],
	"application/vnd.hhe.lesson-player": [ "les", false, false ],
	"application/vnd.route66.link66+xml": [ "link66", false, false ],
	"application/vnd.ms-lrm": [ "lrm", false, false ],
	"application/vnd.frogans.ltf": [ "ltf", false, false ],
	"audio/vnd.lucent.voice": [ "lvp", false, false ],
	"application/vnd.lotus-wordpro": [ "lwp", false, false ],
	"application/mp21": [ "m21", false, false ],
	"audio/x-mpegurl": [ "m3u", false, false ],
	"application/vnd.apple.mpegurl": [ "m3u8", false, false ],
	"video/x-m4v": [ "m4v", false, true ],
	"application/mathematica": [ "ma", false, false ],
	"application/mads+xml": [ "mads", false, false ],
	"application/vnd.ecowin.chart": [ "mag", false, false ],
	"application/mathml+xml": [ "mathml", false, false ],
	"application/vnd.mobius.mbk": [ "mbk", false, false ],
	"application/mbox": [ "mbox", false, false ],
	"application/vnd.medcalcdata": [ "mc1", false, false ],
	"application/vnd.mcd": [ "mcd", false, false ],
	"text/vnd.curl.mcurl": [ "mcurl", false, false ],
	"application/x-msaccess": [ "mdb", false, true ],
	"image/vnd.ms-modi": [ "mdi", false, false ],
	"application/metalink4+xml": [ "meta4", false, false ],
	"application/mets+xml": [ "mets", false, false ],
	"application/vnd.mfmp": [ "mfm", false, false ],
	"application/vnd.osgeo.mapguide.package": [ "mgp", false, false ],
	"application/vnd.proteus.magazine": [ "mgz", false, false ],
	"audio/midi": [ "mid", false, true ],
	"application/vnd.mif": [ "mif", false, false ],
	"video/mj2": [ "mj2", false, false ],
	"application/vnd.dolby.mlp": [ "mlp", false, false ],
	"application/vnd.chipnuts.karaoke-mmd": [ "mmd", false, false ],
	"application/vnd.smaf": [ "mmf", false, false ],
	"image/vnd.fujixerox.edmics-mmr": [ "mmr", false, false ],
	"application/x-msmoney": [ "mny", false, false ],
	"application/mods+xml": [ "mods", true, false ],
	"video/x-sgi-movie": [ "movie", false, true ],
	"application/mp4": [ "mp4", false, true ],
	"video/mp4": [ "mp4", false, true ],
	"audio/mp4": [ "mp4a", false, true ],
	"application/vnd.mophun.certificate": [ "mpc", false, false ],
	"video/mpeg": [ "mpeg", false, true ],
	"audio/mpeg": [ "mpga", false, true ],
	"application/vnd.apple.installer+xml": [ "mpkg", false, false ],
	"application/vnd.blueice.multipass": [ "mpm", false, false ],
	"application/vnd.mophun.application": [ "mpn", false, false ],
	"application/vnd.ms-project": [ "mpp", false, false ],
	"application/vnd.ibm.minipay": [ "mpy", false, false ],
	"application/vnd.mobius.mqy": [ "mqy", false, false ],
	"application/marc": [ "mrc", false, false ],
	"application/marcxml+xml": [ "mrcx", true, false ],
	"application/mediaservercontrol+xml": [ "mscml", false, false ],
	"application/vnd.mseq": [ "mseq", false, false ],
	"application/vnd.epson.msf": [ "msf", false, false ],
	"model/mesh": [ "msh", false, false ],
	"application/vnd.mobius.msl": [ "msl", false, false ],
	"application/vnd.muvee.style": [ "msty", false, false ],
	"model/vnd.mts": [ "mts", false, false ],
	"application/vnd.musician": [ "mus", false, false ],
	"application/vnd.recordare.musicxml+xml": [ "musicxml", false, false ],
	"application/x-msmediaview": [ "mvb", false, false ],
	"application/vnd.mfer": [ "mwf", false, false ],
	"application/mxf": [ "mxf", false, false ],
	"application/vnd.recordare.musicxml": [ "mxl", false, false ],
	"application/xv+xml": [ "mxml", true, false ],
	"application/vnd.triscape.mxs": [ "mxs", false, false ],
	"video/vnd.mpegurl": [ "mxu", false, false ],
	"text/n3": [ "n3", false, false ],
	"application/andrew-inset": [ "N/A", false, false ],
	"application/vnd.wolfram.player": [ "nbp", false, false ],
	"application/x-netcdf": [ "nc", false, false ],
	"application/x-dtbncx+xml": [ "ncx", false, false ],
	"application/vnd.nokia.n-gage.symbian.install": [ "n-gage", false, false ],
	"application/vnd.nokia.n-gage.data": [ "ngdat", false, false ],
	"application/vnd.neurolanguage.nlu": [ "nlu", false, false ],
	"application/vnd.enliven": [ "nml", false, false ],
	"application/vnd.noblenet-directory": [ "nnd", false, false ],
	"application/vnd.noblenet-sealer": [ "nns", false, false ],
	"application/vnd.noblenet-web": [ "nnw", false, false ],
	"image/vnd.net-fpx": [ "npx", false, false ],
	"application/vnd.lotus-notes": [ "nsf", false, false ],
	"application/vnd.fujitsu.oasys2": [ "oa2", false, false ],
	"application/vnd.fujitsu.oasys3": [ "oa3", false, false ],
	"application/vnd.fujitsu.oasys": [ "oas", false, false ],
	"application/x-msbinder": [ "obd", false, true ],
	"application/oda": [ "oda", false, false ],
	"application/vnd.oasis.opendocument.database": [ "odb", false, false ],
	"application/vnd.oasis.opendocument.chart": [ "odc", false, false ],
	"application/vnd.oasis.opendocument.formula": [ "odf", false, false ],
	"application/vnd.oasis.opendocument.formula-template": [ "odft", false, false ],
	"application/vnd.oasis.opendocument.graphics": [ "odg", false, false ],
	"application/vnd.oasis.opendocument.image": [ "odi", false, false ],
	"application/vnd.oasis.opendocument.text-master": [ "odm", false, false ],
	"application/vnd.oasis.opendocument.presentation": [ "odp", false, false ],
	"application/vnd.oasis.opendocument.spreadsheet": [ "ods", false, false ],
	"application/vnd.oasis.opendocument.text": [ "odt", false, false ],
	"audio/ogg": [ "oga", false, true ],
	"video/ogg": [ "ogv", false, true ],
	"application/ogg": [ "ogx", false, true ],
	"application/onenote": [ "onetoc", false, false ],
	"application/oebps-package+xml": [ "opf", true, false ],
	"application/vnd.lotus-organizer": [ "org", false, false ],
	"application/vnd.yamaha.openscoreformat": [ "osf", false, false ],
	"application/vnd.yamaha.openscoreformat.osfpvg+xml": [ "osfpvg", true, false ],
	"application/vnd.oasis.opendocument.chart-template": [ "otc", false, false ],
	"application/x-font-otf": [ "otf", false, false ],
	"application/vnd.oasis.opendocument.graphics-template": [ "otg", false, false ],
	"application/vnd.oasis.opendocument.text-web": [ "oth", false, false ],
	"application/vnd.oasis.opendocument.image-template": [ "oti", false, false ],
	"application/vnd.oasis.opendocument.presentation-template": [ "otp", false, false ],
	"application/vnd.oasis.opendocument.spreadsheet-template": [ "ots", false, false ],
	"application/vnd.oasis.opendocument.text-template": [ "ott", false, false ],
	"application/vnd.openofficeorg.extension": [ "oxt", false, false ],
	"text/x-pascal": [ "p", false, false ],
	"application/pkcs10": [ "p10", false, false ],
	"application/x-pkcs12": [ "p12", false, false ],
	"application/x-pkcs7-certificates": [ "p7b", false, false ],
	"application/pkcs7-mime": [ "p7m", false, false ],
	"application/x-pkcs7-certreqresp": [ "p7r", false, false ],
	"application/pkcs7-signature": [ "p7s", false, false ],
	"application/pkcs8": [ "p8", false, false ],
	"text/plain-bas": [ "par", false, false ],
	"application/vnd.pawaafile": [ "paw", false, false ],
	"application/vnd.powerbuilder6": [ "pbd", false, false ],
	"image/x-portable-bitmap": [ "pbm", false, true ],
	"application/x-font-pcf": [ "pcf", false, false ],
	"application/vnd.hp-pcl": [ "pcl", false, false ],
	"application/vnd.hp-pclxl": [ "pclxl", false, false ],
	"application/vnd.curl.pcurl": [ "pcurl", false, false ],
	"image/x-pcx": [ "pcx", false, true ],
	"application/vnd.palm": [ "pdb", false, false ],
	"application/pdf": [ "pdf", false, true ],
	"application/x-font-type1": [ "pfa", false, false ],
	"application/font-tdpfr": [ "pfr", false, false ],
	"image/x-portable-graymap": [ "pgm", false, false ],
	"application/x-chess-pgn": [ "pgn", false, false ],
	"application/pgp-signature": [ "pgp", false, false ],
	"image/x-pict": [ "pic", false, false ],
	"application/pkixcmp": [ "pki", false, false ],
	"application/pkix-pkipath": [ "pkipath", false, false ],
	"application/vnd.3gpp.pic-bw-large": [ "plb", false, false ],
	"application/vnd.mobius.plc": [ "plc", false, false ],
	"application/vnd.pocketlearn": [ "plf", false, false ],
	"application/pls+xml": [ "pls", true, false ],
	"application/vnd.ctc-posml": [ "pml", false, false ],
	"image/png": [ "png", false, true ],
	"image/x-portable-anymap": [ "pnm", false, true ],
	"application/vnd.macports.portpkg": [ "portpkg", false, false ],
	"application/vnd.ms-powerpoint.template.macroenabled.12": [ "potm", false, false ],
	"application/vnd.openxmlformats-officedocument.presentationml.template": [ "potx", false, false ],
	"application/vnd.ms-powerpoint.addin.macroenabled.12": [ "ppam", false, false ],
	"application/vnd.cups-ppd": [ "ppd", false, false ],
	"image/x-portable-pixmap": [ "ppm", false, true ],
	"application/vnd.ms-powerpoint.slideshow.macroenabled.12": [ "ppsm", false, false ],
	"application/vnd.openxmlformats-officedocument.presentationml.slideshow": [ "ppsx", false, false ],
	"application/vnd.ms-powerpoint": [ "ppt", false, false ],
	"application/vnd.ms-powerpoint.presentation.macroenabled.12": [ "pptm", false, false ],
	"application/vnd.openxmlformats-officedocument.presentationml.presentation": [ "pptx", false, false ],
	"application/x-mobipocket-ebook": [ "prc", false, false ],
	"application/vnd.lotus-freelance": [ "pre", false, false ],
	"application/pics-rules": [ "prf", false, false ],
	"application/vnd.3gpp.pic-bw-small": [ "psb", false, false ],
	"image/vnd.adobe.photoshop": [ "psd", false, true ],
	"application/x-font-linux-psf": [ "psf", false, false ],
	"application/pskc+xml": [ "pskcxml", true, false ],
	"application/vnd.pvi.ptid1": [ "ptid", false, false ],
	"application/x-mspublisher": [ "pub", false, false ],
	"application/vnd.3gpp.pic-bw-var": [ "pvb", false, false ],
	"application/vnd.3m.post-it-notes": [ "pwn", false, false ],
	"audio/vnd.ms-playready.media.pya": [ "pya", false, true ],
	"video/vnd.ms-playready.media.pyv": [ "pyv", false, true ],
	"application/vnd.epson.quickanime": [ "qam", false, false ],
	"application/vnd.intu.qbo": [ "qbo", false, false ],
	"application/vnd.intu.qfx": [ "qfx", false, false ],
	"application/vnd.publishare-delta-tree": [ "qps", false, false ],
	"video/quicktime": [ "qt", false, true ],
	"application/vnd.quark.quarkxpress": [ "qxd", false, false ],
	"audio/x-pn-realaudio": [ "ram", false, true ],
	"application/x-rar-compressed": [ "rar", false, true ],
	"image/x-cmu-raster": [ "ras", false, false ],
	"application/vnd.ipunplugged.rcprofile": [ "rcprofile", false, false ],
	"application/rdf+xml": [ "rdf", true, false ],
	"application/vnd.data-vision.rdz": [ "rdz", false, false ],
	"application/vnd.businessobjects": [ "rep", false, false ],
	"application/x-dtbresource+xml": [ "res", true, false ],
	"image/x-rgb": [ "rgb", false, false ],
	"application/reginfo+xml": [ "rif", true, false ],
	"audio/vnd.rip": [ "rip", false, false ],
	"application/resource-lists+xml": [ "rl", true, false ],
	"image/vnd.fujixerox.edmics-rlc": [ "rlc", false, false ],
	"application/resource-lists-diff+xml": [ "rld", true, false ],
	"application/vnd.rn-realmedia": [ "rm", false, false ],
	"audio/x-pn-realaudio-plugin": [ "rmp", false, true ],
	"application/vnd.jcp.javame.midlet-rms": [ "rms", false, false ],
	"application/relax-ng-compact-syntax": [ "rnc", false, false ],
	"application/vnd.cloanto.rp9": [ "rp9", false, false ],
	"application/vnd.nokia.radio-presets": [ "rpss", false, false ],
	"application/vnd.nokia.radio-preset": [ "rpst", false, false ],
	"application/sparql-query": [ "rq", false, false ],
	"application/rls-services+xml": [ "rs", true, false ],
	"application/rsd+xml": [ "rsd", false, false ],
	"application/rss+xml": [ "rss", true, false ],
	"application/rtf": [ "rtf", false, false ],
	"text/richtext": [ "rtx", false, false ],
	"text/x-asm": [ "s", false, false ],
	"application/vnd.yamaha.smaf-audio": [ "saf", false, false ],
	"application/sbml+xml": [ "sbml", true, false ],
	"application/vnd.ibm.secure-container": [ "sc", false, false ],
	"application/x-msschedule": [ "scd", false, false ],
	"application/vnd.lotus-screencam": [ "scm", false, false ],
	"application/scvp-cv-request": [ "scq", false, false ],
	"application/scvp-cv-response": [ "scs", false, false ],
	"text/vnd.curl.scurl": [ "scurl", false, false ],
	"application/vnd.stardivision.draw": [ "sda", false, false ],
	"application/vnd.stardivision.calc": [ "sdc", false, false ],
	"application/vnd.stardivision.impress": [ "sdd", false, false ],
	"application/vnd.solent.sdkm+xml": [ "sdkm", true, false ],
	"application/sdp": [ "sdp", false, false ],
	"application/vnd.stardivision.writer": [ "sdw", false, false ],
	"application/vnd.seemail": [ "see", false, false ],
	"application/vnd.fdsn.seed": [ "seed", false, false ],
	"application/vnd.sema": [ "sema", false, false ],
	"application/vnd.semd": [ "semd", false, false ],
	"application/vnd.semf": [ "semf", false, false ],
	"application/java-serialized-object": [ "ser", false, false ],
	"application/set-payment-initiation": [ "setpay", false, false ],
	"application/set-registration-initiation": [ "setreg", false, false ],
	"application/vnd.hydrostatix.sof-data": [ "sfd-hdstx", false, false ],
	"application/vnd.spotfire.sfs": [ "sfs", false, false ],
	"application/vnd.stardivision.writer-global": [ "sgl", false, false ],
	"text/sgml": [ "sgml", false, false ],
	"application/x-sh": [ "sh", false, false ],
	"application/x-shar": [ "shar", false, false ],
	"application/shf+xml": [ "shf", true, false ],
	"application/vnd.symbian.install": [ "sis", false, false ],
	"application/x-stuffit": [ "sit", false, false ],
	"application/x-stuffitx": [ "sitx", false, false ],
	"application/vnd.koan": [ "skp", false, false ],
	"application/vnd.ms-powerpoint.slide.macroenabled.12": [ "sldm", false, false ],
	"application/vnd.openxmlformats-officedocument.presentationml.slide": [ "sldx", false, false ],
	"application/vnd.epson.salt": [ "slt", false, false ],
	"application/vnd.stepmania.stepchart": [ "sm", false, false ],
	"application/vnd.stardivision.math": [ "smf", false, false ],
	"application/smil+xml": [ "smi", true, false ],
	"application/x-font-snf": [ "snf", false, false ],
	"application/vnd.yamaha.smaf-phrase": [ "spf", false, false ],
	"application/x-futuresplash": [ "spl", false, false ],
	"text/vnd.in3d.spot": [ "spot", false, false ],
	"application/scvp-vp-response": [ "spp", false, false ],
	"application/scvp-vp-request": [ "spq", false, false ],
	"application/x-wais-source": [ "src", false, false ],
	"application/sru+xml": [ "sru", true, false ],
	"application/sparql-results+xml": [ "srx", true, false ],
	"application/vnd.kodak-descriptor": [ "sse", false, false ],
	"application/vnd.epson.ssf": [ "ssf", false, false ],
	"application/ssml+xml": [ "ssml", true, false ],
	"application/vnd.sailingtracker.track": [ "st", false, false ],
	"application/vnd.sun.xml.calc.template": [ "stc", false, false ],
	"application/vnd.sun.xml.draw.template": [ "std", false, false ],
	"application/vnd.wt.stf": [ "stf", false, false ],
	"application/vnd.sun.xml.impress.template": [ "sti", false, false ],
	"application/hyperstudio": [ "stk", false, false ],
	"application/vnd.ms-pki.stl": [ "stl", false, false ],
	"application/vnd.pg.format": [ "str", false, false ],
	"application/vnd.sun.xml.writer.template": [ "stw", false, false ],
	"image/vnd.dvb.subtitle": [ "sub", false, false ],
	"application/vnd.sus-calendar": [ "sus", false, false ],
	"application/x-sv4cpio": [ "sv4cpio", false, false ],
	"application/x-sv4crc": [ "sv4crc", false, false ],
	"application/vnd.dvb.service": [ "svc", false, false ],
	"application/vnd.svd": [ "svd", false, false ],
	"image/svg+xml": [ "svg", true, false ],
	"application/x-shockwave-flash": [ "swf", false, true ],
	"application/vnd.aristanetworks.swi": [ "swi", false, false ],
	"application/vnd.sun.xml.calc": [ "sxc", true, false ],
	"application/vnd.sun.xml.draw": [ "sxd", true, false ],
	"application/vnd.sun.xml.writer.global": [ "sxg", true, false ],
	"application/vnd.sun.xml.impress": [ "sxi", true, false ],
	"application/vnd.sun.xml.math": [ "sxm", true, false ],
	"application/vnd.sun.xml.writer": [ "sxw", true, false ],
	"text/troff": [ "t", false, false ],
	"application/vnd.tao.intent-module-archive": [ "tao", false, false ],
	"application/x-tar": [ "tar", false, false ],
	"application/vnd.3gpp2.tcap": [ "tcap", false, false ],
	"application/x-tcl": [ "tcl", false, false ],
	"application/vnd.smart.teacher": [ "teacher", false, false ],
	"application/tei+xml": [ "tei", false, false ],
	"application/x-tex": [ "tex", false, false ],
	"application/x-texinfo": [ "texinfo", false, false ],
	"application/thraud+xml": [ "tfi", false, false ],
	"application/x-tex-tfm": [ "tfm", false, false ],
	"application/vnd.ms-officetheme": [ "thmx", false, false ],
	"image/tiff": [ "tiff", false, true ],
	"application/vnd.tmobile-livetv": [ "tmo", false, false ],
	"application/x-bittorrent": [ "torrent", false, false ],
	"application/vnd.groove-tool-template": [ "tpl", false, false ],
	"application/vnd.trid.tpt": [ "tpt", false, false ],
	"application/vnd.trueapp": [ "tra", false, false ],
	"application/x-msterminal": [ "trm", false, false ],
	"application/timestamped-data": [ "tsd", false, false ],
	"text/tab-separated-values": [ "tsv", false, false ],
	"application/x-font-ttf": [ "ttf", false, true ],
	"text/turtle": [ "ttl", false, false ],
	"application/vnd.simtech-mindmapper": [ "twd", false, false ],
	"application/vnd.genomatix.tuxedo": [ "txd", false, false ],
	"application/vnd.mobius.txf": [ "txf", false, false ],
	"text/plain": [ "txt", false, false ],
	"application/vnd.ufdl": [ "ufd", false, false ],
	"application/vnd.umajin": [ "umj", false, false ],
	"application/vnd.unity": [ "unityweb", false, false ],
	"application/vnd.uoml+xml": [ "uoml", true, false ],
	"text/uri-list": [ "uri", false, false ],
	"application/x-ustar": [ "ustar", false, false ],
	"application/vnd.uiq.theme": [ "utz", false, false ],
	"text/x-uuencode": [ "uu", false, false ],
	"audio/vnd.dece.audio": [ "uva", false, true ],
	"video/vnd.dece.hd": [ "uvh", false, true ],
	"image/vnd.dece.graphic": [ "uvi", false, true ],
	"video/vnd.dece.mobile": [ "uvm", false, true ],
	"video/vnd.dece.pd": [ "uvp", false, true ],
	"video/vnd.dece.sd": [ "uvs", false, true ],
	"video/vnd.uvvu.mp4": [ "uvu", false, true ],
	"video/vnd.dece.video": [ "uvv", false, true ],
	"application/x-cdlink": [ "vcd", false, false ],
	"text/x-vcard": [ "vcf", false, false ],
	"application/vnd.groove-vcard": [ "vcg", false, false ],
	"text/x-vcalendar": [ "vcs", false, false ],
	"application/vnd.vcx": [ "vcx", false, false ],
	"application/vnd.visionary": [ "vis", false, false ],
	"video/vnd.vivo": [ "viv", false, false ],
	"application/vnd.visio": [ "vsd", false, false ],
	"application/vnd.vsf": [ "vsf", false, false ],
	"model/vnd.vtu": [ "vtu", false, false ],
	"application/voicexml+xml": [ "vxml", true, false ],
	"application/x-doom": [ "wad", false, false ],
	"audio/x-wav": [ "wav", false, false ],
	"audio/x-ms-wax": [ "wax", false, false ],
	"image/vnd.wap.wbmp": [ "wbmp", false, false ],
	"application/vnd.criticaltools.wbs+xml": [ "wbs", false, false ],
	"application/vnd.wap.wbxml": [ "wbxml", false, false ],
	"audio/webm": [ "weba", false, false ],
	"video/webm": [ "webm", false, false ],
	"image/webp": [ "webp", false, false ],
	"application/vnd.pmi.widget": [ "wg", false, false ],
	"application/widget": [ "wgt", false, false ],
	"video/x-ms-wm": [ "wm", false, false ],
	"audio/x-ms-wma": [ "wma", false, false ],
	"application/x-ms-wmd": [ "wmd", false, false ],
	"application/x-msmetafile": [ "wmf", false, false ],
	"text/vnd.wap.wml": [ "wml", false, false ],
	"application/vnd.wap.wmlc": [ "wmlc", false, false ],
	"text/vnd.wap.wmlscript": [ "wmls", false, false ],
	"application/vnd.wap.wmlscriptc": [ "wmlsc", false, false ],
	"video/x-ms-wmv": [ "wmv", false, false ],
	"video/x-ms-wmx": [ "wmx", false, false ],
	"application/x-ms-wmz": [ "wmz", false, false ],
	"application/x-font-woff": [ "woff", false, false ],
	"application/vnd.wordperfect": [ "wpd", false, false ],
	"application/vnd.ms-wpl": [ "wpl", false, false ],
	"application/vnd.ms-works": [ "wps", false, false ],
	"application/vnd.wqd": [ "wqd", false, false ],
	"application/x-mswrite": [ "wri", false, true ],
	"model/vrml": [ "wrl", true, false ],
	"application/wsdl+xml": [ "wsdl", true, false ],
	"application/wspolicy+xml": [ "wspolicy", true, false ],
	"application/vnd.webturbo": [ "wtb", false, false ],
	"video/x-ms-wvx": [ "wvx", false, false ],
	"application/vnd.hzn-3d-crossword": [ "x3d", false, false ],
	"application/x-silverlight-app": [ "xap", false, false ],
	"application/vnd.xara": [ "xar", false, false ],
	"application/x-ms-xbap": [ "xbap", false, false ],
	"application/vnd.fujixerox.docuworks.binder": [ "xbd", false, false ],
	"image/x-xbitmap": [ "xbm", false, true ],
	"application/xcap-diff+xml": [ "xdf", true, false ],
	"application/vnd.syncml.dm+xml": [ "xdm", true, false ],
	"application/vnd.adobe.xdp+xml": [ "xdp", true, false ],
	"application/dssc+xml": [ "xdssc", true, false ],
	"application/vnd.fujixerox.docuworks": [ "xdw", false, false ],
	"application/xenc+xml": [ "xenc", true, false ],
	"application/patch-ops-error+xml": [ "xer", true, false ],
	"application/vnd.adobe.xfdf": [ "xfdf", false, false ],
	"application/vnd.xfdl": [ "xfdl", false, false ],
	"application/xhtml+xml": [ "xhtml", true, false ],
	"image/vnd.xiff": [ "xif", false, false ],
	"application/vnd.ms-excel.addin.macroenabled.12": [ "xlam", false, false ],
	"application/vnd.ms-excel": [ "xls", false, true ],
	"application/vnd.ms-excel.sheet.binary.macroenabled.12": [ "xlsb", false, true ],
	"application/vnd.ms-excel.sheet.macroenabled.12": [ "xlsm", false, true ],
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [ "xlsx", false, true ],
	"application/vnd.ms-excel.template.macroenabled.12": [ "xltm", false, true ],
	"application/vnd.openxmlformats-officedocument.spreadsheetml.template": [ "xltx", true, false ],
	"application/xml": [ "xml", true, false ],
	"application/vnd.olpc-sugar": [ "xo", false, false ],
	"application/xop+xml": [ "xop", true, false ],
	"application/x-xpinstall": [ "xpi", false, false ],
	"image/x-xpixmap": [ "xpm", false, false ],
	"application/vnd.is-xpr": [ "xpr", false, false ],
	"application/vnd.ms-xpsdocument": [ "xps", false, false ],
	"application/vnd.intercon.formnet": [ "xpw", false, false ],
	"application/xslt+xml": [ "xslt", true, false ],
	"application/vnd.syncml+xml": [ "xsm", true, false ],
	"application/xspf+xml": [ "xspf", true, false ],
	"application/vnd.mozilla.xul+xml": [ "xul", true, false ],
	"image/x-xwindowdump": [ "xwd", false, false ],
	"chemical/x-xyz": [ "xyz", false, false ],
	"application/yang": [ "yang", false, false ],
	"application/yin+xml": [ "yin", true, false ],
	"application/vnd.zzazz.deck+xml": [ "zaz", true, false ],
	"application/zip": [ "zip", false, true ],
	"application/vnd.zul": [ "zir", false, false ],
	"application/vnd.handheld-entertainment+xml": [ "zmm", true, false ]
};

var mimeTypesByExtension = {};

for (var t in mimeTypes) {
    var type = mimeTypes[t];
	mimeTypesByExtension[type[0]] = t;
}
