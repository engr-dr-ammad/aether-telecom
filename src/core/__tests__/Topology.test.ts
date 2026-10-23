import { Topology } from '../Topology';
import { NodeInfo, Edge } from '../../types/index';

describe('Topology', () => {
  let topology: Topology;

  beforeEach(() => {
    topology = new Topology();
  });

  describe('Node Management', () => {
    it('should add a node', () => {
      const nodeInfo: NodeInfo = {
        id: 'node-1',
        publicKey: {
          algorithm: 'rsa',
          key: 'test-key',
          fingerprint: 'test-fp',
        },
        role: 'edge',
        timestamp: Date.now(),
      };

      topology.addNode(nodeInfo);
      expect(topology.hasNode('node-1')).toBe(true);
    });

    it('should remove a node', () => {
      const nodeInfo: NodeInfo = {
        id: 'node-1',
        publicKey: {
          algorithm: 'rsa',
          key: 'test-key',
          fingerprint: 'test-fp',
        },
        role: 'edge',
        timestamp: Date.now(),
      };

      topology.addNode(nodeInfo);
      topology.removeNode('node-1');
      expect(topology.hasNode('node-1')).toBe(false);
    });

    it('should get node count', () => {
      const nodeInfo1: NodeInfo = {
        id: 'node-1',
        publicKey: {
          algorithm: 'rsa',
          key: 'test-key',
          fingerprint: 'test-fp',
        },
        role: 'edge',
        timestamp: Date.now(),
      };

      const nodeInfo2: NodeInfo = {
        id: 'node-2',
        publicKey: {
          algorithm: 'rsa',
          key: 'test-key',
          fingerprint: 'test-fp',
        },
        role: 'relay',
        timestamp: Date.now(),
      };

      topology.addNode(nodeInfo1);
      topology.addNode(nodeInfo2);
      expect(topology.getNodeCount()).toBe(2);
    });
  });

  describe('Edge Management', () => {
    it('should add an edge', () => {
      const edge: Edge = {
        source: 'node-1',
        target: 'node-2',
        latency: 50,
        bandwidth: 100,
        strength: 90,
        lastSeen: Date.now(),
      };

      topology.addEdge(edge);
      const neighbors = topology.getNeighbors('node-1');
      expect(neighbors).toHaveLength(1);
      expect(neighbors[0].target).toBe('node-2');
    });

    it('should keep fresh edges and prune stale ones', () => {
      const freshEdge: Edge = {
        source: 'node-1',
        target: 'node-2',
        latency: 50,
        bandwidth: 100,
        strength: 90,
        lastSeen: Date.now(),
      };

      topology.addEdge(freshEdge);
      // Pruning with very long timeout should keep the edge
      topology.pruneStaleEdges(100000);
      expect(topology.getNeighbors('node-1')).toHaveLength(1);
    });
  });
});
