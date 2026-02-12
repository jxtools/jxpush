/**
 * Array chunking utility
 */

/**
 * Split an array into chunks of specified size
 * @param array - Array to chunk
 * @param chunkSize - Size of each chunk
 * @returns Array of chunks
 */
export function chunk<T>(array: T[], chunkSize: number): T[][] {
  if (chunkSize <= 0) {
    throw new Error('Chunk size must be greater than 0');
  }

  if (array.length === 0) {
    return [];
  }

  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }

  return chunks;
}

/**
 * Split an array into a specified number of chunks
 * @param array - Array to chunk
 * @param numChunks - Number of chunks to create
 * @returns Array of chunks
 */
export function chunkIntoN<T>(array: T[], numChunks: number): T[][] {
  if (numChunks <= 0) {
    throw new Error('Number of chunks must be greater than 0');
  }

  if (array.length === 0) {
    return [];
  }

  const chunkSize = Math.ceil(array.length / numChunks);
  return chunk(array, chunkSize);
}
