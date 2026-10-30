# MESH documentation

> Authored for this app (not imported). It lists the pages and says which are imported and which are written about this client.

This reader has two kinds of pages.

| Page | Kind | What it covers |
|---|---|---|
| About this implementation | Authored here | What this app is, what works, what is demo, limits, storage, security |
| How it works | Authored here | Modes, node connection, identity, posting, feeds, groups, DMs, moderation |
| Getting started with others | Authored here | Run or reach a node, create identities, find and follow people, troubleshooting |
| MESH protocol: overview | Imported | Layered stack and comparison, from the protocol README |
| MESH spec v1.1: overview, principles, architecture | Imported | Spec sections 1 to 3 |
| MESH spec v1.1: privacy, storage and integrity layers | Imported | Spec sections 4 to 6 |
| MESH spec v1.1: social and moderation layers | Imported | Spec sections 7 and 8 |
| MESH spec v1.1: view, network and application layers | Imported | Spec sections 9 to 11 |
| MESH spec v1.1: sync protocol and security model | Imported | Spec sections 15 and 16 |

## Where the protocol pages come from

The imported pages are copies of text in the MESH protocol repository, `https://github.com/FraterCCCLXIII/mesh-protocol` (released by its authors under CC0 1.0). Each one starts with a `Source:` line giving the file and line range. Some sections of the specification are left out for length (for example multi-device and identity recovery, sections 12 to 14, and the appendices). Read the repository for the whole specification.

The README of this app links to `https://github.com/holon-protocol/mesh-protocol`. That address did not resolve on GitHub when these docs were written; the local clone used for the import has `FraterCCCLXIII/mesh-protocol` as its remote.

## Reading order

1. About this implementation
2. How it works
3. Getting started with others
4. The protocol pages, in the order of the table above

The spec describes protocol version 1.1. This app talks to nodes over HTTP, and the node servers it targets are described in the other pages. Where the spec and the node servers differ, the node servers decide what this app can do.
