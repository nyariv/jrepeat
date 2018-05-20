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

      var $temp = $('<div>');
      $temp.append(contents);
      if ($temp.html() != $container.html()) {
        $container.addClass('jrepeat-exit');
        $container.addClass('jrepeat-transitioning');
        $container.removeClass('jrepeat-enter');

        clearTimeout(timer);
        timer = setTimeout(function () {
          $container.removeClass('jrepeat-exit');
          $container.addClass('jrepeat-enter');

          $container.html(contents);
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
        template = $("#" + CSS.escape(attr('templateId'))).html();
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
    
    var template = templateId ? $("#" + CSS.escape(templateId)).html() : options.template;

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
      initialContent: $container.html()
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

      if ($newContent.html() !== $container.html()) {
        $container.html($newContent.html());
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
      $template.html(template);

      $template.find('[if]').not($template.find('[each] [if]')).each(function(i, elem) {
        var $elem = $(elem);
        var stateParam = $elem.attr('if');
        var show = stateParam ? expr(stateParam, state, special, functions) : undefined;
        if (!show) {
          $elem.remove();
        }
      });

      $template.find('[show]').not($template.find('[each] [if]')).each(function(i, elem) {
        var $elem = $(elem);
        var stateParam = $elem.attr('jshow');
        var show = stateParam ? expr(stateParam, state, special, functions) : undefined;
        $elem.addClass(show ? 'show' : 'hide');
        $elem.removeClass(!show ? 'show' : 'hide');
      });

      $template.find('[jclass]').not($template.find('[each] [if]')).each(function(i, elem) {
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

      $template.find('[each]').not($template.find('[each] [each]')).each(function(i, elem) {
        var $elem = $(elem);
        var tpl = $elem.html();
        $elem.empty();
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
            $elem.append(html(tpl, state, newSpecial, functions));
          }
        }
      });

      return $template.html();
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
      return  attr('template') ? attr('template') : (templateId ? $("#" + CSS.escape(templateId)).html() : $container.html());
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
      template = directives(template, state, special, functions);
      return template.replace(/({{(.*?)}})/g, function(match, placeholder, expression, offset, input_string) {
        return escape(stringify(expr(expression, state, special, functions), true));
      });
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
      case 'null':
        return 'null';
      case 'string':
        if (!forDisplay) {
          return '"' + value.replace(/"/g, '\\"') + '"';
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
      var temp = s;
      if ((s[0] == "'") && (s[s.length-1] == "'")) {
        temp = '"' + s
          .substring(1, s.length-1)
          .replace(/\\\\/g, '__--__')
          .replace(/"/g, '\\"')
          .replace(/\\'/g, "'") 
          .replace(/__--__/g, '\\\\') + '"';
      }
      return JSON.parse(temp);
    } catch (e) {

    }

    if (parseInt(s).toString() === s) {
      return parseInt(s);
    }

    if (parseFloat(s).toString() === s) {
      return parseFloat(s);
    }

    if (s == 'true') {
      return true;
    }

    if (s == 'false') {
      return false;
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

    var newScope = $.extend({}, typeof scope == 'object' ? scope : {}, newSpecial, functions);
    function getVar(path) {
      try {
        return Function('scope', "'use strict';  return scope." + path)(newScope);
      } catch (e) {
        return undefined;
      }
    }

    function getFunc(path) {
      return getVar(path) || function(){};
    }

    // Strings - single quote
    var stringS = [];
    exprPart = exprPart.replace(/(\w\[)?'.*?(?<!\\)'/g, function(match, mismatch, offset, input_string) {
      if(mismatch) {
        return match;
      }
      stringS.push(match);
      return "===-'-===";
    });

    // Strings - double quotes
    var stringD = [];
    exprPart = exprPart.replace(/(\w\[)?".*?(?<!\\)"/g, function(match, mismatch, offset, input_string) {
      if(mismatch) {
        return match;
      }
      stringD.push(match);
      return "===-\"-===";
    });

    function varConvert(s) {
      var pos = 0;
      var count = 0;
      while (pos < s.length && count < s.length) {
        s = s.substring(0, pos) + s.substring(pos).replace(/([\w\]]\s*([\[\(]))(.+)/, function(match, prefix, char, inner, offsetMain, input_string){
          var res = varConvert(inner);
          pos += offsetMain + /[\[\(]/.exec(match).index + 1 + res.pos;
          
          var found = false;
          var openCount = 0;
          for (var i = 0; i < match.length && !found; i++) {
            if (match[i] == char) {
              openCount++;
            }
            if (match[i] == (char == "[" ? "]" : ")")) {
              openCount--;
              if (!openCount) {
                pos += i + 1;
                found = true;
              }
            }
          }

          var func = /\s*\(/.exec(match.substring(pos));
          return prefix + res.replaced.replace(/(\.?)(?<!['"\d\/])([a-z$_][\.a-z$_\d]*)(\s*\(.*?\))?/gi, function (match, period, variable, func, offset, input_string) {
            if(((variable == '$getVar' || variable == '$getFunc') && func) || period) {
              return match;
            }
            return (func ? "$getFunc('" : "$getVar('") + variable.replace(/'/, "\\'") + "')" + (func ? func : '');
          });
        });
        count++;
      }

      return {replaced: s, pos: pos ? pos : count};
    }

    // Variables
    var temp = varConvert("a("+exprPart+")").replaced;
    exprPart = temp.substring(2, temp.length - 1);
    
    var count = 0;
    exprPart = exprPart.replace(/===-"-===/g, function(match, offset, input_string) {
      return stringD[count++];
    });

    count = 0;
    exprPart = exprPart.replace(/===-'-===/g, function(match, offset, input_string) {
      return stringS[count++];
    });

    try {
      return Function('$getVar', '$getFunc', '"use strict"; return ' + exprPart + ';')(getVar, getFunc);
    } catch (e) {
      if (!~e.message.indexOf('of undefined')) {
        console.error(s);
        throw e;
      }
      return undefined; 
    }
  }
  
  $.fn.jRepeat = jRepeat;
  $.fn.jTemplate = jTemplate;
})(jQuery)