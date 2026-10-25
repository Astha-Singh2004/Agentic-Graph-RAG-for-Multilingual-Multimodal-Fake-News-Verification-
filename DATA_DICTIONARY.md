# Data Dictionary: Multi-Modal Fact Verification Benchmark

Comprehensive schema dictionary and field specifications for all datasets comprising the **100,000-article / 300,000-evidence Fact Verification Benchmark**.

---

### Dataset Summary Overview
| File Name | Record Count | Description | Primary Key | Foreign Keys |
| :--- | :--- | :--- | :--- | :--- |
| `01_news_articles.csv` | 100,000 | Synthetic news articles with real/fake ground truth | `article_id` | - |
| `02_claims.csv` | 200,000 | Decomposed structured semantic triples (2 claims/article) | `claim_id` | `article_id` |
| `03_entities.csv` | 29 | Knowledge Graph entities (Organizations, Locations, Topics) | `entity_id` | - |
| `05_evidence.csv` | 300,000 | Candidate evidence sentences with BM25 & dense vector scores | `evidence_id` | `claim_id`, `article_id` |
| `06_nli_training.csv` | 300,000 | Natural Language Inference pairs (Entailment/Contradiction/Neutral) | `nli_id` | `claim_id`, `evidence_id` |
| `08_social_posts.csv` | 20,000 | Synthetic social media / chat posts with viral claims | `post_id` | `article_id` |
| `09_image_metadata.csv` | 10,000 | Multimodal OCR text, confidence & CLIP alignment scores | `image_id` | `article_id` |
| `10_verification_results.csv`| 100,000 | Aggregate algorithmic verification verdicts and sub-scores | `verification_id` | `article_id`, `primary_claim_id` |
| `12_train.csv` | 80,000 | ML-ready training split for cross-lingual classification | `article_id` | - |
| `13_validation.csv` | 10,000 | ML-ready validation split | `article_id` | - |
| `14_test.csv` | 10,000 | ML-ready test benchmark split for precision/recall evaluation | `article_id` | - |

---

### 1. `01_news_articles.csv`
* `article_id` (string): Unique identifier (`FN000001` - `FN100000`).
* `title` (string): Article headline.
* `content` (string): Full body text of the news article.
* `language` (string): ISO-639-1 language code (`en`, `hi`, `mr`, `bn`, `pa`, `ta`, `te`, `gu`, `ml`, `or`).
* `category` (string): Domain category (`Politics`, `Health`, `Science`, `Agriculture`, `Education`, `Entertainment`, `Other`).
* `source_type` (string): `OFFICIAL`, `INSTITUTIONAL`, `NEWS_AGENCY`, `VIRAL_SOCIAL`.
* `source` (string): Attributed source name or domain.
* `published_at` (string): Publication timestamp (ISO-8601 YYYY-MM-DD).
* `region` (string): Geographic locus (`Madhya Pradesh`, `Maharashtra`, `Delhi`, etc.).
* `label` (string): Ground truth label (`REAL` or `FAKE`).
* `synthetic` (bool): Boolean flag denoting synthetic benchmark generation (`true`).
* `split` (string): Dataset split partition (`train`, `validation`, `test`).

---

### 2. `02_claims.csv`
* `claim_id` (string): Unique identifier (`CL000001_1`, `CL000001_2`).
* `article_id` (string): Parent article reference (`FN000001`).
* `claim_text` (string): Natural language claim assertion.
* `language` (string): Language of the claim.
* `subject` (string): Semantic triple subject entity (e.g. `Government / Institution`).
* `predicate` (string): Semantic triple predicate (e.g. `ANNOUNCED_OR_IMPLEMENTED`, `CONCERNS`, `CLAIMED`).
* `object` (string): Semantic triple object/concept (e.g. `Public Health Advisory`).
* `event` (string): Event descriptor (e.g. `INFORMATION_EVENT`).
* `event_date` (string): Target event date.
* `location` (string): Geographic entity involved (e.g. `Madhya Pradesh`).
* `claim_type` (string): Hierarchy tier (`PRIMARY` or `CONTEXT`).
* `label` (string): `REAL` or `FAKE`.
* `split` (string): `train`, `validation`, `test`.
* `synthetic` (bool): `true`.

---

### 3. `03_entities.csv`
* `entity_id` (string): Graph node identifier (`ENT000001` - `ENT000029`).
* `entity_name` (string): Canonical name (e.g. `Government / Institution`, `Madhya Pradesh`, `Financial Scheme`).
* `entity_type` (string): Taxonomy class (`ORGANIZATION`, `LOCATION`, `TOPIC`).

---

### 4. `05_evidence.csv`
* `evidence_id` (string): Unique identifier (`EV000001_1` - `EV000001_3`).
* `claim_id` (string): Target claim evaluated (`CL000001_1`).
* `article_id` (string): Parent article (`FN000001`).
* `evidence_text` (string): Retrieved factual evidence snippet.
* `source` (string): Authoritative origin.
* `source_type` (string): `OFFICIAL`, `INSTITUTIONAL`, `NEWS`.
* `published_at` (string): Timestamp.
* `bm25_score` (float): BM25 sparse keyword ranking score ($0.0 - 1.0$).
* `vector_score` (float): BGE-M3 dense semantic similarity score ($0.0 - 1.0$).
* `source_reliability` (float): Source credibility weighting ($0.0 - 1.0$).
* `temporal_score` (float): Temporal proximity and freshness score ($0.0 - 1.0$).
* `evidence_score` (float): Combined composite retrieval score ($0.0 - 1.0$).
* `synthetic` (bool): `true`.

---

### 5. `06_nli_training.csv`
* `nli_id` (string): NLI pair identifier (`NLI000001_1`).
* `claim_id` (string): Reference claim identifier.
* `evidence_id` (string): Reference evidence identifier.
* `claim_text` (string): Premise / claim text.
* `evidence_text` (string): Hypothesis / evidence text.
* `label` (string): NLI categorical label (`ENTAILMENT`, `CONTRADICTION`, `NEUTRAL`).
* `entailment_score` (float): Softmax probability for entailment.
* `contradiction_score` (float): Softmax probability for contradiction.
* `neutral_score` (float): Softmax probability for neutral.
* `model` (string): Underlying NLI model (`synthetic-xlm-r-nli`).
* `split` (string): `train`, `validation`, `test`.
* `synthetic` (bool): `true`.

---

### 6. `08_social_posts.csv`
* `post_id` (string): Social item identifier (`SOC000001`).
* `article_id` (string): Associated article.
* `platform` (string): Origin platform (`Twitter/X`, `WhatsApp`, `Telegram`, `Facebook`).
* `text` (string): Social post body content.
* `language` (string): ISO language code.
* `label` (string): `REAL` or `FAKE`.
* `split` (string): `train`, `validation`, `test`.
* `synthetic` (bool): `true`.

---

### 7. `09_image_metadata.csv`
* `image_id` (string): Image record ID (`IMG000010`).
* `article_id` (string): Associated article (`FN000010`).
* `image_path` (string): File reference (`images/FN000010.jpg`).
* `ocr_text` (string): Text extracted via EasyOCR.
* `ocr_language` (string): Detected language of embedded text.
* `ocr_confidence` (float): OCR detection confidence score ($0.0 - 1.0$).
* `clip_score` (float): Contrastive Language-Image Pretraining alignment score ($0.0 - 1.0$).
* `image_text_consistency` (float): Consistency metric ($0.0 - 1.0$). Values $< 0.60$ indicate out-of-context manipulation.
* `label` (string): `REAL` or `FAKE`.
* `synthetic` (bool): `true`.

---

### 8. `10_verification_results.csv`
* `verification_id` (string): Pipeline result ID (`VR000001`).
* `article_id` (string): Evaluated article (`FN000001`).
* `primary_claim_id` (string): Primary claim analyzed (`CL000001_1`).
* `supporting_evidence_count` (int): Count of entailment evidence records.
* `contradicting_evidence_count` (int): Count of contradiction evidence records.
* `best_evidence_score` (float): Top evidence candidate score.
* `temporal_consistency` (float): Temporal alignment metric.
* `numeric_consistency` (float): Numerical consistency metric.
* `graph_consistency` (float): Knowledge graph path consistency metric ($0.0 - 1.0$).
* `final_verdict` (string): Decision output (`SUPPORTED`, `CONTRADICTED`, `UNVERIFIED`).
* `confidence` (float): Normalized decision confidence ($0.0 - 1.0$).
* `label` (string): Ground truth label (`REAL` or `FAKE`).
* `split` (string): `train`, `validation`, `test`.
* `synthetic` (bool): `true`.

---

### 9. `12_train.csv`, `13_validation.csv`, `14_test.csv`
Standard ML classification splits:
* `article_id` (string): Article ID.
* `text` (string): Concatenated title and content.
* `language` (string): Article language.
* `category` (string): Category domain.
* `label` (string): Target label (`REAL` or `FAKE`).
* `split` (string): Partition name (`train`, `validation`, or `test`).
* `synthetic` (bool): `true`.
