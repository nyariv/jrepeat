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
    var obj;
    var $container = this;

    var templateId = options.templateId;

    if (!options.state) {
      throw new Error('No state specified');
      return;
    }

    var filterCallback = function() {return true;};
    var onUpdateCallback = function() {};

    var filtered = options.state;

    /**
     * @typedef jRepeatInstance
     * @type {object}
     * @property {() => number} length Get list length after filtering
     * @property {()} reset Reset filters
     * @property {(callback: ())} filter Apply filter callback
     * @property {()} nextPage Go next page in filtered list
     * @property {()} prevPage Go to prev page on filtered list
     * @property {(page: number)} setPage Set to specific page
     * @property {()} update Update view with current state.
     * @property {()} refresh Update both state and view
     * @property {(callback: (container: {}, instance: {})} onUpdate On update listener adder.
     * @property {(key: string, value: *)} set Set instance property
     * @property {(key: string)} get Get instance property
     * @property {(template: string, scope: *, special?: {}) => string} renderer Html renderer
     * @property {(set: string) => string} tpl Set/get template
     * @property {object} data Instance data
     * @property {{}} data.container jQuery object container
     * @property {string} data.initialContents Iniital contents
     * @property {*} data.state Template state
     * @property {()} internalUpdate Update the state (usually for filtering)
     * @property {(container: {}, instance: {})} onUpdateCallback On update callback.
    */
    obj = {
      filter: function(callback) {
        filterCallback = callback;
        attr('page', 0);
        obj.refresh();
      },
      reset: function() {
        filterCallback = function() {return true;};
        attr('page', 0);
        obj.refresh();
      },
      nextPage: function() {
        obj.setPage(attr('page') + 1);
      },
      prevPage: function() {
        obj.setPage(attr('page') - 1);
      },
      setPage: function (page) {
        if (!attr('limit')) {
          attr('page', 0);
        } else {
          var max = Math.floor((filtered.length - 1) / attr('limit'));
          attr('page', page <= max ? (page >= 0 ? page : 0) : max);
        }
        obj.update();
      },
      length: function() {
        return filtered.length;
      },
      update: update,
      updateInternal: function () {
        filtered = attr('state').filter(filterCallback);
      },
      tpl: tpl
    };

    obj = $.extend($container.jTemplate(options, {
      transitionExit: 0,
      transitionEnter: 0,
      limit: 0,
      page: 0,
      tag: undefined
    }), obj);

    var timer;
    /**
     * Update view with current state.
     */
    function update () {
      var paged = filtered;
      if (attr('limit')) {
        paged = filtered.slice((attr('page')) * attr('limit'), (attr('page') + 1) * attr('limit'));
      }

      var contents = "";
      for (var i = 0; i < paged.length; i++) {
        contents += html(tpl(), paged[i], {
          index: i, 
          page: attr('page'), 
          limit: attr('limit'), 
          length: filtered.length
        }, attr('functions'));
      }

      $container.addClass('jrepeat-processed');

  
      if ($container.data('contents') != contents) {
        $container.data('contents', contents);
        $container.addClass('jrepeat-exit');
        $container.addClass('jrepeat-transitioning');
        $container.removeClass('jrepeat-enter');

        clearTimeout(timer);
        timer = setTimeout(function () {
          $container.removeClass('jrepeat-exit');
          $container.addClass('jrepeat-enter');

          $container[0].innerHTML = contents;
          obj.onUpdateCallback($container, obj);

          timer = setTimeout(function () {
            $container.removeClass('jrepeat-enter');
            $container.removeClass('jrepeat-transitioning');
          }, attr('transitionEnter'));
        }, 50 + attr('transitionExit'));
      }
      return obj;
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
        attr('template', set);
        update();
      }

      var template = undefined;

      if (!template && attr('templateId')) {
        template = $("#" + CSS.escape(attr('templateId')))[0].innerHTML;
      }
      
      if (!template && attr('tag')) {
        template = "<" + escape(attr('tag')) + ">{{$self}}</" + escape(attr('tag')) + ">";
      }

      if (!template && attr('template')) {
        template = attr('template');
      }

      if (!template) {
        template = attr('initialContent');
      }

      return template;
    }


    var attr = obj.get;
    var html = obj.renderer;

    attr('template', tpl());

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
    attributes = attributes || {};
    var obj;
    var $container = this;

    var templateId = options.templateId;
    var state = options.state;
    options.functions = options.functions || {};
    
    var template = templateId ? $("#" + CSS.escape(templateId))[0].innerHTML : options.template;

    if (!state) {
      throw new Error('No state specified')
    }

    var onUpdateCallback = function() {
      return obj;
    };

    attributes.templateId = templateId;

    /**
     * @typedef jTemplateInstance
     * @type {object}
     * @property {()} update Update view with current state.
     * @property {() => templateInstance} refresh Update both state and view
     * @property {(callback: (container: {}, instance: {})} onUpdate On update listener adder.
     * @property {(key: string, value: *)} set Set instance property
     * @property {(key: string)} get Get instance property
     * @property {(template: string, scope: *, special?: {}) => string} renderer Html renderer
     * @property {(set: string) => string} tpl Set/get template
     * @property {object} data Instance data
     * @property {{}} data.container jQuery object container
     * @property {string} data.initialContents Iniital contents
     * @property {*} data.state Template state
     * @property {()} internalUpdate Update the state (usually for filtering)
     * @property {(container: {}, instance: {})} onUpdateCallback On update callback.
    */
    obj = {
      update: update,
      updateInternal: function(){},
      refresh: function () {
        obj.updateInternal();
        obj.update();
        return obj;
      },
      onUpdate: function(callback) {
        obj.onUpdateCallback = callback;
        return obj;
      },
      onUpdateCallback: onUpdateCallback,
      set: function(key, value) {
        attr(key, value);
        obj.refresh();
        return obj;
      },
      get: attr,
      renderer: html,
      tpl: tpl
    };

    obj.data = $.extend({}, attributes);
    obj.data = $.extend({}, attributes, attrs(), options, {
      container: $container[0],
      initialContent: $container[0].innerHTML
    });

    attr('template', tpl());

    attrSync();

    setTimeout(function() {
      obj.update();
    });

    /**
     * Update view with current state.
     */
    function update() {
      var $newContent = $('<div></div>');
      $newContent.append(html(tpl(), attr('state'), {}, attr('functions')));

      if ($newContent[0].innerHTML !== $container[0].innerHTML) {
        $container[0].innerHTML = $newContent[0].innerHTML;
        obj.onUpdateCallback($container, obj);
      }
      return obj;
    }

    /**
     * Render builtin directives like 'each', 'show', and 'jclass'.
     * 
     * @param {string} template
     *   The template. Expressions will be executed when wrapped with {{ }}.
     * @param {*} state
     *  Scope variables for use in expressions.
     * @param {object} special
     *  Extra scope variables (usuallaly used for loop index, etc).
     * 
     * @example
     *   <div each="myArray">{{myArray[$index]}}</div>
     * @example
     *   <div show="myVar">is shown: {{myVar}}</div>
     * @example
     *   <div jclass="{active: true}"></div>
     */
    function directives(template, state, special, functions) {
      
      var $template = $('<div></div>');
      $template[0].innerHTML = template;

      each($template.find('[if]').not($template.find('[each] [if]')), function(i, elem) {
        var $elem = $(elem);
        var stateParam = $elem.attr('if');
        var show = stateParam ? expr(stateParam, state, special, functions) : undefined;
        if (!show) {
          $elem.remove();
        }
      });

      each($template.find('[show]').not($template.find('[each] [if]')), function(i, elem) {
        var $elem = $(elem);
        var stateParam = $elem.attr('jshow');
        var show = stateParam ? expr(stateParam, state, special, functions) : undefined;
        $elem.addClass(show ? 'show' : 'hide');
        $elem.removeClass(!show ? 'show' : 'hide');
      });

      each($template.find('[jclass]').not($template.find('[each] [if]')), function(i, elem) {
        var $elem = $(elem);
        var stateParam = $elem.attr('jclass');
        var classes = stateParam ? expr(stateParam, state, special, functions) : undefined;
        for (theClass in classes) {
          if (classes[theClass]) {
            $elem.addClass(theClass);
          } else {
            $elem.removeClass(theClass);
          }
        }
      });

      each($template.find('[each]').not($template.find('[each] [each]')), function(i, elem) {
        var $elem = $(elem);
        var tpl = elem.innerHTML;
        var markup = "";
        var stateParam = $elem.attr('each');
        var list = stateParam ? expr(stateParam, state, special, functions) : undefined;
        if (list) {
          var newSpecial = $.extend({}, special);
          var count = 0;
          for (var sp in newSpecial) {
            if(sp.indexOf('index') == 0) {
              count++;
            }
          }
          for (var j in list) {
            newSpecial['index' + (count ? count : '')] = j;
            markup += html(tpl, state, newSpecial, functions);
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
        attr('template', set)
        update();
      }
      return  attr('template') ? attr('template') : (templateId ? $("#" + CSS.escape(templateId))[0].innerHTML : $container[0].innerHTML);
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
     */
    function html (template, state, special, functions) {
      var h = hash(template, state, special, functions);
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
    function attr (key, value) {
      if(typeof value == 'undefined') {
        if ($container[0].hasAttribute(key)) {
          return parse($container.attr(key));
        }
        return obj.data[key];
      } else {
        obj.data[key] = value;
        if(typeof attributes[key] != 'undefined') {
          $container.attr(key, stringify(value, true));
        }
      }
      return value;
    }

    
    /**
     * Set all attibutes from current state.
     */
    function attrSync () {
      for (var i in attributes) {
        attr(i, obj.data[i]);
      }
    }

    /**
     * Get all attibutes from current state.
     */
    function attrs() {
      var ret = {};
      for (var i in attributes) {
        ret[i] = attr(i);
      }
      return ret;
    }

    return obj;
  };

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

    if (!s.length) {
      return undefined;
    }

    try {
      return JSON.parse(s);
    } catch (e) {

    }

    if (s === 'undefined') {
      return undefined;
    }

    return s;
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
    var newSpecial = {};
    newSpecial.$self = scope;

    for (var i in special) {
      newSpecial['$' + i] = special[i];
    }

    var vars = {sandbox: undefined};
    var regex = /([\w]+)\s*?(\()?/g;
    var found;
    while (found = regex.exec(s)) {
      if (found[2]) {
        vars[found[1]] = function(){};
      } else {
        vars[found[1]] = undefined;
      }
    }

    var sandbox = $.extend(vars, typeof scope == 'object' ? scope : {}, newSpecial, functions);
    
    var h = hash(s);
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
  function cache(key, set) {
    if (set) {
      cache.memory[key] = set
    }

    return cache.memory[key]
  }

  cache.memory = {};
  
  $.fn.jRepeat = jRepeat;
  $.fn.jTemplate = jTemplate;
})(jQuery)