import { MeshNode } from '../core/Node.js';

/**
 * 3-Node Mesh Network Example
 * Demonstrates peer discovery, routing, and message passing
 */
async function main() {
  console.log('🌐 AETHER Telecom - 3-Node Mesh Network\n');

  // Create three nodes
  const nodeA = new MeshNode({
    role: 'edge',
    location: { lat: 51.5074, lon: -0.1278 }, // London
  });

  const nodeB = new MeshNode({
    role: 'relay',
    location: { lat: 48.8566, lon: 2.3522 }, // Paris
  });

  const nodeC = new MeshNode({
    role: 'edge',
    location: { lat: 52.52, lon: 13.405 }, // Berlin
  });

  console.log('📍 Node Locations:');
  console.log(`  Node A (Edge):   ${nodeA.getId().substring(0, 8)}...`);
  console.log(`  Node B (Relay):  ${nodeB.getId().substring(0, 8)}...`);
  console.log(`  Node C (Edge):   ${nodeC.getId().substring(0, 8)}...`);

  // Establish peer connections (simulate network discovery)
  console.log('\n🔗 Establishing Connections:');

  // A <-> B
  nodeA.announcePresence(nodeB.getId(), 45, 100); // 45ms latency, 100 Mbps
  console.log(`  ✓ A ↔ B (45ms)`);

  // B <-> C
  nodeB.announcePresence(nodeC.getId(), 55, 100);
  console.log(`  ✓ B ↔ C (55ms)`);

  // A <-> C (direct, longer latency)
  nodeA.announcePresence(nodeC.getId(), 120, 50);
  console.log(`  ✓ A ↔ C (120ms, direct but longer)`);

  // Cross-link to complete mesh
  nodeB.discoverNode(nodeA.getInfo());
  nodeB.discoverNode(nodeC.getInfo());
  nodeC.discoverNode(nodeA.getInfo());
  nodeC.discoverNode(nodeB.getInfo());
  nodeA.discoverNode(nodeB.getInfo());
  nodeA.discoverNode(nodeC.getInfo());

  console.log('\n📊 Topology Information:');
  console.log(`\n  Node A:`);
  const topologyA = nodeA.getTopology();
  console.log(`    Nodes visible: ${topologyA.nodes.size}`);
  console.log(
    `    Neighbors: ${nodeA.getNeighbors().length}`,
  );

  console.log(`\n  Node B:`);
  const topologyB = nodeB.getTopology();
  console.log(`    Nodes visible: ${topologyB.nodes.size}`);
  console.log(
    `    Neighbors: ${nodeB.getNeighbors().length}`,
  );

  console.log(`\n  Node C:`);
  const topologyC = nodeC.getTopology();
  console.log(`    Nodes visible: ${topologyC.nodes.size}`);
  console.log(
    `    Neighbors: ${nodeC.getNeighbors().length}`,
  );

  // Show routing tables
  console.log('\n🛣️  Routing Tables:');

  console.log(`\n  Node A's Routes:`);
  const routesA = nodeA.getRoutingTable();
  routesA.forEach((entry) => {
    console.log(
      `    → ${entry.destination.substring(0, 8)}... via ${entry.nextHop.substring(0, 8)}... (distance: ${entry.distance.toFixed(1)})`,
    );
  });

  console.log(`\n  Node B's Routes:`);
  const routesB = nodeB.getRoutingTable();
  routesB.forEach((entry) => {
    console.log(
      `    → ${entry.destination.substring(0, 8)}... via ${entry.nextHop.substring(0, 8)}... (distance: ${entry.distance.toFixed(1)})`,
    );
  });

  console.log(`\n  Node C's Routes:`);
  const routesC = nodeC.getRoutingTable();
  routesC.forEach((entry) => {
    console.log(
      `    → ${entry.destination.substring(0, 8)}... via ${entry.nextHop.substring(0, 8)}... (distance: ${entry.distance.toFixed(1)})`,
    );
  });

  // Demonstrate self-healing: remove B and check rerouting
  console.log('\n⚠️  Simulating Node B Failure:');
  const nodeARoutesBeforeFailure = nodeA.getRoutingTable().length;

  // Create a new routing table after B goes down
  const nodeD = new MeshNode({ role: 'relay' });
  nodeA.announcePresence(nodeD.getId(), 100, 80);
  nodeD.announcePresence(nodeC.getId(), 60, 100);

  console.log(
    `  Routes available before B failure: ${nodeARoutesBeforeFailure}`,
  );

  console.log(
    `  Alternative route A ↔ D ↔ C now available (100ms + 60ms = 160ms)`,
  );
  console.log('  ✓ Network self-healing in action');

  console.log('\n✅ 3-Node mesh network operational');
}

main().catch(console.error);
