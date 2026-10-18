---
title: "Graph Neural Networks"
termSlug: "graph-neural-networks"
year: 2026
month: 4
monthName: "April"
day: 13
order: 7
source: "2026/apr-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/apr-term.md"
excerpt: "Graph Neural Networks (GNNs) are a class of deep learning models designed to operate directly on graph-structured data — learning representations of nodes, edges, and entire graphs by iteratively a..."
---
### Definition:

Graph Neural Networks (GNNs) are a class of deep learning models designed to operate directly on graph-structured data — learning representations of nodes, edges, and entire graphs by iteratively aggregating and transforming information from neighboring nodes — enabling machines to reason about data where relationships and connections between entities are as important as the entities themselves.

GNNs extend the power of neural networks beyond grids (images) and sequences (text) to the most general data structure in mathematics — the graph — making them the natural tool for any problem where "who is connected to whom" fundamentally changes the answer.

What is a Graph — The Foundation

A Graph G = (V, E) consists of:

  V = Vertices (nodes) — the entities
  E = Edges — the relationships between entities

```text
  Visual:
       [A]──────[B]
        │  \      │
        │    \    │
       [C]────[D]─[E]

  Nodes: A, B, C, D, E  (5 nodes)
  Edges: A-B, A-C, A-D, B-D, B-E, C-D, D-E  (7 edges)

  Each node can have FEATURES (a vector of numbers):
    Node A: [age=25, income=50k, active=1]
    Node B: [age=32, income=80k, active=1]
    Node C: [age=19, income=20k, active=0]

  Each edge can have FEATURES too:
    Edge A-B: [friendship_strength=0.9, years_known=5]
    Edge A-C: [friendship_strength=0.3, years_known=1]

  Graph types:
    Undirected: A─B means A knows B AND B knows A
    Directed:   A→B means A follows B (not necessarily vice versa)
    Weighted:   edges have numerical weights
    Heterogeneous: multiple types of nodes and edges
```

### Example:

Drug Discovery with GNNs
A pharmaceutical company uses GNNs to predict whether new drug molecules will be toxic before expensive lab testing.

```
# molecule_gnn.py
# GNN for molecular toxicity prediction
# Using PyTorch Geometric (PyG)

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.nn import GCNConv, GATConv, global_mean_pool
from torch_geometric.data import Data, DataLoader

# ── Step 1: Represent a molecule as a graph ──────────────────

def molecule_to_graph(smiles: str) -> Data:
    """
    Convert SMILES string to PyG graph
    In practice: use RDKit for atom/bond feature extraction
    """
    from rdkit import Chem
    from rdkit.Chem import AllChem

    mol = Chem.MolFromSmiles(smiles)

    # Node features (one per atom)
    node_features = []
    for atom in mol.GetAtoms():
        features = [
            atom.GetAtomicNum(),              # atomic number (C=6, N=7...)
            atom.GetDegree(),                 # number of bonds
            atom.GetFormalCharge(),           # charge
            int(atom.GetIsAromatic()),        # aromatic ring?
            int(atom.IsInRing()),             # in a ring?
            atom.GetTotalNumHs(),             # hydrogen count
        ]
        node_features.append(features)

    # Edge indices (bonds)
    edge_indices = []
    edge_features = []
    for bond in mol.GetBonds():
        i = bond.GetBeginAtomIdx()
        j = bond.GetEndAtomIdx()

        # Undirected: add both directions
        edge_indices += [[i, j], [j, i]]

        bond_features = [
            bond.GetBondTypeAsDouble(),       # 1.0=single, 1.5=aromatic, 2.0=double
            int(bond.IsInRing()),             # in ring?
            int(bond.GetIsConjugated()),      # conjugated?
        ]
        edge_features += [bond_features, bond_features]

    return Data(
        x          = torch.tensor(node_features, dtype=torch.float),
        edge_index = torch.tensor(edge_indices,  dtype=torch.long).t(),
        edge_attr  = torch.tensor(edge_features, dtype=torch.float),
    )

# ── Step 2: Define the GNN Model ─────────────────────────────

class MolecularGNN(nn.Module):
    """
    GNN for molecular property prediction.
    Architecture: 3 GCN layers → global pooling → MLP classifier
    """

    def __init__(
        self,
        node_features:   int = 6,
        hidden_channels: int = 64,
        num_classes:     int = 2,    # toxic / non-toxic
        num_layers:      int = 3,
        dropout:         float = 0.5,
    ):
        super().__init__()

        self.dropout = dropout

        # GNN layers — message passing
        self.conv_layers = nn.ModuleList()

        # First layer: node_features → hidden
        self.conv_layers.append(
            GCNConv(node_features, hidden_channels)
        )

        # Hidden layers: hidden → hidden
        for _ in range(num_layers - 1):
            self.conv_layers.append(
                GCNConv(hidden_channels, hidden_channels)
            )

        # Batch normalization after each GNN layer
        self.batch_norms = nn.ModuleList([
            nn.BatchNorm1d(hidden_channels)
            for _ in range(num_layers)
        ])

        # Graph-level classifier (after pooling)
        self.classifier = nn.Sequential(
            nn.Linear(hidden_channels, hidden_channels // 2),
            nn.ReLU(),
            nn.Dropout(p=dropout),
            nn.Linear(hidden_channels // 2, num_classes),
        )

    def forward(self, data):
        x          = data.x           # node features [N, 6]
        edge_index = data.edge_index  # graph connectivity [2, E]
        batch      = data.batch       # batch assignment [N]

        # ── Message Passing Layers ────────────────────────
        for conv, bn in zip(self.conv_layers, self.batch_norms):
            # 1. Aggregate messages from neighbors
            x = conv(x, edge_index)
            # 2. Normalize
            x = bn(x)
            # 3. Non-linearity
            x = F.relu(x)
            # 4. Dropout for regularization
            x = F.dropout(x, p=self.dropout, training=self.training)

        # After 3 layers: each atom knows its 3-hop neighborhood
        # x shape: [num_atoms, 64] — one embedding per atom

        # ── Graph-Level Pooling ───────────────────────────
        # Aggregate all atom embeddings → single molecule embedding
        # global_mean_pool: average all atom embeddings per molecule
        graph_embedding = global_mean_pool(x, batch)
        # graph_embedding shape: [batch_size, 64]

        # ── Classification ────────────────────────────────
        out = self.classifier(graph_embedding)
        # out shape: [batch_size, 2] → toxic / non-toxic logits

        return out

    def predict_toxicity(self, smiles: str) -> dict:
        """Predict toxicity for a single molecule"""
        self.eval()
        with torch.no_grad():
            graph = molecule_to_graph(smiles)
            graph.batch = torch.zeros(
                graph.x.size(0), dtype=torch.long
            )
            logits = self.forward(graph)
            probs  = F
```
