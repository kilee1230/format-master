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
  if (!xml) return '';
  
  try {
    // Check validity first
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "application/xml");
    const errorNode = doc.querySelector("parsererror");
    if (errorNode) throw new Error(errorNode.textContent || "Invalid XML");

    // Simple formatting logic
    let formatted = '';
    let indent = 0;
    const tab = '  ';
    
    // Remove existing whitespace between tags to start fresh
    xml = xml.replace(/>\s+</g, '><').trim();
    
    // Regex based formatting for XML strings
    xml.split(/>\s*</).forEach(function(node) {
        if (node.match( /^\/\w/ )) indent = Math.max(indent - 1, 0); // closing tag
        
        formatted += tab.repeat(indent);
        formatted += '<' + node + '>\r\n';
        
        if (node.match( /^<?\w[^>]*[^\/]$/ )) indent += 1; // opening tag
    });
    
    return formatted.substring(1, formatted.length - 3); // remove extra < and > added by split/join logic adjustment
  } catch (e) {
    // Fallback simple implementation if complex one fails
    console.error("Formatting error", e);
    throw new Error("Unable to format invalid XML");
  }
};

export const minifyXml = (xml: string): string => {
  return xml.replace(/>\s+</g, '><').trim();
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
  // Create object for this node
  const obj: any = {};

  // Process attributes
  if (node.hasAttributes()) {
    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i];
      obj[`@${attr.name}`] = attr.value;
    }
  }

  // Process children
  if (node.hasChildNodes()) {
    // Handle single text node content
    if (node.childNodes.length === 1 && node.childNodes[0].nodeType === 3) {
       const text = node.childNodes[0].textContent?.trim();
       // If attributes exist, we need object structure, otherwise just return text
       if (node.hasAttributes()) {
         if (text) obj['#text'] = text;
       } else {
         return text;
       }
    } else {
      // Handle complex children
      for (let i = 0; i < node.childNodes.length; i++) {
        const child = node.childNodes[i];
        
        // Skip whitespace text nodes
        if (child.nodeType === 3 && !child.textContent?.trim()) continue;
        
        // Handle Text nodes mixed with elements
        if (child.nodeType === 3) {
             const text = child.textContent?.trim();
             if (text) {
                 if (obj['#text']) {
                     if (Array.isArray(obj['#text'])) obj['#text'].push(text);
                     else obj['#text'] = [obj['#text'], text];
                 } else {
                     obj['#text'] = text;
                 }
             }
             continue;
        }

        if (child.nodeType === 1) { // Element
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