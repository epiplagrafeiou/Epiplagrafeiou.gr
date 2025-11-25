// src/lib/xml-parsers/parser-utils.ts

/**
 * Safely extracts a string value from a parsed XML node.
 * Handles cases where the value might be a direct string, an object with a text property
 * (like '#text' or '__cdata'), or an array containing the value.
 * @param node The parsed XML node.
 * @returns The extracted string, or an empty string if not found.
 */
export function getText(node: any): string {
  if (!node) {
    return "";
  }
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    // If it's an array, recursively call getText on the first element.
    return getText(node[0]);
  }
  if (typeof node === 'object') {
    // Handle common text property names used by various XML parsers.
    return node["#text"] || node.__cdata || node["_"] || "";
  }
  return "";
}

/**
 * Recursively searches for a product array within a parsed XML object.
 * This is resilient to varying root element names.
 * @param node The current node of the parsed XML object.
 * @returns An array of product nodes, or an empty array if not found.
 */
export function findProductArray(node: any): any[] {
    for (const key in node) {
        if (key === 'product' && Array.isArray(node[key])) {
            return node[key];
        }
        // Handle cases where a single product is not in an array
        if (key === 'product' && typeof node[key] === 'object' && node[key] !== null) {
            return [node[key]]; 
        }
        if (typeof node[key] === 'object' && node[key] !== null) {
            const result = findProductArray(node[key]);
            if (result.length > 0) {
                return result;
            }
        }
    }
    return [];
}
