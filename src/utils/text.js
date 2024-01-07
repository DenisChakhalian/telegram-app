const toMarkdownLink = (text, entities, isSing) => {
  if (!text) {
    return "";
  }

  const start = isSing ? 1 : 0;
  let i = start;

  let resultMark = "";

  text
    .split(" ")
    .slice(start)
    .join(" ")
    .split("")
    .map((ch, idx) => {
      if (!entities || !entities[i]) {
        resultMark += ch;
        return ch;
      }

      if (entities[i].type === "hashtag") {
        resultMark += ch;
        i++;
        return ch;
      }

      if (!entities || entities.length < i) {
        resultMark += ch;
        return ch;
      }

      if (idx === entities[i]?.offset - (start ? entities[0]?.length + 1 : 0)) {
        resultMark += "[" + ch;
        return ch;
      }

      if (
        idx ===
        entities[i]?.offset +
          entities[i]?.length -
          (start ? entities[0]?.length + 2 : 0 + (start ? 0 : 1))
      ) {
        const result = ch + "](" + entities[i]?.url + ")";

        i++;

        resultMark += result;

        return ch;
      }
      resultMark += ch;

      return ch;
    })
    .join("");

  return resultMark;
};

const toFixLink = (text) => {
  if (!text) {
    return "";
  }

  let isLink = false;

  return text
    .split("")
    .map((el) => {
      if (el === "[") {
        isLink = true;
        return el;
      }
      if (el === "]") {
        isLink = false;
        return el;
      }
      if (isLink || el === "#") {
        return el
          .replace(/\_/g, "\\_")
          .replace(/\*/g, "\\*")
          .replace(/\[/g, "\\[")
          .replace(/\]/g, "\\]")
          .replace(/\(/g, "\\(")
          .replace(/\)/g, "\\)")
          .replace(/\~/g, "\\~")
          .replace(/\`/g, "\\`")
          .replace(/\'/g, "\\'")
          .replace(/\>/g, "\\>")
          .replace(/\#/g, "\\#")
          .replace(/\+/g, "\\+")
          .replace(/\-/g, "\\-")
          .replace(/\=/g, "\\=")
          .replace(/\|/g, "\\|")
          .replace(/\{/g, "\\{")
          .replace(/\}/g, "\\}")
          .replace(/\./g, "\\.")
          .replace(/\!/g, "\\!");
      }

      return el;
    })
    .join("");
};

const toFixText = (text) => {
  if (!text) {
    return "";
  }

  return text
    .replace(/\_/g, "\\_")
    .replace(/\*/g, "\\*")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\~/g, "\\~")
    .replace(/\`/g, "\\`")
    .replace(/\'/g, "\\'")
    .replace(/\>/g, "\\>")
    .replace(/\#/g, "\\#")
    .replace(/\+/g, "\\+")
    .replace(/\-/g, "\\-")
    .replace(/\=/g, "\\=")
    .replace(/\|/g, "\\|")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/\./g, "\\.")
    .replace(/\!/g, "\\!");
};

module.exports = {
  toMarkdownLink,
  toFixText,
  toFixLink,
};
