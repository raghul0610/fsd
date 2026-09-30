# Knowledge Retrieval / RAG Direction

The offline MVP intentionally does not require a vector database or cloud LLM.

`LocalKnowledgeRetriever` performs lightweight keyword/token relevance scoring over curated knowledge stored in IndexedDB. This keeps retrieval available without connectivity and is appropriate for a small device-side knowledge corpus.

`CloudKnowledgeRetriever` is an extension point only. A future online implementation can use embeddings/vector search and a generation model without changing the UI/domain interfaces.

Healthcare content is demonstration content and must be clinically reviewed and replaced with verified sources before real deployment.