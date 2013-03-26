rest-edit
=========

This is an editor for REST resources written in pure HTML5/Javascript. IT runs in the browser.

![example 1](https://github.com/lbovet/rest-edit/blob/master/doc/rest-edit1.png?raw=true)

Features
--------
* GET
* PUT
* POST
* DELETE
* Syntax highlighting and checking (thanks to http://ace.ajax.org)
* Autoformat JSON
* Log panel showing requests and errors
* Set HTTP headers
* Drag-and-drop files

Usage
-----

Just copy it to your web files and enjoy editing your PUTable REST resources, simply by giving their path as # parameter.

Work on an existing resource ``/myproject/rest-api/persons/alice``

    http://localhost:8080/myproject/rest-edit/editor.html#/myproject/rest-api/persons/alice

Work on a new resource ``/myproject/rest-api/persons/bob``

    http://localhost:8080/myproject/rest-edit/editor.html?new=true#/myproject/rest-api/persons/bob
    

