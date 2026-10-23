export interface NodeId {
  id: string;
}

export interface PublicKey {
  algorithm: 'rsa' | 'pqc'; // post-quantum crypto
  key: string;
  fingerprint: string;
}

export interface NodeInfo {
  id: string;
  publicKey: PublicKey;
  role: 'edge' | 'relay' | 'compute' | 'hub';
  location?: { lat: number; lon: number };
  timestamp: number;
}

export interface Edge {
  source: string;
  target: string;
  latency: number; // milliseconds
  bandwidth: number; // Mbps
  strength: number; // signal strength 0-100
  lastSeen: number;
}

export interface Message {
  id: string;
  source: string;
  destination: string;
  payload: Buffer;
  ttl: number;
  path?: string[]; // Route taken
  timestamp: number;
}

export interface RoutingEntry {
  destination: string;
  nextHop: string;
  distance: number;
  path: string[];
  timestamp: number;
}

export interface TopologySnapshot {
  nodes: Map<string, NodeInfo>;
  edges: Edge[];
  timestamp: number;
}

export interface RouteQuality {
  latency: number;
  bandwidth: number;
  reliability: number; // 0-1
  cost: number; // Combined metric
}
