/**
 * Simple word-based text chunking.
 * Splits text into chunks of approximately `maxTokens` words.
 */
function chunkText(text, maxTokens = 2500) {
  const words = text.split(/\s+/);
  const chunks = [];
  let current = [];

  for (const word of words) {
    current.push(word);
    if (current.length >= maxTokens) {
      chunks.push(current.join(' '));
      current = [];
    }
  }

  if (current.length > 0) {
    chunks.push(current.join(' '));
  }

  return chunks;
}

module.exports = { chunkText };
