"use strict";
(function ($) {
  let Data = [];
  let SelectedProblemIndex = -1;
  let SelectedTestIndex = -1;
  //#region CKeditor 
  let textEditor;

  function GetContent() {
    return textEditor.getData().replace(/>[\n\t ]+</g, "><");
  }

  function SetContent(htmlContent) {
    textEditor.setData((htmlContent ?? "").replace(/>[\n\t ]+</g, "><"));
  }

  function GetText() {
    return textEditor.editable().getText();
  }
  //#endregion
  //#region Func 
  function selectFolder() {
    return new Promise(resolve => {
      let input = $('<input type="file" name="files[]" id="files" multiple="" directory="" webkitdirectory="" mozdirectory="">').appendTo('body')[0];
      input.onchange = _ => {
        let files = Array.from(input.files);
        input.remove();
        resolve(files);
      };
      input.click();
    });
  }
  function selectFile(contentType, multiple) {
    return new Promise(resolve => {
      let input = document.createElement('input');
      input.type = 'file';
      input.multiple = multiple;
      input.accept = contentType;
      input.onchange = _ => {
        let files = Array.from(input.files);
        input.remove();
        if (multiple)
          resolve(files);
        else
          resolve(files[0]);
      };
      input.click();
    });
  }

  function ReadFile(file) {
    return new Promise(resolve => {
      let reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.readAsText(file);
    });
  }

  function AddProblem(name, index, isNew) {
    let field = $(`<div class="field"></div>`).insertBefore($('#btnAddProblem'));
    let inputGroup = $(`<div class="ui right mini action input w-100"></div>`).appendTo(field);;
    let input = $(`<input type="text" value="${name}">`).appendTo(inputGroup);
    let deleteButton = $(`<button class="ui right teal icon button"><i class="minus icon"></i></button>`).appendTo(inputGroup);
    if (isNew) {
      Data.push({
        Name: name,
        TimeLimit: 3000,
        MemoryLimit: 2500,
        Tests: []
      });
    }
    $(input).change(function (e) {
      Data[SelectedProblemIndex].Name = input.val();
    });

    $(input).click(function (e) {
      SelectedProblemIndex = index;
      SetContent(Data[index].Content);
      $('#txtTimeLimit').val(Data[index].TimeLimit);
      $('#txtMemoryLimit').val(Data[index].MemoryLimit);
      $('#btnAddTest').parent().find(".field").remove();
      for (let i = 0; i < Data[index].Tests.length; i++) {
        let element = Data[index].Tests[i];
        let test = AddTest(element.Name, i, false);
        if (i == 0) test.click();
      }
      $('#ProblemList').find('.icon.button').removeClass('red').addClass('teal');
      deleteButton.removeClass('teal').addClass('red');
    });

    $(deleteButton).click(function (e) {
      var thisIndex = Array.prototype.indexOf.call(field[0].parentNode.children, field[0]);
      Data.splice(thisIndex, 1);
      $(field).remove();
    });
    return input;
  }
  function AddTest(name, index, isNew) {
    let field = $(`<div class="field"></div>`).insertBefore($('#btnAddTest'));
    let inputGroup = $(`<div class="ui right mini action input w-100"></div>`).appendTo(field);
    let input = $(`<input type="text" value="${name}">`).appendTo(inputGroup);
    let deleteButton = $(`<button class="ui right teal icon button"><i class="minus icon"></i></button>`).appendTo(inputGroup);
    if (isNew) {
      Data[SelectedProblemIndex].Tests.push({
        Name: name,
        Input: "",
        Output: ""
      });
    }
    $(input).change(function (e) {
      Data[SelectedProblemIndex].Tests[index].Name = input.val();
    }).click(function (e) {
      SelectedTestIndex = index;
      let test = Data[SelectedProblemIndex].Tests[index];
      $('#txtInput').val(test.Input);
      $('#txtOutput').val(test.Output);
      $('#TestList').find('.icon.button').removeClass('red').addClass('teal');
      deleteButton.removeClass('teal').addClass('red');
    });

    $(deleteButton).click(function (e) {
      var thisIndex = Array.prototype.indexOf.call(field[0].parentNode.children, field[0]);
      Data[SelectedProblemIndex].Tests.splice(thisIndex, 1);
      $(field).remove();
    });
    return input;
  }
  function showMess(title, content) {
    $("#site-modal #title").html(title);
    $("#site-modal .content").html(content);
    $("#site-modal").modal("show");
  }
  //#endregion
  //#region Events
  $(document).ready(function () {
    $('.tabular.menu .item').tab();
    $("select.dropdown").dropdown();
    $(".ui.dropdown").dropdown();
    $(".ui.dropdown.site-links").dropdown({ action: "hide", on: "hover" });
    $(".ui.checkbox").checkbox();

    $(".message .close").on("click", function () {
      $(this).closest(".message").transition("fade");
    });

    $('#btnOpen').click(async function (e) {
      let file = await selectFile(".json", false);
      let fileData = await ReadFile(file);
      Data = JSON.parse(fileData);
      $('#btnAddProblem').parent().find(".field").remove();
      for (let index = 0; index < Data.length; index++) {
        let element = Data[index];
        let pro = AddProblem(element.Name, index, false);
        if (index == 0) pro.click();
      }
    });

    $('#btnImport').click(async function (e) {
      let files = await selectFolder();
      files = files.filter(function (element, index, array) {
        return element.name.endsWith('.inp') || element.name.endsWith('.out');
      }).reverse(); // Đảo lại do file được lên danh sách ngược
      if (files.length % 2 != 0) {
        console.log('Files Count even');
        console.log(files);
        return;
      }
      let newIndex = Data[SelectedProblemIndex].Tests.length;
      for (let index = 0; index < files.length; index += 2, newIndex++) {
        let inputFile = await ReadFile(files[index + 1]);
        let outputFile = await ReadFile(files[index]);
        AddTest("Import Test " + (index / 2 + 1), newIndex, true);
        Data[SelectedProblemIndex].Tests[newIndex].Input = inputFile.trim();
        Data[SelectedProblemIndex].Tests[newIndex].Output = outputFile.trim();
      }
    });

    $('#btnSave').click(function (e) {
      download(JSON.stringify(Data), "data.json", "text/plain");
    });

    $('#btnAddProblem').click(function (e) {
      AddProblem('Problem', $(this).parent().children().length - 1, true).click();
    });

    $('#btnAddTest').click(function (e) {
      if (!Data.length || Data.length == 0) return
      AddTest('Test', $(this).parent().children().length - 1, true).click();
    });

    $('#txtInput').change(function (e) {
      Data[SelectedProblemIndex].Tests[SelectedTestIndex].Input = $(this).val();
    });

    $('#txtOutput').change(function (e) {
      Data[SelectedProblemIndex].Tests[SelectedTestIndex].Output = $(this).val();
    });

    $('#txtTimeLimit').change(function (e) {
      Data[SelectedProblemIndex].TimeLimit = $(this).val();
    });

    $('#txtMemoryLimit').change(function (e) {
      Data[SelectedProblemIndex].MemoryLimit = $(this).val();
    });

    $('#btnRename').click(function (e) {
      let str = $('#txtRename').val();
      if (str == "") {
        $('#lblRenameError').html(`<ul class="list"><li>Nhập tên vào đã chứ</li></ul>`).show();
        return;
      }
      $('#lblRenameError').hide();
      for (let index = 0; index < Data[SelectedProblemIndex].Tests.length; index++) {
        let name = str + " " + (index + 1);
        Data[SelectedProblemIndex].Tests[index].Name = name;
        $('#TestList input:nth-child(' + index + ')').val(name);
      }
    });

    textEditor = $('#txtEdit').ckeditor(function () { }, options).editor;
    textEditor.on('change', function () {
      Data[SelectedProblemIndex].Content = GetContent();
    });

    window.MonacoResize = function () {
      textEditor.resize("100%", $("#editorContainer").height());
    };
    //#endregion
  });
})(window.jQuery);