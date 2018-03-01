# Contributing

This element contains a script to automatically rebuild it for choosen Sortable release.

**TL;DR**

- Change `polymer-sortablejs-template.html` file instead of ~~`polymer-sortablejs.html`~~
- Run `$ node bower_components/polymer-sortablejs/build.js` to update and rebuild element

## Overview

When _there's an update to Sortable framework_ for which this element is a wraper or you want to _rebuild to include changes you made in template_, you should run `build.js` script inside of element folder with **Node 8** or newer. It will overwrite `polymer-sortable.html` with content of template file `polymer-sortable-template.html` and all options in currently installed Sortable version, excluding those that are defined at the top of `build.js` file.

### Choosing SOrtable version

By default script looks for Sortable files in bower_components and node_modules and will use currently installed verison.  
If it can't find them, script will download from GitHub (RubaXa/Sortable#master). You can use `-b` to specify branch or `-u` - username from which Sortable will be downloaded.

### Exluding options

On top of `build.js` file there is a constant Array

````javascript
const DISABLED_PROPERTIES = [
  'draggable',
  'setData',
  'supportPointer'
];
````

Those properties will not be included in built file so you either need to manually set them in the element or make sure they aren't nescessary.

### Editing template

You can do whatever you want in the template file as long as you don't remove two comments:

````javascript
/*properties*/

/*propertyobservers*/
````

Those two must stay in their places and you mustn't forget they will be overwriten with normal property/function definiton - do not remove commas!

## Pull Requests

Before submitting a Pull Request be sure to run `build.js`.

If you change the code, commit the same message both to the template and generated file if possible.

If you change is only update to latest Sortable, update version in `bower.json` and commit your change as `Rebuilt for Sortable [verison-number]`.