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
  
  jQuery('.element-input').val($('[jrepeat]').empty()[0].outerHTML);
  jQuery('.element-input').keyup(function() {
    var list = JSON.parse($('.list-input').val());
    jQuery('[jrepeat]').replaceWith(jQuery('.element-input').val());
    sr = jQuery('[jrepeat]').jRepeat({
      state: list, 
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