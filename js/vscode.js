(function ($) {
    var originalModel, modifiedModel, diffEditor
    Editor.Init([
        { ID: "codeEditor", Lang: "javascript", TabSize: 4, Value: "// First line\nfunction hello() {\n\talert('Hello world!');\n}\n// Last line" },
    ], function () {
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
            let file = await selectFile(".asm, .sh, .bas, .c, .c, .c, .cs, .cpp, .cpp, .cpp, .lisp, .d, .exs, .erl, .out, .f90, .go, .hs, .java, .js, .lua, .nim, .ml, .m, .pas, .php, .txt, .pro, .py, .py, .rb, .rs, .ts, .v", false);
            let reader = new FileReader();
            reader.onload = function () { originalModel.setValue(reader.result); };
            reader.readAsText(file);
        });
        $('#select-language').change(function (e) { 
            monaco.editor.setModelLanguage(Editor.Get("codeEditor").getModel(), $(this).val());
        });
        $('#select-theme').change(function (e) {
            monaco.editor.setTheme($(this).val())
        });
    });
})(window.jQuery);