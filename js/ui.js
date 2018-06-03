jQuery(document).ready(function(){
  // Template
  jQuery('.template-input').val(`<template id="template1">
    ${jr.tpl().trim()}
</template>`);
  jQuery('.template-input').keyup(function() {
    var $template = $(jQuery('.template-input').val());
    $('#template1').html($template.html())
    jr.render();
  });
  
  // List
  var l = jQuery.extend([], myObj.one.list);
  jQuery('.list-input').val(JSON.stringify(l, null, 2));
  jQuery('.list-input').keyup(function() {
    var list = JSON.parse($('.list-input').val());
    jr.set('state', list).render(true);
  });
  
  // Element
  jQuery('.element-input').val(jQuery('[data-jrepeat]').clone().empty()[0].outerHTML);
  jQuery('.element-input').keyup(function() {
    jQuery('[data-jrepeat]')[0].outerHTML = jQuery('.element-input').val();
    jr.set('container', jQuery('[data-jrepeat]'))
    jr.render();
  });
  
  // Style
  jQuery('.style-input').val($('#style').html().trim());
  jQuery('.style-input').keyup(function() {
    var style = $('.style-input').val();
    jQuery('#style').html(style);
  });
  
  // Functions
  jQuery('.functions-input').keyup(function() {
    var functions = eval("(" + $('.functions-input').val() + ")");
    jr.set('functions', functions);
    jr.render();
  });
});