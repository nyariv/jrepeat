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
  </script>
  ```

## Options

**state**  
Type: `Array` Default: `none`  
The state of the template, or rather the JSON list containing all the element data.

**templateId**  
Type: `String` Default: `none`
The id of the element containing the template markup. Optional.

**tag**  
Type: `String` Default: `none`  
If not template is provided, the tag option may be used as a quick and simple setup. For example, a tag with the value of `div` is the template equivalent of:

```html
<div>{{$self}}</div>
```

**limit**  
Type: `Number` Default: `0`
The number of items per page. Prints all if none provided.

**transitionExit**  
Type: `Number` Default: `none`  
The number of milliseconds until contents replaced when updated. Adds a class `.jrepeat-exit` while waiting. Used for transition effects.

**transitionEnter**  
Type: `Number` Default: `none`  
The number of milliseconds until remove class `.jrepeat-enter`, which appears after contents have been replaced when updated. Used for transition effects.

**functions**  
Type: `Object` Default: `{}`  
An object of functions that will be avaible for calling in template markup. Example:

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
  </script>

  <template id="template1">
      <li>This is {{myFunc($index)}}</li>
  </template>
```

## Public Methods
**update**  
Updates the rendering.
```js
jr.update();
```

**internalUpdate**  
Updates filtering without updating rendering..
```js
jr.internalUpdate();
```

**refresh**  
Updates the rendering and filtering.
```js
jr.refresh();
```

**nextPage**  
Changes to next page of elements in the list and updates view.
```js
jr.nextPage();
```

**prevPage**  
Changes to previous page of elements in the list and updates view.
```js
jr.prevPage();
```

**setPage**  
Changes to a specific page of elements in the list and updates view.
```js
jr.setPage(1);
```

**length**  
Gets the lenght of the currently filtered list.
```js
jr.length();
```

**filter**  
Filters the list of elements.
```js
jr.filter((item, i) => /abc/.test(item.var1);
```

**reset**  
Resets the filtering.
```js
jr.reset();
```

**get**  
Gets a property of the plugin instance.
```js
jr.get('page');
```
Available properties:
- `container`
- `limit` -  Also available as an attribute.
- `functions`
- `page` - Also available as an attribute.
- `state`
- `tag` - Also available as an attribute.
- `template`
- `templateId` - Also available as an attribute.
- `transitionEnter` - Also available as an attribute.
- `transitionExit` - Also available as an attribute.

**set**  
Sets a property of the plugin instance. See `get` method for available properties.
```js
jr.set('limit', 10);
```

**onUpdate**  
Sets on-update event handler. fired when view is updated.
```js
jr.onUpdate(($container, jr) => console.log('updated'));
```

## System variables available to the template
- `{{$self}}` - The state object. Useful if items are strings and not objects.
- `{{$index}}` - The index of the item in the current page.
- `{{$page}}` - Current page
- `{{$limit}}` - Limit property
- `{{$length}}` - Length