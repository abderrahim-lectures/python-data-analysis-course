---
title: "App de Chat en Temps Réel"
description: "Construisez une application de chat alimentée par WebSocket avec des salles, des indicateurs de frappe et un historique des messages."
difficulty: "intermediate"
estimatedMinutes: 60
tags: ["networking", "async", "cli"]
learningObjectives:
  - "Déplacer des messages sur un WebSocket avec un gestionnaire en coroutine"
  - Diffuser à plusieurs clients connectés avec asyncio
  - "Router les messages dans des salles en utilisant le chemin de connexion"
  - "Rejouer l'historique et les événements de présence aux nouveaux arrivants"
  - "Piloter un client de chat depuis stdin avec run_in_executor"
prerequisites:
  - "Les bases de Python (fonctions, ensembles, tuples)"
  - "Les bases d'asyncio (async def, await, asyncio.run, asyncio.gather)"
  - "Un second terminal ouvert pour la démo en direct de deux terminaux"
---

# 🛠️ 💬 App de Chat en Temps Réel

Une app de chat est la plus douce introduction possible à la mise en réseau : des messages sortent par une socket, des messages entrent, et on répète. Presque chaque expérience « en direct » — multijoueur, notifications, curseurs collaboratifs — est cette boucle portant d'autres habits. Ce projet en construit une pour de vrai : un gestionnaire d'écho, puis une diffusion par salle, puis la relecture d'historique et de présence pour quiconque arrive en retard, et enfin un client de terminal avec lequel tu peux réellement discuter à travers deux terminaux. Tout est asyncio + `websockets`, sans navigateur et sans fioritures.

Cela suppose Python 101 plus un peu d'async — rien d'Analyse de Données n'est requis. C'est optionnel et non noté ; voir [Projets du monde réel](/docs/projects) pour la liste complète et croissante.

## 🎯 Ce que tu vas faire

1. Pousser et tirer des messages sur un WebSocket avec un gestionnaire en coroutine.
2. Diffuser le message d'un client à chaque autre client connecté.
3. Router les messages dans des salles séparées par chemin de connexion.
4. Rejouer l'historique et les événements de présence d'une salle à un client qui arrive en retard.
5. Construire un client de terminal piloté par stdin et discuter à travers deux terminaux.

## Où exécuter ceci

**En local avec `uv`** est le seul endroit où le *chat en direct de deux terminaux* fonctionne, parce qu'un serveur de chat est un processus qui doit rester en cours d'exécution. Mais chaque étape jusqu'à la démo en direct finale garde le serveur et ses clients de test dans un seul `asyncio.run()`, donc les mêmes cellules s'exécutent sans modification dans le cloud.

**Google Colab, Kaggle Notebooks et Binder** exécutent chaque démo in-process exactement comme écrit — serveur dans un contexte de coroutine, clients virtuels dans un autre, tout à l'intérieur d'un seul `asyncio.run`. L'honnêteté impose de préciser : un notebook ne peut pas tenir deux *terminaux* ouverts, donc la démo finale « tape depuis le terminal B » reste locale. Utilise les badges pour voir la boucle de messages ; utilise un terminal pour la vraie conversation.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/websocket-chat/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/websocket-chat/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fwebsocket-chat%2Fnotebook.ipynb)

## Configuration

Crée le projet. `websockets` est la seule dépendance ; `asyncio` est la bibliothèque standard. Le serveur ne lie que `localhost`, ce qui garde tout sur ta machine — un vrai déploiement élargirait cela, et l'un des Pièges courants explique pourquoi.

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

`asyncio` te donne des coroutines — des fonctions `async def` qui peuvent faire une pause à un `await` sans perdre leur place — ce qui est exactement ce dont un serveur a besoin pendant qu'il attend sur de nombreuses sockets à la fois. `websockets` transforme le TCP brut en appels `send`/`recv` propres, pour que ton code se concentre sur *ce qui se passe à chaque message* plutôt que sur le cadrage d'octets. Python 3.11+ est supposé pour `asyncio.timeout` ; tout ce qui est plus ancien échange les deux lignes de timeout.

**✅ Liste de vérification**

- ✅ `uv init websocket-chat` a créé un projet avec un `pyproject.toml`.
- ✅ `uv add websockets` a réussi ; le contrôle de version a affiché `ws 1x.x`.
- ✅ Tu as un second terminal disponible pour la démo finale.

## Étape 1 : Écho — le serveur parlant le plus simple

Chaque serveur de chat commence ici : un gestionnaire qui s'exécute une fois par connexion, boucle sur les messages entrants et en renvoie quelque chose. Le nôtre fait écho. Parce que le serveur et son client de test vivent dans *un* `asyncio.run`, tu peux exécuter ceci n'importe où.

### 1.1 Écris le serveur écho et une démo in-process

**👟 Indice de départ :** `async with websockets.serve(...)` démarre le serveur ; à l'intérieur, `websockets.connect(...)` ouvre un client. Les deux coroutines partagent une boucle d'événements, donc `await` saute entre elles.

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

Toute l'astuce de l'async est de *céder sans abandonner la position* : `await socket.recv()` suspend cette coroutine pendant que d'autres coroutines (comme le propre `recv` du gestionnaire d'écho) progressent, puis reprend exactement où elle s'est arrêtée. `async for message in websocket` est cette boucle épelée — il attend le message suivant, exécute le corps, attend le suivant. `websockets.serve` retourne un objet async dont le gestionnaire de contexte exécute le serveur *pendant* le bloc et l'arrête après, donc le serveur et le client vivent et meurent ensemble en un seul appel.

**🎯 Résultat attendu :** `echo: hello`.

**🩹 Si ça ne marche pas :** Si rien ne s'affiche, c'est que le `recv()` du client a fait la course avec le send du gestionnaire — avec un seul message en vol, cela signifie habituellement que le serveur n'a jamais accepté la connexion (vérifie l'hygiène du port 8765). Si tu vois `ConnectionRefusedError`, c'est que la ligne `serve` a levé avant que `connect` ne s'exécute — le traceback te disant quelle coroutine a échoué est tout le diagnostic. Si `await` apparaît dans une fonction qui n'est pas `async def`, c'est une erreur de syntaxe avec un message très spécifique : *« await outside async function »*.

### 1.2 Vérifie l'écho

**✅ Liste de vérification**

- ✅ `uv run python chat.py` affiche `echo: hello`.
- ✅ Envoyer trois messages fait un aller-retour de trois échos : `echo: one`, `echo: two`, `echo: three`.
- ✅ `websockets.connect` cible le même hôte/port que `serve`.

**🤔 Question(s) socratique(s)**

- Le `async for` du gestionnaire continue d'attendre pour toujours. Que ferait le serveur si un client se connectait et n'envoyait *jamais rien* — et que fait la boucle d'événements pendant ce temps ?
- echo répond à ce qu'il reçoit, mais il doit *croire* que le message est du texte. Que se passe-t-il si un client envoie des octets ou une charge utile énorme de 100 Mo, et où (dans `websockets` ou dans ton gestionnaire) te défendrais-tu contre cela ?

## Étape 2 : Diffusion — un émetteur, beaucoup d'auditeurs

Les salles de chat sont des envois groupés. Cette étape suit chaque socket connecté dans un ensemble, et quand un client parle, *tout le monde sauf le locuteur* reçoit le message. Cet ensemble est la graine de tout ce dont une salle a besoin.

### 2.1 Écris le gestionnaire de diffusion

**👟 Indice de départ :** Ajoute chaque connexion à un ensemble `connections` au niveau du module, `await asyncio.gather(...)` les sends pour que les auditeurs lents ne bloquent pas les rapides, et `discard` la socket quand elle part.

```python
# chat.py (continuation)
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

L'ensemble fait deux travaux difficiles : dédoublonne (une socket ne peut être jointe qu'une fois, donc `add` est idempotent) et te donne l'arithmétique d'ensemble — `connections - {websocket}` est simplement « tous les autres ». `finally` n'est pas optionnel ici : si un client se déconnecte à mi-message, l'ensemble est nettoyé quelle que soit la façon dont la boucle sort, sinon les fantômes continuent de recevoir pour toujours. Le `send` intérieur du `async for` est séquentiel (un await à la fois) ; asyncio.gather vient dans la version par salle de l'Étape 3 quand plusieurs salles rivalisent.

**🎯 Résultat attendu :** Avec deux clients connectés, un message de l'un n'apparaît que chez l'autre — l'émetteur ne voit jamais sa propre diffusion.

**🩹 Si ça ne marche pas :** Si l'*émetteur* reçoit aussi sa copie, c'est que `connections - {websocket}` a mal fait la soustraction d'ensemble (ou que le peer listé s'inclut honnêtement). Si un client déconnecté apparaît encore dans le compte de la salle, c'est que le bloc `finally` manque. Si un client lent bloque tout le monde, les sends bloquent en séquence — c'est la mise à niveau par gather.

### 2.2 Vérifie la diffusion

**✅ Liste de vérification**

- ✅ Une démo à deux clients montre chaque message arrivant exactement une fois chez l'*autre* client.
- ✅ L'émetteur ne reçoit pas son propre message.
- ✅ Déconnecter un client puis se reconnecter montre un échange à deux sens frais — pas de fantômes.

**🤔 Question(s) socratique(s)**

- La diffusion est délibérément fragile : si le send d'un pair se bloque, le `async for` bloque toute la boucle. Où `asyncio.gather` (ou `gather(return_exceptions=True)`) changerait-il cela, et quel compromis « envoie à tous, échoue bruyamment » cache-t-il ?
- `connections - {websocket}` exclut le locuteur de son propre message. WhatsApp te montre *ton* message stylé différemment plutôt que de le cacher. Quels messages vont à l'émetteur dépend de la conception — que casse-t-on si tu te trompes dans un vrai protocole ?

## Étape 3 : Salles — routage par chemin de connexion

Une app de chat est des salles, pas un blob. Cette étape utilise le chemin de l'URL de connexion (`ws://localhost:8765/general` → salle `general`) comme clé de routage : chaque salle possède son propre ensemble de sockets, et les messages se diffusent seulement aux membres de cette salle.

### 3.1 Écris le routeur de salles

**👟 Indice de départ :** Garde un `dict[str, set]` de salle → sockets ; lis la salle sur `websocket.path` ; rejoins, diffuse, puis nettoie dans `finally`.

```python
# chat.py (continuation)
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

`websocket.path` est une information de routage gratuite : rejoindre la salle `off-topic` consiste simplement à se connecter à cette URL, et la première ligne du gestionnaire *dérive* la salle au lieu de la stocker. `rooms.setdefault(room, set())` crée la salle à la première adhésion sans branche if. `asyncio.gather(*(...))` attend le send de chaque cohabitants de salle en concurrence, donc un auditeur lent ne peut pas prendre la salle en otage — le coût est qu'un send en échec lève, et le nettoyage `finally` garde la salle en ordre quoi qu'il arrive. Le `timeout(1)` de la démo prouve l'isolation : bob n'entend rien parce que le message d'alice est honnêtement allé dans une salle différente.

**🎯 Résultat attendu :** `['[general] alice voted yes', 'bob heard nothing']`.

**🩹 Si ça ne marche pas :** Si le message d'alice fuit dans la salle de bob, c'est que les clés `room` n'ont jamais différé — la démo a connecté les deux au même chemin. Si toute la démo reste bloquée au lieu de timeout, c'est que le garde-fou `asyncio.timeout` manque ou que le `listener` n'a pas rejoint avant l'envoi du message (augmente le `sleep`). Si une salle grandit pour toujours, c'est que `peers.discard` dans `finally` manque.

### 3.2 Vérifie le routage de salle

**✅ Liste de vérification**

- ✅ `general` et `off-topic` ne reçoivent que leurs propres messages.
- ✅ Rejoindre à nu `ws://localhost:8765` atterrit dans la salle de repli `general`.
- ✅ La déconnexion d'un auditeur le retire de la salle : la reconnexion te ramène avec une adhésion fraîche.

**🤔 Question(s) socratique(s)**

- Un nom de salle est juste une chaîne libre dans l'URL. Que se passe-t-il quand un client se connecte à `ws://localhost:8765/../../etc` — est-ce une salle, ou un trou de sécurité ? Que validerais-tu avant de faire confiance à `websocket.path` ?
- `serve` sur un port gère *toutes* les salles. Les vrais systèmes de chat shardent les salles *à travers* les serveurs et routent une adhésion vers le bon. À quoi ressemble un registre de salle partagé et toujours actif par rapport au fait de tenir chaque salle dans la mémoire d'un seul processus ?

## Étape 4 : Historique et présence — ce que méritent les retardataires

Une salle qui oublie son passé est inutile à un nouveau venu. Cette étape donne à chaque salle un journal d'historique cap-and-drop, le rejoue à chaque nouvel arrivant, et annonce les arrivées et départs pour que la présence survive au commérage.

### 4.1 Ajoute l'historique et la présence au gestionnaire de salle

**👟 Indice de départ :** Garde un deque par salle (maxlen=50) de `(sender, text)` ; à l'adhésion, rejoue-le avant la boucle de chat ; envoie une ligne de présence enveloppée dans la même diffusion utilisée pour le chat.

```python
# chat.py (continuation)
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

`deque(maxlen=50)` est la structure de données parfaite pour « garder les N plus récents » : les ajouts au-delà du plafond font silencieusement tomber les plus anciens, donc l'historique ne peut pas gonfler. L'ordre compte dans la séquence d'adhésion — `replay` donne d'abord le passé au nouveau venu, *puis* la salle annonce le nouveau venu à tous les autres, pour que personne ne voie « alice joined » avant qu'alice n'ait du contexte. `f"guest-{port}"` est un surnom honnête bon marché : le port source du peer est unique par connexion en pratique, ce qui bat le fait de demander des noms avant d'avoir un système d'auth.

**🎯 Résultat attendu :** Connecter un second client affiche l'historique rejoué (join + les derniers messages) puis la ligne `* guest-XXXX joined` de la salle en direct ; sa déconnexion affiche `* guest-XXXX left`.

**🩹 Si ça ne marche pas :** Si le nouveau venu voit l'annonce avant l'historique, c'est que les lignes `replay` et de diffusion ont été échangées. Si l'historique rejoue *à l'infini*, c'est que `maxlen` manque — le deque grandit pour toujours. Si une adhésion est stockée comme `system` mais rejouée comme `history`, le nom `sender` dérivé pour les adhésions diffère des lignes de chat par conception ; garde les deux formatés pareil ou le journal se lit comme deux voix.

### 4.2 Vérifie l'historique et la présence

**✅ Liste de vérification**

- ✅ Un nouveau venu reçoit le backlog *avant* tout message en direct.
- ✅ Après 60 messages, l'historique reste à 50 — les plus anciens tombent, les plus récents sont gardés.
- ✅ L'arrivée et le départ produisent chacun exactement une ligne de présence `* ...` pour le reste de la salle.

**🤔 Question(s) socratique(s)**

- Cet historique est une mémoire par processus : redémarre le serveur et la salle est sourde à son propre passé. À quoi ressemble l'étape « puis une base de données », et où un historique *structuré en journal* et un *event-sourced* diffèrent-ils réellement ?
- La présence est ici auto-déclarée : un client qui se déconnecte sans que son `finally` s'exécute (coupure d'alimentation) diffuse un `left` seulement si le nettoyage tourne. Qu'est-ce qui distingue « la connexion est morte » de « l'utilisateur a quitté » au niveau du protocole, et lequel est plus sûr d'afficher comme `left` ?

## Étape 5 : Un vrai client de terminal — discute à travers deux terminaux

Le serveur est terminé ; maintenant les gens ont besoin d'une bouche. Cette étape écrit `chat_client.py`, un client piloté par stdin qui affiche ce que dit la salle et envoie ce qu'il tape — exécute-le dans un second terminal pendant que `chat.py` sert dans le premier, et tu discutes pour de vrai.

### 5.1 Écris le client

**👟 Indice de départ :** Deux coroutines — l'une lit depuis la socket pour toujours, l'autre lit `sys.stdin` via l'exécuteur — et `asyncio.gather` leur permet de vivre côte à côte.

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

`loop.run_in_executor(None, sys.stdin.readline)` est l'astuce qui laisse l'`input()` bloquant coexister avec la socket : l'appel bloquant s'exécute sur un thread de travail pendant que la boucle d'événements fait tout le reste, et `await` reprend quand une ligne arrive enfin. L'astuce d'invite `\r` + `> ` redessine la ligne d'invite pour que les messages entrants ne soient pas écrits par-dessus ta frappe. `gather` joint les deux boucles, et quand l'une finit (tu fermes stdin avec Ctrl+D), tout le client se déroule proprement.

**🎯 Résultat attendu :** Le terminal A exécute `uv run python chat.py` et montre un journal serveur en direct ; le terminal B exécute `uv run python chat_client.py`, tape `hello`, et les clients de A affichent `guest-XXXX: hello` — avec une invite fraîche à chaque fois.

**🩹 Si ça ne marche pas :** Si B se connecte mais que A ne montre jamais de message, les deux processus doivent partager le port exact et la salle de l'URL du client doit correspondre — vérifie que la ligne serve de `room_chat_v2` est ce qui est *réellement servi*. Si la frappe écrase les messages en direct, c'est que le redessin `\r` manque dans `print_incoming`. Si fermer B bloque A, c'est que `gather` a par défaut annulé à la première fin — le `readline` bloquant n'a pas fini, donc le Ctrl+D de B compte.

### 5.2 Vérifie le chat en direct

**✅ Liste de vérification**

- ✅ Terminal A : `uv run python chat.py` sert `ws://localhost:8765`.
- ✅ Terminal B : `uv run python chat_client.py` se connecte et son invite `> ` apparaît.
- ✅ Taper dans B fait écho comme `live guest-XXXX: <text>` dans A ; le même client affiche les messages de tout le monde au-dessus d'une `> ` fraîche.
- ✅ Rejoindre un second client déclenche les lignes `* guest-XXXX joined` des deux clients — tu as une salle.

**🤔 Question(s) socratique(s)**

- Les messages ici sont non authentifiés et non chiffrés — n'importe qui sur le réseau pourrait lire ou parler. Parcourt les trois endroits où tu ajouterais l'identité (nom à la connexion), la confidentialité (TLS) et la confiance (contrôles d'origine) si tu livrais ceci sur un LAN.
- Le client et l'invite se disputent la même ligne. Où cette conception casse-t-elle avec des messages *binaires* ou des *messages plus longs que la largeur du terminal* — et qu'exigerait un vrai TUI (comme `curses`) que ce client à chemin heureux saute ?

## ⚠️ Pièges courants

- **Des sockets qui ne quittent jamais l'ensemble.** Sans `finally: peers.discard(...)`, un client qui se déconnecte reste « présent » et le `send` vers lui lève pour toujours. Correction : le nettoyage s'exécute toujours, même en cas d'erreur.
- **Des sends bloquants qui affament la salle.** Le `send` d'un auditeur lent retient tout le monde s'il est attendu un à la fois. Correction : `asyncio.gather` par message — et sois prêt à ce que `gather` lève au premier échec (`return_exceptions=True` si tu veux que le reste finisse).
- **Des noms de salle fiés aveuglément.** `websocket.path` est une entrée fournie par l'attaquant. Correction : whitelist les noms de salle à l'adhésion, ou la « salle » devient un vecteur d'injection de système de fichiers/route.
- **Anonymat de l'émetteur.** Un surnom basé sur le port est unique mais spoofable et oubliable. Correction : exige un `HELLO name` en premier message et arrête de lui faire confiance une fois que l'auth existe.
- **Historique illimité.** `deque(maxlen=N)` plafonne à l'écriture, jamais à la lecture — tout ce qui ne l'a pas grandit sans borne par salle.

## Ce que tu viens de construire

Un système de chat fonctionnel à deux terminaux : un gestionnaire d'écho async, une diffusion par salle via les chemins d'URL, un historique plafonné rejoué aux retardataires, des annonces de présence et un client stdin — le tout assez petit pour tenir dans ta tête. La leçon transférable est la *forme* des systèmes en direct : une boucle qui attend, un ensemble de pairs connectés, un état dérivé (salles) et une sémantique de relecture (historique/présence). Chaque jeu multijoueur, tableau de bord et éditeur collaboratif est le même squelette sous plus de commodités.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/websocket-chat/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/websocket-chat) dans le dépôt du cours est une version plus complète du code ci-dessus, avec un chat web multi-salles et un fichier de conseils TLS. Clone-le, ou ouvre tout le dépôt dans un [GitHub Codespace](https://codespaces.new/abderrahim-lectures/python-data-analysis-course), et exécute-le depuis là.
:::

## Où aller à partir d'ici

- Transforme la présence en un événement *typé* — `typing`, `online`, `away` — et rends `guest-XXXX is typing…` seulement quand c'est vrai, avec un timeout de 3 secondes.
- Remplace le surnom `guest-port` par une poignée de main `HELLO` en premier message, puis rejette les messages envoyés avant elle.
- Persiste l'historique dans un fichier SQLite (ou un fichier structuré en journal) pour que les redémarrages gardent la salle ; la question de l'Étape 4 l'a cadré exactement.
- Enveloppe le serveur dans `uvicorn` avec des notes `wss`/TLS et une whitelist de noms de salle, et appelle-le de forme production.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres élèves — et son README a un tutoriel complet et adapté aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git avant : forker le dépôt, créer une branche, commiter tes fichiers, et ouvrir la PR, une étape à la fois. Aucune expérience préalable avec git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓
