"use strict";
(function ($) {
  Editor.Init([
    { ID: "HTML", Lang: "html", Value: "<html>\n<head>\n</head>\n<body>\n\t<p>Hello</p>\n</body>\n</html>", OnChange : UpdateResult },
    { ID: "CSS", Lang: "css", Value: "p{\n\tcolor:red;\n}", OnChange : UpdateResult },
    { ID: "JS", Lang: "javascript", Value: "function doSomeThing(){\n}", OnChange : UpdateResult }
  ], function () { $('.btnInsertCode:first-child').click(); });
  window.MonacoResize = Editor.Resize;

  function GetCode(str) {
    let data = str.split('\n');
    while (data.length > 0 && data[0] == "") data.shift();
    while (data.length > 0 && data[data.length - 1] == "") data.pop();
    if (data.length == 0) return str;
    return data.map(a => a.length > 2 && a.substring(0, 2) == "  " ? a.substring(2) : a).join('\n');
  }

  let Updating = false;
  function LoadTemplates(name) {
    $.ajax({
      async: false,
      type: 'GET',
      url: `templates/html/${name}.html`,
      success: function (data) {
        Updating = true;
        const regex = /<head>(.*?<\/head>\s*<body>.*?<\/body>)\s*<style>(.*?)<\/style>\s*<script>(.*?)<\/script>/gms;
        let result = regex.exec(data);
        Editor.Get('HTML').setValue(result.length > 1 ? result[1].trim() : "");
        Editor.Get('CSS').setValue(result.length > 2 ? GetCode(result[2]) : "");
        Editor.Get('JS').setValue(result.length > 3 ? GetCode(result[3].trim()) : "");
        Updating = false;
        UpdateResult();
      },
      fail: function () {
        console.log(`templates/html/${name}.html NOT FOUND`);
      }
    });
  }
  
  function UpdateResult() {
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
    var str = Editor.Get('HTML').getValue();
    let url = getGeneratedPageURL({
      html: str,
      css: Editor.Get('CSS').getValue(),
      js: Editor.Get('JS').getValue()
    })
    var result = regex.exec(str);
    if (result && result.length > 2) {
      url = getGeneratedPageURL({
        html: result[2],
        css: Editor.Get('CSS').getValue(),
        js: Editor.Get('JS').getValue(),
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
    $(".ui.dropdown").dropdown();
    $(".ui.dropdown.site-links").dropdown({ action: "hide", on: "hover" });
    $(".ui.checkbox").checkbox();
    $(".message .close").on("click", function () {
      $(this).closest(".message").transition("fade");
    });
    // =================================== //
    $('.btnInsertCode').click(function (e) { 
      LoadTemplates($(this).data("template"));
    });

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