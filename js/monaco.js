"use strict";
(function ($) {
  window.Editor = {};
  const localStorageSetItem = function (key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (ignorable) {
    }
  }
  const localStorageGetItem = function (key) {
    try {
      return localStorage.getItem(key);
    } catch (ignorable) {
      return null;
    }
  }
  Editor.themeMode = localStorageGetItem("themeMode") || "vs-dark";
  Editor.fontSize = 14;
  Editor.Init = function (editorList, doneEvent) {
    Editor.Objs = editorList;
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
    require(["vs/editor/editor.main"], function () {
      // Through the options literal, the behaviour of the editor can be easily customized.
      // Here are a few examples of config options that can be passed to the editor.
      // You can also call editor.updateOptions at any time to change the options.
      $.when(
        $.getScript("https://unpkg.com/css-format-monaco/dist/css-format-monaco.min.js")
      ).done(function () {
        cssFormatMonaco(monaco, {
          "indent_size": "2",
          "indent_char": " ",
          "max_preserve_newlines": "-1",
          "preserve_newlines": false,
          "keep_array_indentation": false,
          "break_chained_methods": false,
          "indent_scripts": "normal",
          "brace_style": "collapse",
          "space_before_conditional": true,
          "unescape_strings": false,
          "jslint_happy": false,
          "end_with_newline": false,
          "wrap_line_length": "0",
          "indent_inner_html": false,
          "comma_first": false,
          "e4x": false,
          "indent_empty_lines": false
        });
      });

      $.each(Editor.Objs, function (index, el) {
        el.Obj = monaco.editor.create(document.getElementById(el.ID), {
          value: el.Value,
          language: el.Lang,
          automaticLayout: true, // the important part
          lineNumbers: el.LineNumbers ?? "on",
          tabSize: 2,
          roundedSelection: false,
          scrollBeyondLastLine: false,
          readOnly: el.ReadOnly ?? false,
          theme: Editor.themeMode,
          minimap: { enabled: el.Minimap ?? true }
        });
        el.Obj.getModel().onDidChangeContent(el.OnChange ?? function () { });
      });

      Editor.Resize = function () { $.each(Editor.Objs, function (index, el) { el.Obj.layout() }); };

      Editor.Get = function (id) {
        let result = Editor.Objs.filter(function (st) { return st.ID == id; });
        return result ? result[0].Obj : null;
      };
      $("body").keydown(function (e) {
        var keyCode = e.keyCode || e.which;

        if (event.ctrlKey && (keyCode == 107 || keyCode == 187)) { // Ctrl + +
          e.preventDefault();
          Editor.fontSize += 1;
          editorsUpdateFontSize(Editor.fontSize);
          return;
        }

        if (event.ctrlKey && (keyCode == 109 || keyCode == 189)) { // Ctrl + -
          e.preventDefault();
          Editor.fontSize -= 1;
          editorsUpdateFontSize(Editor.fontSize);
          return;
        }
      });

      function editorsUpdateFontSize(fontSize) { $.each(Editor.Objs, function (index, el) { el.Obj.updateOptions({ fontSize: fontSize }); }); }
      if (doneEvent) doneEvent();
    });
  }
})(window.jQuery);