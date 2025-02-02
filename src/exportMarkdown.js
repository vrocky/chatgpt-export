const consoleSave = require("./util/consoleSave");
const getTimestamp = require("./util/getTimestamp");

(function exportMarkdown() {
  var markdown = "";
  var elements = document.querySelectorAll("article[data-testid^='conversation-turn']");
  var timestamp = getTimestamp();
  markdown += `\`${timestamp}\`\n\n`;

  function processNode(node) {
    let nodeMarkdown = "";
    
    if (node.nodeType === Node.TEXT_NODE) {
      nodeMarkdown += node.textContent;
      return nodeMarkdown;
    }

    switch (node.nodeType) {
      case Node.ELEMENT_NODE:
        var tag = node.tagName;
        var text = node.textContent;

        switch (tag) {
          case "H1":
            nodeMarkdown += "<h1>"
            node.childNodes.forEach(child => {
              nodeMarkdown += processNode(child);
            });
            nodeMarkdown += "</h1>\n\n";
            break;
          case "H2":
            nodeMarkdown += "<h2>"
            node.childNodes.forEach(child => {
              nodeMarkdown += processNode(child);
            });
            nodeMarkdown += "</h2>\n\n";
            break;
          case "H3":
            nodeMarkdown += "<h3>"
            node.childNodes.forEach(child => {
              nodeMarkdown += processNode(child);
            });
            nodeMarkdown += "</h3>\n\n";
            break;
          case "P":
            node.childNodes.forEach(child => {
              nodeMarkdown += processNode(child);
            });
            nodeMarkdown += `\n\n`;
            break;
          case "OL":
            node.childNodes.forEach((listItemNode, index) => {
              if (listItemNode.nodeType === Node.ELEMENT_NODE && listItemNode.tagName === "LI") {
                nodeMarkdown += `${index + 1}. ${processNode(listItemNode)}\n`;
              }
            });
            nodeMarkdown += "\n";
            break;
          case "UL":
            node.childNodes.forEach((listItemNode) => {
              if (listItemNode.nodeType === Node.ELEMENT_NODE && listItemNode.tagName === "LI") {
                nodeMarkdown += `- ${processNode(listItemNode)}\n`;
              }
            });
            nodeMarkdown += "\n";
            break;
          case "PRE":
            const codeBlockSplit = text.split("Copy code");
            const codeBlockLang = codeBlockSplit[0].trim();
            const codeBlockData = codeBlockSplit[1].trim();
            nodeMarkdown += `\`\`\`${codeBlockLang}\n${codeBlockData}\n\`\`\`\n\n`;
            break;
          case "TABLE":
            node.childNodes.forEach((tableSectionNode) => {
              if (tableSectionNode.nodeType === Node.ELEMENT_NODE &&
                  (tableSectionNode.tagName === "THEAD" || tableSectionNode.tagName === "TBODY")) {
                let tableRows = "";
                let tableColCount = 0;
                tableSectionNode.childNodes.forEach((tableRowNode) => {
                  if (tableRowNode.nodeType === Node.ELEMENT_NODE && tableRowNode.tagName === "TR") {
                    let tableCells = "";
                    tableRowNode.childNodes.forEach((tableCellNode) => {
                      if (tableCellNode.nodeType === Node.ELEMENT_NODE &&
                          (tableCellNode.tagName === "TD" || tableCellNode.tagName === "TH")) {
                        tableCells += `| ${tableCellNode.textContent} `;
                        if (tableSectionNode.tagName === "THEAD") {
                          tableColCount++;
                        }
                      }
                    });
                    tableRows += `${tableCells}|\n`;
                  }
                });
                nodeMarkdown += tableRows;
                if (tableSectionNode.tagName === "THEAD") {
                  nodeMarkdown += `| ${Array(tableColCount).fill("---").join(" | ")} |\n`;
                }
              }
            });
            nodeMarkdown += "\n";
            break;
          default:
            node.childNodes.forEach(child => {
              nodeMarkdown += processNode(child);
            });
            break;
        }
        break;
    }

    return nodeMarkdown;
  }

  for (var i = 0; i < elements.length; i++) {
    var ele = elements[i];
    let authorLabel = ele.querySelector("[data-testid*='message-participant']")?.textContent || "";

    if (authorLabel.includes("You")) {
      markdown += `<br>_User_:<br>\n`;
    } else if (authorLabel.includes("ChatGPT") || authorLabel.includes("GPT")) {
      markdown += `<br>_ChatGPT_:<br>\n`;
    }

    markdown += processNode(ele) + "\n";
  }

  consoleSave(console, "md");
  console.save(markdown);
  return markdown;
})();
