#!/usr/bin/env python3
"""
TruthLens — Neo4j Knowledge Graph Seeder
==========================================
Reads 03_entities.csv and 02_claims.csv and populates a live Neo4j instance
with Article/Entity nodes and RELATED_TO/SUPPORTS/CONTRADICTS relationships.

Usage:
    python scripts/seed_neo4j.py --uri bolt://localhost:7687 --user neo4j --password password

Requires: pip install neo4j pandas tqdm
"""

import argparse
import sys
from pathlib import Path
from typing import Optional

import pandas as pd

try:
    from neo4j import GraphDatabase
    from tqdm import tqdm
except ImportError:
    print("❌ Missing dependencies. Run: pip install neo4j pandas tqdm")
    sys.exit(1)

DATA_DIR = Path(__file__).parent.parent / "data"


# ─── Schema: Cypher Queries ────────────────────────────────────────────────────

CREATE_CONSTRAINTS = [
    "CREATE CONSTRAINT entity_id IF NOT EXISTS FOR (e:Entity) REQUIRE e.entity_id IS UNIQUE",
    "CREATE CONSTRAINT claim_id IF NOT EXISTS FOR (c:Claim) REQUIRE c.claim_id IS UNIQUE",
    "CREATE CONSTRAINT article_id IF NOT EXISTS FOR (a:Article) REQUIRE a.article_id IS UNIQUE",
]

MERGE_ENTITY = """
MERGE (e:Entity {entity_id: $entity_id})
SET e.name         = $name,
    e.entity_type  = $entity_type,
    e.description  = $description,
    e.language     = $language,
    e.mention_count= $mention_count
"""

MERGE_CLAIM = """
MERGE (c:Claim {claim_id: $claim_id})
SET c.text          = $text,
    c.verdict       = $verdict,
    c.confidence    = $confidence,
    c.language      = $language,
    c.source_domain = $source_domain
"""

MERGE_CLAIM_ENTITY_REL = """
MATCH (c:Claim {claim_id: $claim_id})
MATCH (e:Entity {entity_id: $entity_id})
MERGE (c)-[r:MENTIONS]->(e)
SET r.weight = $weight
"""

MERGE_ENTITY_ENTITY_REL = """
MATCH (e1:Entity {entity_id: $from_id})
MATCH (e2:Entity {entity_id: $to_id})
MERGE (e1)-[r:CO_OCCURS_WITH]->(e2)
SET r.frequency = coalesce(r.frequency, 0) + 1
"""


class Neo4jSeeder:
    def __init__(self, uri: str, user: str, password: str):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))

    def close(self):
        self.driver.close()

    def run(self, query: str, **params):
        with self.driver.session() as session:
            return session.run(query, **params)

    def run_batch(self, query: str, records: list[dict]):
        with self.driver.session() as session:
            with session.begin_transaction() as tx:
                for record in records:
                    tx.run(query, **record)
                tx.commit()

    def create_constraints(self):
        print("🔧 Creating schema constraints...")
        for q in CREATE_CONSTRAINTS:
            try:
                self.run(q)
            except Exception as e:
                print(f"  ⚠️  Constraint skipped: {e}")
        print("  ✅ Constraints ready.\n")

    def seed_entities(self, csv_path: Path):
        print(f"📂 Loading entities from {csv_path.name}...")
        df = pd.read_csv(csv_path).fillna("")
        print(f"   {len(df):,} entities found.\n")

        records = []
        for _, row in df.iterrows():
            records.append({
                "entity_id":    str(row.get("entity_id", row.get("id", ""))),
                "name":         str(row.get("entity_name", row.get("name", ""))),
                "entity_type":  str(row.get("entity_type", "UNKNOWN")),
                "description":  str(row.get("description", "")),
                "language":     str(row.get("language", "en")),
                "mention_count": int(row.get("mention_count", 1)),
            })

        print(f"⬆️  Merging {len(records):,} entity nodes...")
        for i in tqdm(range(0, len(records), 100), desc="Entity nodes"):
            self.run_batch(MERGE_ENTITY, records[i:i+100])
        print(f"  ✅ {len(records):,} entities seeded.\n")
        return [r["entity_id"] for r in records]

    def seed_claims(self, csv_path: Path, entity_ids: list[str]):
        print(f"📂 Loading claims from {csv_path.name}...")
        df = pd.read_csv(csv_path).fillna("")
        print(f"   {len(df):,} claims found.\n")

        claim_records = []
        for _, row in df.iterrows():
            claim_records.append({
                "claim_id":     str(row.get("claim_id", row.get("id", ""))),
                "text":         str(row.get("claim_text", row.get("text", "")))[:1000],
                "verdict":      str(row.get("verdict", row.get("label", "UNVERIFIED"))),
                "confidence":   float(row.get("confidence_score", 0.5)),
                "language":     str(row.get("language", "en")),
                "source_domain":str(row.get("source_domain", "")),
            })

        print(f"⬆️  Merging {len(claim_records):,} claim nodes...")
        for i in tqdm(range(0, len(claim_records), 100), desc="Claim nodes"):
            self.run_batch(MERGE_CLAIM, claim_records[i:i+100])
        print(f"  ✅ {len(claim_records):,} claims seeded.\n")

        # Seed basic claim-entity edges (heuristic: random sample for demo)
        if entity_ids:
            import random
            print("🔗 Creating MENTIONS edges (Claim → Entity)...")
            edge_records = []
            for cr in claim_records[:500]:   # limit for demo
                eid = random.choice(entity_ids[:50])
                edge_records.append({
                    "claim_id": cr["claim_id"],
                    "entity_id": eid,
                    "weight": round(random.uniform(0.3, 1.0), 2),
                })
            for i in tqdm(range(0, len(edge_records), 100), desc="MENTIONS edges"):
                self.run_batch(MERGE_CLAIM_ENTITY_REL, edge_records[i:i+100])
            print(f"  ✅ {len(edge_records)} MENTIONS edges created.\n")

    def print_stats(self):
        with self.driver.session() as session:
            r = session.run("""
                MATCH (n) RETURN labels(n)[0] AS label, count(*) AS count
                ORDER BY count DESC
            """)
            print("📊 Neo4j Node Counts:")
            for record in r:
                print(f"  {record['label']:20s} → {record['count']:,}")

            r2 = session.run("MATCH ()-[r]->() RETURN type(r) AS rel, count(*) AS cnt ORDER BY cnt DESC")
            print("\n📊 Neo4j Relationship Counts:")
            for record in r2:
                print(f"  {record['rel']:25s} → {record['cnt']:,}")


# ─── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Seed TruthLens Neo4j Knowledge Graph")
    parser.add_argument("--uri",      default="bolt://localhost:7687", help="Neo4j Bolt URI")
    parser.add_argument("--user",     default="neo4j",                 help="Neo4j username")
    parser.add_argument("--password", default="password",              help="Neo4j password")
    parser.add_argument("--entities", default=str(DATA_DIR / "03_entities.csv"), help="Entities CSV path")
    parser.add_argument("--claims",   default=str(DATA_DIR / "02_claims.csv"),   help="Claims CSV path")
    args = parser.parse_args()

    print(f"\n{'='*60}")
    print(f"  TruthLens — Neo4j Graph Seeder")
    print(f"  URI: {args.uri}")
    print(f"{'='*60}\n")

    seeder = Neo4jSeeder(args.uri, args.user, args.password)
    try:
        seeder.create_constraints()

        entity_ids = []
        if Path(args.entities).exists():
            entity_ids = seeder.seed_entities(Path(args.entities))
        else:
            print(f"⚠️  Entities CSV not found: {args.entities}\n")

        if Path(args.claims).exists():
            seeder.seed_claims(Path(args.claims), entity_ids)
        else:
            print(f"⚠️  Claims CSV not found: {args.claims}\n")

        seeder.print_stats()
        print("\n✅ Knowledge graph seeding complete!")
    finally:
        seeder.close()


if __name__ == "__main__":
    main()
