(function ($) {
  let resizableSize = 8;
  function getData(element, dataName, defaultValue, defaultUnit) {
    let sizeData = String(element.data(dataName));
    let size = parseInt(sizeData) || defaultValue;
    if (sizeData.endsWith("%")) { return { size, unit: "%" }; }
    if (sizeData.endsWith("px")) { return { size, unit: "px" }; }
    if (sizeData.endsWith("em")) { return { size, unit: "em" }; }
    if (sizeData.endsWith("rem")) { return { size, unit: "rem" }; }
    return { size, unit: defaultUnit };
  }
  function HideResize() {
    $(".resizable.column").each(function (index, element) {
      let resizableV = $(this);
      if (resizableV.css('display') == 'none' || resizableV.css("visibility") == "hidden") {
        resizableV.prev().css("width", "");
        resizableV.next().css("width", "");
        return;
      } else {
        let leftSize = getData(resizableV, "size", 50, "%");
        resizableV.css("width", resizableSize + "px");
        resizableV.prev().css("width", "calc(" + leftSize.size + leftSize.unit + " - " + resizableSize / 2 + "px)");
        resizableV.next().css("width", "calc(100% - " + leftSize.size + leftSize.unit + " - " + resizableSize / 2 + "px)");
      }
    });

    $(".resizable.row").each(function (index, element) {
      let resizableH = $(this);
      if (resizableH.css('display') == 'none' || resizableH.css("visibility") == "hidden") {
        resizableH.prev().css("height", "");
        resizableH.next().css("height", "");
        return;
      } else {
        let topSize = getData(resizableH, "size", 50, "%");
        resizableH.css("height", resizableSize + "px");
        resizableH.prev().css("height", "calc(" + topSize.size + topSize.unit + " - " + resizableSize / 2 + "px)");
        resizableH.next().css("height", "calc(100% - " + topSize.size + topSize.unit + " - " + resizableSize / 2 + "px)");
      }
    });
  }
  function CalcSize(size, unit, rootSize) {
    let result = size;
    if (unit == "px") result = size / rootSize * 100;
    if (unit == "em") result = (size * parseFloat(el.parent().css("font-size"))) / rootSize * 100;
    if (unit == "rem") result = (size * parseFloat($("body").css("font-size"))) / rootSize * 100;
    return result;
  }
  function MinMax(element, vertical) {
    let size = 8;
    let max = getData($(element), "max", 70, "%");
    let min = getData($(element), "min", 30, "%");
    let el = $(element);
    let rect = el.parent()[0].getBoundingClientRect(); // lấy thông tin parent tính cả padding và border
    if (vertical) {
      let maxS = CalcSize(max.size, max.unit, rect.width);
      let minS = CalcSize(min.size, min.unit, rect.width);
      let leftWidth = el.prev()[0].getBoundingClientRect().width / rect.width * 100;
      if (leftWidth < minS || leftWidth > maxS) {
        leftWidth = Math.min(maxS, Math.max(minS, leftWidth));
        let rightWidth = 100 - leftWidth;
        el.prev().css("width", "calc(" + leftWidth + "% - " + resizableSize / 2 + "px)");
        el.next().css("width", "calc(" + rightWidth + "% - " + resizableSize / 2 + "px)");
      }
    }
    else {
      let maxS = CalcSize(max.size, max.unit, rect.height);
      let minS = CalcSize(min.size, min.unit, rect.height);
      let topHeight = el.prev()[0].getBoundingClientRect().height / rect.height * 100;
      if (topHeight < minS || topHeight > maxS) {
        topHeight = Math.min(maxS, Math.max(minS, topHeight));
        let botHeight = 100 - topHeight;
        el.prev().css("height", "calc(" + topHeight + "% - " + resizableSize / 2 + "px)");
        el.next().css("height", "calc(" + botHeight + "% - " + resizableSize / 2 + "px)");
      }
    }
    if (typeof MonacoResize != 'undefined' && MonacoResize) MonacoResize();

  }
  function FixMinMax(element) {
    let resizableV = element.find(".resizable.column");
    let resizableH = element.find(".resizable.row");
    resizableV.each(function (index) { MinMax(this, true); });
    resizableH.each(function (index) { MinMax(this, false); });
  }
  $(window).resize(function () {
    HideResize();
  });
  $(document).ready(function () {
    let size = 8;
    let resizableV = $(".resizable.column");
    let resizableH = $(".resizable.row");
    resizableV.each(function (index) { dragElement(this, true); });
    resizableH.each(function (index) { dragElement(this, false); });
    HideResize();
    function dragElement(element, vertical) {
      let max = getData($(element), "max", 70, "%");
      let min = getData($(element), "min", 30, "%");
      element.onmousedown = function (e) {
        e = e || window.event;
        e.preventDefault();
        document.onmouseup = function () {/* stop moving when mouse button is released:*/
          document.onmouseup = null;
          document.onmousemove = null;
        };
        document.onmousemove = function (e) {// call a function whenever the cursor moves:
          e = e || window.event;
          e.preventDefault();
          let el = $(element);
          let rect = el.parent()[0].getBoundingClientRect(); // lấy thông tin parent tính cả padding và border
          let x = e.clientX - rect.left; //x position within the element.
          let y = e.clientY - rect.top;  //y position within the element.
          if (vertical) {
            let maxS = CalcSize(max.size, max.unit, rect.width);
            let minS = CalcSize(min.size, min.unit, rect.width);
            let leftWidth = Math.min(maxS, Math.max(minS, x / rect.width * 100));
            let rightWidth = 100 - leftWidth;
            el.prev().css("width", "calc(" + leftWidth + "% - " + resizableSize / 2 + "px)");
            el.next().css("width", "calc(" + rightWidth + "% - " + resizableSize / 2 + "px)");
          }
          else {
            let maxS = CalcSize(max.size, max.unit, rect.height);
            let minS = CalcSize(min.size, min.unit, rect.height);
            let topHeight = Math.min(maxS, Math.max(minS, y / rect.height * 100));
            let botHeight = 100 - topHeight;
            el.prev().css("height", "calc(" + topHeight + "% - " + resizableSize / 2 + "px)");
            el.next().css("height", "calc(" + botHeight + "% - " + resizableSize / 2 + "px)");
          }
          FixMinMax(el.prev());
          FixMinMax(el.next());
          if (typeof MonacoResize != 'undefined' && MonacoResize) MonacoResize();
        };
      }
    }
  });
})(window.jQuery);