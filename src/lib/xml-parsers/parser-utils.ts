// src/lib/xml-parsers/parser-utils.ts

/**
 * Safely extracts a string value from a parsed XML node.
 * Handles cases where the value might be a direct string, an object with a text property
 * (like '#text' or '__cdata'), or an array containing the value.
 * @param node The parsed XML node.
 * @returns The extracted string, or an empty string if not found.
 */
export function getText(node: any): string {
  if (node === undefined || node === null) {
    return "";
  }
  if (typeof node === "string" || typeof node === "number") {
    return String(node).trim();
  }
  if (Array.isArray(node)) {
    // If it's an array, recursively call getText on the first element.
    return getText(node[0]);
  }
  if (typeof node === 'object') {
    // Handle common text property names used by various XML parsers.
    return String(node["#text"] || node.__cdata || node["_text"] || "").trim();
  }
  return "";
}

/**
 * Recursively searches for a product array within a parsed XML object.
 * This is resilient to varying root element names (e.g., 'product', 'Product').
 * @param node The current node of the parsed XML object.
 * @returns An array of product nodes, or an empty array if not found.
 */
export function findProductArray(node: any): any[] {
    for (const key in node) {
        // Case-insensitive check for 'product'
        if (key.toLowerCase() === 'product') {
            const productNode = node[key];
            if (Array.isArray(productNode)) {
                return productNode;
            }
            if (typeof productNode === 'object' && productNode !== null) {
                // If a single product is not in an array, wrap it in one.
                return [productNode];
            }
        }
        // Recurse into child objects
        if (typeof node[key] === 'object' && node[key] !== null) {
            const result = findProductArray(node[key]);
            if (result.length > 0) {
                return result;
            }
        }
    }
    return [];
}
