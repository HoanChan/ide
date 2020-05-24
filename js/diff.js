(function ($) {
  var originalModel, modifiedModel, diffEditor
  Editor.Init([
    // { ID: "original", Lang: "plaintext", Value: "", Minimap: false },
    // { ID: "modified", Lang: "plaintext", Value: "", Minimap: false },
  ], function () {
    originalModel = monaco.editor.createModel("", "text/plain");
    modifiedModel = monaco.editor.createModel("", "text/plain");

    diffEditor = monaco.editor.createDiffEditor(document.getElementById("container"), {
      // You can optionally disable the resizing
      enableSplitViewResizing: false,
      automaticLayout: true, // the important part
    });
    diffEditor.setModel({
      original: originalModel,
      modified: modifiedModel,
      originalEditable: true, // for left pane
      readOnly: false,         // for right pane
    });

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
    $('#btnOpenOri').click(async function (e) { 
      let file = await selectFile(".asm, .sh, .bas, .c, .c, .c, .cs, .cpp, .cpp, .cpp, .lisp, .d, .exs, .erl, .out, .f90, .go, .hs, .java, .js, .lua, .nim, .ml, .m, .pas, .php, .txt, .pro, .py, .py, .rb, .rs, .ts, .v", false);
      let reader = new FileReader();
      reader.onload = function () { originalModel.setValue(reader.result); };
      reader.readAsText(file);      
    });
    $('#btnOpenModi').click(async function (e) {
      let file = await selectFile(".asm, .sh, .bas, .c, .c, .c, .cs, .cpp, .cpp, .cpp, .lisp, .d, .exs, .erl, .out, .f90, .go, .hs, .java, .js, .lua, .nim, .ml, .m, .pas, .php, .txt, .pro, .py, .py, .rb, .rs, .ts, .v", false);
      let reader = new FileReader();
      reader.onload = function () { modifiedModel.setValue(reader.result); };
      reader.readAsText(file);
    });
  });
})(window.jQuery);