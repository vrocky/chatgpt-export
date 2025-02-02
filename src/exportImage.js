const getTimestamp = require("./util/getTimestamp");

(function exportImage() {
  // download img
  function triggerDownload(imgURI) {
    var evt = new MouseEvent("click", {
      view: window,
      bubbles: false,
      cancelable: true,
    });

    const title = document.getElementsByTagName("title")[0].innerText;
    let filename = title ? title.trim().toLowerCase().replace(/^[^\w\d]+|[^\w\d]+$/g, '').replace(/[\s\W-]+/g, '-') : "chatgpt";
    var a = document.createElement("a");
    a.setAttribute("download", filename + ".png");
    a.setAttribute("href", imgURI);
    a.setAttribute("target", "_blank");

    a.dispatchEvent(evt);
  }

  // canvas config
  var canvasWidth = 1200;

  // prepare image elements
  var imageContent = "";
  var promptBg = "#272832";
  var footerBg = "#1b1c22";
  var responseBg = "#343642";
  var promptStartDiv = `<div style="background: ${promptBg}; padding: 16px; ">`;
  var responseStartDiv = `<div style="background: ${responseBg}; padding: 16px; ">`;

  function divWrapper(child) {
    return `<div style="line-height: 1.5em; margin-bottom: 0.85em">${child}</div>`;
  }

  // extract chats 
  var elements = document.querySelectorAll("article[data-testid^='conversation-turn']");
  for (var i = 0; i < elements.length; i++) {
    var ele = elements[i];
    let authorLabel = ele.querySelector("[data-testid*='message-participant']")?.textContent || "";
    
    const isResponse = !authorLabel.includes("You");

    // Start div based on message type
    if (isResponse) {
      imageContent += responseStartDiv;
      imageContent += divWrapper("<em>ChatGPT:</em>");
    } else {
      imageContent += promptStartDiv;
      imageContent += divWrapper("<em>User:</em>");
    }

    // Process message content
    function processContent(node) {
      if (!node) return "";
      
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = node.tagName;
        let content = "";

        switch(tag) {
          case "P":
            return divWrapper(Array.from(node.childNodes)
              .map(child => processContent(child))
              .join(" "));
          
          case "OL":
          case "UL":
            let listItems = Array.from(node.children)
              .map(li => `<li>${processContent(li)}</li>`)
              .join("");
            return divWrapper(`<${tag.toLowerCase()}>${listItems}</${tag.toLowerCase()}>`);

          case "PRE":
            const codeContent = processCodeBlock(node);
            return divWrapper(
              `<pre style="background: #000; padding:16px; white-space: pre-wrap;">${codeContent}</pre>`
            );

          case "TABLE":
            return processTable(node);

          default:
            return Array.from(node.childNodes)
              .map(child => processContent(child))
              .join("");
        }
      }
      return "";
    }

    imageContent += processContent(ele);
    imageContent += "</div>"; // Close message div
  }

  // Helper functions for code and table processing
  function processCodeBlock(node) {
    try {
      const codeBlock = node.querySelector("code");
      let codeText = "";
      
      codeBlock.childNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const spanColor = getCodeSpanColor(node.className);
          codeText += `<span style="color: ${spanColor};">${node.textContent}</span>`;
        } else {
          codeText += node.textContent;
        }
      });
      return codeText;
    } catch (err) {
      return node.textContent.replace("Copy code", "");
    }
  }

  function getCodeSpanColor(className) {
    if (className.includes("-keyword")) return "#267FC5";
    if (className.includes("-title")) return "#DC122C";
    if (className.includes("-string")) return "#148B61";
    if (className.includes("-comment")) return "#6D6D6D";
    if (className.includes("-number")) return "#D41366";
    return "#ffffff";
  }

  function processTable(node) {
    let tableContent = "";
    const sections = node.querySelectorAll("thead, tbody");
    
    sections.forEach(section => {
      const rows = Array.from(section.querySelectorAll("tr"))
        .map(row => {
          const cells = Array.from(row.children)
            .map(cell => `<td>${cell.textContent}</td>`)
            .join("");
          return `<tr>${cells}</tr>`;
        })
        .join("");
      
      tableContent += `<${section.tagName.toLowerCase()}>${rows}</${section.tagName.toLowerCase()}>`;
    });

    return divWrapper(`<table>${tableContent}</table>`);
  }

  //Edge Blob polyfill https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
  if (!HTMLCanvasElement.prototype.toBlob) {
    Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
      value: function (callback, type, quality) {
        var canvas = this;
        setTimeout(function () {
          var binStr = atob(
              canvas.toDataURL(type, quality).split(",")[1]
            ),
            len = binStr.length,
            arr = new Uint8Array(len);

          for (var i = 0; i < len; i++) {
            arr[i] = binStr.charCodeAt(i);
          }

          callback(new Blob([arr], { type: type || "image/png" }));
        });
      },
    });
  }

  // create canvas
  var canvas = document.createElement("canvas");

  // create content
  var content = imageContent;

  // get size of contents
  var sizingDiv = document.createElement("div");
  sizingDiv.id = "sizing-div";
  sizingDiv.style.width = canvasWidth / 2 + "px";
  sizingDiv.innerHTML = content.trim();
  document.body.appendChild(sizingDiv);
  var sizingDivHeight = sizingDiv.offsetHeight * 2;

  // remove sizing div
  sizingDiv.remove();

  // compile
  var timestamp = getTimestamp();

  var xmlDiv = document.createElement("div");
  xmlDiv.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
  xmlDiv.style.width = canvasWidth / 2 + "px";
  xmlDiv.style.fontFamily = "sans-serif";
  xmlDiv.style.fontSize = "14px";

  var headerDiv = document.createElement("div");
  headerDiv.innerText = timestamp;
  headerDiv.style.fontSize = "12px";
  headerDiv.style.paddingTop = "4px";
  headerDiv.style.paddingBottom = "2px";
  headerDiv.style.fontFamily = "monospace";
  headerDiv.style.textAlign = "center";
  headerDiv.style.color = "rgba(255,255,255,0.25)";
  headerDiv.style.background = footerBg;

  var contentDiv = document.createElement("div");
  contentDiv.style.color = "#fff";
  contentDiv.style.fontWeight = 300;
  contentDiv.style.marginRight = "auto";
  contentDiv.style.marginLeft = "auto";
  contentDiv.appendChild(sizingDiv);

  var footerDiv = document.createElement("div");
  footerDiv.innerText = "Generated with chatgpt-export";
  footerDiv.style.fontSize = "12px";
  footerDiv.style.paddingTop = "2px";
  footerDiv.style.paddingBottom = "4px";
  footerDiv.style.fontFamily = "monospace";
  footerDiv.style.textAlign = "center";
  footerDiv.style.color = "rgba(255,255,255,0.25)";
  footerDiv.style.background = footerBg;

  xmlDiv.appendChild(headerDiv);
  xmlDiv.appendChild(contentDiv);
  xmlDiv.appendChild(footerDiv);

  var data = `<svg id="svg" xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}px" height="${sizingDivHeight}px">
  <foreignObject width="100%" height="100%">
  ${xmlDiv.outerHTML}
  </foreignObject>
  </svg>
  `;

  // canvas styles
  canvas.width = canvasWidth;
  canvas.height = sizingDivHeight;

  //get DPI
  let dpi = window.devicePixelRatio;

  // get context
  var ctx = canvas.getContext("2d");
  ctx.scale(dpi, dpi);

  // create image
  data = encodeURIComponent(data);
  var img = new Image();
  img.src = "data:image/svg+xml," + data;
  img.onload = function () {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(function (blob) {
      var newImg = document.createElement("img"),
        url = URL.createObjectURL(blob);

      newImg.onload = function () {
        // no longer need to read the blob so it's revoked
        URL.revokeObjectURL(url);
      };

      newImg.src = url;
      document.body.appendChild(newImg);

      // download image
      var imgURI = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
      triggerDownload(imgURI);

      // remove image element
      newImg.remove();
    });
  };
})();
