# jRepeat - jQuery repeating elements based on templates
A jQuery plugin for creating repeating elements using a template. Inspired by angular's `ng-repeat`/`ngFor`. The plugin does not provide any templates or css, just the templating system and some api.


## Demo and Examples
You can view a live demo and some examples of how to use the various options here: https://nyariv.github.io/jrepeat/.


## Features
* Angular-like html templates with variable placeholders
* Filtering and pagination
* Show/if/class directives as in angular.

## Getting Started
1. Download the [latest release](https://github.com/nyariv/jrepeat/releases/latest).

2. Include the jQuery and the plugin.
  ```html
  <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
  <script src="path/to/jrepeat.min.js"></script>
  ```

3. Include some JSON as your list of items

  ```html
  <script>
    let myList  = [
      {
        "var1": "test1"
      },
      {
        "var1": "abc2"
      },
      {
        "var1": "testabc3"
      },
      {
        "var1": "<b>banana4</b>"
      }
    ]
  </script>
  ```
4. Include your template.

  ```html
  <template id="template1">
      <li>This is {{var1}}</li>
  </template>
  ```

5. Include the container and apply the plugin.

  ```html
  <ul jrepeat></ul>

  <script>
    const jr = jQuery("[jrepeat]").jRepeat({
      state: myList,
      templateId: "template1"
    });
    jr.render();
  </script>
  ```

## Options

**state**  
Type: `Array` Default: `none`  
Required. The state of the template, or rather the JSON list containing all the element data.

**templateId**  
Type: `String` Default: `none`
Optional, available as attribute. The id of the element containing the template markup. Optional.

**trackBy**  
Type: `String` Default: `none`  
Optiona. The state property that holds the id of the element. This is needed if the list is modified throughout page life cycle.

**tag**  
Type: `String` Default: `none`  
Optional, available as attribute. If no template is provided, the tag option may be used as a quick and simple setup. For example, a tag with the value of `div` is the template equivalent of:

```html
<div>{{$self}}</div>
```

**limit**  
Type: `Number` Default: `0`
Optional, available as attribute. The number of items per page. Prints all if none provided.

**transitionExit**  
Type: `Number` Default: `none`  
Optional, available as attribute. The number of milliseconds until contents replaced when updated. Adds a class `.jrepeat-exit` while waiting. Used for transition effects.

**transitionEnter**  
Type: `Number` Default: `none`  
Optional, available as attribute. The number of milliseconds until remove class `.jrepeat-enter`, which appears after contents have been replaced when updated. Used for transition effects.

**functions**  
Type: `Object` Default: `{}`  
Optional. An object of functions that will be avaible for calling in template markup. Example:

```html
  <ul jrepeat></ul>

  <script>
    const jr = $("[jrepeat]").jRepeat({
      state: myList,
      templateId: "template1",
      functions: {
        myFunc: (num) => "myFunc " + num;
      }
    });
    jr.render();
  </script>

  <template id="template1">
      <li>This is {{myFunc($index)}}</li>
  </template>
```

## Public Methods
**render**  
Updates the rendering, with an optional boolean argument to trigger recalculation. Generally, recalculation is needed when sorting, filtering, or state changes.

```js
jr.render(true);
```

**nextPage**  
Changes to next page of elements in the list and updates view.

```js
jr.nextPage().render();
```

**prevPage**  
Changes to previous page of elements in the list and updates view.

```js
jr.prevPage().render();
```

**setPage**  
Changes to a specific page of elements in the list and updates view.

```js
jr.setPage(1).render();
```

**length**  
Gets the length of the currently filtered list.

```js
jr.length();
```

**filter**  
Filters the list of elements.

```js
jr.filter((item, i) => /abc/.test(item.var1).render();
```

**sort**  
Sorts the list of elements.

```js
jr.sort((a, b) => a.var1.localeCompare(b.var1).render();
```

**reset**  
Resets the filtering and sorting.

```js
jr.reset().render();
```

**get**  
Gets a property of the plugin instance.

```js
jr.get('page');
```
Available properties:
- `container`
- `limit`
- `functions`
- `page`
- `state`
- `tag`
- `trackBy`
- `template`
- `templateId`
- `transitionEnter`
- `transitionExit`

**set**  
Sets a property of the plugin instance. See `get` method for available properties.

```js
jr.set('limit', 10).render();
```

**onUpdate**  
Sets on-update event handler. fired when view is updated.

```js
jr.onUpdate((newElements, jr) => console.log('updated'));
```

## System variables available to the template
- `{{$self}}` - The state object. Useful if items are strings and not objects.
- `{{$index}}` - The index of the item in the current page.