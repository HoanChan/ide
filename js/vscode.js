(function ($) {
  Editor.Init([
    { ID: "codeEditor", Lang: "javascript", TabSize: 4, Value: "// First line\nfunction hello() {\n\talert('Hello world!');\n}\n// Last line" },
  ], function () {
    $("#select-language").html("");
    $.each(Editor.Langs, function (index, el) {
      $("#select-language").append(`<option${el.id == "javascript" ? " selected" : ""}>${el.id}</option>`);
    });
    Editor.Get("codeEditor").focus();
    window.MonacoResize = Editor.Resize;
  });

  function selectFile(contentType, multiple) {
    return new Promise(resolve => {
      let input = document.createElement('input');
      input.type = 'file';
      input.multiple = multiple;
      input.accept = contentType;
      input.onchange = _ => {
        let files = Array.from(input.files);
        if (multiple)
          resolve(files);
        else
          resolve(files[0]);
        input.remove();
      };
      input.click();
    });
  }
  //========================================================================================================================================//
  $(document).ready(function () {
    $(".ui.dropdown").dropdown();
    $(".ui.dropdown.site-links").dropdown({ action: "hide", on: "hover" });
    $(".ui.checkbox").checkbox();
    $(".message .close").on("click", function () {
      $(this).closest(".message").transition("fade");
    });
    $('#btnOpen').click(async function (e) {
      let file = await selectFile(Editor.Ex.join(','), false);
      let reader = new FileReader();
      reader.onload = function () { Editor.Get("codeEditor").setValue(reader.result); };
      reader.readAsText(file);
    });
    $('#select-language').change(function (e) {
      monaco.editor.setModelLanguage(Editor.Get("codeEditor").getModel(), $(this).val());
    });
    $('#select-theme').change(function (e) {
      monaco.editor.setTheme($(this).val())
    });
    $('#btnInsertCode').click(function (e) {
      $("#codeEditor").addClass('loading');
      let id = $('#select-language').val();
      $.ajax({
        //async: false,
        type: 'GET',
        url: `https://microsoft.github.io/monaco-editor/index/samples/sample.${id}.txt`,
        success: function (data) {
          Editor.Get("codeEditor").setValue(data);
          $("#codeEditor").removeClass('loading');
        },
        fail: function () {
          Editor.Get("codeEditor").setValue(`templates/html/${name}.html NOT FOUND`);
          $("#codeEditor").removeClass('loading');
        }
      });
    });
  });
})(window.jQuery);