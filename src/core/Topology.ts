import { NodeInfo, Edge, TopologySnapshot } from '../types/index.js';

export class Topology {
  private nodes = new Map<string, NodeInfo>();
  private edges = new Map<string, Edge>();

  /**
   * Add or update a node in the topology
   */
  addNode(nodeInfo: NodeInfo): void {
    this.nodes.set(nodeInfo.id, nodeInfo);
  }

  /**
   * Remove a node and its edges
   */
  removeNode(nodeId: string): void {
    this.nodes.delete(nodeId);
    const edgesToRemove: string[] = [];

    this.edges.forEach((edge, key) => {
      if (edge.source === nodeId || edge.target === nodeId) {
        edgesToRemove.push(key);
      }
    });

    edgesToRemove.forEach((key) => this.edges.delete(key));
  }

  /**
   * Add or update an edge between two nodes
   */
  addEdge(edge: Edge): void {
    const key = this.edgeKey(edge.source, edge.target);
    this.edges.set(key, { ...edge, lastSeen: Date.now() });
  }

  /**
   * Remove stale edges (not seen for timeout period)
   */
  pruneStaleEdges(timeoutMs: number = 30000): void {
    const now = Date.now();
    const toRemove: string[] = [];

    this.edges.forEach((edge, key) => {
      if (now - edge.lastSeen > timeoutMs) {
        toRemove.push(key);
      }
    });

    toRemove.forEach((key) => this.edges.delete(key));
  }

  /**
   * Get all neighbors of a node
   */
  getNeighbors(nodeId: string): Edge[] {
    const neighbors: Edge[] = [];

    this.edges.forEach((edge) => {
      if (edge.source === nodeId || edge.target === nodeId) {
        neighbors.push(edge);
      }
    });

    return neighbors;
  }

  /**
   * Get the current topology snapshot
   */
  getSnapshot(): TopologySnapshot {
    return {
      nodes: new Map(this.nodes),
      edges: Array.from(this.edges.values()),
      timestamp: Date.now(),
    };
  }

  /**
   * Get all nodes
   */
  getAllNodes(): NodeInfo[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get a specific node
   */
  getNode(nodeId: string): NodeInfo | undefined {
    return this.nodes.get(nodeId);
  }

  /**
   * Check if node exists
   */
  hasNode(nodeId: string): boolean {
    return this.nodes.has(nodeId);
  }

  /**
   * Get node count
   */
  getNodeCount(): number {
    return this.nodes.size;
  }

  private edgeKey(source: string, target: string): string {
    // Normalize edge key (order-independent for undirected graph)
    return [source, target].sort().join('--');
  }
}
