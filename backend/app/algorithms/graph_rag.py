from typing import List, Dict, Any, Optional
import logging
from app.db.neo4j_client import graph_db

logger = logging.getLogger(__name__)

class GraphRAGEngine:
    """
    Agentic Graph RAG Engine.
    Navigates multi-hop knowledge graph relationships using Dijkstra's Shortest Path
    and Breadth-First Search (BFS) neighborhood traversals to retrieve relational evidence
    and compute structural consistency scores.
    """
    def __init__(self):
        self.db = graph_db

    def extract_entities_from_text(self, text: str) -> List[str]:
        """Identifies known knowledge graph entities mentioned in text."""
        entities_found = []
        text_lower = text.lower()
        for node in self.db.graph.nodes():
            if node.lower() in text_lower:
                entities_found.append(node)
        return entities_found

    def find_relational_evidence(
        self,
        subject: Optional[str],
        topic_or_object: Optional[str],
        location: Optional[str]
    ) -> Dict[str, Any]:
        """
        Executes Dijkstra path analysis between subject and object/location,
        and retrieves 1-2 hop neighborhood context.
        """
        # Determine source and target nodes
        source = subject or "Government / Institution"
        target = location or topic_or_object or "India-wide"

        # Dijkstra Path
        path_info = self.db.find_dijkstra_path(source, target)
        if not path_info:
            path_info = {
                "source_entity": source,
                "target_entity": target,
                "shortest_path": [source, target],
                "path_length": 2,
                "hops": 2,
                "weight": 2.0,
                "relational_consistency": 0.64
            }

        # BFS Context Expansion from subject and location
        bfs_source = self.db.bfs_traversal(source, max_depth=2)
        
        # Interactive Subgraph for Visualizer
        focus_nodes = [source, target]
        if topic_or_object:
            focus_nodes.append(topic_or_object)
        subgraph = self.db.get_subgraph_for_visualization(focus_nodes, depth=1)

        return {
            "path_info": path_info,
            "relational_consistency": path_info.get("relational_consistency", 0.7),
            "bfs_neighbors": bfs_source[:8],
            "subgraph": subgraph
        }

graph_rag_engine = GraphRAGEngine()
