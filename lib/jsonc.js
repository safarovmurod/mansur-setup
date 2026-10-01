'use strict';

/**
 * Strips comments and trailing commas from a JSONC string.
 * Handles single-line comments // and multi-line comments /* ... * /
 * safely without breaking inside quoted strings.
 */
function stripJsonComments(str) {
  let insideString = false;
  let stringChar = '';
  let isEscaped = false;
  let result = '';

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const nextChar = str[i + 1];

    if (insideString) {
      result += char;
      if (isEscaped) {
        isEscaped = false;
      } else if (char === '\\') {
        isEscaped = true;
      } else if (char === stringChar) {
        insideString = false;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      insideString = true;
      stringChar = char;
      result += char;
      continue;
    }

    // Single line comment
    if (char === '/' && nextChar === '/') {
      const lineEnd = str.indexOf('\n', i + 2);
      if (lineEnd === -1) break;
      i = lineEnd - 1;
      continue;
    }

    // Multi line comment
    if (char === '/' && nextChar === '*') {
      const commentEnd = str.indexOf('*/', i + 2);
      if (commentEnd === -1) break;
      i = commentEnd + 1;
      continue;
    }

    result += char;
  }

  // Remove trailing commas before } or ]
  return result.replace(/,\s*([}\]])/g, '$1');
}

function parseJsonc(content, fallback = {}) {
  if (!content || !content.trim()) return fallback;
  try {
    const cleaned = stripJsonComments(content);
    return JSON.parse(cleaned);
  } catch (err) {
    // If strict strip fails, try direct parse
    try {
      return JSON.parse(content);
    } catch (_) {
      throw new Error(`JSONC parse error: ${err.message}`);
    }
  }
}

/**
 * Deep merge source into target.
 * Objects are merged recursively, arrays and primitives from source overwrite target.
 */
function deepMerge(target, source) {
  const output = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] !== null &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      key in target &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      output[key] = deepMerge(target[key], source[key]);
    } else {
      output[key] = source[key];
    }
  }
  return output;
}

module.exports = { stripJsonComments, parseJsonc, deepMerge };
