import { RoutingEntry, RouteQuality } from '../types/index.js';
import { Topology } from './Topology.js';

export class Router {
  private routingTable = new Map<string, RoutingEntry>();
  private topology: Topology;

  constructor(topology: Topology) {
    this.topology = topology;
  }

  /**
   * Compute shortest path using Dijkstra's algorithm
   * Considers latency as the primary metric
   */
  computeRoutes(sourceId: string): void {
    const snapshot = this.topology.getSnapshot();
    const distances = new Map<string, number>();
    const previous = new Map<string, string>();
    const unvisited = new Set<string>();

    // Initialize
    snapshot.nodes.forEach((node) => {
      distances.set(node.id, node.id === sourceId ? 0 : Infinity);
      unvisited.add(node.id);
    });

    while (unvisited.size > 0) {
      // Find unvisited node with smallest distance
      let current: string | null = null;
      let minDist = Infinity;

      unvisited.forEach((nodeId) => {
        const dist = distances.get(nodeId) ?? Infinity;
        if (dist < minDist) {
          minDist = dist;
          current = nodeId;
        }
      });

      if (current === null || minDist === Infinity) break;

      const node = current; // TypeScript type guard
      unvisited.delete(node);

      // Update distances through node
      const neighbors = this.topology.getNeighbors(node);
      neighbors.forEach((edge) => {
        const neighbor =
          edge.source === node ? edge.target : edge.source;

        // Prefer lower latency, but boost reliability
        const cost = edge.latency / (1 + edge.strength / 100);
        const newDist = (distances.get(node) ?? Infinity) + cost;

        if (newDist < (distances.get(neighbor) ?? Infinity)) {
          distances.set(neighbor, newDist);
          previous.set(neighbor, node);
        }
      });
    }

    // Build routing table
    this.routingTable.clear();
    distances.forEach((distance, destination) => {
      if (destination === sourceId) return;
      if (distance === Infinity) return;

      const path: string[] = [];
      let current: string | undefined = destination;

      while (current && current !== sourceId) {
        path.unshift(current);
        const prev = previous.get(current);
        if (!prev) break;
        current = prev;
      }

      if (current === sourceId) {
        path.unshift(sourceId);

        this.routingTable.set(destination, {
          destination,
          nextHop: path[1] || destination,
          distance,
          path,
          timestamp: Date.now(),
        });
      }
    });
  }

  /**
   * Get the next hop for a destination
   */
  getNextHop(destination: string): string | null {
    const entry = this.routingTable.get(destination);
    return entry?.nextHop ?? null;
  }

  /**
   * Get the complete path to a destination
   */
  getPath(destination: string): string[] | null {
    const entry = this.routingTable.get(destination);
    return entry?.path ?? null;
  }

  /**
   * Get routing entry
   */
  getRoutingEntry(destination: string): RoutingEntry | undefined {
    return this.routingTable.get(destination);
  }

  /**
   * Calculate route quality metrics
   */
  calculateRouteQuality(path: string[]): RouteQuality {
    let totalLatency = 0;
    let minBandwidth = Infinity;
    let reliability = 1;

    // Traverse path edges
    for (let i = 0; i < path.length - 1; i++) {
      const source = path[i];
      const target = path[i + 1];
      const neighbors = this.topology.getNeighbors(source);

      const edge = neighbors.find(
        (e) =>
          (e.source === source && e.target === target) ||
          (e.target === source && e.source === target),
      );

      if (edge) {
        totalLatency += edge.latency;
        minBandwidth = Math.min(minBandwidth, edge.bandwidth);
        reliability *= edge.strength / 100; // Multiply signal strengths
      }
    }

    const cost = totalLatency * (1 / (minBandwidth || 1)) * (1 / reliability);

    return {
      latency: totalLatency,
      bandwidth: minBandwidth === Infinity ? 0 : minBandwidth,
      reliability,
      cost,
    };
  }

  /**
   * Get all routing entries
   */
  getRoutingTable(): RoutingEntry[] {
    return Array.from(this.routingTable.values());
  }

  /**
   * Clear routing table
   */
  clearRoutingTable(): void {
    this.routingTable.clear();
  }
}
