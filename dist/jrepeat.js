(function ($) {
  'use strict'

  /**
   * Basic template jquery plugin.
   * 
   * @param {object} options
   *   Plugin options.
   * @param {*} options.state
   *   Required, State values to be used in the template.
   * @param {string} [options.templateId]
   *   Template Id.
   * @param {string} [options.tag]
   *   HTML tag to apply for a simple template.
   * @param {number} [options.transitionStart]
   *   Number of millisconds to wait until content is changed. For animations.
   * @param {number} [options.transitionEnd]
   *   Number of millisconds to wait until content is set to done. For animations.
   * @param {number} [options.page]
   *   Current page number.
   * @param {number} [options.limit]
   *   Number of items to display in a page.
   * 
   * @returns {jRepeatInstance}
   *   Plugin instance
   */
  function jRepeat(options) {
    options = options || {};

    var obj;;

    var filterCallback;
    var sortCallback;

    if (this.data('jrepeat')) {
      obj = this.data('jrepeat');
      for (var i in options) {
        obj.prop(i, options[i]);
      }
      return obj;
    }

    /**
     * @typedef jRepeatInstance
     * @type {object}
     * @property {() => number} length Get list length after filtering
     * @property {()} reset Reset filters
     * @property {(callback: ())} filter Apply filter callback
     * @property {()} nextPage Go next page in currentList list
     * @property {()} prevPage Go to prev page on currentList list
     * @property {(page: number)} setPage Set to specific page
     * @property {()} render Update view with current state.
     * @property {()} refresh Update both state and view
     * @property {(callback: (container: {}, instance: {})} onUpdate On update listener adder.
     * @property {(key: string, value: *)} set Set instance property
     * @property {(key: string)} get Get instance property
     * @property {(template: string, scope: *, special?: {}) => string} templateRenderer Html templateRenderer
     * @property {(set: string) => string} tpl Set/get template
     * @property {object} data Instance data
     * @property {{}} data.container jQuery object container
     * @property {string} data.initialContents Iniital contents
     * @property {*} data.state Template state
     * @property {()} internalState Update the state
    */
    obj = {
      filter: function(callback) {
        filterCallback = callback;
        prop('page', 0);
        refilteringNeeded = true;
        return obj;
      },
      sort: function(callback) {
        sortCallback = callback;
        refilteringNeeded = true;
        return obj;
      },
      reset: function() {
        filterCallback = function() {return true;};
        sortCallback = null;
        prop('page', 0);
        refilteringNeeded = true;
        return obj;
      },
      nextPage: function() {
        return obj.setPage(prop('page') + 1);
      },
      prevPage: function() {
        return obj.setPage(prop('page') - 1);
      },
      setPage: function (page) {
        var lastPage = prop('page');
        if (!prop('limit')) {
          prop('page', 0);
        } else {
          var max = Math.floor((currentList().length - 1) / prop('limit'));
          prop('page', page <= max ? (page >= 0 ? page : 0) : max);
        }
        return obj;
      },
      length: function() {
        return currentList().length;
      },
      render: function(resetCache) {
        render(resetCache);
        return obj;
      },
      tpl: tpl
    };

    var filtered;
    var refilteringNeeded = true;

    function currentList() {
      if (!prop('state')) {
        throw new Error('No state specified');
      }

      if (refilteringNeeded) {
        filtered = sort(filter(prop('state')));
        refilteringNeeded = false;
      }
      return filtered;
    }

    function filter(arr) {
      globalIndex = [];
      return arr.filter(function(value, i, array) {
        var isIn = filterCallback ? filterCallback(value, i, array) : true;
        if (isIn) {
          globalIndex.push(i);
        }
        return isIn;
      });
    }

    function sort(arr) {
      var res = arr;

      res = res.map(function(item, i) {
        return {item: item, gi: globalIndex[i]};
      });

      if(sortCallback) {
          res = res.sort(function(a, b) {
            return sortCallback(a.item, b.item) || a.gi - b.gi;
          });
      } else {
        res = res.sort(function(a, b) {
          return a.gi - b.gi;
        });
      }

      globalIndex = [];
      res = res.map(function(item, i){
        globalIndex.push(item.gi);
        return item.item;
      });

      return res;
    }

    obj = $.extend(this.jTemplate(options, {
      transitionExit: 0,
      transitionEnter: 0,
      limit: 0,
      page: 0,
      tag: undefined,
      trackBy: undefined
    }), obj);

    this.data('jrepeat', obj);

    var timer;
    var lastApply;
    var filterElements = {};
    var globalIndex = [];
    /**
     * Render view with current state.
     */
    function render (resetCache) {
      resetCache = refilteringNeeded = refilteringNeeded || resetCache;

      if (lastApply) {
        clearTimeout(timer);
        lastApply();
      }

      var paged = currentList();
      if (prop('limit')) {
        paged = paged.slice((prop('page')) * prop('limit'), (prop('page') + 1) * prop('limit'));
      }
      
      var offset = prop('page') * prop('limit');

      var oldContents = prop('container').data('contents') || [];
      var oldIds = (prop('container').data('ids') || []);

      var contents = [];
      var newIds = [];

      var toAdd = [];
      var toAddAfter = [];
      for (var i = 0; i < paged.length; i++) {
        var index = offset + i;
        var $item = getItem(index, resetCache);
        var id = $item.data('jid');
        var oldIdPos = oldIds.indexOf(id);

        if (!~oldIdPos) {
          $item.addClass('jrepeat-add');
          toAdd.push($item);
        } else {
          if (oldContents[oldIdPos].data('hash') !== $item.data('hash')) {
            oldContents[oldIdPos].replaceWith($item);
            oldContents[oldIdPos] = $item;
          } else {
            $item = oldContents[oldIdPos];
          }
        }

        contents.push($item);
        $item.data('i', i);
        $item.data('globalIndex', globalIndex[index]);
        newIds.push(id);
      }

      var j = 0;
      var k = 0;
      var lastElem;
      while (j < oldContents.length || k < contents.length) {
        var next = false;
        var current;

        if(!oldContents[j]) {
          current = contents[k++];
        } else if (!contents[k]) {
          current = oldContents[j++];
        } else if (oldContents[j] === contents[k]) {
          current = contents[k++];
          j++;
        } else if (oldContents[j].data('globalIndex') < contents[k].data('globalIndex')) {
          current = oldContents[j++];
        } else {
          current = contents[k++];
        }

        if (~toAdd.indexOf(current)) {
          toAddAfter.push(lastElem);
          // lastElem.after($item);
        }
        
        lastElem = current;
      }

      var toRemove = [];
      for (var i in oldIds) {
        if (!~newIds.indexOf(oldIds[i])) {
          oldContents[i].addClass('jrepeat-remove');
          toRemove.push(oldContents[i]);
        }
      }

      var stop = false;
      lastApply = function () {
        if (stop) return;
        stop = true;

        if (resetCache || toRemove.length === oldContents.length) {
          prop('container').html(fragment(contents));
        } else {
          for (var i in toAdd) {
            if (toAddAfter[i]) {
              toAddAfter[i].after(toAdd[i]);
            } else {
              if (i === 0) {
                prop('container').prepend(toAdd[i]);
              } else {
                prop('container').append(toAdd[i]);
              }
            }
          }

          toRemove.map(function($elem) {
            filterElements[id] = $elem.detach().removeClass('jrepeat-remove');
          });
        }
        prop('container').data('contents', contents);
        prop('container').data('ids', newIds);

        lastApply = null;
        timer = null;
        (prop('onUpdateCallback') || function(){})(flatten(toAdd), obj);
        setTimeout(function () {
          $(flatten(toAdd)).removeClass('jrepeat-add');
        }, prop('transitionEnter'));
      };
    
      if (toRemove.length && prop('transitionExit')) {
        timer = setTimeout(lastApply,  prop('transitionExit'));
      } else {
        lastApply();
      }



      return obj;
    }

    function flatten(arr) {
      var res = [];
      for (var i = 0; i < arr.length; i++) {
        if (arr[i] instanceof jQuery) {
          res = res.concat(flatten(arr[i]));
        } else {
          res.push(arr[i]);
        }
      }
      return res;
    }

    function getId(index) {
      var trackBy = prop('trackBy');
      return trackBy ? expr(trackBy, currentList()[index], {
        index: index,
      }, prop('functions')) : ("$index=" + globalIndex[index]);
    }

    function getItem(index, resetCache) {
      var id = getId(index);
      var tmplt = tpl();

      var h = hash(tmplt, currentList()[index], {
        index: index,
      }, prop('functions'));

      if (!(filterElements[id] && filterElements[id].data('hash') === h)) {
        filterElements[id] = $(parseHtml(html(tmplt, currentList()[index], {
          index: index,
        }, prop('functions'))));
        filterElements[id].data('hash', h);
        filterElements[id].data('jid', id);
      }
        
      filterElements[id].data('index', index);

      return filterElements[id];
    }

    /**
     * Set/get current template.
     * 
     * @param {string} set
     *   Template to set.
     * 
     * @returns {string}
     *   Current template.
     */
    function tpl(set) {
      var template = undefined;

      if (set) {
        prop('template', set);
      }


      if (!template && prop('templateId')) {
        template = ($("#" + CSS.escape(prop('templateId')))[0] || {}).innerHTML;
      }
      
      if (!template && prop('tag')) {
        template = "<" + escape(prop('tag')) + ">{{$self}}</" + escape(prop('tag')) + ">";
      }

      if (!template && prop('template')) {
        template = prop('template');
      }

      if (!template) {
        template = prop('initialContent');
      }

      return template;
    }


    var prop = obj.prop;
    var html = obj.templateRenderer;

    prop('template', tpl());

    return obj;
  };

  /**
   * Basic template jquery plugin.
   * 
   * @param {object} options
   *   Plugin options.
   * @param {*} options.state
   *   Required, State values to be used in the template.
   * @param {object} [options.functions]
   *   Optional, the functions available to the view.
   * @param {{}} [attributes]
   * 
   * @returns {jTemplateInstance}
   *   Plugin instance
   */
  function jTemplate(options, attributes) {
    options = options || {};
    options.functions = options.functions || {};
    attributes = attributes || {};
    attributes.templateId = attributes.templateId || undefined;
    var obj;

    /**
     * @typedef jTemplateInstance
     * @type {object}
     * @property {()} render Update view with current state.
     * @property {(callback: (container: {}, instance: {})} onUpdate On render listener adder.
     * @property {(key: string, value: *)} set Set instance property
     * @property {(key: string)} get Get instance property
     * @property {(key: string, value: *)} prop Set/get instance property
     * @property {(template: string, scope: *, special?: {}) => string} templateRenderer Html templateRenderer
     * @property {(set: string) => string} tpl Set/get template
     * @property {object} data Instance data
     * @property {{}} data.container jQuery object container
     * @property {string} data.initialContents Iniital contents
     * @property {*} data.state Template state
    */
    obj = {
      render: function() {
        render();
        return obj;
      },
      onUpdate: function(callback) {
        prop('onUpdateCallback', callback);
        return obj;
      },
      set: function(key, value) {
        prop(key, value);
        return obj;
      },
      get: function(key) {
        return prop(key);
      },
      prop: prop,
      templateRenderer: html,
      tpl: tpl
    };

    obj.data = $.extend({}, attributes, attrs(this), options, {
      container: this,
      initialContent: this[0].innerHTML
    });

    attrSync();

    /**
     * Update view with current state.
     */
    function render() {
      if (!prop('state')) {
        throw new Error('No state specified')
      }

      prop('container').addClass('jrepeat-processed');
      var $newContent = $('<div></div>');
      $newContent.append(html(tpl(), prop('state'), {}, prop('functions')));

      if ($newContent[0].innerHTML !== prop('container')[0].innerHTML) {
        prop('container')[0].innerHTML = $newContent[0].innerHTML;
        (prop('onUpdateCallback') || function(){})(prop('container'), obj);
      }
      return obj;
    }

    /**
     * Render builtin directives like 'each', 'show', 'if', and 'jclass'.
     * 
     * @param {string} template
     *   The template. Expressions will be executed when wrapped with {{ }}.
     * @param {*} state
     *  Scope variables for use in expressions.
     * @param {object} special
     *  Extra scope variables (usuallaly used for loop index, etc).
     * @param {object} functions
     *  Scope functions for use in expressions.
     * 
     * @example
     *   <div each="myArray">{{myArray[$index]}}</div>
     * @example
     *   <div show="myVar">is shown: {{myVar}}</div>
     * @example
     *   <div if="myVar">is rendered: {{myVar}}</div>
     * @example
     *   <div jclass="{active: true}"></div>
     */
    function directives(template, state, special, functions) {
      
      var $template = $('<div></div>');
      $template[0].innerHTML = template;

      each($template.find('[data-if]').not($template.find('[data-each] [data-if]')), function(i, elem) {
        var $elem = $(elem);
        var stateParam = $elem[0].dataset['if'];
        var show = stateParam ? expr(stateParam, state, special, functions) : undefined;
        if (!show) {
          $elem.remove();
        }
      });

      each($template.find('[data-show]').not($template.find('[data-each] [data-show]')), function(i, elem) {
        var $elem = $(elem);
        var stateParam = $elem[0].dataset['show'];
        var show = stateParam ? expr(stateParam, state, special, functions) : undefined;
        $elem.addClass(show ? 'show' : 'hide');
        $elem.removeClass(!show ? 'show' : 'hide');
      });

      each($template.find('[data-class]').not($template.find('[data-each] [data-class]')), function(i, elem) {
        var $elem = $(elem);
        var stateParam = $elem[0].dataset['class'];
        var classes = stateParam ? expr(stateParam, state, special, functions) : undefined;
        for (theClass in classes) {
          if (classes[theClass]) {
            $elem.addClass(theClass);
          } else {
            $elem.removeClass(theClass);
          }
        }
      });

      each($template.find('[data-each]').not($template.find('[data-each] [data-each]')), function(i, elem) {
        var $elem = $(elem);
        var tpl = elem.innerHTML;
        var markup = "";
        var stateParam = $elem[0].dataset['each'];
        var list = stateParam ? expr(stateParam, state, special, functions) : undefined;
        if (list) {
          var scopeSpecial = $.extend({}, special);
          var count = 0;
          for (var sp in scopeSpecial) {
            if(sp.indexOf('index') == 0) {
              count++;
            }
          }
          for (var j in list) {
            scopeSpecial['index' + (count ? count : '')] = j;
            markup += html(tpl, state, scopeSpecial, functions);
          }
        }
        elem.innerHTML = markup;
      });

      function each(array, callback) {
        for (var i = 0; i < array.length; i++) {
          callback(i, array[i]);
        }
      }

      return $template[0].innerHTML;
    }

    /**
     * Set/get current template.
     * 
     * @param {string} set
     *   Template to set.
     * 
     * @returns {string}
     *   Current template.
     */
    function tpl(set) {
      if (set) {
        prop('template', set)
      }
      var templateId = prop('templateId');
      return  prop('template') ? prop('template') : (templateId ? ($("#" + CSS.escape(templateId))[0] || {}).innerHTML : prop('initialContent'));
    }
  
    /**
     * Instantiate a template using a provided state.
     * 
     * @param {string} template
     *   The template. Expressions will be executed when wrapped with {{ }}.
     * @param {*} state
     *  Scope variables for use in expressions.
     * @param {object} special
     *  Extra scope variables (usuallaly used for loop index, etc).
     * @param {object} functions
     *  Scope functions for use in expressions.
     */
    function html (template, state, special, functions) {
      var h = hash("template", template, state, special, functions);
      var c = cache(h);
      if (c) return c;

      template = directives(template, state, special, functions);
      template = template.replace(/({{(.*?)}})/g, function(match, placeholder, expression, offset, input_string) {
        return escape(stringify(expr(expression, state, special, functions), true));
      });

      return cache(h, template);
    }

    /**
     * Escape a string for html display.
     * 
     * @param {string} s
     *   String input.
     * 
     * @returns {string}
     *   Escaped html.
     */
    function escape (s) {
      return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
    }

    /**
     * Set/get property from current state.
     * 
     * @param {string} key 
     *   Property name.
     * @param {*} value
     *   Optional property value to set.
     * 
     * @returns {*}
     *   Value that was set/get. 
     */
    function prop (key, value) {
      if(typeof value == 'undefined') {
        if (attributes.hasOwnProperty(key)) {
          return obj.data[key] = parse(obj.data.container[0].dataset[key]);
        }
        return obj.data[key];
      } else {
        obj.data[key] = value;
        if (attributes.hasOwnProperty(key)) {
          obj.data.container[0].dataset[key] = stringify(value, true);
        }
      }
      return value;
    }

    
    /**
     * Set all attibutes from current state.
     */
    function attrSync () {
      for (var i in attributes) {
        prop(i, obj.data[i]);
      }
    }

    /**
     * Get all attibutes from current state.
     */
    function attrs(container) {
      var ret = {};
      for (var i in attributes) {
        ret[i] = container[0].dataset[i];
      }
      return ret;
    }

    return obj;
  };

  function fragment(arr) {
    var frag = document.createDocumentFragment();
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] instanceof Node) {
        frag.append(arr[i]);
      } else if (typeof arr[i] == "object") {
        frag.append(fragment(arr[i]));
      }
    }
    return frag;
  }

  /**
   * Convert js value to string
   * 
   * @param {*} value 
   *   Js value.
   * @param {*} forDisplay 
   *   Optional flag for converting to a string that will be printed.
   * 
   * @returns {string}
   *   String output.
   */
  function stringify (value, forDisplay) {
    switch (typeof value) {
      case 'object':
        return JSON.stringify(value);
      case 'undefined':
        if (!forDisplay) {
          return 'undefined';
        }
        return "";
      case 'string':
        if (!forDisplay) {
          return JSON.stringify(value);
        }
        return value;
      default:
        return value.toString();
    }
  }

  /**
   * Convert string to js value.
   * 
   * @param {string} s String input.
   * 
   * @returns {*}
   *   Converted value.
   */
  function parse(s) {
    if (typeof s != 'string') return s;

    var h = hash(s);
    if (cache(h, null, "parse")) {
      return cache(h, null, "parse");
    }

    var res = s

    if (!s.length) {
      res = undefined;
    } else if (s == 'undefined') {
      res = undefined;
    } else {
      try {
        res = JSON.parse(s);
      } catch (e) {
  
      }
    }
    cache(h, res, "parse")
    return res;
  }

  function parseHtml(markup) {
    var el = document.createElement('div');
    el.innerHTML = markup;
    return el.children;
  }

  /**
   * Execute an expression.
   * 
   * @param {string} s 
   *  Expression string.
   * @param {*} scope
   *  Scope variables.
   * @param {object} special
   *  Extra scope variables (usuallaly used for loop index, etc).
   * 
   * @returns {*}
   *  Expression result.
   */
  function expr(s, scope, special, functions) {
    if (!s) return undefined;
    special = special || {};
    functions = functions || {};
    var exprPart = s;
    var scopeSpecial = {};
    scopeSpecial.$self = scope;

    for (var i in special) {
      scopeSpecial['$' + i] = special[i];
    }

    var vars = {sandbox: undefined};
    var regex = /([\w]+)\s*(\()?/g;
    var found;
    while (found = regex.exec(s)) {
      if (found[2]) {
        vars[found[1]] = function(){};
      } else {
        vars[found[1]] = undefined;
      }
    }

    var sandbox = $.extend(vars, typeof scope == 'object' ? scope : {}, scopeSpecial, functions);
    
    var h = hash("expression", s);
    var exec;
    if (!(exec = cache(h))) {
      exec = cache(h, Function('sandbox', "with (sandbox) {return (" + s + ")}"));
    } 

    try {
      return exec(sandbox)
    } catch (e) {
      console.error(s);
      console.error(e);
      return undefined;
    }
  }

  /**
   * Get hash of all arguments.
   * 
   * @returns {string}
   *   The hash.
   */
  function hash() {
    var s = "";
    for (var i in arguments) {
      s += "#" + stringify(arguments[i]).replace(/#/g, "##");
    }

    var hash = 0, i, chr;
    if (s.length === 0) return hash;
    for (i = 0; i < s.length; i++) {
      chr   = s.charCodeAt(i);
      hash  = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }

  /**
   * Get/set a cache value.
   * 
   * @param {string} key 
   *   The key of the cache.
   * @param {*} set 
   *   The value to save.
   * 
   * @returns {*}
   *   The cached value.
   */
  function cache(key, set, bucket) {
    bucket = bucket || "general";
    cache.memory[bucket] = cache.memory[bucket] || {};
    
    if (!key) {
      delete cache.memory[bucket];
      return
    }

    if (set) {
      cache.memory[bucket][key] = set
    }

    return cache.memory[bucket][key]
  }

  cache.memory = {};
  
  $.fn.jRepeat = jRepeat;
  $.fn.jTemplate = jTemplate;
})(jQuery)