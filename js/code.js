(function ($) {
  var $selectLanguage;
  var $compilerOptions;
  var $commandLineArguments;
  var $runBtn;
  var $statusLine;
  var Compiler = new window.Compiler();

  Editor.Init([
    { ID: "codeEditor", Lang: "javascript", TabSize: 4, Value: "// First line\nfunction hello() {\n\talert('Hello world!');\n}\n// Last line" },
    { ID: "input", Lang: "plaintext", Value: "", Minimap: false },
    { ID: "output", Lang: "plaintext", Value: "", Minimap: false },
    { ID: "compile", Lang: "plaintext", Value: "", Minimap: false },
    { ID: "error", Lang: "plaintext", Value: "", Minimap: false },
    { ID: "sandbox", Lang: "plaintext", Value: "", Minimap: false },
  ], function () {
    if (Compiler.getIdFromURI()) {
      Compiler.loadSavedSource();
    } else {
      Compiler.loadRandomLanguage();
    }
    Editor.Get("codeEditor").focus();
    Editor.Get("codeEditor").getModel().onDidChangeContent(function (e) { Compiler.onChangeContent(parseInt($selectLanguage.val())); });
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
    console.log("Hey, HC-IDE is open-sourced. Have fun!");
    $('.tabular.menu .item').tab();
    $("select.dropdown").dropdown();
    $(".ui.dropdown").dropdown();
    $(".ui.dropdown.site-links").dropdown({ action: "hide", on: "hover" });
    $(".ui.checkbox").checkbox();
    $(".message .close").on("click", function () {
      $(this).closest(".message").transition("fade");
    });
    // =================================== //
    $statusLine = $("#status-line");
    $compilerOptions = $("#compiler-options");
    $commandLineArguments = $("#command-line-arguments");
    $commandLineArguments.attr("size", $commandLineArguments.attr("placeholder").length);
    $runBtn = $("#btnRun").click(function (e) { Compiler.run(); Editor.Get("output").focus(); document.getElementById("output").scrollIntoView(); });
    $selectLanguage = $("#select-language").change(function (e) { Compiler.changeEditorLanguage(); });

    $("#btnOpen").click(async function (e) {
      let file = await selectFile(".asm, .sh, .bas, .c, .c, .c, .cs, .cpp, .cpp, .cpp, .lisp, .d, .exs, .erl, .out, .f90, .go, .hs, .java, .js, .lua, .nim, .ml, .m, .pas, .php, .txt, .pro, .py, .py, .rb, .rs, .ts, .v", false);
      let reader = new FileReader();
      reader.onload = function () { Editor.Get("codeEditor").setValue(reader.result); };
      reader.readAsText(file);
    });

    $("#btnSave").click(function (e) {
      Compiler.save()
    });

    $("#btnDownload").click(function (e) {
      var value = parseInt($selectLanguage.val());
      download(Editor.Get("codeEditor").getValue(), $(".lm_title")[0].innerText, "text/plain");
    });

    $("#btnShare").click(function (e) {
      var $temp = $("<input>");
      $("body").append($temp);
      $temp.val(window.location.href).select();
      document.execCommand("copy");
      $temp.remove();
      ShowDialog("Thông báo", "Địa chỉ trang web đã được copy vào ClipBoard, hãy dán vào nơi khác để chia sẻ cho mọi người", "cyan");
    });

    $("#btnInsertCode").click(function (e) {
      if (confirm("Bạn có chắc sẽ làm điều này không? Toàn bộ mã nguồn hiện tại sẽ bị thay thế.")) {
        Compiler.insertTemplate();
      }
    });

    function showDot(dotID) {
      var dot = document.getElementById(dotID);
      if (!dot.parentElement.classList.contains("active")) {
        dot.hidden = false;
      }
    }

    Compiler.setSource = function (value) { Editor.Get("codeEditor").setValue(value); };
    Compiler.setInput = function (value) { Editor.Get("input").setValue(value); };
    Compiler.setOutput = function (value) { Editor.Get("output").setValue(value); if (value != "") showDot("stdout-dot"); };
    Compiler.setError = function (value) { Editor.Get("error").setValue(value); if (value != "") showDot("stderr-dot"); };
    Compiler.setCompile = function (value) { Editor.Get("compile").setValue(value); if (value != "") showDot("compile-output-dot"); };
    Compiler.setSanbox = function (value) { Editor.Get("sandbox").setValue(value); if (value != "") showDot("sandbox-message-dot"); };
    Compiler.setStatus = function (value, time, memory) { $statusLine.html(value); };
    Compiler.setLang = function (value) { $selectLanguage.dropdown("set selected", value); };
    Compiler.setOpts = function (value) { $compilerOptions.val(value); };
    Compiler.setArgs = function (value) { $commandLineArguments.val(value); };

    Compiler.getSource = function () { return Editor.Get("codeEditor").getValue(); };
    Compiler.getInput = function () { return Editor.Get("input").getValue(); };
    Compiler.getOuput = function () { return Editor.Get("output").getValue(); };
    Compiler.getError = function () { return Editor.Get("error").getValue(); };
    Compiler.getCompile = function () { return Editor.Get("compile").getValue(); };
    Compiler.getSanbox = function () { return Editor.Get("sandbox").getValue(); };
    Compiler.getLang = function () { return $selectLanguage.val(); };
    Compiler.getOpts = function () { return $compilerOptions.val(); };
    Compiler.getArgs = function () { return $commandLineArguments.val(); };
    Compiler.getStatus = function () { return $statusLine.html(); };

    Compiler.setSourceLanguage = function () { monaco.editor.setModelLanguage(Editor.Get("codeEditor").getModel(), $selectLanguage.find(":selected").attr("mode")); };
    Compiler.setSourceFileName = function (fileName) { $(".lm_title")[0].innerText = fileName; };

    Compiler.showLoading = function () { $runBtn.addClass("loading"); };
    Compiler.hideLoading = function () { $runBtn.removeClass("loading") };
    Compiler.afterRun = function () { };
    Compiler.beforeRun = function () {
      document.getElementById("stdout-dot").hidden = true;
      document.getElementById("stderr-dot").hidden = true;
      document.getElementById("compile-output-dot").hidden = true;
      document.getElementById("sandbox-message-dot").hidden = true;
    };

    Compiler.showError = function (title, content) { ShowDialog(title, content, 'red'); }
    // ================================== //
    $('.dot').parent().click(function (event) {
      $(event.target).children('.dot')[0].hidden = true;
    });

    $(`input[name="theme-mode"][value="${Editor.themeMode}"]`).prop("checked", true);
    $("input[name=\"theme-mode\"]").on("change", function (e) {
      $('#site-settings').modal('hide');
      themeMode = e.target.value;
      Compiler.localStorageSetItem("themeMode", Editor.themeMode);
      monaco.editor.setTheme(themeMode);
      Editor.Get("codeEditor").focus();
    });

    $("body").keydown(function (e) {
      var keyCode = e.keyCode || e.which;
      if (keyCode == 120) { // F9
        e.preventDefault();
        Compiler.run();
        return;
      }

      if (keyCode == 112) { // F1
        e.preventDefault();
        $('#info-modal').modal('show');
        return;
      }

      if (keyCode == 118) { // F7
        e.preventDefault();
        wait = !wait;
        localStorageSetItem("wait", wait);
        alert(`Trạng thái chờ chạy lệnh: ${wait ? "ON." : "OFF"}.`);
        return;
      }

      if (keyCode == 113 || (event.ctrlKey && keyCode == 83)) { // F2 || Ctrl + S
        e.preventDefault();
        $("#btnSave").click();
        return;
      }

      if (event.ctrlKey && keyCode == 79) { // Ctrl + O
        e.preventDefault();
        $("#btnOpen").click();
        return;
      }

    });

  });
})(window.jQuery);