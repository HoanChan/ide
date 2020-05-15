var loc = window.location.pathname;
var dir = "https://ckeditor.netlify.app";
// CKEDITOR.plugins.addExternal('codemirror', dir + '/Scripts/ckeditor/plugins/codemirror/', 'plugin.js');
CKEDITOR.plugins.addExternal('textselection', dir + '/Scripts/ckeditor/plugins/textselection/', 'plugin.js');
CKEDITOR.plugins.addExternal('pastebase64', dir + '/Scripts/ckeditor/plugins/pastebase64/', 'plugin.js');
CKEDITOR.plugins.addExternal('base64image', dir + '/Scripts/ckeditor/plugins/base64image/', 'plugin.js');
// CKEDITOR.plugins.addExternal('hccode', dir + '/js/ckeditor/plugins/hccode/', 'plugin.js');
var options = {
    //height: "100%",
    on: {
        'instanceReady': function (evt) {
            evt.editor.resize("100%", $("#editorContainer").height());
            // evt.editor.execCommand('maximize');
        }
    },
    resize_enabled: false,
    language: 'vi',
    enterMode: CKEDITOR.ENTER_BR,
    shiftEnterMode: CKEDITOR.ENTER_P,
    autoParagraph: false,
    extraPlugins: 'mathjax,codesnippet,pastebase64,base64image,textselection',//'codemirror,mathjax,codesnippet,pastebase64,base64image,textselection',
    mathJaxLib: 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.0/MathJax.js?config=TeX-AMS_HTML',
    codemirror: {
        theme: 'rubyblue',
        // Whether or not to automatically format code should be done when the editor is loaded
        autoFormatOnStart: false,
        // Whether or not to automatically format code which has just been uncommented
        autoFormatOnUncomment: true,
        // Whether or not to enable code formatting
        enableCodeFormatting: true,
        // "Whether or not to use Beautify for auto formatting On start
        useBeautifyOnStart: false,
        // Whether or not to show the search Code button on the toolbar
        showSearchButton: false,
        // Whether or not to show the format button on the toolbar
        showFormatButton: false,
        // Whether or not to show the comment button on the toolbar
        showCommentButton: false,
        // Whether or not to show the uncomment button on the toolbar
        showUncommentButton: false,
        // Whether or not to show the showAutoCompleteButton button on the toolbar
        showAutoCompleteButton: false,
    },
    // codeSnippet_theme: 'hc',
    codeSnippet_languages: {
        delphi: 'Pascal / Delphi',
        html: 'HTML / XML',
        css: 'CSS',
        scss: 'SCSS',
        less: 'LESS',
        cpp: 'C++',
        csharp: 'C#',
        vbnet: 'VB.Net',
        javascript: 'JavaScript',
        java: 'Java',
        php: 'PHP',
        python: 'Python',
        ruby: 'Ruby',
        sql: 'SQL',
        dos: 'DOS',
        markdown: 'Markdown',
        swift: 'Swift',
        vbs: 'VBScript'
    },
    toolbarGroups: [
        { name: 'document', groups: ['mode', 'document', 'doctools'] },
        { name: 'clipboard', groups: ['clipboard', 'undo'] },
        { name: 'editing', groups: ['find', 'selection', 'spellchecker', 'editing'] },
        { name: 'forms', groups: ['forms'] },
        { name: 'basicstyles', groups: ['basicstyles', 'cleanup'] },
        { name: 'paragraph', groups: ['list', 'indent', 'blocks', 'align', 'bidi', 'paragraph'] },
        { name: 'links', groups: ['links'] },
        { name: 'insert', groups: ['insert'] },
        { name: 'styles', groups: ['styles'] },
        { name: 'colors', groups: ['colors'] },
        { name: 'tools', groups: ['tools'] },
        { name: 'others', groups: ['others'] },
        { name: 'about', groups: ['about'] }
    ],
    removeButtons: 'Scayt,Form,Save,NewPage,Preview,Print,Templates,Cut,Copy,Undo,Redo,Find,Replace,SelectAll,Checkbox,TextField,Textarea,Select,Radio,Button,ImageButton,HiddenField,Bold,Italic,Underline,BidiLtr,BidiRtl,Language,Anchor,Flash,Image,Iframe,Maximize,About,ShowBlocks'
};
function dynamicInputAdd(id, data, remove) {
    var me = $(id);
    var field = me.find("#field").last();
    var newIn = field.html();
    var newInput = $('<div class="d-flex flex-row p-2" id="line">' + newIn + '</div>');
    newInput.children().show();
    newInput.find('#btn').last().addClass('remove-me bg-danger').removeClass('add-more').html('-');
    newInput.find('#value').html(data);
    field.before(newInput);
    me.find('.remove-me').click(function (e) {
        e.preventDefault();
        var element = $(this);
        while (element.attr('id') != 'line')
            element = element.parent();
        element.remove();
        if (remove) remove();
    });
    return newInput;
}
function initDynamicInput(id, add, remove) {
    $(id).find(".add-more").click(function (e) {
        e.preventDefault();
        dynamicInputAdd(id, "Nội dung", remove).find('#value').ckeditor(function () { }, options).editor;
        if (add) add();
    });
}