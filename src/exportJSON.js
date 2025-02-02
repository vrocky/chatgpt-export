const consoleSave = require("./util/consoleSave");
const getTimestamp = require("./util/getTimestamp");

(function exportJSON() {
  const conversation = {
    timestamp: getTimestamp(),
    messages: []
  };

  function processMessageContent(node) {
    if (!node) return "";
    
    // Handle text nodes
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent.trim();
    }

    // Handle element nodes
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = node.tagName;
      let content = "";

      switch (tag) {
        case "P":
          return Array.from(node.childNodes)
            .map(child => processMessageContent(child))
            .join(" ") + "\n";
        
        case "OL":
        case "UL":
          return Array.from(node.children)
            .map((li, idx) => {
              const marker = tag === "OL" ? `${idx + 1}.` : "-";
              return `${marker} ${processMessageContent(li)}`;
            })
            .join("\n") + "\n";

        case "PRE":
          const codeBlockParts = node.textContent.split("Copy code");
          return `\`\`\`${codeBlockParts[0].trim()}\n${codeBlockParts[1].trim()}\n\`\`\`\n`;

        case "TABLE":
          let tableContent = [];
          node.querySelectorAll('tr').forEach(row => {
            const cells = Array.from(row.children).map(cell => cell.textContent.trim());
            tableContent.push(cells);
          });
          return {
            type: 'table',
            content: tableContent
          };

        default:
          return Array.from(node.childNodes)
            .map(child => processMessageContent(child))
            .join("");
      }
    }

    return "";
  }

  const elements = document.querySelectorAll("article[data-testid^='conversation-turn']");
  
  elements.forEach(element => {
    const authorLabel = element.querySelector("[data-testid*='message-participant']")?.textContent || "";
    const role = authorLabel.includes("You") ? "user" : "assistant";
    
    const content = processMessageContent(element);
    
    conversation.messages.push({
      role,
      content: typeof content === 'object' ? content : content.trim()
    });
  });

  consoleSave(console, "json");
  console.save(JSON.stringify(conversation, null, 2));
  return conversation;
})();
