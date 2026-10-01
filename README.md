# Skyball Sprint — Multiplayer / 联机版本

Separate multiplayer copy of Skyball Sprint. The single-player project is unchanged.

## Play

Create a room, share its invitation link, and wait for 2–4 players. The host starts the race. Drag anywhere on mobile or use WASD / arrow keys on desktop. Each person controls a different colored runner; the camera follows your runner. Every player can build any lane. A full ball builds four steps. Stop dragging to stop building; move backward to descend manually. The host can start another race from the result screen.

No account, microphone, or camera permission is required. Invite links grant access to a room; share them only with intended players.

## Connection limitations

PeerJS 1.5.5 uses its public signaling service and WebRTC data connections. Keep the host's tab open and in the foreground. There is no dedicated game server, host migration, or reconnect during a race. A departing host ends the room. New players can only join before the race. Some mobile carrier, corporate, or restrictive NAT networks may require a TURN relay, which is not configured in this version; try another network if a connection times out. This is a small-party multiplayer prototype, not a public matchmaking service.

The host computes movement, resource use, shared stairs, and finish order. Clients send bounded direction inputs only. State snapshots are sent at 20 Hz. Inputs expire after 500 ms without refresh. Audio retains the single-player samples; reference audio matching remains unfinished.

## Build

Run `python3 build.py`. This embeds vendored Three.js, PeerJS, game code and sounds into `index.html`. Serve with HTTP(S); use HTTPS on a public host. GitHub Pages serves the repository root.

- `game.js`: inherited Three.js scene, models, audio, and input handlers
- `network.js`: room UI, authoritative simulation, network transport
- `shell.html`: responsive page template
- `vendor/`: dependencies and licenses

PeerJS documentation: https://peerjs.com/docs/
