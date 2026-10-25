import os
import csv
import logging
from typing import Dict, List, Any, Optional, Tuple
import networkx as nx
from app.config import settings

logger = logging.getLogger(__name__)

class Neo4jGraphClient:
    """
    Dual-mode Knowledge Graph Client:
    1. Connects to Neo4j via bolt protocol if available.
    2. Gracefully falls back to high-performance NetworkX embedded knowledge graph
       built directly from 03_entities.csv and 02_claims.csv relationships.
    """
    def __init__(self):
        self.driver = None
        self.connected_neo4j = False
        self.graph = nx.Graph()
        self.entities: Dict[str, Dict[str, Any]] = {}
        self.name_to_id: Dict[str, str] = {}
        self._init_embedded_graph()
        self._try_connect_neo4j()

    def _init_embedded_graph(self):
        """Build entity graph from 03_entities.csv and relational linkages."""
        entities_csv = settings.DATA_PATH / "03_entities.csv"
        if not entities_csv.exists():
            logger.warning(f"Entities file not found at {entities_csv}")
            return

        # Load entity nodes
        try:
            with open(entities_csv, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    eid = row["entity_id"]
                    ename = row["entity_name"].strip()
                    etype = row["entity_type"].strip()
                    self.entities[eid] = {
                        "id": eid,
                        "name": ename,
                        "type": etype
                    }
                    self.name_to_id[ename.lower()] = eid
                    self.graph.add_node(
                        ename,
                        id=eid,
                        name=ename,
                        type=etype
                    )

            # Build semantic edges based on relationships
            # 1. Hub connection: Government / Institution connects to Topics and Central entities
            gov = "Government / Institution"
            central_loc = "India-wide"
            
            # Connect India-wide to all state locations
            for eid, data in self.entities.items():
                name = data["name"]
                etype = data["type"]
                if etype == "LOCATION" and name != central_loc:
                    self.graph.add_edge(central_loc, name, relation="CONTAINS_STATE", weight=1.0)
                elif etype == "TOPIC":
                    self.graph.add_edge(gov, name, relation="ADMINISTERS", weight=1.2)
                    # Link topic to India-wide as general domain
                    self.graph.add_edge(name, central_loc, relation="NATIONWIDE_SCOPE", weight=1.5)

            # Connect Gov to India-wide directly
            if central_loc in self.graph:
                self.graph.add_edge(gov, central_loc, relation="JURISDICTION", weight=1.0)

            # Connect Related Topics for semantic multi-hop inference
            topic_links = [
                ("Public Health Advisory", "Public Safety Notice", "SYNERGY"),
                ("Public Health Advisory", "Environmental Programme", "INTERSECTS"),
                ("Financial Scheme", "Farmer Subsidy", "ECONOMIC_SUPPORT"),
                ("Financial Scheme", "Government Policy", "FRAMEWORK"),
                ("Education Programme", "Technology Programme", "SKILLS_DEV"),
                ("Sports Programme", "Entertainment Event", "CULTURAL_INITIATIVE"),
                ("Research Finding", "Technology Programme", "INNOVATION"),
                ("Farmer Subsidy", "Environmental Programme", "SUSTAINABILITY"),
                ("International Agreement", "Government Policy", "TREATY_MAPPING")
            ]
            for t1, t2, rel in topic_links:
                if t1 in self.graph and t2 in self.graph:
                    self.graph.add_edge(t1, t2, relation=rel, weight=1.4)

            # Add sample relationships from 02_claims.csv if available
            claims_csv = settings.DATA_PATH / "02_claims.csv"
            if claims_csv.exists():
                count = 0
                with open(claims_csv, mode="r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        subj = row.get("subject", "").strip()
                        obj = row.get("object", "").strip()
                        loc = row.get("location", "").strip()
                        pred = row.get("predicate", "RELATED_TO").strip()
                        
                        if subj and obj and subj in self.graph and obj in self.graph:
                            self.graph.add_edge(subj, obj, relation=pred, weight=1.1)
                        if obj and loc and obj in self.graph and loc in self.graph:
                            self.graph.add_edge(obj, loc, relation="IMPLEMENTED_IN", weight=1.2)
                        count += 1
                        if count >= 1000:  # Sample top claims for rich connectivity
                            break

            logger.info(f"Loaded Embedded Graph: {self.graph.number_of_nodes()} nodes, {self.graph.number_of_edges()} edges")
        except Exception as e:
            logger.error(f"Error loading entity graph: {e}")

    def _try_connect_neo4j(self):
        """Attempt to connect to live Neo4j instance."""
        try:
            from neo4j import GraphDatabase
            self.driver = GraphDatabase.driver(
                settings.NEO4J_URI,
                auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
            )
            # Test connectivity
            with self.driver.session() as session:
                result = session.run("RETURN 1 as test")
                if result.single():
                    self.connected_neo4j = True
                    logger.info("Connected to live Neo4j database successfully!")
        except Exception as e:
            self.connected_neo4j = False
            logger.info(f"Using high-performance embedded NetworkX graph ({e})")

    def find_entity_match(self, text: str) -> Optional[str]:
        """Fuzzy or substring match entity name from text."""
        text_lower = text.lower()
        # Direct lookup
        for name in self.graph.nodes():
            if name.lower() in text_lower:
                return name
        return None

    def find_dijkstra_path(self, source: str, target: str) -> Optional[Dict[str, Any]]:
        """
        Dijkstra Shortest Path algorithm between two entities.
        Computes shortest path length, intermediate hops, and relational consistency score.
        """
        if not source or not target:
            return None
        
        # Match entities in graph
        src_node = source if source in self.graph else self.find_entity_match(source)
        tgt_node = target if target in self.graph else self.find_entity_match(target)

        if not src_node or not tgt_node:
            # Fallback to closest nodes or central entities
            src_node = src_node or "Government / Institution"
            tgt_node = tgt_node or "India-wide"

        try:
            path = nx.dijkstra_path(self.graph, src_node, tgt_node, weight="weight")
            length = nx.dijkstra_path_length(self.graph, src_node, tgt_node, weight="weight")
            hops = len(path) - 1
            
            # Shorter paths indicate higher semantic connection
            relational_consistency = max(0.2, 1.0 - (hops * 0.18))

            return {
                "source_entity": src_node,
                "target_entity": tgt_node,
                "shortest_path": path,
                "path_length": int(hops),
                "hops": int(hops),
                "weight": round(float(length), 3),
                "relational_consistency": round(float(relational_consistency), 4)
            }
        except nx.NetworkXNoPath:
            return {
                "source_entity": src_node,
                "target_entity": tgt_node,
                "shortest_path": [src_node, tgt_node],
                "path_length": 99,
                "hops": 99,
                "weight": 99.0,
                "relational_consistency": 0.1
            }
        except Exception as e:
            logger.error(f"Dijkstra calculation error: {e}")
            return None

    def bfs_traversal(self, start_node: str, max_depth: int = 2) -> List[Dict[str, Any]]:
        """
        Breadth-First Search (BFS) neighborhood exploration up to max_depth.
        Discovers related contextual entities.
        """
        node = start_node if start_node in self.graph else self.find_entity_match(start_node)
        if not node:
            node = "Government / Institution"

        visited = {node: 0}
        queue = [(node, 0)]
        results = []

        while queue:
            curr, depth = queue.pop(0)
            if depth >= max_depth:
                continue

            for neighbor in self.graph.neighbors(curr):
                if neighbor not in visited:
                    visited[neighbor] = depth + 1
                    edge_data = self.graph.get_edge_data(curr, neighbor) or {}
                    rel = edge_data.get("relation", "CONNECTS")
                    node_data = self.graph.nodes[neighbor]
                    results.append({
                        "node": neighbor,
                        "depth": depth + 1,
                        "relation": rel,
                        "type": node_data.get("type", "ENTITY"),
                        "parent": curr
                    })
                    queue.append((neighbor, depth + 1))

        return results

    def get_subgraph_for_visualization(self, focus_nodes: List[str], depth: int = 1) -> Dict[str, Any]:
        """
        Extracts an interactive subgraph centered around focus_nodes for front-end rendering.
        Outputs nodes and links compatible with React Force Graph / D3.
        """
        matched_nodes = set()
        for fn in focus_nodes:
            if not fn:
                continue
            m = fn if fn in self.graph else self.find_entity_match(fn)
            if m:
                matched_nodes.add(m)

        if not matched_nodes:
            matched_nodes = {"Government / Institution", "India-wide"}

        # Expand by 1 hop
        expanded_nodes = set(matched_nodes)
        for node in matched_nodes:
            expanded_nodes.update(self.graph.neighbors(node))

        sub = self.graph.subgraph(expanded_nodes)

        nodes = []
        for n in sub.nodes():
            data = self.graph.nodes[n]
            nodes.append({
                "id": n,
                "label": n,
                "type": data.get("type", "TOPIC"),
                "is_focus": n in matched_nodes
            })

        links = []
        for u, v, data in sub.edges(data=True):
            links.append({
                "source": u,
                "target": v,
                "relation": data.get("relation", "RELATES_TO"),
                "weight": data.get("weight", 1.0)
            })

        return {
            "nodes": nodes,
            "links": links,
            "total_nodes": len(nodes),
            "total_edges": len(links)
        }

    def close(self):
        if self.driver:
            self.driver.close()

graph_db = Neo4jGraphClient()
