---
title: "Build a WebSocket Chat App"
description: "Build a real-time chat server with asyncio and websockets: echo handler, room-based broadcasting, message history and presence replay, and a terminal chat client."
difficulty: "intermediate"
estimatedMinutes: 60
tags: ["networking", "async", "cli"]
learningObjectives:
  - "Move messages over a WebSocket with a coroutine handler"
  - Broadcast to multiple connected clients with asyncio
  - "Route messages into rooms using the connection path"
  - "Replay history and presence events to fresh joiners"
  - "Drive a chat client from stdin with run_in_executor"
prerequisites:
  - "Python basics (functions, sets, tuples)"
  - "asyncio basics (async def, await, asyncio.run, asyncio.gather)"
  - "A second terminal open for the live two-terminal demo"
---

# 🛠️ 💬 Build a WebSocket Chat App

A chat app is the gentlest possible introduction to networking: messages go out a socket, messages come in, repeat. Almost every "live" experience — multiplayer, notifications, collaborative cursors — is this loop wearing other clothes. This project builds one for real: an echo handler, then room-based broadcasting, then history and presence replay for anyone joining late, and finally a terminal client you can actually chat with across two terminals. Everything is asyncio + `websockets`, with no browser and no fluff.

This assumes Python 101 plus a bit of async — nothing from Data Analysis is required. It's optional and ungraded; see [Real-World Projects](/projects) for the full, growing list.

## 🎯 What you'll do

1. Push and pull messages over a WebSocket with a coroutine handler.
2. Broadcast one client's message to every other connected client.
3. Route messages into separate rooms by connection path.
4. Replay room history and presence events to a client joining late.
5. Build a stdin-driven terminal client and chat across two terminals.

## Where to run this

**Locally with `uv`** is the only place the *live two-terminal chat* works, because a chat server is a process that must stay running. But every step up to the final live demo keeps the server and its test clients in one `asyncio.run()`, so the same cells run unmodified in the cloud.

**Google Colab, Kaggle Notebooks, and Binder** run each in-process demo exactly as written — server in one coroutine context, virtual clients in another, all inside a single `asyncio.run`. The honest caveat: a notebook can't hold two *terminals* open, so the final "type from terminal B" demo stays local. Use the badges to see the message loop; use a terminal for the real conversation.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/websocket-chat/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/websocket-chat/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fwebsocket-chat%2Fnotebook.ipynb)

## Setup

Create the project. `websockets` is the one dependency; `asyncio` is standard library. The server binds to `localhost` only, which keeps everything on your machine — a real deployment would widen that, and one of the Common pitfalls explains why.

```bash
uv init websocket-chat
cd websocket-chat
```

```bash
uv add websockets
```

```bash
uv run python -c "import websockets, asyncio; print('ws', websockets.__version__)"
```

`asyncio` gives you coroutines — `async def` functions that can pause at an `await` without losing their place — which is exactly what a server needs while it waits on many sockets at once. `websockets` turns raw TCP into clean `send`/`recv` calls, so your code focuses on *what happens on each message* rather than byte framing. Python 3.11+ is assumed for `asyncio.timeout`; anything older swaps the two timeout lines.

**✅ Checklist**

- ✅ `uv init websocket-chat` created a project with a `pyproject.toml`.
- ✅ `uv add websockets` succeeded; the version check printed `ws 1x.x`.
- ✅ You have a second terminal available for the final demo.

## Step 1: Echo — the simplest server that talks

Every chat server starts here: a handler that runs once per connection, loops over incoming messages, and sends something back. Ours echoes. Because the server and its test client live in *one* `asyncio.run`, you can run this anywhere.

### 1.1 Write the echo server and an in-process demo

**👟 Starter hint:** `async with websockets.serve(...)` starts the server; inside it, `websockets.connect(...)` opens a client. Both coroutines share one event loop, so `await` hops between them.

```python
# chat.py
import asyncio

import websockets

async def echo(websocket):
    async for message in websocket:
        await websocket.send(f"echo: {message}")

async def demo_echo():
    async with websockets.serve(echo, "localhost", 8765):
        async with websockets.connect("ws://localhost:8765") as socket:
            await socket.send("hello")
            print(await socket.recv())

asyncio.run(demo_echo())
```

The whole trick of async is *yielding without giving up position*: `await socket.recv()` suspends this coroutine while other coroutines (like the echo handler's own `recv`) proceed, then resumes exactly where it stopped. `async for message in websocket` is that loop spelled out — it awaits the next message, runs the body, awaits the next. `websockets.serve` returns an async object whose context manager runs the server *during* the block and shuts it down after, so the server and client live and die together in one call.

**🎯 Expected output:** `echo: hello`.

**🩹 If it's off:** If nothing prints, the client's `recv()` raced the handler's send — with only one message in flight that usually means the server never accepted the connection (check port 8765 hygiene). If you see `ConnectionRefusedError`, the `serve` line threw before `connect` ran — the traceback telling you which coroutine failed is the whole diagnostic. If `await` appears inside a function that isn't `async def`, that's a syntax error with a very specific message: *"await outside async function"*.

### 1.2 Verify the echo

**✅ Checklist**

- ✅ `uv run python chat.py` prints `echo: hello`.
- ✅ Sending three messages round-trips three echoes: `echo: one`, `echo: two`, `echo: three`.
- ✅ `websockets.connect` targets the same host/port as `serve`.

**🤔 Socratic Question(s)**

- The handler's `async for` keeps waiting forever. What would the server do if a client connected and *never sent anything* — and what's the event loop doing in the meantime?
- echo replies to whatever it gets, but it has to *believe* the message is text. What happens if a client sends bytes or a huge 100 MB payload, and where (in `websockets` or in your handler) would you defend against it?

## Step 2: Broadcast — one sender, many listeners

Chat rooms are group sends. This step tracks every connected socket in a set, and when a client speaks, *everyone except the speaker* gets the message. That set is the seed of everything a room needs.

### 2.1 Write the broadcast handler

**👟 Starter hint:** Add each connection to a module-level `connections` set, `await asyncio.gather(...)` the sends so slow listeners don't block fast ones, and `discard` the socket when it leaves.

```python
# chat.py (continued)
connections: set[websockets.WebSocketServerProtocol] = set()

async def broadcast(websocket):
    connections.add(websocket)
    try:
        async for message in websocket:
            for peer in connections - {websocket}:
                await peer.send(message)
    finally:
        connections.discard(websocket)
```

The set does two hard jobs: dedupes (a socket can only be joined once, so `add` is idempotent) and gives you set arithmetic — `connections - {websocket}` is simply "everyone else". `finally` is not optional here: if a client disconnects mid-message, the set is cleaned up no matter how the loop exits, otherwise ghosts keep receiving forever. The `async for` inner `send` is sequential (one await at a time); asyncio.gather comes in Step 3's per-room version when multiple rooms compete.

**🎯 Expected output:** With two clients connected, a message from one appears only at the other — the sender never sees its own broadcast.

**🩹 If it's off:** If the *sender* also receives its copy, `connections - {websocket}` got the set subtraction wrong (or listed peer truthfully includes itself). If a disconnected client still shows in the room count, the `finally` block is missing. If a slow client stalls everyone, sends are blocking in sequence — that's the gather upgrade.

### 2.2 Verify broadcasting

**✅ Checklist**

- ✅ A two-client demo shows each message arriving exactly once at the *other* client.
- ✅ The sender does not receive its own message.
- ✅ Disconnecting a client then reconnecting shows a fresh two-way exchange — no ghosts.

**🤔 Socratic Question(s)**

- Broadcasting is deliberately flaky: if one peer's send hangs, the `async for` blocks the whole loop. Where would `asyncio.gather` (or `gather(return_exceptions=True)`) change that, and what trade-off does "send to all, fail loudly" hide?
- `connections - {websocket}` excludes the speaker from its own message. WhatsApp shows you *your* message styled differently rather than hiding it. Which messages go to the sender depends on design — what breaks if you get that wrong in a real protocol?

## Step 3: Rooms — routing by connection path

A chat app is rooms, not one blob. This step uses the connection URL's path (`ws://localhost:8765/general` → room `general`) as the routing key: each room owns its own set of sockets, and messages fan out only to that room's members.

### 3.1 Write the room router

**👟 Starter hint:** Keep a `dict[str, set]` of room → sockets; read the room off `websocket.path`; join, broadcast, then clean up in `finally`.

```python
# chat.py (continued)
rooms: dict[str, set[websockets.WebSocketServerProtocol]] = {}

async def room_chat(websocket):
    room = websocket.path.strip("/") or "general"
    peers = rooms.setdefault(room, set())
    peers.add(websocket)
    try:
        async for message in websocket:
            targets = [peer for peer in peers if peer is not websocket]
            if targets:
                await asyncio.gather(*(peer.send(f"[{room}] {message}") for peer in targets))
    finally:
        peers.discard(websocket)

async def demo_rooms():
    seen = []

    async def listener(name, room):
        async with websockets.connect(f"ws://localhost:8765/{room}") as socket:
            await asyncio.sleep(0.05)  # let both clients join before anyone speaks
            await socket.send(f"{name} voted yes")
            try:
                with asyncio.timeout(1):
                    seen.append(await socket.recv())
            except TimeoutError:
                seen.append(f"{name} heard nothing")

    async with websockets.serve(room_chat, "localhost", 8765):
        await asyncio.gather(listener("alice", "general"), listener("bob", "off-topic"))

    print(sorted(seen))

asyncio.run(demo_rooms())
```

`websocket.path` is free routing information: joining room `off-topic` is just connecting to that URL, and the handler's first line *derives* the room instead of storing it. `rooms.setdefault(room, set())` creates the room on first join without an if-branch. `asyncio.gather(*(...))` awaits every room-mate's send concurrently, so one slow listener can't hold the room hostage — the cost is that a failing send raises, and the `finally` cleanup keeps the room tidy regardless. The demo's `timeout(1)` proves the isolation: bob hears nothing because alice's message honestly went to a different room.

**🎯 Expected output:** `['[general] alice voted yes', 'bob heard nothing']`.

**🩹 If it's off:** If alice's message leaks into bob's room, the `room` keys never differed — the demo connected both to the same path. If the whole demo hangs instead of timing out, the `asyncio.timeout` guard is missing or the `listener` didn't join before the message sent (raise the `sleep`). If a room grows forever, `peers.discard` in `finally` is missing.

### 3.2 Verify room routing

**✅ Checklist**

- ✅ `general` and `off-topic` receive only their own messages.
- ✅ Joining bare `ws://localhost:8765` lands in the `general` fallback room.
- ✅ A listener's disconnect drops it from the room: reconnect brings you back with a fresh join.

**🤔 Socratic Question(s)**

- A room name is just a free-form string in the URL. What happens when a client connects to `ws://localhost:8765/../../etc` — is that a room, or a security hole? What would you validate before trusting `websocket.path`?
- `serves` on one port handles *all* rooms. Real chat systems shard rooms *across* servers and route a join to the right one. What does a shared, always-on room registry look like compared to just holding every room in one process's memory?

## Step 4: History and presence — what latecomers deserve

A room that forgets its past is useless to a newcomer. This step gives each room a cap-and-drop history log, replays it to every fresh joiner, and announces joins and leaves so presence survives gossip.

### 4.1 Add history and presence to the room handler

**👟 Starter hint:** Keep a per-room deque (maxlen=50) of `(sender, text)`; on join, replay it before the chat loop; send a presence line wrapped in the same broadcast used for chat.

```python
# chat.py (continued)
from collections import deque

history: dict[str, deque] = {}
HISTORY_SIZE = 50
PRESENCE = True

def log_message(room: str, sender: str, text: str) -> None:
    log = history.setdefault(room, deque(maxlen=HISTORY_SIZE))
    log.append((sender, text))

async def replay(websocket, room: str) -> None:
    for sender, text in history.get(room, deque()):
        await websocket.send(f"[history] {sender}: {text}")

async def room_chat_v2(websocket):
    room = websocket.path.strip("/") or "general"
    peers = rooms.setdefault(room, set())
    peers.add(websocket)
    sender = f"guest-{websocket.remote_address[1]}"
    log_message(room, "system", f"{sender} joined")
    await replay(websocket, room)
    for peer in peers - {websocket}:
        await peer.send(f"* {sender} joined {room}")
    try:
        async for message in websocket:
            log_message(room, sender, message)
            targets = [peer for peer in peers if peer is not websocket]
            if targets:
                await asyncio.gather(*(peer.send(f"{sender}: {message}") for peer in targets))
    finally:
        peers.discard(websocket)
        log_message(room, "system", f"{sender} left")
        for peer in peers:
            await peer.send(f"* {sender} left {room}")
```

`deque(maxlen=50)` is the perfect data structure for "keep the latest N": appends past the cap silently drop the oldest, so history can't balloon. The order matters in the join sequence — `replay` first hands the newcomer the past, *then* the room announces the newcomer to everyone else, so nobody sees "alice joined" before alice has context. `f"guest-{port}"` is a cheap honest nickname: the peer's source port is unique per connection in practice, which beats asking for names before you have an auth system.

**🎯 Expected output:** Connecting a second client prints the replayed history (join + the last messages) then the live room's `* guest-XXXX joined` line; its disconnect prints `* guest-XXXX left`.

**🩹 If it's off:** If the newcomer sees the announcement before the history, the `replay` and broadcast lines were swapped. If history replays *infinite*, `maxlen` is missing — the deque grows forever. If a join is stored as `system` but replayed as `history`, the derived `sender` name for joins differs from chat lines by design; keep both formatted the same or the log reads like two voices.

### 4.2 Verify history and presence

**✅ Checklist**

- ✅ A newcomer receives the backlog *before* any live message.
- ✅ After 60 messages, history stays at 50 — oldest drop, newest kept.
- ✅ Joining and leaving each produce exactly one `* ...` presence line for the rest of the room.

**🤔 Socratic Question(s)**

- This history is per-process memory: restart the server and the room is deaf to its own past. What does the "then a database" step look like, and where do a *log-structured* and an *event-sourced* history actually differ?
- Presence here is self-reported: a client that disconnects without its `finally` running (killed power) broadcasts a `left` only if cleanup runs. What distinguishes "connection died" from "user quit" at the protocol level, and which is safer to display as `left`?

## Step 5: A real terminal client — chat across two terminals

The server is done; now people need a mouth. This step writes `chat_client.py`, a stdin-driven client that prints what the room says and sends what it types — run it in a second terminal while `chat.py` serves in the first, and you're chatting for real.

### 5.1 Write the client

**👟 Starter hint:** Two coroutines — one reads from the socket forever, one reads `sys.stdin` via the executor — and `asyncio.gather` lets both live side by side.

```python
# chat_client.py
import asyncio
import sys

import websockets

async def print_incoming(socket):
    async for message in socket:
        print(f"\r{message}\n> ", end="")

async def read_stdin(socket):
    loop = asyncio.get_running_loop()
    while True:
        line = await loop.run_in_executor(None, sys.stdin.readline)
        if not line:
            break
        await socket.send(line.strip())
        await asyncio.sleep(0)

async def main():
    url = sys.argv[1] if len(sys.argv) > 1 else "ws://localhost:8765/general"
    async with websockets.connect(url) as socket:
        await asyncio.gather(print_incoming(socket), read_stdin(socket))

asyncio.run(main())
```

`loop.run_in_executor(None, sys.stdin.readline)` is the trick that lets blocking `input()` coexist with the socket: the blocking call runs on a worker thread while the event loop does everything else, and `await` resumes when a line finally arrives. The `\r` + `> ` prompt hack redraws the prompt line so incoming messages aren't written over your typing. `gather` joins the two loops, and when either ends (you close stdin with Ctrl+D), the whole client unwinds cleanly.

**🎯 Expected output:** Terminal A runs `uv run python chat.py` and shows a live server log; Terminal B runs `uv run python chat_client.py`, types `hello`, and A's clients print `guest-XXXX: hello` — with a fresh prompt each time.

**🩹 If it's off:** If B connects but A never shows a message, both processes must share the exact port and the client URL's room must match — check the `room_chat_v2` serve line is what's *actually served*. If typing overwrites live messages, the `\r` redraw is missing from `print_incoming`. If closing B hangs A, `gather` defaulted to cancel-on-first-completion — the blocking `readline` didn't end, so B's Ctrl+D matters.

### 5.2 Verify the live chat

**✅ Checklist**

- ✅ Terminal A: `uv run python chat.py` serves `ws://localhost:8765`.
- ✅ Terminal B: `uv run python chat_client.py` connects and its prompt `> ` appears.
- ✅ Typing in B echoes as `live guest-XXXX: <text>` in A; the same client prints everyone's messages above a fresh `> `.
- ✅ Joining a second client triggers both clients' `* guest-XXXX joined` lines — you have a room.

**🤔 Socratic Question(s)**

- Messages here are unauthenticated and unencrypted — anyone on the network could read or speak. Walk through the three places you'd add identity (name on connect), confidentiality (TLS), and trust (origin checks) if you shipped this to a LAN.
- The client and the prompt fight over the same line. Where does this design break with *binary* messages or *messages longer than the terminal width* — and what would a proper TUI (like `curses`) require that this happy-path client skips?

## ⚠️ Common pitfalls

- **Sockets that never leave the set.** Without `finally: peers.discard(...)`, a client that disconnects stays "present" and `send` to it raises forever. Fix: cleanup always runs, even on error.
- **Blocking sends starving the room.** A slow listener's `send` holds everyone if awaited one at a time. Fix: `asyncio.gather` per message — and be ready for `gather` to raise on the first failure (`return_exceptions=True` if you want the rest to finish).
- **Room names trusted blindly.** `websocket.path` is attacker-supplied input. Fix: whitelist room names at join, or the "room" becomes a filesystem/route injection vector.
- **Sender anonymity.** A port-based nickname is unique but spoofable and forgettable. Fix: require a first-message `HELLO name` and stop trusting it after auth exists.
- **Unbounded history.** `deque(maxlen=N)` caps at the write, never at read — anything without it grows without bound per room.

## What you just built

A working two-terminal chat system: an async echo handler, room-based broadcasting via URL paths, capped history replayed to latecomers, presence announcements, and a stdin client — all of it small enough to hold in your head. The transferable lesson is the *shape* of live systems: a loop that awaits, a set of connected peers, derived state (rooms), and replay semantics (history/presence). Every multiplayer game, dashboard, and collaborative editor is the same skeleton under more conveniences.

:::tip[Run a fuller version without any local setup]
[`examples/websocket-chat/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/websocket-chat) in the course repo is a fuller version of the code above, with a multi-room web chat and a TLS guidance file. Clone it, or open the whole repo in a [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), and run it from there.
:::

## Where to go from here

- Turn presence into a *typed* event — `typing`, `online`, `away` — and render `guest-XXXX is typing…` only while true, with a 3-second timeout.
- Replace the `guest-port` nickname with a first-message `HELLO` handshake, then reject messages sent before it.
- Persist history to a SQLite file (or a log-structured file) so restarts keep the room; Step 4's question framed exactly how.
- Wrap the server in `uvicorn` with `wss`/TLS notes and a room-name whitelist, and call it production-shaped.

## Share your project with the class

Built something you're proud of? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) is a gallery of projects other students have submitted — and its README has a full, beginner-friendly walkthrough for adding yours via a **pull request**, even if you've never used git before: forking the repo, making a branch, committing your files, and opening the PR, one step at a time. No prior git experience assumed.

Welcome to writing Python outside the browser. 🎓