import { MeshNode } from '../core/Node.js';

/**
 * Single Node Example
 * Demonstrates basic node creation and information
 */
async function main() {
  console.log('🌐 AETHER Telecom - Single Node Example\n');

  // Create a node
  const node = new MeshNode({
    role: 'edge',
    location: { lat: 51.5074, lon: -0.1278 }, // London
  });

  console.log(`Node ID: ${node.getId()}`);
  console.log(`Fingerprint: ${node.getFingerprint()}`);
  console.log(`Role: ${node.getInfo().role}`);
  console.log(`Location: ${JSON.stringify(node.getInfo().location)}`);

  console.log('\n📊 Initial State:');
  const info = node.getInfo();
  console.log(
    `  Nodes in topology: ${node.getTopology().nodes.size}`,
  );
  console.log(
    `  Edges in topology: ${node.getTopology().edges.length}`,
  );
  console.log(
    `  Routing table entries: ${node.getRoutingTable().length}`,
  );

  console.log('\n✅ Single node ready for mesh discovery');
}

main().catch(console.error);
