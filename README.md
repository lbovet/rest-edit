rest-edit
=========

This is a pure HTML5/Javascript editor for JSON REST resources.

Just copy it to your web files and enjoy editing your PUTable REST resources, simply by giving their path as # parameter.

Features
--------
* GET
* PUT
* DELETE
* Syntax highlighting and checking (thanks to http://ace.ajax.org)
* Log panel showing requests and errors

URL
---

Work on an existing resource ``/myproject/rest-api/persons/alice``
    http://localhost:8080/myproject/rest-edit/editor.html#/myproject/rest-api/persons/alice

Work on a new resource ``/myproject/rest-api/persons/bob``
    http://localhost:8080/myproject/rest-edit/editor.html?new=true#/myproject/rest-api/persons/bob
    
Screenshots
-----------

