# Skyball Sprint — Multiplayer / 联机版本

Separate multiplayer copy; the original single-player project is unchanged.

## Automatic waiting room

Open the public URL to join a waiting room automatically. No room code or invitation link is needed. The first visitor is the host. With at least one other human connected (2 humans total), the host can click Start race. The game does not run while waiting. Empty slots are filled by computers when the host starts; 2, 3 or 4 humans are supported.

Full or already-started rooms route new visitors to another waiting room. Computers replace guests who leave during a race. Only the host can start or replay a race, with at least two humans still connected.

Drag anywhere on mobile or use WASD / arrow keys. Everyone can build any lane. A full ball builds four steps. Release movement to stop; move backward to descend manually.

## Networking

PeerJS 1.5.5 and public PeerServer signaling provide WebRTC connections. Public deterministic peer IDs elect the host of each match; clients scan the next ID when a match is full. The host computes movement, resources, stairs and results, broadcasting snapshots at 20 Hz. Guests send bounded directional inputs which expire after 500 ms. Computers use the same movement and consumption rules.

This is a small-party prototype without a dedicated game or matchmaking server. The host must stay in the foreground. If the host leaves, remaining clients return to a fresh waiting room and attempt automatic matching again; progress is not migrated. When signaling or direct connectivity fails, the waiting screen offers a Reconnect button. Restrictive NAT/carrier networks may prevent peer connections because a TURN relay is not configured. Audio retains the existing single-player samples.

## Build

Run `python3 build.py` to bundle the vendored Three.js, PeerJS, game code and sounds into `index.html`. Serve over HTTP(S); GitHub Pages serves the repository root.

- `game.js`: Three.js scene, audio and controls
- `network.js`: automatic matching, authoritative simulation and computer steering
- `shell.html`: page template
- `vendor/`: dependencies and licenses

PeerJS docs: https://peerjs.com/docs/
