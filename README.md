rest-edit
=========

This is an editor for REST resources written in pure HTML5/Javascript. It runs in the browser.

![example 1](https://github.com/lbovet/rest-edit/blob/master/doc/rest-edit1.png?raw=true)
![example 2](https://github.com/lbovet/rest-edit/blob/master/doc/rest-edit2.png?raw=true)

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
* Collection browser

Usage
-----

Just copy its files into your web content and enjoy editing your PUTable REST resources. 
Either directly in the editor by simply by giving the resource path as # parameter.or with the collection browser.

*Editor*

Work on an existing resource ``/myproject/rest-api/persons/alice``

    http://localhost:8080/myproject/rest-edit/editor.html#/myproject/rest-api/persons/alice

Work on a new resource ``/myproject/rest-api/persons/bob``

    http://localhost:8080/myproject/rest-edit/editor.html?new=true#/myproject/rest-api/persons/bob
    
*Collection Browser*

Start browsing from a given collection ``http://localhost:8080/myproject/rest-edit/browser.html#/myproject/rest-api/``


[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/lbovet/rest-edit/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

