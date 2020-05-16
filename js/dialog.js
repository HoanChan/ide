(function ($) {
  window.ShowDialog = function (title, content, color = 'back') {
    let dialog = $(`
    <div class="ui modal">
      <div class="header c-${color}">
        <i class="close icon"></i>
        <span id="title">${title}</span>
      </div>
      <div class="scrolling content">${content}</div>
      <div class="actions">
        <div class="ui small labeled icon cancel button">
          <i class="remove icon"></i>
          Close (ESC)
        </div>
      </div>
    </div>
    `).appendTo('body')
      .modal({
        onHidden: function () {
          dialog.remove();
        }
      }).modal('show');
  }
})(window.jQuery);