require([
    "dojo/aspect", "dojo/ready", "dojo/parser", "dojo/store/JsonRest", "dojo/store/Observable",
    "dijit/Tree", "dijit/tree/ObjectStoreModel", "dojo/store/Memory", "dojo/_base/array", "dijit/layout/ContentPane", "dijit/layout/BorderContainer"
], function(aspect, ready, parser, JsonRest, Observable, Tree, ObjectStoreModel, Memory, array){

    ready(function(){

		var root;
		var uri;

		var show = function(id) {
			if(id) {
				uri = id;
			}
			if(uri) {
				var src = $("#edit-switch").hasClass("active") ? "/editor.html#"+uri : uri;
				$("#frame").attr("src", src);
			}
		};

		$("#edit-switch").click( function() {
			$("#edit-switch").toggleClass("active");
			show();
		});

        var init = function() {	      
	        window.onhashchange = $.noop;
	        
	        if(!window.location.hash) {
				window.location.hash = "#/";
	        }
	        if(!window.location.hash.match(/.*\/$/)) {
				window.location.hash = window.location.hash+"/"; 
			}
		    root = window.location.hash.split("#")[1];
			$("#title").html(root);		
			$("#title").toggle();
			$("#title").toggle();			
			
			window.onhashchange = function() {
				window.location.reload();
			};
	    };
	    
	    init();
		
		var store = new JsonRest({
		    target:"",
		    mayHaveChildren: function(object){
				return object.folder;
		    },
		    getChildren: function(object, onComplete, onError){
				this.get(object.id).then( function(resp) {
					var children = [];
					var c = resp[Object.keys(resp)[0]];
					array.forEach(c, function(el) {
						children.push({ id : object.id + el, name: el.replace("/",""), folder: el.match(/\/$/) });
					});
					onComplete(children);
				}, onError).then(function(){}, function(err) { console.error(err); });
		    },
		    getRoot: function(onItem, onError){
				onItem({id : root, name: root, folder: true});
		    },
			getLabel: function(object) {
				return object.name;
			}
		});

		var expandRecursive = function(node) {
			return tree._expandNode(node).then(function() {
				var children = node.getChildren();
				if(children && children.length==1){
					var child=children[0];
	                if (child.hasChildren() && !child.isExpanded)
	                {
						expandRecursive(child);
	                }
				}
			});
		};

        var tree = new Tree({
            model: store,
            showRoot: false,
            onClick: function(item, node) {
				if(item.folder) {
					if(node.isExpanded) {
						node.collapse();
					} else {
						expandRecursive(node);
					}
				} else {
					show(item.id);
				}				
            },
            getIconClass: function(item, opened) {
				if(item.folder) {
					if(opened) {
						return "icon-folder-open light";
					} else {
						return "icon-folder-close light";
					}
				} else {
					var parts = item.name.split(".");
					var ext = parts[parts.length-1];
					var type = mimeTypesByExtension[ext];
					if(type) {
						switch(type.split("/")[0]) {
							case "text": return "icon-align-left lighter";
							case "image": return "icon-picture lighter";
							case "video": return "icon-film lighter";
							case "audio": return "icon-music lighter";
							default: return "icon-file lighter";
						}
					} else {
						return "icon-file lighter";
					}
				}
			}            
        }, "tree");        
        tree.startup();
    });
});