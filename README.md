# Skyball Sprint — Multiplayer / 联机版本

Separate multiplayer copy; the original single-player project is unchanged.

## Instant play

Open the public URL and play immediately. There are no room codes, invitation links, or start screens. You initially race against three computers while background matchmaking connects you with other visitors. Up to four humans share each race; new arrivals take over computer runners at their current position. Full or finished races route new visitors to another match. Computers fill remaining positions and replace disconnected guests.

Drag anywhere on mobile or use WASD / arrow keys. Everyone can build any lane. A full ball builds four steps. Release movement to stop; move backward to descend manually. Any player can request a new race after the result screen.

## Networking

PeerJS 1.5.5 and public PeerServer signaling provide WebRTC connections. Public deterministic peer IDs elect the host of each match; clients scan the next ID when a match is full. The host computes movement, resources, stairs and results, broadcasting snapshots at 20 Hz. Guests send bounded directional inputs which expire after 500 ms. Computers use the same movement and consumption rules.

This is a small-party prototype without a dedicated game or matchmaking server. The host must stay in the foreground. If the host leaves, remaining clients start a fresh computer race and attempt automatic matching again; progress is not migrated. When signaling or direct connectivity fails, computer play remains available and the top-left reconnect button retries. Restrictive NAT/carrier networks may prevent peer connections because a TURN relay is not configured. Audio retains the existing single-player samples.

## Build

Run `python3 build.py` to bundle the vendored Three.js, PeerJS, game code and sounds into `index.html`. Serve over HTTP(S); GitHub Pages serves the repository root.

- `game.js`: Three.js scene, audio and controls
- `network.js`: automatic matching, authoritative simulation and computer steering
- `shell.html`: page template
- `vendor/`: dependencies and licenses

PeerJS docs: https://peerjs.com/docs/
