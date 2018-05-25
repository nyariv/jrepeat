jQuery(document).ready(function(){
  jQuery('.template-input').val(`<template id="template1">
    ${sr.tpl().trim()}
</template>`);
  jQuery('.template-input').keyup(function() {
    var $template = $(jQuery('.template-input').val());
    $('#template1').html($template.html())
    sr.update();
  });
  
  var l = jQuery.extend([], myObj.one.list);
  // l[1].myfunc = l[1].myfunc.toString();
  jQuery('.list-input').val(JSON.stringify(l, null, 2));
  jQuery('.list-input').keyup(function() {
    var list = JSON.parse($('.list-input').val());
    sr.set('state', list);
  });
  
  jQuery('.element-input').val(`<ul jrepeat="" transitionexit="0" transitionenter="500" limit="6" page="0" templateid="template1"></ul>`);
  jQuery('.element-input').keyup(function() {
    var list = JSON.parse($('.list-input').val());
    jQuery('[jrepeat]').replaceWith(jQuery('.element-input').val());
    sr = jQuery('[jrepeat]').jRepeat({
      state: list, 
      functions: {
        myfunc: function(val) { return val;}
      }
    });
    jQuery('#page').text(sr.get('page') + 1);
    jQuery('#items').text(myObj.one.list.length);


    sr.onUpdate(function(){
      jQuery('#items').text(sr.length());
      jQuery('#page').text(sr.get('page') + 1)
    });
  });
  
  jQuery('.style-input').val($('#style').html().trim());
  jQuery('.style-input').keyup(function() {
    var style = $('.style-input').val();
    jQuery('#style').html(style);
  });
  
  jQuery('.functions-input').keyup(function() {
    var functions = eval("(" + $('.functions-input').val() + ")");
    sr.set('functions', functions);
  });
});