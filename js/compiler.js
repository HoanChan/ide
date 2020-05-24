window.Compiler = function () {
  var me = this;
  // #region ==== Global Func ==== //
  me.getIdFromURI = function () { return location.search.substr(1).trim(); }
  me.onChangeContent = function (langID) { me.currentLanguageId = langID; }
  me.localStorageSetItem = function (key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (ignorable) {
    }
  }
  me.localStorageGetItem = function (key) {
    try {
      return localStorage.getItem(key);
    } catch (ignorable) {
      return null;
    }
  }
  // #endregion
  // #region ==== Local Var ==== //
  var defaultUrl = me.localStorageGetItem("api-url") || "https://api.judge0.com";
  var apiUrl = defaultUrl;
  var wait = me.localStorageGetItem("wait") || false;
  var pbUrl = "https://pb.judge0.com";
  var check_timeout = 200;
  // #endregion
  // #region ==== Global Var ==== //
  me.currentLanguageId = 67; //Pascal
  // #endregion
  // #region ==== Update UI Func ==== //
  me.showError = function (title, content) { };
  me.showLoading = function () { };
  me.hideLoading = function () { };

  me.setSource = function (value) { };
  me.setInput = function (value) { };
  me.setOutput = function (value) { };
  me.setError = function (value) { };
  me.setCompile = function (value) { };
  me.setSanbox = function (value) { };
  me.setLang = function (value) { };
  me.setArgs = function (value) { };
  me.setOpts = function (value) { };
  me.setStatus = function (value, time, memory) { };

  me.getSource = function () { return "" };
  me.getInput = function () { return "" };
  me.getOutput = function () { return "" };
  me.getError = function () { return "" };
  me.getCompile = function () { return "" };
  me.getSanbox = function () { return "" };
  me.getLang = function () { return "" };
  me.getArgs = function () { return "" };
  me.getOpts = function () { return "" };
  me.getStatus = function () { return "" };

  me.setSourceLanguage = function () { };
  me.setSourceFileName = function (fileName) { };

  me.afterRun = function () { };
  me.beforeRun = function () { };
  // #endregion
  // #region ==== Main Func ==== //
  me.run = function () {
    if (me.getSource().trim() === "") {
      me.showError("Lỗi", "Mã nguồn của chương trình không được để trống!");
      return;
    } else { me.showLoading(); }
    me.beforeRun();
    me.setOutput("");
    me.setError("");
    me.setCompile("");
    me.setSanbox("");

    var sourceValue = encode(me.getSource());
    var stdinValue = encode(me.getInput());
    var languageId = resolveLanguageId(me.getLang());
    var compilerOptions = me.getOpts();
    var commandLineArguments = me.getArgs();

    if (parseInt(languageId) === 44) {
      sourceValue = me.getSource();
    }

    var data = {
      source_code: sourceValue,
      language_id: languageId,
      stdin: stdinValue,
      compiler_options: compilerOptions,
      command_line_arguments: commandLineArguments
    };

    timeStart = performance.now();
    $.ajax({
      url: apiUrl + `/submissions?base64_encoded=true&wait=${wait}`,
      type: "POST",
      async: true,
      contentType: "application/json",
      data: JSON.stringify(data),
      success: function (data, textStatus, jqXHR) {
        console.log(`Your submission token is: ${data.token}`);
        if (wait == true) {
          handleResult(data);
        } else {
          setTimeout(fetchSubmission.bind(null, data.token), check_timeout);
        }
      },
      error: handleRunError
    });
  }
  // #endregion
  // #region ==== Save Support ==== //

  me.save = function () {
    var content = JSON.stringify({
      source_code: encode(me.getSource()),
      language_id: me.getLang(),
      compiler_options: me.getOpts(),
      command_line_arguments: me.getArgs(),
      stdin: encode(me.getInput()),
      stdout: encode(me.getOutput()),
      stderr: encode(me.getError()),
      compile_output: encode(me.getCompile()),
      sandbox_message: encode(me.getSanbox()),
      status_line: encode(me.getStatus())
    });
    var filename = "judge0-ide.json";
    var data = {
      content: content,
      filename: filename
    };

    $.ajax({
      url: pbUrl,
      type: "POST",
      async: true,
      headers: {
        "Accept": "application/json"
      },
      data: data,
      success: function (data, textStatus, jqXHR) {
        if (me.getIdFromURI() != data["short"]) {
          window.history.replaceState(null, null, location.origin + location.pathname + "?" + data["short"]);
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        handleError(jqXHR, textStatus, errorThrown);
      }
    });
  }

  me.loadSavedSource = function () {
    snippet_id = me.getIdFromURI();

    if (snippet_id.length == 36) {
      $.ajax({
        url: apiUrl + "/submissions/" + snippet_id + "?fields=source_code,language_id,stdin,stdout,stderr,compile_output,message,time,memory,status,compiler_options,command_line_arguments&base64_encoded=true",
        type: "GET",
        success: function (data, textStatus, jqXHR) {
          me.setSource(decode(data["source_code"]));
          me.setLang(data["language_id"]);
          me.setOpts(data["compiler_options"]);
          me.setArgs(data["command_line_arguments"]);
          me.setInput(decode(data["stdin"]));
          me.setOutput(decode(data["stdout"]));
          me.setError(decode(data["stderr"]));
          me.setCompile(decode(data["compile_output"]));
          me.setSanbox(decode(data["message"]));
          var time = (data.time === null ? "-" : data.time + "s");
          var memory = (data.memory === null ? "-" : data.memory + "KB");
          me.setStatus(`${data.status.description}, ${time}, ${memory}`);
          me.changeEditorLanguage();
        },
        error: handleRunError
      });
    } else if (snippet_id.length == 4) {
      $.ajax({
        url: pbUrl + "/" + snippet_id + ".json",
        type: "GET",
        success: function (data, textStatus, jqXHR) {
          me.setSource(decode(data["source_code"]));
          me.setLang(data["language_id"]);
          me.setOpts(data["compiler_options"]);
          me.setArgs(data["command_line_arguments"]);
          me.setInput(decode(data["stdin"]));
          me.setOutput(decode(data["stdout"]));
          me.setError(decode(data["stderr"]));
          me.setCompile(decode(data["compile_output"]));
          me.setSanbox(decode(data["sandbox_message"]));
          me.setStatus(decode(data["status_line"]));
          me.changeEditorLanguage();
        },
        error: function (jqXHR, textStatus, errorThrown) {
          me.showError("Not Found", "Code not found!");
          window.history.replaceState(null, null, location.origin + location.pathname);
          me.loadRandomLanguage();
        }
      });
    }
  }
  // #endregion
  // #region ==== Local Func ==== //
  function encode(str) { return btoa(unescape(encodeURIComponent(str || ""))); }
  function decode(bytes) {
    var escaped = escape(atob(bytes || ""));
    try {
      return decodeURIComponent(escaped);
    } catch {
      return unescape(escaped);
    }
  }

  function handleError(jqXHR, textStatus, errorThrown) {
    me.showError(`${jqXHR.statusText} (${jqXHR.status})`, `<pre>${JSON.stringify(jqXHR, null, 4)}</pre>`);
  }

  function handleRunError(jqXHR, textStatus, errorThrown) {
    handleError(jqXHR, textStatus, errorThrown);
    me.hideLoading();
  }

  function handleResult(data) {
    timeEnd = performance.now();
    console.log("It took " + (timeEnd - timeStart) + " ms to get submission result.");

    var status = data.status;
    var stdout = decode(data.stdout);
    var stderr = decode(data.stderr);
    var compile_output = decode(data.compile_output);
    var sandbox_message = decode(data.message);
    me.setStatus(status.description, data.time * 1000, data.memory);
    me.setOutput(stdout);
    me.setError(stderr);
    me.setCompile(compile_output);
    me.setSanbox(sandbox_message);
    me.hideLoading();
    me.afterRun();
  }

  function resolveLanguageId(id) {
    id = parseInt(id);
    return languageIdTable[id] || id;
  }

  function resolveApiUrl(id) {
    id = parseInt(id);
    return languageApiUrlTable[id] || defaultUrl;
  }

  function fetchSubmission(submission_token) {
    $.ajax({
      url: apiUrl + "/submissions/" + submission_token + "?base64_encoded=true",
      type: "GET",
      async: true,
      success: function (data, textStatus, jqXHR) {
        if (data.status.id <= 2) { // In Queue or Processing
          setTimeout(fetchSubmission.bind(null, submission_token), check_timeout);
          return;
        }
        handleResult(data);
      },
      error: handleRunError
    });
  }
  // #endregion
  // #region ==== Source Template ==== //

  me.changeEditorLanguage = function () {
    me.setSourceLanguage();
    currentLanguageId = parseInt(me.getLang());
    me.setSourceFileName(fileNames[currentLanguageId]);
    apiUrl = resolveApiUrl(me.getLang());
  }

  me.insertTemplate = function () {
    currentLanguageId = parseInt(me.getLang());
    me.setSource(sources[currentLanguageId]);
    me.changeEditorLanguage();
  }

  me.loadRandomLanguage = function () {
    me.setLang(me.currentLanguageId);
    apiUrl = resolveApiUrl(me.getLang());
    me.insertTemplate();
  }


  var assemblySource = "\
section	.text\n\
    global _start\n\
\n\
_start:\n\
\n\
    xor	eax, eax\n\
    lea	edx, [rax+len]\n\
    mov	al, 1\n\
    mov	esi, msg\n\
    mov	edi, eax\n\
    syscall\n\
\n\
    xor	edi, edi\n\
    lea	eax, [rdi+60]\n\
    syscall\n\
\n\
section	.rodata\n\
\n\
msg	db 'hello, world', 0xa\n\
len	equ	$ - msg\n\
";

  var bashSource = "echo \"hello, world\"";

  var basicSource = "PRINT \"hello, world\"";

  var cSource = "\
#include <stdio.h>\n\
\n\
int main(void) {\n\
    printf(\"hello, world\\n\");\n\
    return 0;\n\
}\n\
";

  var csharpSource = "\
public class Hello {\n\
    public static void Main() {\n\
        System.Console.WriteLine(\"hello, world\");\n\
    }\n\
}\n\
";

  var cppSource = "\
#include <iostream>\n\
\n\
int main() {\n\
    std::cout << \"hello, world\" << std::endl;\n\
    return 0;\n\
}\n\
";

  var cobolSource = "\
IDENTIFICATION DIVISION.\n\
PROGRAM-ID. MAIN.\n\
PROCEDURE DIVISION.\n\
DISPLAY \"hello, world\".\n\
STOP RUN.\n\
";

  var lispSource = "(write-line \"hello, world\")";

  var dSource = "\
import std.stdio;\n\
\n\
void main()\n\
{\n\
    writeln(\"hello, world\");\n\
}\n\
";

  var elixirSource = "IO.puts \"hello, world\"";

  var erlangSource = "\
main(_) ->\n\
    io:fwrite(\"hello, world\\n\").\n\
";

  var executableSource = "\
Judge0 IDE assumes that content of executable is Base64 encoded.\n\
\n\
This means that you should Base64 encode content of your binary,\n\
paste it here and click \"Run\".\n\
\n\
Here is an example of compiled \"hello, world\" NASM program.\n\
Content of compiled binary is Base64 encoded and used as source code.\n\
\n\
https://ide.judge0.com/?kS_f\n\
";

  var fortranSource = "\
program main\n\
    print *, \"hello, world\"\n\
end\n\
";

  var goSource = "\
package main\n\
\n\
import \"fmt\"\n\
\n\
func main() {\n\
    fmt.Println(\"hello, world\")\n\
}\n\
";

  var haskellSource = "main = putStrLn \"hello, world\"";

  var javaSource = "\
public class Main {\n\
    public static void main(String[] args) {\n\
        System.out.println(\"hello, world\");\n\
    }\n\
}\n\
";

  var javaScriptSource = "console.log(\"hello, world\");";

  var kotlinSource = "\
fun main() {\n\
    println(\"hello, world\")\n\
}\n\
";

  var luaSource = "print(\"hello, world\")";

  var objectiveCSource = "\
#import <Foundation/Foundation.h>\n\
\n\
int main() {\n\
    @autoreleasepool {\n\
        char name[10];\n\
        scanf(\"%s\", name);\n\
        NSString *message = [NSString stringWithFormat:@\"hello, %s\\n\", name];\n\
        printf(\"%s\", message.UTF8String);\n\
    }\n\
    return 0;\n\
}\n\
";

  var ocamlSource = "print_endline \"hello, world\"";

  var octaveSource = "printf(\"hello, world\\n\");";

  var pascalSource = "\
program Hello;\n\
begin\n\
    writeln ('hello, world')\n\
end.\n\
";

  var phpSource = "\
<?php\n\
print(\"hello, world\\n\");\n\
?>\n\
";

  var plainTextSource = "hello, world\n";

  var prologSource = "\
:- initialization(main).\n\
main :- write('hello, world\\n').\n\
";

  var pythonSource = "print(\"hello, world\")";

  var rSource = "cat(\"hello, world\\n\")";

  var rubySource = "puts \"hello, world\"";

  var rustSource = "\
fn main() {\n\
    println!(\"hello, world\");\n\
}\n\
";

  var scalaSource = "\
object Main {\n\
    def main(args: Array[String]) = {\n\
        val name = scala.io.StdIn.readLine()\n\
        println(\"hello, \"+ name)\n\
    }\n\
}\n\
";

  var sqliteSource = "\
-- On Judge0 IDE your SQL script is run on chinook database (https://www.sqlitetutorial.net/sqlite-sample-database).\n\
-- For more information about how to use SQL with Judge0 API please\n\
-- watch this asciicast: https://asciinema.org/a/326975.\n\
SELECT\n\
    Name, COUNT(*) AS num_albums\n\
FROM artists JOIN albums\n\
ON albums.ArtistID = artists.ArtistID\n\
GROUP BY Name\n\
ORDER BY num_albums DESC\n\
LIMIT 4;\n\
";
  var sqliteAdditionalFiles = "";

  var swiftSource = "\
import Foundation\n\
let name = readLine()\n\
print(\"hello, \\(name!)\")\n\
";

  var typescriptSource = "console.log(\"hello, world\");";

  var vbSource = "\
Public Module Program\n\
   Public Sub Main()\n\
      Console.WriteLine(\"hello, world\")\n\
   End Sub\n\
End Module\n\
";

  var c3Source = "\
// On the Judge0 IDE, C3 is automatically\n\
// updated every hour to the latest commit on master branch.\n\
module main;\n\
\n\
extern func void printf(char *str, ...);\n\
\n\
func int main()\n\
{\n\
    printf(\"hello, world\\n\");\n\
    return 0;\n\
}\n\
";

  var javaTestSource = "\
import static org.junit.jupiter.api.Assertions.assertEquals;\n\
\n\
import org.junit.jupiter.api.Test;\n\
\n\
class MainTest {\n\
    static class Calculator {\n\
        public int add(int x, int y) {\n\
            return x + y;\n\
        }\n\
    }\n\
\n\
    private final Calculator calculator = new Calculator();\n\
\n\
    @Test\n\
    void addition() {\n\
        assertEquals(2, calculator.add(1, 1));\n\
    }\n\
}\n\
";

  var mpiccSource = "\
// Try adding \"-n 5\" (without quotes) into command line arguments. \n\
#include <mpi.h>\n\
\n\
#include <stdio.h>\n\
\n\
int main()\n\
{\n\
    MPI_Init(NULL, NULL);\n\
\n\
    int world_size;\n\
    MPI_Comm_size(MPI_COMM_WORLD, &world_size);\n\
\n\
    int world_rank;\n\
    MPI_Comm_rank(MPI_COMM_WORLD, &world_rank);\n\
\n\
    printf(\"Hello from processor with rank %d out of %d processors.\\n\", world_rank, world_size);\n\
\n\
    MPI_Finalize();\n\
\n\
    return 0;\n\
}\n\
";

  var mpicxxSource = "\
// Try adding \"-n 5\" (without quotes) into command line arguments. \n\
#include <mpi.h>\n\
\n\
#include <iostream>\n\
\n\
int main()\n\
{\n\
    MPI_Init(NULL, NULL);\n\
\n\
    int world_size;\n\
    MPI_Comm_size(MPI_COMM_WORLD, &world_size);\n\
\n\
    int world_rank;\n\
    MPI_Comm_rank(MPI_COMM_WORLD, &world_rank);\n\
\n\
    std::cout << \"Hello from processor with rank \"\n\
              << world_rank << \" out of \" << world_size << \" processors.\\n\";\n\
\n\
    MPI_Finalize();\n\
\n\
    return 0;\n\
}\n\
";

  var mpipySource = "\
# Try adding \"-n 5\" (without quotes) into command line arguments. \n\
from mpi4py import MPI\n\
\n\
comm = MPI.COMM_WORLD\n\
world_size = comm.Get_size()\n\
world_rank = comm.Get_rank()\n\
\n\
print(f\"Hello from processor with rank {world_rank} out of {world_size} processors\")\n\
";

  var nimSource = "\
# On the Judge0 IDE, Nim is automatically\n\
# updated every day to the latest stable version.\n\
echo \"hello, world\"\n\
";

  var pythonForMlSource = "\
import mlxtend\n\
import numpy\n\
import pandas\n\
import scipy\n\
import sklearn\n\
\n\
print(\"hello, world\")\n\
";

  var bosqueSource = "\
// On the Judge0 IDE, Bosque (https://github.com/microsoft/BosqueLanguage)\n\
// is automatically updated every hour to the latest commit on master branch.\n\
\n\
namespace NSMain;\n\
\n\
concept WithName {\n\
    invariant $name != \"\";\n\
\n\
    field name: String;\n\
}\n\
\n\
concept Greeting {\n\
    abstract method sayHello(): String;\n\
    \n\
    virtual method sayGoodbye(): String {\n\
        return \"goodbye\";\n\
    }\n\
}\n\
\n\
entity GenericGreeting provides Greeting {\n\
    const instance: GenericGreeting = GenericGreeting@{};\n\
\n\
    override method sayHello(): String {\n\
        return \"hello world\";\n\
    }\n\
}\n\
\n\
entity NamedGreeting provides WithName, Greeting {\n\
    override method sayHello(): String {\n\
        return String::concat(\"hello\", \" \", this.name);\n\
    }\n\
}\n\
\n\
entrypoint function main(arg?: String): String {\n\
    var val = arg ?| \"\";\n\
    if (val == \"1\") {\n\
        return GenericGreeting@{}->sayHello();\n\
    }\n\
    elif (val == \"2\") {\n\
        return GenericGreeting::instance->sayHello();\n\
    }\n\
    else {\n\
        return NamedGreeting@{name=\"bob\"}->sayHello();\n\
    }\n\
}\n\
";

  var sources = {
    45: assemblySource,
    46: bashSource,
    47: basicSource,
    48: cSource,
    49: cSource,
    50: cSource,
    51: csharpSource,
    52: cppSource,
    53: cppSource,
    54: cppSource,
    55: lispSource,
    56: dSource,
    57: elixirSource,
    58: erlangSource,
    44: executableSource,
    59: fortranSource,
    60: goSource,
    61: haskellSource,
    62: javaSource,
    63: javaScriptSource,
    64: luaSource,
    65: ocamlSource,
    66: octaveSource,
    67: pascalSource,
    68: phpSource,
    43: plainTextSource,
    69: prologSource,
    70: pythonSource,
    71: pythonSource,
    72: rubySource,
    73: rustSource,
    74: typescriptSource,
    75: cSource,
    76: cppSource,
    77: cobolSource,
    78: kotlinSource,
    79: objectiveCSource,
    80: rSource,
    81: scalaSource,
    82: sqliteSource,
    83: swiftSource,
    84: vbSource,
    1001: cSource,
    1002: cppSource,
    1003: c3Source,
    1004: javaSource,
    1005: javaTestSource,
    1006: mpiccSource,
    1007: mpicxxSource,
    1008: mpipySource,
    1009: nimSource,
    1010: pythonForMlSource,
    1011: bosqueSource
  };

  var fileNames = {
    45: "main.asm",
    46: "script.sh",
    47: "main.bas",
    48: "main.c",
    49: "main.c",
    50: "main.c",
    51: "Main.cs",
    52: "main.cpp",
    53: "main.cpp",
    54: "main.cpp",
    55: "script.lisp",
    56: "main.d",
    57: "script.exs",
    58: "main.erl",
    44: "a.out",
    59: "main.f90",
    60: "main.go",
    61: "main.hs",
    62: "Main.java",
    63: "script.js",
    64: "script.lua",
    65: "main.ml",
    66: "script.m",
    67: "main.pas",
    68: "script.php",
    43: "text.txt",
    69: "main.pro",
    70: "script.py",
    71: "script.py",
    72: "script.rb",
    73: "main.rs",
    74: "script.ts",
    75: "main.c",
    76: "main.cpp",
    77: "main.cob",
    78: "Main.kt",
    79: "main.m",
    80: "script.r",
    81: "Main.scala",
    82: "script.sql",
    83: "Main.swift",
    84: "Main.vb",
    1001: "main.c",
    1002: "main.cpp",
    1003: "main.c3",
    1004: "Main.java",
    1005: "MainTest.java",
    1006: "main.c",
    1007: "main.cpp",
    1008: "script.py",
    1009: "main.nim",
    1010: "script.py",
    1011: "main.bsq"
  };

  var languageIdTable = {
    1001: 1,
    1002: 2,
    1003: 3,
    1004: 4,
    1005: 5,
    1006: 6,
    1007: 7,
    1008: 8,
    1009: 9,
    1010: 10,
    1011: 11
  }

  var extraApiUrl = "https://cors-anywhere.herokuapp.com/https://extra.api.judge0.com";
  var languageApiUrlTable = {
    1001: extraApiUrl,
    1002: extraApiUrl,
    1003: extraApiUrl,
    1004: extraApiUrl,
    1005: extraApiUrl,
    1006: extraApiUrl,
    1007: extraApiUrl,
    1008: extraApiUrl,
    1009: extraApiUrl,
    1010: extraApiUrl,
    1011: extraApiUrl
  }
  // #endregion
};