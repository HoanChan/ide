/// <reference path="main.js" />
(function ($) {
  //#region Editor

  var $selectLanguage;
  var Compiler = new window.Compiler();
  Editor.Init([
    { ID: "codeEditor", Lang: "javascript", Value: "// First line\nfunction hello() {\n\talert('Hello world!');\n}\n// Last line" },
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
  
  //#endregion
  //#region Tests
  var TestReults = [];
  var Problem;
  function CreateTestData(index) {
    return `
              <div class="ui relaxed divided list">
                <div class="item">
                  <div class="right floated content">
                    <a class="header">Thời gian thực hiện</a>
                    <div class="text-right description">${TestReults[index] ? TestReults[index].Time / 1000 : ""} s</div>
                  </div>
                  <i class="large middle aligned clock outline icon"></i>
                  <div class="content">
                    <a class="header">Giới hạn thời gian</a>
                    <div class="description">${Problem ? Problem.TimeLimit / 1000 : ""} s</div>
                  </div>
                </div>
                <div class="item">
                  <div class="right floated content">
                    <a class="header">Bộ nhớ sử dụng</a>
                    <div class="text-right description">${TestReults[index] ? TestReults[index].Memory : ""} KB</div>
                  </div>
                  <i class="large middle aligned microchip icon"></i>
                  <div class="content">
                    <a class="header">Giới hạn bộ nhớ</a>
                    <div class="description">${Problem ? Problem.MemoryLimit : ""} KB</div>
                  </div>
                </div>
                <div class="item">
                  <div class="right floated content">
                    <a class="header">Input</a>
                    <div class="text-right description">${TestReults[index] ? TestReults[index].Input : ""}</div>
                  </div>
                  <i class="large middle aligned keyboard icon"></i>
                  <div class="content">
                    <a class="header">Input</a>
                    <div class="description">${Problem ? Problem.Tests[index].Input : ""}</div>
                  </div>
                </div>
                <div class="item">
                  <div class="right floated content">
                    <a class="header">Output thực tế</a>
                    <div class="text-right description">${TestReults[index] ? TestReults[index].Output : ""}</div>
                  </div>
                  <i class="large middle aligned desktop icon"></i>
                  <div class="content">
                    <a class="header">Output</a>
                    <div class="description">${Problem ? Problem.Tests[index].Output : ""}</div>
                  </div>
                </div>
                <div class="item">
                  <div class="ui styled accordion w-100">
                    <div class="title"><i class="dropdown icon"></i>Thông báo biên dịch</div>
                    <div class="content">${TestReults[index] ? TestReults[index].Compile.replace(/\n/g, "<br />") : 0}</div>
                    <div class="title"><i class="dropdown icon"></i>Thông báo lỗi</div>
                    <div class="content">${TestReults[index] ? TestReults[index].Error.replace(/\n/g, "<br />") : 0}</div>
                  </div>                
                </div>
              </div>
            `;
  }
  function CreateTests(file) {
    let reader = new FileReader();
    reader.onload = function () {
      var data = JSON.parse(reader.result);
      console.log(data);
      $("#left").html("");
      let menu = $(`<div class="ui top attached tabular mini menu"></div>`).appendTo("#left");
      let content = $(`<div class="ui bottom attached segment"></div>`).appendTo("#left");
      for (let index = 0; index < data.length; index++) {
        let item = $(`<a class="${index == 0 ? "active " : ""}item"></a`).html(data[index].Name).on('click', function () {
          Problem = data[index];
          menu.children(".item").removeClass('active');
          $(this).addClass('active');
          content.html("<h2>" + Problem.Name + "</h2>" + "<div>" + Problem.Content + "</div>");
          let tests = Problem.Tests;
          $("#testList").html("");
          for (let i = 0; i < tests.length; i++) {
            let test = $(`<a class="teal item">${tests[i].Name}</a>`)
              .on('click', function () {
                $('#testList .item').removeClass('active');
                $(this).addClass('active');
                $("#testInfo").html(CreateTestData(i));
                $('.ui.accordion').accordion();
              });
            $("#testList").append(test);
            if (i == 0) test.click();
          }
        }).appendTo(menu);
        if (index == 0) item.click();
      }
    };
    reader.readAsText(file);
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
  function CreateResults() {
    $("#btnRun").addClass("loading");
    let tests = Problem.Tests;
    TestReults = Array(tests.length);
    var Counter = 0;
    for (let index = 0; index < tests.length; index++) {
      let testCompiler = new window.Compiler();
      let result = {};
      testCompiler.setSource = function (value) { Editor.Get("codeEditor").setValue(value); };
      // testCompiler.setInput = function (value) { result.Input = value; };
      result.Input = tests[index].Input;
      testCompiler.setOutput = function (value) { result.Output = value; };
      testCompiler.setError = function (value) { result.Error = value; };
      testCompiler.setCompile = function (value) { result.Compile = value; };
      testCompiler.setSanbox = function (value) { result.Sanbox = value; };
      testCompiler.setStatus = function (status, time, memory) { result.Time = time; result.Memory = memory; };
      testCompiler.getSource = function () { return Editor.Get("codeEditor").getValue(); };
      testCompiler.getInput = function () { return tests[index].Input; };
      testCompiler.getOuput = function () { return tests[index].Output; };
      testCompiler.getLang = function () { return $selectLanguage.val(); };
      testCompiler.afterRun = function () {
        console.log(result);
        TestReults[index] = result;
        testCompiler = null;
        let correct = TestReults[index] && (TestReults[index].Output == Problem.Tests[index].Output);
        let label = correct ? '<div class="ui teal left pointing label">Đúng</div>' : '<div class="ui red left pointing label">Sai</div>';
        $("#testList").children().eq(index).html(`${tests[index].Name} ${label}`).removeClass("active");
        Counter++;
        if (Counter == tests.length) {
          $("#btnRun").removeClass("loading");
          $("#testList .item:first-child").click();
        }
      };
      testCompiler.run();
    }
  }
  //#endregion
  //#region events
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
    $("#testInfo").html(CreateTestData(0));
    $('.ui.accordion').accordion();
    $('#testList .item').on('click', function () {
      $('#testList .item').removeClass('active');
      $(this).addClass('active');
    });
    // =================================== //
    loadMessages();
    $("#btnOpen").click(async function (e) {
      let file = await selectFile(".asm, .sh, .bas, .c, .c, .c, .cs, .cpp, .cpp, .cpp, .lisp, .d, .exs, .erl, .out, .f90, .go, .hs, .java, .js, .lua, .nim, .ml, .m, .pas, .php, .txt, .pro, .py, .py, .rb, .rs, .ts, .v", false);
      let reader = new FileReader();
      reader.onload = function () { Editor.Get("codeEditor").setValue(reader.result); };
      reader.readAsText(file);
    });
    $("#btnOpenTest").click(async function (e) {
      let file = await selectFile(".json", false);
      CreateTests(file);
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

    $("#btnRun").click(function (e) {
      if ($("#btnRun").hasClass("loading")) return;
      CreateResults();
    });
    $selectLanguage = $("#select-language").change(function (e) {
      Compiler.changeEditorLanguage();
    });

    Compiler.setSource = function (value) { Editor.Get("codeEditor").setValue(value); };
    Compiler.setLang = function (value) { $selectLanguage.dropdown("set selected", value); };

    Compiler.getSource = function () { return Editor.Get("codeEditor").getValue(); };
    Compiler.getLang = function () { return $selectLanguage.val(); };

    Compiler.setSourceLanguage = function () { monaco.editor.setModelLanguage(Editor.Get("codeEditor").getModel(), $selectLanguage.find(":selected").attr("mode")); };
    Compiler.setSourceFileName = function (fileName) { $(".lm_title")[0].innerText = fileName; };

    Compiler.showError = function (title, content) { ShowDialog(title, content, 'red'); }

    // ================================== //
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
        $("#btnRun").click();
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
        Editor.Get("codeEditor").updateOptions({ fontSize: fontSize });
        return;
      }

      if (event.ctrlKey && (keyCode == 109 || keyCode == 189)) { // Ctrl + -
        e.preventDefault();
        fontSize -= 1;
        Editor.Get("codeEditor").updateOptions({ fontSize: fontSize });
        return;
      }

      if (event.ctrlKey && keyCode == 79) { // Ctrl + O
        e.preventDefault();
        $("#btnOpen").click();
        return;
      }

    });

  });

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
  //#endregion
})(window.jQuery);