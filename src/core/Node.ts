import { randomUUID } from 'crypto';
import { NodeInfo, Message, Edge } from '../types/index.js';
import { PKI } from '../crypto/PKI.js';
import { Topology } from './Topology.js';
import { Router } from './Router.js';

export interface NodeOptions {
  role?: 'edge' | 'relay' | 'compute' | 'hub';
  location?: { lat: number; lon: number };
}

export class MeshNode {
  readonly id: string;
  readonly role: 'edge' | 'relay' | 'compute' | 'hub';
  private publicKey: string;
  private privateKey: string;
  private topology: Topology;
  private router: Router;
  private messageQueue = new Map<string, Message>();
  private listeners = new Map<
    string,
    (message: Message) => void | Promise<void>
  >();

  constructor(options: NodeOptions = {}) {
    this.id = randomUUID();
    this.role = options.role ?? 'edge';

    const identity = PKI.generateNodeIdentity();
    this.publicKey = identity.publicKey;
    this.privateKey = identity.privateKey;

    this.topology = new Topology();
    this.router = new Router(this.topology);

    // Register self in topology
    this.topology.addNode({
      id: this.id,
      publicKey: {
        algorithm: 'rsa',
        key: this.publicKey,
        fingerprint: identity.fingerprint,
      },
      role: this.role,
      location: options.location,
      timestamp: Date.now(),
    });
  }

  /**
   * Get node ID
   */
  getId(): string {
    return this.id;
  }

  /**
   * Get public key fingerprint
   */
  getFingerprint(): string {
    return PKI.generateFingerprint(this.publicKey);
  }

  /**
   * Announce node presence to a peer
   */
  announcePresence(
    targetNodeId: string,
    latency: number,
    bandwidth: number = 100,
  ): void {
    const edge: Edge = {
      source: this.id,
      target: targetNodeId,
      latency,
      bandwidth,
      strength: 100 - Math.min(latency / 2, 50), // Signal strength based on latency
      lastSeen: Date.now(),
    };

    this.topology.addEdge(edge);
    this.router.computeRoutes(this.id);
  }

  /**
   * Discover a remote node and add to topology
   */
  discoverNode(remoteNodeInfo: NodeInfo): void {
    this.topology.addNode(remoteNodeInfo);
  }

  /**
   * Send a message to a destination
   */
  async sendMessage(destination: string, payload: Buffer): Promise<string> {
    const message: Message = {
      id: randomUUID(),
      source: this.id,
      destination,
      payload,
      ttl: 64,
      timestamp: Date.now(),
    };

    const path = this.router.getPath(destination);
    if (path) {
      message.path = path;
    }

    this.messageQueue.set(message.id, message);

    // If message is for this node, deliver immediately
    if (destination === this.id) {
      await this.deliverMessage(message);
    }

    return message.id;
  }

  /**
   * Register message listener
   */
  onMessage(
    pattern: string | 'all',
    handler: (message: Message) => void | Promise<void>,
  ): void {
    this.listeners.set(pattern, handler);
  }

  /**
   * Deliver message to local handlers
   */
  private async deliverMessage(message: Message): Promise<void> {
    const handler = this.listeners.get('all');
    if (handler) {
      await handler(message);
    }
  }

  /**
   * Route a message (forward or deliver)
   */
  async routeMessage(message: Message): Promise<void> {
    message.ttl--;

    if (message.ttl <= 0) {
      console.warn(
        `[${this.id}] Message ${message.id} TTL expired, dropping`,
      );
      return;
    }

    if (message.destination === this.id) {
      await this.deliverMessage(message);
      return;
    }

    const nextHop = this.router.getNextHop(message.destination);
    if (!nextHop) {
      console.warn(
        `[${this.id}] No route to ${message.destination}, storing message`,
      );
      this.messageQueue.set(message.id, message);
      return;
    }

    // In a real implementation, forward to nextHop via transport layer
    console.log(
      `[${this.id}] Routing message ${message.id} to ${nextHop} (for ${message.destination})`,
    );
  }

  /**
   * Get current topology
   */
  getTopology() {
    return this.topology.getSnapshot();
  }

  /**
   * Get routing table
   */
  getRoutingTable() {
    return this.router.getRoutingTable();
  }

  /**
   * Get node neighbors
   */
  getNeighbors(): Edge[] {
    return this.topology.getNeighbors(this.id);
  }

  /**
   * Health check - prune stale edges
   */
  healthCheck(): void {
    this.topology.pruneStaleEdges();
  }

  /**
   * Get node info
   */
  getInfo(): NodeInfo {
    const node = this.topology.getNode(this.id);
    if (!node) {
      throw new Error('Node info not found');
    }
    return node;
  }
}
