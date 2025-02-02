const consoleSave = require("./util/consoleSave");
const getTimestamp = require("./util/getTimestamp");

// Global nodeToMarkdown function
window.nodeToMarkdown = function(node) {
  if (!node) return "";
  
  // Handle text nodes
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent;
  }

  // Handle KaTeX Math
  if (node.classList && (node.classList.contains("katex-display") || node.classList.contains("katex"))) {
    let annotationNode = node.querySelector(".katex-mathml annotation");
    if (annotationNode) {
      let latexText = annotationNode.textContent.trim();
      let isBlockMath = node.classList.contains("katex-display");
      return isBlockMath ? `\n$$\n${latexText}\n$$\n\n` : `$${latexText}$`;
    }
  }

  // Handle element nodes
  if (node.nodeType === Node.ELEMENT_NODE) {
    const tag = node.tagName;
    const text = node.textContent;
    let markdown = "";

    switch (tag) {
      case "H1":
      case "H2":
      case "H3":
        const headerLevel = tag.charAt(1); // Get the header level number
        markdown = `${'#'.repeat(headerLevel)} `;
        markdown += Array.from(node.childNodes).map(child => nodeToMarkdown(child)).join("");
        markdown += '\n\n';
        break;

      case "P":
        markdown = Array.from(node.childNodes).map(child => nodeToMarkdown(child)).join("") + "\n\n";
        break;

      case "OL":
      case "UL":
        markdown = Array.from(node.children)
          .map((li, idx) => {
            const marker = tag === "OL" ? `${idx + 1}.` : "-";
            return `${marker} ${nodeToMarkdown(li)}`;
          })
          .join("\n") + "\n\n";
        break;

      case "PRE":
        const codeBlockParts = text.split("Copy code");
        markdown = `\`\`\`${codeBlockParts[0].trim()}\n${codeBlockParts[1].trim()}\n\`\`\`\n\n`;
        break;

      case "TABLE":
        node.childNodes.forEach((section) => {
          if (section.nodeType === Node.ELEMENT_NODE &&
              (section.tagName === "THEAD" || section.tagName === "TBODY")) {
            let tableRows = "";
            let colCount = 0;
            
            section.querySelectorAll("tr").forEach(row => {
              let cells = "";
              row.querySelectorAll("td, th").forEach(cell => {
                cells += `| ${cell.textContent.trim()} `;
                if (section.tagName === "THEAD") colCount++;
              });
              tableRows += `${cells}|\n`;
            });
            
            markdown += tableRows;
            if (section.tagName === "THEAD") {
              markdown += `| ${Array(colCount).fill("---").join(" | ")} |\n`;
            }
          }
        });
        markdown += "\n";
        break;

      default:
        markdown = Array.from(node.childNodes).map(child => nodeToMarkdown(child)).join("");
    }
    return markdown;
  }

  return "";
};

(function exportMarkdown() {
  var markdown = "";
  var elements = document.querySelectorAll("article[data-testid^='conversation-turn']");
  markdown += `\`${getTimestamp()}\`\n\n`;

  elements.forEach(element => {
    const authorLabel = element.querySelector("[data-testid*='message-participant']")?.textContent || "";
    
    if (authorLabel.includes("You")) {
      markdown += `<br>_User_:<br>\n`;
    } else if (authorLabel.includes("ChatGPT") || authorLabel.includes("GPT")) {
      markdown += `<br>_ChatGPT_:<br>\n`;
    }

    markdown += nodeToMarkdown(element) + "\n";
  });

  consoleSave(console, "md");
  console.save(markdown);
  return markdown;
})();