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
				reformat();
            } else {
				editor.getSession().setMode("ace/mode/text");
				$("#reformat").hide();
            }
            editor.getSession().setValue(data);
        });
    p.fail( function(xhr, status, err) 
        { 
            $("#title").css({ "font-style": "italic" });
            logError(xhr.status+" "+xhr.statusText+"\n");                  
            initEmpty();
        });                
}

function put() {
    logReq("PUT "+uri);
    var p = $.ajax(uri, { 
        method: "PUT", 
        data: editor.getSession().getValue(),
        contentType: "application/json; ; charset=UTF-8",
        processData: false,
        headers: getHeaders()
    });        
    p.done( function(data, status, xhr) 
        { 
            $("#title").css({ "font-style": "normal" });
            logOk(xhr.status+" "+xhr.statusText);
        });
    p.fail( function(xhr, status, err) 
        { 
            logError(xhr.status+" "+xhr.statusText+"\n"+ ((status==400 || status >= 500) ? xhr.responseText : ""));               
        });           
}

function post() {
    logReq("POST "+uri);
    var p = $.ajax(uri, { 
        method: "POST", 
        data: editor.getSession().getValue(),
        contentType: "application/json; ; charset=UTF-8",
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
			console.log("done");
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
	if(!postMode) {
		window.location = window.location.href.replace(/\??.[^#]*#/, "?mode=post#");	
	} else {		
		window.location = window.location.href.replace(/mode=post/, "");	
	}
}

function initEmpty() {
	editor.getSession().setMode("ace/mode/json");
	$("#title").css({ "font-style": "italic" });
	editor.getSession().setValue("{}");
	editor.navigateTo(0, 1);   
}

function init() {
	$.cookie.json = true;
	uri = window.location.hash;
	if(uri) {
	    uri = uri.substring(1,uri.length);
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
	
		editor = ace.edit("editor");
		editor.setTheme("ace/theme/tomorrow");
		editor.getSession().setTabSize(2);
		editor.getSession().setUseSoftTabs(true);

		editor.commands.addCommand({
		    name: "reformat",
		    bindKey: {win: "Ctrl-Shift-F", mac: "Command-Shift-F"},
		    exec: reformat
		});

		editor.commands.addCommand({
		    name: "save",
		    bindKey: {win: "Ctrl-S", mac: "Command-S"},
		    exec: put
		});	
		
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
	    $("#title").attr("href", uri);
	    $("#title").html(docName.split("?")[0]);
	    var create = window.location.search.indexOf("new=true") != -1;
	    postMode = window.location.search.indexOf("mode=post") != -1;
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
	    }
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
	} else {
	    logError("Please specify the resource URI after a # in the address bar. Example: "+window.location+"#/mypath/myresource");
	}
}

$.extend({
    confirm: function(message, title, okAction) {
        $("<div></div>").dialog({
            // Remove the closing 'X' from the dialog
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

$().ready(init); 
window.onhashchange = init;

var editor;
var postMode;
var uri;

