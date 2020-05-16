(function ($) {
  function importHTML(parent) {
    parent.find('div[data-import-html]').each(function (index, element) {
      let me = $(this);
      let file = me.data('import-html');
      $.ajax({
        async: false,
        type: 'GET',
        url: file,
        success: function (data) {
          let p = me.parent();
          $(me).replaceWith(data);
          importHTML(p);
        },
        fail: function () {
          $(me).replaceWith("<span>" + file + "</span>");
        }
      });
    });
  }  
  
  $( document ).ready(function() {
    $.holdReady(true);
    importHTML($('body'));
    $.holdReady(false);
  });
    
})(window.jQuery);