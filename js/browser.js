require([
    "dojo/aspect", "dojo/ready", "dojo/parser", "dojo/store/JsonRest", "dojo/store/Observable",
    "dijit/Tree", "dijit/tree/ObjectStoreModel", "dojo/store/Memory", "dojo/_base/array", "dijit/layout/ContentPane", "dijit/layout/BorderContainer"
], function(aspect, ready, parser, JsonRest, Observable, Tree, ObjectStoreModel, Memory, array){

    ready(function(){
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
				onItem({id : "/", name: "/", folder: true});
		    },
			getLabel: function(object) {
				return object.name;
			}
		});

        var tree = new Tree({
            model: store,
            showRoot: false,
            openOnClick: true,
            onClick: function(item) {
				$("#frame").attr("src", "/editor.html#"+item.id);
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