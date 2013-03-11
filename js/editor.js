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
    var p = $.ajax(uri, { dataType:"text" });        
    p.done( function(data, status, xhr) 
        { 
            $("#title").css({ "font-style": "normal" });
            logOk(xhr.status+" "+xhr.statusText);
            editor.getSession().setValue(data);
            reformat();
        });
    p.fail( function(xhr, status, err) 
        { 
            $("#title").css({ "font-style": "italic" });
            logError(xhr.status+" "+xhr.statusText+"\n");                        
        });                
}

function put() {
    logReq("PUT "+uri);
    var p = $.ajax(uri, { 
        method: "PUT", 
        data: editor.getSession().getValue(),
        processData: false            
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

function del() {
    $.confirm("Are you sure you want to delete this resource?", "Confirm Delete", 
        function() {
            logReq("DELETE "+uri);
            var p = $.ajax(uri, { 
                method: "DELETE"
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

var editor = ace.edit("editor");
editor.setTheme("ace/theme/tomorrow");
editor.getSession().setMode("ace/mode/json");
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

var uri = window.location.hash;
if(uri) {
    uri = uri.substring(1,uri.length);
    if(uri.lastIndexOf("/") == uri.length-1) {
        lastSlash = uri.substring(0,uri.length-1).lastIndexOf("/");
    } else {        
        lastSlash = uri.lastIndexOf("/");
    }
    if(lastSlash == -1) {
        lastSlash=0;
    }
    var name = uri.substring(lastSlash+1);
    document.title = name;
    $().ready(function() {
        $("#reformat").click(reformat);    
        $("#reload").click(get);    
        $("#save").click(put);    
        $('#delete').click(del);        
        $("#title").attr("href", uri);
        $("#title").html(name)        
        if(window.location.search.indexOf("new=true") == -1) {
            get();
        } else {
            var p = $.ajax(uri, { dataType:"text" });        
            p.done( function(data, status, xhr) 
                { 
                    logError("Resource already exists");
                    editor.getSession().setValue(data);
                    reformat();
                });
            p.fail( function(xhr, status, err) 
                { 
                    $("#title").css({ "font-style": "italic" });
                    editor.getSession().setValue("{}");
                    editor.navigateTo(0, 1);                      
                });
        }
        editor.focus();
    });
} else {
    logError("No url specified after # in query string");
}
