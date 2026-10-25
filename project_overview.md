# Cross-Lingual Multimodal Fake News and Claim Verification System

## 1. Introduction

This project is a Cross-Lingual Multimodal Fake News and Claim Verification System built using an Agentic Graph RAG framework. It is designed to detect misinformation and verify the truthfulness of claims by analyzing text, visual content, multilingual data, and relational knowledge. The system is intended to help users determine whether a statement is supported, contradicted, or remains unverified using evidence-based reasoning.

The goal of the project is to create an intelligent fact-checking platform that combines artificial intelligence, retrieval methods, and graph-based reasoning to identify fake news more accurately than traditional keyword-based systems.

## 2. Problem Statement

In the modern digital era, misinformation spreads rapidly through social media, news websites, short videos, and online articles. Many false claims are created to influence public opinion, politics, finance, and social trust. Therefore, there is a strong need for automated systems that can verify claims and identify misleading or fabricated information.

Traditional fact-checking systems are often limited because they rely on simple word matching or shallow textual analysis. The challenge becomes even more complex when the content is in regional languages, code-mixed language, or includes image-based misinformation.

## 3. Objective of the Project

The major objective of this project is to build an intelligent fact-verification system that can:

- analyze multilingual and code-mixed text,
- process multimodal inputs such as text and images,
- retrieve relevant evidence from large datasets,
- use knowledge graph reasoning to validate relationships,
- compare evidence with the claim using AI models,
- and produce a final verdict such as Supported, Contradicted, or Unverified.

## 4. Proposed Solution

The proposed system combines multiple AI and information retrieval techniques into a single pipeline. Instead of relying on a single model, it uses a hybrid architecture that includes:

- multilingual preprocessing,
- claim extraction,
- semantic retrieval,
- graph-based evidence reasoning,
- natural language inference,
- and final decision aggregation.

This combination makes the system more robust and reliable for misinformation detection.

## 5. System Architecture

The system is divided into several major components:

### Frontend Layer
The frontend is built using Next.js and React. It provides a web interface where users can submit claims, upload evidence or images, view the verdict, and inspect analytics and graph-based results.

### Backend Layer
The backend is implemented using FastAPI in Python. It handles the API requests, processes the claim, invokes AI and retrieval modules, and returns the result to the frontend.

### AI and Model Layer
The system uses several advanced AI modules:

- Gemini 2.5 Flash for structured claim extraction and reasoning,
- XLM-RoBERTa for Natural Language Inference (NLI),
- CLIP for image-text alignment,
- EasyOCR for text extraction from images,
- FastText for language identification,
- IndicTrans2 for cross-lingual normalization and translation,
- BGE-M3 for dense semantic retrieval.

### Retrieval Layer
The retrieval layer uses multiple approaches such as:

- BM25 for sparse keyword-based evidence matching,
- vector search for semantic similarity,
- knowledge graph traversal for relational context.

### Decision Layer
The final verdict is determined using a weighted decision engine that combines all evidence signals such as BM25 relevance, vector similarity, source reliability, NLI confidence, temporal consistency, and graph consistency.

## 6. Agentic AI in the Project

The project uses an Agentic AI approach through a Gemini-powered ReAct-style agent. This agent acts as an autonomous reasoning layer that decides which tools and processes are necessary for the given claim.

The agent works in a step-by-step manner:

1. Detect the language and normalize the input text.
2. Extract structured claim information such as subject, predicate, object, event, and location.
3. Retrieve relevant evidence from multiple sources.
4. Traverse the knowledge graph to identify relational context.
5. Compare the claim with evidence through NLI reasoning.
6. Combine all signals to prepare a final verdict.

This makes the system more intelligent and dynamic than a simple static machine learning pipeline.

## 7. Graph RAG

Graph RAG stands for Graph Retrieval-Augmented Generation. In this project, it is implemented using Neo4j and NetworkX.

The knowledge graph stores entities and their relationships. For example, entities such as organizations, locations, political figures, events, or topics are connected through edges. The system can then perform:

- Dijkstra shortest path analysis,
- breadth-first traversal (BFS),
- neighborhood expansion,
- relational consistency checks.

This helps the project understand whether a claim is logically connected to known entities and real-world relationships. Graph RAG adds deeper contextual understanding beyond typical document retrieval.

## 8. Core Algorithms Used

### BM25 Algorithm
BM25 is a sparse retrieval algorithm used to rank evidence based on keyword frequency and document relevance. It is effective for exact search and matching relevant phrases in a large corpus.

### Dense Vector Retrieval
This method uses embedding-based representations to search for semantically similar content. It works even when the query and evidence use different wording or expressions.

### Graph Traversal Algorithms
The system uses graph traversal methods such as:

- Dijkstra’s shortest path algorithm for finding the most relevant relational path,
- Breadth-First Search for exploring neighboring nodes and context.

### Natural Language Inference (NLI)
NLI is used to determine whether the evidence supports, contradicts, or remains neutral to the claim. This is one of the most important tasks in fact verification.

### Weighted Decision Engine
The final verdict is generated by a weighted decision engine that combines multiple signals into a single score. This score helps determine whether the claim is supported, contradicted, or unverified.

## 9. Project Workflow

The user submits a claim or image. The system then follows this workflow:

1. Input preprocessing and language detection.
2. Claim extraction and semantic structuring.
3. Evidence retrieval using BM25 and dense vector search.
4. Knowledge graph traversal for relational context.
5. NLI evaluation against retrieved evidence.
6. Multimodal validation if images are present.
7. Weighted aggregation of all scores.
8. Final verdict with explanation and confidence score.

This workflow makes the system capable of explanation-driven fact checking.

## 10. Technologies Used

### Frontend
- Next.js
- React
- JavaScript
- Tailwind CSS

### Backend
- Python
- FastAPI
- Pydantic
- REST APIs

### AI and ML Tools
- Google Gemini 2.5 Flash
- XLM-RoBERTa
- CLIP
- EasyOCR
- FastText
- IndicTrans2
- BGE-M3

### Knowledge Graph and Data Storage
- Neo4j
- NetworkX
- CSV-based datasets

### Deployment
- Docker
- Docker Compose

## 11. Why This Project is Important

This project is important because it tackles the growing issue of misinformation using an advanced AI-based solution. The system is highly relevant in today’s world, where false claims can spread quickly across media channels. By combining AI reasoning, evidence retrieval, and graph knowledge, the project provides a meaningful approach to digital trust and information verification.

## 12. Conclusion

The Cross-Lingual Multimodal Fake News and Claim Verification System is a powerful fact-checking platform that integrates modern AI, retrieval enhancement, and graph-based reasoning. It demonstrates how agentic AI and Graph RAG can be used to verify claims in multilingual and multimodal contexts.

This project is not just a technical implementation; it is a practical response to the real-world challenge of misinformation. It provides a strong foundation for future research in trustworthy AI, automated fact checking, and explainable decision systems.

---

Prepared for final-year project documentation and interview presentation.
