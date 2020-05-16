(function ($) {
  function importHTML(parent) {
    parent.find('div[data-import-html]').each(function (index, element) {
      let me = $(this);
      let file = me.data('import-html');
      $.get(file, function (data) {
        let p = me.parent();
        $(me).replaceWith(data);
        importHTML(p);
      }).fail(function () {
        $(me).replaceWith("<span>" + file + "</span>");
      });
    });
  }
  
  $(document).ready(function () {
    importHTML($('body'));
  });
})(window.jQuery);