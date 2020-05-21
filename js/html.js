/// <reference path="main.js" />
"use strict";
(function ($) {
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
  var htmlEditor, cssEditor, jsEditor;
  require(["vs/editor/editor.main"], function () {
    // Through the options literal, the behaviour of the editor can be easily customized.
    // Here are a few examples of config options that can be passed to the editor.
    // You can also call editor.updateOptions at any time to change the options.

    htmlEditor = monaco.editor.create(document.getElementById("HTML"), {
      value: "<html>\n<head>\n</head>\n<body>\n\t<p>Hello</p>\n</body>\n</html>",
      language: "html",
      automaticLayout: true, // the important part
      lineNumbers: "on",
      roundedSelection: false,
      scrollBeyondLastLine: false,
      readOnly: false,
      theme: themeMode,
    });

    cssEditor = monaco.editor.create(document.getElementById("CSS"), {
      value: "p{\n\tcolor:red;\n}",
      language: "css",
      automaticLayout: true, // the important part
      lineNumbers: "on",
      roundedSelection: false,
      scrollBeyondLastLine: false,
      readOnly: false,
      theme: themeMode,
    });

    jsEditor = monaco.editor.create(document.getElementById("JS"), {
      value: "function doSomeThing(){\n}",
      language: "javascript",
      automaticLayout: true, // the important part
      lineNumbers: "on",
      roundedSelection: false,
      scrollBeyondLastLine: false,
      readOnly: false,
      theme: themeMode,
    });

    htmlEditor.getModel().onDidChangeContent(UpdateResult2);
    cssEditor.getModel().onDidChangeContent(UpdateResult2);
    jsEditor.getModel().onDidChangeContent(UpdateResult2);

    LoadTemplates("jquery");

    window.MonacoResize = function () {
      htmlEditor.layout();
      cssEditor.layout();
      jsEditor.layout();
    };
  });
  let Updating = false;
  function LoadTemplates(name) {
    $.ajax({
      async: false,
      type: 'GET',
      url: `templates/html/${name}.html`,
      success: function (data) {
        Updating = true;
        let result = data.split(/^\<\!--@-->/gm);
        htmlEditor.setValue(result.length > 0 ? result[0].trim() : "");
        cssEditor.setValue(result.length > 1 ? result[1].trim() : "");
        jsEditor.setValue(result.length > 2 ? result[2].trim() : "");
        Updating = false;
        UpdateResult2();
      },
      fail: function () {
        console.log(`templates/html/${name}.html NOT FOUND`);
      }
    });
  }

  function UpdateResult() {
    if (Updating) return;
    Updating = true;
    const frame1 = document.getElementById('RESULT');
    const frameDoc = frame1.contentWindow || frame1.contentDocument.document || frame1.contentDocument;
    const regex = /^\<head\>(.*?)\<\/head\>.*?\<body\>(.*?)\<\/body\>/gsm;
    var str = htmlEditor.getValue();
    let html = `<html><head><style>${cssEditor.getValue()}</style></head>
    <body>${str}<script>${jsEditor.getValue()}</script></body></html>`;
    var result = regex.exec(str);
    if (result && result.length > 2) {
      html = `<html><head>${result[1]}<style>${cssEditor.getValue()}</style></head>
    <body>${result[2]}<script>${jsEditor.getValue()}</script></body></html>`;
    }
    frameDoc.document.write(html);
    frameDoc.document.close();
    Updating = false;
  }
  
  function UpdateResult2() {
    const getGeneratedPageURL = ({ html, css, js, head }) => {
      const getBlobURL = (code, type) => {
        const blob = new Blob([code], { type })
        return URL.createObjectURL(blob)
      }

      const cssURL = getBlobURL(css, 'text/css');
      const jsURL = getBlobURL(js, 'text/javascript');

      const source = `
        <html>
          <head>
            ${head || ""}
            ${css && `<link rel="stylesheet" type="text/css" href="${cssURL}" />`}
          </head>
          <body>
            ${html || ''}
            ${js && `<script src="${jsURL}"></script>`}
          </body>
        </html>
      `;
      return getBlobURL(source, 'text/html');
    }
    const regex = /^\<head\>(.*?)\<\/head\>.*?\<body\>(.*?)\<\/body\>/gsm;
    var str = htmlEditor.getValue();
    let url = getGeneratedPageURL({
      html: str,
      css: cssEditor.getValue(),
      js: jsEditor.getValue()
    })
    var result = regex.exec(str);
    if (result && result.length > 2) {
      url = getGeneratedPageURL({
        html: result[2],
        css: cssEditor.getValue(),
        js: jsEditor.getValue(),
        head: result[1]
      })
    }

    const iframe = document.querySelector('#RESULT')
    iframe.src = url
  }
  
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
    // $('.tabular.menu .item').tab();
    // $("select.dropdown").dropdown();
    $(".ui.dropdown").dropdown();
    $(".ui.dropdown.site-links").dropdown({ action: "hide", on: "hover" });
    $(".ui.checkbox").checkbox();
    $(".message .close").on("click", function () {
      $(this).closest(".message").transition("fade");
    });
    // =================================== //
    loadMessages();

    // $("#btnOpen").click(async function (e) {
    //   let file = await selectFile(".asm, .sh, .bas, .c, .c, .c, .cs, .cpp, .cpp, .cpp, .lisp, .d, .exs, .erl, .out, .f90, .go, .hs, .java, .js, .lua, .nim, .ml, .m, .pas, .php, .txt, .pro, .py, .py, .rb, .rs, .ts, .v", false);
    //   let reader = new FileReader();
    //   reader.onload = function () { htmlEditor.setValue(reader.result); };
    //   reader.readAsText(file);
    // });

    // $("#btnSave").click(function (e) {
    //   Compiler.save()
    // });

    $("#btnDownload").click(function (e) {
      var value = parseInt($selectLanguage.val());
      download(htmlEditor.getValue(), $(".lm_title")[0].innerText, "text/plain");
    });

    $("#btnShare").click(function (e) {
      var $temp = $("<input>");
      $("body").append($temp);
      $temp.val(window.location.href).select();
      document.execCommand("copy");
      $temp.remove();
      ShowDialog("Thông báo", "Địa chỉ trang web đã được copy vào ClipBoard, hãy dán vào nơi khác để chia sẻ cho mọi người", "cyan");
    });

    // $("#btnInsertCode").click(function (e) {
    //   if (confirm("Bạn có chắc sẽ làm điều này không? Toàn bộ mã nguồn hiện tại sẽ bị thay thế.")) {
    //     Compiler.insertTemplate();
    //   }
    // });


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
    htmlEditor.updateOptions({ fontSize: fontSize });
    cssEditor.updateOptions({ fontSize: fontSize });
    jsEditor.updateOptions({ fontSize: fontSize });
    stderrEditor.updateOptions({ fontSize: fontSize });
    compileOutputEditor.updateOptions({ fontSize: fontSize });
    sandboxMessageEditor.updateOptions({ fontSize: fontSize });
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
      url: `messages.json?${Date.now()}`,
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