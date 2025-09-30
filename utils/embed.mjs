import { pipeline } from '@xenova/transformers';

let embedderPromise;

/** Get (or create) the embedding pipeline */
async function getEmbedder() {
  if (!embedderPromise) {
    embedderPromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return embedderPromise;
}

/**
 * Embed text -> normalized vector (number[])
 * Uses built-in mean pooling + L2 normalization from the library
 */
export async function embedText(text) {
  const embedder = await getEmbedder();
  // pooling:'mean' + normalize:true means no manual mean-pool needed
  const result = await embedder(text, { pooling: 'mean', normalize: true });
  return Array.from(result.data); // Float32Array -> plain array
}
