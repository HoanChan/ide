/// <reference path="main.js" />
(function ($) {
  var $selectLanguage;
  var $compilerOptions;
  var $commandLineArguments;
  var $runBtn;
  var $statusLine;
  var Compiler = new window.Compiler();
  var themeMode = Compiler.localStorageGetItem("themeMode") || "vs-dark";
  var fontSize = 14;

  //========================================================================================================================================//
  require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.20.0/min/vs' } });

  // Before loading vs/editor/editor.main, define a global MonacoEnvironment that overwrites
  // the default worker url location (used when creating WebWorkers). The problem here is that
  // HTML5 does not allow cross-domain web workers, so we need to proxy the instantiation of
  // a web worker through a same-domain script
  window.MonacoEnvironment = {
    getWorkerUrl: function (workerId, label) {
      return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
          self.MonacoEnvironment = {
            baseUrl: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.20.0/min/'
          };
          importScripts('https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.20.0/min/vs/base/worker/workerMain.min.js');`
      )}`;
    }
  };
  var sourceEditor, stdinEditor, stdoutEditor, compileOutputEditor, stderrEditor, sandboxMessageEditor;
  require(["vs/editor/editor.main"], function () {
    // Through the options literal, the behaviour of the editor can be easily customized.
    // Here are a few examples of config options that can be passed to the editor.
    // You can also call editor.updateOptions at any time to change the options.

    sourceEditor = monaco.editor.create(document.getElementById("codeEditor"), {
      value: "// First line\nfunction hello() {\n\talert('Hello world!');\n}\n// Last line",
      language: "javascript",
      automaticLayout: true, // the important part
      lineNumbers: "on",
      roundedSelection: false,
      scrollBeyondLastLine: false,
      readOnly: false,
      theme: themeMode,
    });
    stdinEditor = monaco.editor.create(document.getElementById("input"), {
      value: "",
      language: "plaintext",
      automaticLayout: true, // the important part
      lineNumbers: "on",
      roundedSelection: false,
      scrollBeyondLastLine: false,
      readOnly: false,
      theme: themeMode,
      minimap: { enabled: false }
    });
    stdoutEditor = monaco.editor.create(document.getElementById("output"), {
      value: "",
      language: "plaintext",
      automaticLayout: true, // the important part
      lineNumbers: "on",
      roundedSelection: false,
      scrollBeyondLastLine: false,
      readOnly: false,
      theme: themeMode,
      minimap: { enabled: false }
    });
    compileOutputEditor = monaco.editor.create(document.getElementById("compile"), {
      value: "",
      language: "plaintext",
      automaticLayout: true, // the important part
      lineNumbers: "on",
      roundedSelection: false,
      scrollBeyondLastLine: false,
      readOnly: false,
      theme: themeMode,
      minimap: { enabled: false }
    });
    stderrEditor = monaco.editor.create(document.getElementById("error"), {
      value: "",
      language: "plaintext",
      automaticLayout: true, // the important part
      lineNumbers: "on",
      roundedSelection: false,
      scrollBeyondLastLine: false,
      readOnly: false,
      theme: themeMode,
      minimap: { enabled: false }
    });
    sandboxMessageEditor = monaco.editor.create(document.getElementById("sandbox"), {
      value: "",
      language: "plaintext",
      automaticLayout: true, // the important part
      lineNumbers: "on",
      roundedSelection: false,
      scrollBeyondLastLine: false,
      readOnly: false,
      theme: themeMode,
      minimap: { enabled: false }
    });

    if (Compiler.getIdFromURI()) {
      Compiler.loadSavedSource();
    } else {
      Compiler.loadRandomLanguage();
    }
    sourceEditor.focus();
    sourceEditor.getModel().onDidChangeContent(function (e) { Compiler.onChangeContent(parseInt($selectLanguage.val())); });
    window.MonacoResize = function () {
      sourceEditor.layout();
      stdinEditor.layout();
      stdoutEditor.layout();
      compileOutputEditor.layout();
      stderrEditor.layout();
      sandboxMessageEditor.layout();
    };
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
    loadMessages();
    $statusLine = $("#status-line");
    $compilerOptions = $("#compiler-options");
    $commandLineArguments = $("#command-line-arguments");
    $commandLineArguments.attr("size", $commandLineArguments.attr("placeholder").length);
    $runBtn = $("#btnRun").click(function (e) { Compiler.run(); stdoutEditor.focus(); document.getElementById("output").scrollIntoView(); });
    $selectLanguage = $("#select-language").change(function (e) { Compiler.changeEditorLanguage(); });

    $("#btnOpen").click(async function (e) {
      let file = await selectFile(".asm, .sh, .bas, .c, .c, .c, .cs, .cpp, .cpp, .cpp, .lisp, .d, .exs, .erl, .out, .f90, .go, .hs, .java, .js, .lua, .nim, .ml, .m, .pas, .php, .txt, .pro, .py, .py, .rb, .rs, .ts, .v", false);
      let reader = new FileReader();
      reader.onload = function () { sourceEditor.setValue(reader.result); };
      reader.readAsText(file);
    });

    $("#btnSave").click(function (e) {
      Compiler.save()
    });

    $("#btnDownload").click(function (e) {
      var value = parseInt($selectLanguage.val());
      download(sourceEditor.getValue(), $(".lm_title")[0].innerText, "text/plain");
    });

    $("#btnShare").click(function (e) {
      var $temp = $("<input>");
      $("body").append($temp);
      $temp.val(window.location.href).select();
      document.execCommand("copy");
      $temp.remove();
      showMess("Thông báo", "Địa chỉ trang web đã được copy vào ClipBoard, hãy dán vào nơi khác để chia sẻ cho mọi người");
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

    Compiler.setSource = function (value) { sourceEditor.setValue(value); };
    Compiler.setInput = function (value) { stdinEditor.setValue(value); };
    Compiler.setOutput = function (value) { stdoutEditor.setValue(value); if (value != "") showDot("stdout-dot"); };
    Compiler.setError = function (value) { stderrEditor.setValue(value); if (value != "") showDot("stderr-dot"); };
    Compiler.setCompile = function (value) { compileOutputEditor.setValue(value); if (value != "") showDot("compile-output-dot"); };
    Compiler.setSanbox = function (value) { sandboxMessageEditor.setValue(value); if (value != "") showDot("sandbox-message-dot"); };
    Compiler.setStatus = function (value, time, memory) { $statusLine.html(value); };
    Compiler.setLang = function (value) { $selectLanguage.dropdown("set selected", value); };
    Compiler.setOpts = function (value) { $compilerOptions.val(value); };
    Compiler.setArgs = function (value) { $commandLineArguments.val(value); };

    Compiler.getSource = function () { return sourceEditor.getValue(); };
    Compiler.getInput = function () { return stdinEditor.getValue(); };
    Compiler.getOuput = function () { return stdoutEditor.getValue(); };
    Compiler.getError = function () { return stderrEditor.getValue(); };
    Compiler.getCompile = function () { return compileOutputEditor.getValue(); };
    Compiler.getSanbox = function () { return sandboxMessageEditor.getValue(); };
    Compiler.getLang = function () { return $selectLanguage.val(); };
    Compiler.getOpts = function () { return $compilerOptions.val(); };
    Compiler.getArgs = function () { return $commandLineArguments.val(); };
    Compiler.getStatus = function () { return $statusLine.html(); };

    Compiler.setSourceLanguage = function () { monaco.editor.setModelLanguage(sourceEditor.getModel(), $selectLanguage.find(":selected").attr("mode")); };
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

    Compiler.showError = function (title, content) {
      $("#site-modal #title").html(title);
      $("#site-modal .content").html(content);
      $("#site-modal").modal("show");
    }
    // ================================== //
    $('.dot').parent().click(function (event) {
      $(event.target).children('.dot')[0].hidden = true;
    });

    $(`input[name="theme-mode"][value="${themeMode}"]`).prop("checked", true);
    $("input[name=\"theme-mode\"]").on("change", function (e) {
      $('#site-settings').modal('hide');
      themeMode = e.target.value;
      Compiler.localStorageSetItem("themeMode", themeMode);
      monaco.editor.setTheme(themeMode);
      sourceEditor.focus();
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

      if (event.ctrlKey && (keyCode == 107 || keyCode == 187)) { // Ctrl + +
        e.preventDefault();
        fontSize += 1;
        editorsUpdateFontSize(fontSize);
        return;
      }

      if (event.ctrlKey && (keyCode == 109 || keyCode == 189)) { // Ctrl + -
        e.preventDefault();
        fontSize -= 1;
        editorsUpdateFontSize(fontSize);
        return;
      }

      if (event.ctrlKey && keyCode == 79) { // Ctrl + O
        e.preventDefault();
        $("#btnOpen").click();
        return;
      }

    });

  });
  function editorsUpdateFontSize(fontSize) {
    sourceEditor.updateOptions({ fontSize: fontSize });
    stdinEditor.updateOptions({ fontSize: fontSize });
    stdoutEditor.updateOptions({ fontSize: fontSize });
    stderrEditor.updateOptions({ fontSize: fontSize });
    compileOutputEditor.updateOptions({ fontSize: fontSize });
    sandboxMessageEditor.updateOptions({ fontSize: fontSize });
  }
  function ShareUrl() {
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val(window.location.href).select();
    document.execCommand("copy");
    $temp.remove();
    showMess("Thông báo", "Địa chỉ trang web đã được copy vào ClipBoard, hãy dán vào nơi khác để chia sẻ cho mọi người");
  }

  function showMess(title, content) {
    $("#mess-modal #title").html(title);
    $("#mess-modal .content").html(content);
    $("#mess-modal").modal("show");
  }

  var messagesData = "";
  function showMessages() {
    var $navigationMessage = $("#navigation-message span");
    var $about = $("#about");
    $navigationMessage.html("");
    $navigationMessage.parent().width(0);
    var width = $about.offset().left - parseFloat($about.css("padding-left")) - $navigationMessage.parent().offset().left - parseFloat($navigationMessage.parent().css("padding-left"));
    if (width < 100 || messagesData === undefined) { return; }
    var messages = messagesData["messages"];
    $navigationMessage.css("animation-duration", messagesData["duration"]);
    $navigationMessage.parent().width(width - 5);
    var combinedMessage = "";
    for (var i = 0; i < messages.length; ++i) {
      combinedMessage += `${messages[i]}`;
      if (i != messages.length - 1) {
        combinedMessage += "&nbsp".repeat(Math.min(200, messages[i].length));
      }
    }
    $navigationMessage.html(combinedMessage);
  }

  function loadMessages() {
    $.ajax({
      url: `https://hoanchan.github.io/live/ide/messages.json?${Date.now()}`,
      type: "GET",
      headers: {
        "Accept": "application/json"
      },
      success: function (data, textStatus, jqXHR) {
        messagesData = data;
        showMessages();
      }
    });
  }

  $(window).resize(function () {
    showMessages();
  });
})(window.jQuery);