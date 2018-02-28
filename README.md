polymer-sortablejs
-------------------

A Polymer binding to [SortableJS](https://github.com/RubaXa/Sortable/). Forked by Kano Computing to make it work in Polymer 2.

Demo: http://rubaxa.github.io/Sortable/

### Usage

```html

<link rel="import" href="bower_components/polymer-sortablejs/polymer-sortablejs.html"/>

<sortable-js>
  <template is="dom-repeat" items={{items}}>
    <div>{{item}}</div>
  </template>
</sortable-js>
```

### Install

```
$ bower install KanoComponents/polymer-sortablejs#master
```
