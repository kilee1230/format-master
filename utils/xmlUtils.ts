export const isValidXml = (xml: string): boolean => {
  if (!xml || !xml.trim()) return false;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "application/xml");
    const errorNode = doc.querySelector("parsererror");
    return !errorNode;
  } catch (e) {
    return false;
  }
};

export const formatXml = (xml: string): string => {
  if (!xml) return "";

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "application/xml");
    const errorNode = doc.querySelector("parsererror");
    if (errorNode) throw new Error("Invalid XML");

    const formatNode = (node: Node, level: number): string => {
      const indent = "  ".repeat(level);

      if (node.nodeType === Node.TEXT_NODE) {
        return (node.textContent || "").trim();
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        let str = `${indent}<${el.nodeName}`;

        // Attributes
        if (el.hasAttributes()) {
          for (let i = 0; i < el.attributes.length; i++) {
            str += ` ${el.attributes[i].name}="${el.attributes[i].value}"`;
          }
        }

        // Children handling
        // If it's empty
        if (!el.hasChildNodes()) {
          return `${str} />`;
        }

        let hasElementChildren = false;
        let childStr = "";

        for (let i = 0; i < el.childNodes.length; i++) {
          const child = el.childNodes[i];
          if (child.nodeType === Node.ELEMENT_NODE) {
            hasElementChildren = true;
            childStr += "\n" + formatNode(child, level + 1);
          } else if (
            child.nodeType === Node.TEXT_NODE ||
            child.nodeType === Node.CDATA_SECTION_NODE
          ) {
            const text = (child.textContent || "").trim();
            if (text) {
              childStr += text;
            }
          }
        }

        if (hasElementChildren) {
          str += ">" + childStr + `\n${indent}</${el.nodeName}>`;
        } else if (childStr) {
          str += ">" + childStr + `</${el.nodeName}>`;
        } else {
          return `${str} />`;
        }

        return str;
      }
      return "";
    };

    let result = "";
    if (xml.trim().startsWith("<?xml")) {
      const match = xml.match(/<\?xml[^?]+\?>/);
      if (match) result = match[0] + "\n";
    }

    return result + formatNode(doc.documentElement, 0);
  } catch (e) {
    console.error("Formatting error", e);
    return xml;
  }
};

export const minifyXml = (xml: string): string => {
  return xml.replace(/>\s+</g, "><").trim();
};

/**
 * Converts XML string to JSON object for Tree View visualization
 */
export const xmlToJson = (xml: string): any => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "application/xml");
    const errorNode = doc.querySelector("parsererror");
    if (errorNode) return null;

    const root = doc.documentElement;
    // Return object with root tag name
    return { [root.nodeName]: xmlNodeToJson(root) };
  } catch (e) {
    return null;
  }
};

const xmlNodeToJson = (node: Element): any => {
  const obj: any = {};

  if (node.hasAttributes()) {
    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i];
      obj[`@${attr.name}`] = attr.value;
    }
  }

  if (node.hasChildNodes()) {
    if (node.childNodes.length === 1 && node.childNodes[0].nodeType === 3) {
      const text = node.childNodes[0].textContent?.trim();
      if (node.hasAttributes()) {
        if (text) obj["#text"] = text;
      } else {
        return text;
      }
    } else {
      for (let i = 0; i < node.childNodes.length; i++) {
        const child = node.childNodes[i];
        if (child.nodeType === 3 && !child.textContent?.trim()) continue;

        if (child.nodeType === 3) {
          const text = child.textContent?.trim();
          if (text) {
            if (obj["#text"]) {
              if (Array.isArray(obj["#text"])) obj["#text"].push(text);
              else obj["#text"] = [obj["#text"], text];
            } else {
              obj["#text"] = text;
            }
          }
          continue;
        }

        if (child.nodeType === 1) {
          const childEl = child as Element;
          const nodeName = childEl.nodeName;
          const jsonVal = xmlNodeToJson(childEl);

          if (obj[nodeName]) {
            if (!Array.isArray(obj[nodeName])) {
              obj[nodeName] = [obj[nodeName]];
            }
            obj[nodeName].push(jsonVal);
          } else {
            obj[nodeName] = jsonVal;
          }
        }
      }
    }
  }
  return obj;
};

/**
 * Converts a JSON Object to an XML String.
 * Handles the specific @attribute and #text structure from xmlToJson,
 * but also handles generic JSON objects.
 */
export const jsonToXml = (json: any, rootName: string = "root"): string => {
  const toXml = (obj: any, name: string): string => {
    if (obj === null || obj === undefined) return `<${name} />`;

    if (typeof obj !== "object") {
      return `<${name}>${obj}</${name}>`;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => toXml(item, name)).join("");
    }

    let attrs = "";
    let children = "";
    let hasTextKey = false;
    let textValue = "";

    // Check for specific structure from xmlToJson (@ for attrs, #text for content)
    Object.keys(obj).forEach((key) => {
      if (key.startsWith("@")) {
        attrs += ` ${key.substring(1)}="${obj[key]}"`;
      } else if (key === "#text") {
        hasTextKey = true;
        textValue = obj[key];
      } else {
        children += toXml(obj[key], key);
      }
    });

    if (hasTextKey && !children) {
      return `<${name}${attrs}>${textValue}</${name}>`;
    }

    if (!children && !hasTextKey) {
      return `<${name}${attrs} />`;
    }

    return `<${name}${attrs}>${children}</${name}>`;
  };

  // If the root object has a single key that is an object, assume that is the root element
  if (
    typeof json === "object" &&
    !Array.isArray(json) &&
    Object.keys(json).length === 1
  ) {
    const key = Object.keys(json)[0];
    return `<?xml version="1.0" encoding="UTF-8"?>\n${toXml(json[key], key)}`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n${toXml(json, rootName)}`;
};
