/**
 * AI Services Export
 * RAG Framework components for semantic search and context injection
 */

// Semantic Search
export {
  generateEmbedding,
  generateEmbeddings,
  semanticSearch,
  searchCollection,
  indexDocument,
  indexDocuments,
  indexProducts,
  indexClips,
  indexFeatures,
  indexParts,
  reindexAll,
  cosineSimilarity,
  buildProductContent,
  buildClipContent,
  buildFeatureContent,
  buildPartContent,
  type EmbeddingDocument,
  type SemanticSearchResult,
  type IndexableDocument,
  type IndexableCollection,
} from './semanticSearchService';

// Knowledge Base
export {
  retrieveContext,
  retrieveContextCached,
  retrieveStrategyContext,
  retrieveDesignItemContext,
  formatContextForPrompt,
  formatContextAsJSON,
  hybridSearch,
  clearContextCache,
  recordSelection,
  type KnowledgeContext,
  type ContextItem,
  type ProjectHistoryItem,
  type StrategyExcerpt,
  type ContextInjectionConfig,
  type FeedbackEntry,
} from './knowledgeBaseService';
