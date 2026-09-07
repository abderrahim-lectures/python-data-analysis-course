---
title: "Moniteur d'Énergie Domestique"
description: "Suivez la consommation d'énergie du foyer avec ventilation par appareil et recommandations d'économie."
difficulty: "beginner"
estimatedMinutes: 50
tags: ["cli", "csv", "calculations"]
prerequisites:
  - "Les bases de Python (listes, dictionnaires, boucles, fonctions)"
  - "La lecture de fichiers CSV"
learningObjectives:
  - "Convertir les watts et les heures en kWh par appareil et par jour"
  - "Agréger un total mensuel et la part de chaque appareil"
  - "Tarifer l'énergie avec un tarif progressif à deux paliers"
  - "Auditer la consommation en veille et générer des conseils d'économie basés sur des règles"
  - "Comparer deux scénarios d'usage et rapporter un delta d'économies"
---

# ⚡ Construis un Moniteur d'Énergie

Ta facture d'électricité est une boîte noire : un seul nombre chaque mois et un haussement d'épaules. Ce projet la brise. Tu liras de vrais nombres d'appareils — watts, heures par jour — depuis un CSV, calculeras l'énergie dans l'unité que les services publics facturent réellement (kWh), classeras les appareils par leur part du total, tariferas un tarif *progressif* (le dépassement coûte plus cher), auditeras ce que les appareils consomment juste en veille, et évalueras en dollars un scénario « et si j'utilisais moins le chauffage ». Les maths sont quatre formules arithmétiques ; la compétence consiste à transformer des évaluations éparses en un rapport honnête et prêt à décider.

Ce projet suppose que tu maîtrises Python 101 — listes, dictionnaires, boucles, fonctions — plus une lecture aisée du `csv`. Rien ici n'a besoin de pandas. Il est facultatif et non noté ; consulte [Real-World Projects](/docs/projects) pour la liste complète, qui ne cesse de s'allonger.

## 🎯 Ce que tu vas faire

1. Charger les évaluations des appareils et calculer les kWh par jour et par mois pour chaque appareil.
2. Totaliser le mois et classer chaque appareil par sa part de la facture.
3. Tarifer le total avec un tarif progressif à deux paliers — au-delà de 250 kWh coûte plus cher.
4. Auditer la consommation en veille et faire suggérer par le code ce qui vaut le coup d'être débranché.
5. Comparer l'usage « actuel » contre « optimisé » et rapporter les dollars économisés.

## Où exécuter ceci

**Localement avec `uv`** est le chemin recommandé — un moniteur d'énergie est une CLI fichier-en/fichier-out (CSV en entrée, rapport imprimé en sortie), et les fichiers appartiennent à ton terminal.

**GitHub Codespaces** est une alternative sans configuration : ouvre [tout le dépôt du cours dans un Codespace gratuit](https://codespaces.new/abderrahim-lectures/python-data-analysis-course) (Node et Python sont déjà installés) et exécute les mêmes commandes depuis un terminal de navigateur.

**Google Colab, Kaggle Notebooks ou Binder** fonctionnent — le notebook à [`examples/energy-monitor/notebook.ipynb`](https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/energy-monitor/notebook.ipynb) exécute le même rapport sur les appareils d'échantillon fournis en mémoire.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/abderrahim-lectures/python-data-analysis-course/blob/main/examples/energy-monitor/notebook.ipynb)
[![Open In Kaggle](https://kaggle.com/static/images/open-in-kaggle.svg)](https://kaggle.com/kernels/welcome?src=https://github.com/abderrahim-lectures/python-data-analysis-course/blob/main/examples/energy-monitor/notebook.ipynb)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/abderrahim-lectures/python-data-analysis-course/main?filepath=examples%2Fenergy-monitor%2Fnotebook.ipynb)

## Configuration

`uv` est un outil unique qui remplace la chaîne « installer Python, puis pip, puis un outil d'environnement virtuel » — et ce projet est du pur standard library.

**macOS / Linux** (terminal) :

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell) :

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Ferme et rouvre ton terminal, puis confirme l'installation :

```bash
uv --version
```

Puis configure le projet :

```bash
uv init energy-monitor
cd energy-monitor
```

**✅ Liste de vérification**

- ✅ `uv --version` affiche un numéro de version.
- ✅ `energy-monitor/` existe avec un `pyproject.toml`.
- ✅ `python -c "import csv"` réussit — aucun paquet tiers.

## Étape 1 : Les kWh par appareil

L'énergie est facturée en **kWh** — kilowattheures, la puissance d'un appareil de 1000 watts fonctionnant pendant une heure. Les étiquettes des appareils donnent les *watts* et tes habitudes donnent les *heures*, donc la conversion est `watts / 1000 * heures`. Un chauffage de 1500 W allumé 3 heures boit `1.5 × 3 = 4.5 kWh` par jour — et tu ne le devinerais jamais à partir de la seule étiquette. Cette étape transforme les évaluations en l'unique nombre qui compte.

### 1.1 Écris le chargeur d'appareils et le convertisseur

**👟 Indice de départ :** Garde les colonnes CSV brutes, puis *dérive* `kwh_per_day` et `kwh_per_month` dans la même boucle :

```bash
cat > appliances.csv <<'EOF'
device,device_type,watts,avg_hours_per_day
fridge,kitchen,150,24
tv,living_room,120,5
router,network,10,24
heater,bedroom,1500,3
ps5,gaming,200,2
EOF
```

```python
# energy.py
import csv

def load_appliances(path: str = "appliances.csv") -> list[dict]:
    with open(path, newline="") as f:
        rows = list(csv.DictReader(f))
    for row in rows:
        row["watts"] = float(row["watts"])
        row["avg_hours_per_day"] = float(row["avg_hours_per_day"])
        row["kwh_per_day"] = row["watts"] / 1000 * row["avg_hours_per_day"]
        row["kwh_per_month"] = row["kwh_per_day"] * 30
    return rows

if __name__ == "__main__":
    for a in load_appliances():
        print(f"{a['device']:<9} {a['device_type']:<11} {a['watts']:>5.0f} W "
              f"{a['avg_hours_per_day']:>5.1f} h/d  {a['kwh_per_day']:>6.2f} kWh/d "
              f"{a['kwh_per_month']:>7.2f} kWh/mo")
```

`list(csv.DictReader(f))` photographie toutes les lignes d'un coup — la boucle qui les enrichit ne relit jamais le fichier. Chaque champ dérivé est une *fonction pure des colonnes brutes* de la même ligne, ajoutée là où la ligne naît. `30` comme mois est un proxy délibéré : explicitement un mois arrondi, pas 31 ni fractionnaire, pour que les nombres soient stables et reproductibles — un auditeur d'énergie dit « mois de 30 jours » à voix haute au lieu de prétendre que le calendrier est uniforme.

**🎯 Résultat attendu :**

```
fridge    kitchen       150 W  24.0 h/d    3.60 kWh/d   108.00 kWh/mo
tv        living_room   120 W   5.0 h/d    0.60 kWh/d    18.00 kWh/mo
router    network        10 W  24.0 h/d    0.24 kWh/d     7.20 kWh/mo
heater    bedroom      1500 W   3.0 h/d    4.50 kWh/d   135.00 kWh/mo
ps5       gaming        200 W   2.0 h/d    0.40 kWh/d    12.00 kWh/mo
```

**🩹 Si ça ne marche pas :** Si un appareil affiche `0.00 kWh`, `watts` ou `avg_hours_per_day` était encore une chaîne au moment de la division — `float()` manque sur l'un d'eux. Si le chauffage affiche `1500 W` mais que `4.50` ne s'aligne jamais à droite, une faute de frappe dans l'en-tête de colonne (`watts` contre `watt`) a fait de `row["watts"]` une nouvelle clé de chaîne — imprime `row.keys()` pour le comparer à la ligne d'en-tête.

### 1.2 Vérifie la conversion

**✅ Liste de vérification**

- ✅ Chaque `kwh_per_day` dérivé égale `watts / 1000 × heures` à la main (frigo : `150/1000×24 = 3.6`).
- ✅ `kwh_per_month` est exactement 30× `kwh_per_day` — pas de calendrier végétal, pas de flottement.
- ✅ L'enrichissement `float()` couvre les deux colonnes numériques brutes, donc `sum(...)` ne concatène jamais de chaînes.

**🤔 Question(s) socratique(s)**

- `avg_hours_per_day` du frigo est 24 — toujours allumé. À quoi ressemblerait une différence *nouveau congélateur* contre *vieux frigo à bière* dans ce modèle, et quel est le second intrant qu'un vrai moniteur ajouterait à la place d'une seule moyenne ?
- Le chauffage fait 1500 W à l'étiquette. Nomme un nombre réel qui est *plus bas* que l'étiquette en moyenne (il cycle, il n'est pas toujours allumé) et un qui est *plus haut* (une chaleur résistive réglée au variateur qui résiste au modèle). Quelle direction fait *surpasser* `kwh`, et laquelle fait *sous-estimer* ?

## Étape 2 : Total et part

Un tableau par appareil est un menu ; le total et la *part* de chaque appareil sont l'histoire. Avec `total = sum(...)`, le chauffage à ~48 % saute aux yeux comme « la moitié de ta facture », tandis que le routeur à moins de 3 % est révélé négligeable. Cette étape imprime le ratio sur lequel se prennent les décisions.

### 2.1 Écris le rapport de parts

**👟 Indice de départ :** `sum(a["kwh_per_day"] for a in appliances)` une fois, puis `share = device_kwh / total * 100` dans la boucle d'impression :

```python
# report.py
import energy
from pathlib import Path

appliances = energy.load_appliances()
total_day = sum(a["kwh_per_day"] for a in appliances)
total_month = total_day * 30

print(f"{'device':<9} {'type':<11} {'kWh/d':>6} {'kWh/mo':>8} {'share':>6}")
for a in sorted(appliances, key=lambda a: a["kwh_per_day"], reverse=True):
    share = a["kwh_per_day"] / total_day * 100
    print(f"{a['device']:<9} {a['device_type']:<11} {a['kwh_per_day']:>6.2f} "
          f"{a['kwh_per_month']:>8.2f} {share:>5.1f}%")

print(f"\ntotal: {total_day:.2f} kWh/day = {total_month:.2f} kWh/month")
```

`sum(a["kwh_per_day"] for a in appliances)` est un générateur — pas de liste intermédiaire, une seule passe, et le total *ne peut pas* dériver des valeurs par ligne puisqu'il est calculé à partir du même champ. `sorted(..., reverse=True)` réordonne strictement pour l'affichage ; la liste sous-jacente de dicts est intacte, donc l'étape 3 réutilise les mêmes lignes. La part est `partie / tout × 100`, et le dénominateur vient des données, jamais d'une constante magique.

**🎯 Résultat attendu :**

```
device    type        kWh/d   kWh/mo   share
heater    bedroom      4.50   135.00   48.2%
fridge    kitchen      3.60   108.00   38.5%
tv        living_room  0.60    18.00    6.4%
ps5       gaming       0.40    12.00    4.3%
router    network      0.24     7.20    2.6%

total: 9.34 kWh/day = 280.20 kWh/month
```

**🩹 Si ça ne marche pas :** Si l'ordre remonte comme par magie, `reverse=True` manque sur `sorted`. Si CHAQUE part affiche `100.0%` (chaque appareil divisé par lui-même), la variable de boucle `a` est utilisée *à la fois* comme ligne et comme `total_day` — l'expression de somme doit être calculée avant la boucle, en dehors d'elle.

### 2.2 Vérifie le classement

**✅ Liste de vérification**

- ✅ Lignes totales : `9.34 × 30 = 280.20` — cohérent avec les lignes de l'étape 1.
- ✅ Les parts totalisent 100.0 % (le tout est sur la facture ou ne l'est pas ; pas de dérive d'arrondi au-delà d'un dixième).
- ✅ Le chauffage est premier et le routeur dernier, et l'écart ressemble à ce que fait le comportement (thermostat ≠ équipement réseau toujours allumé).

**🤔 Question(s) socratique(s)**

- Les parts sont *pourcent de l'énergie*, pas *pourcent de la facture* — les deux ne sont égaux que sous un tarif plat. L'étape 3 introduit un tarif progressif. La part de quel appareil va *rétrécir* sous la progressivité, et pourquoi — les derniers ~30 kWh sont facturés au taux de prime, mais tous les appareils ne les ont pas générés ?
- Le total est 280.20 kWh/mois, un nombre de foyer plausible. Où le graphique d'une *vraie* maison différerait-il de ce CSV (pointe contre nuit, saison de chauffage, recharge de VE) ? Quelle est la première colonne qui rendrait ce modèle saisonnier ?

## Étape 3 : Tarifer un tarif progressif

Les services publics facturent rarement un taux plat par kWh : sous le palier, l'énergie est bon marché ; au-dessus, chaque kWh supplémentaire coûte plus cher. Cette étape tarife les 280.2 kWh avec un tarif **premiers 250 kWh à 0,20 $, tout ce qui est au-dessus à 0,35 $** — et montre la prime que les derniers 30.2 kWh ajoutent en silence.

### 3.1 Écris le calculateur de facture progressif

**👟 Indice de départ :** `bill_for(kwh)` renvoie le coût de base pour `kwh <= 250` et divise au-dessus en deux paliers :

```python
# tariff.py
import energy

BASE_RATE = 0.20      # $/kWh for the first 250 kWh
BRACKET = 250         # kWh
HIGH_RATE = 0.35      # $/kWh above the bracket

def bill_for(kwh_month: float) -> float:
    if kwh_month <= BRACKET:
        return kwh_month * BASE_RATE
    base_cost = BRACKET * BASE_RATE
    high_cost = (kwh_month - BRACKET) * HIGH_RATE
    return base_cost + high_cost

if __name__ == "__main__":
    appliances = energy.load_appliances()
    total_month = sum(a["kwh_per_day"] for a in appliances) * 30

    for a in sorted(appliances, key=lambda a: a["kwh_per_day"], reverse=True):
        flat = a["kwh_per_day"] * 30 * BASE_RATE
        print(f"{a['device']:<9} flat-rate cost {flat:>6.2f} $/mo")

    flat_total = total_month * BASE_RATE
    tiered = bill_for(total_month)
    print(f"\nflat rate:  {total_month:.2f} kWh @ ${BASE_RATE:.2f} -> ${flat_total:.2f}")
    print(f"tiered:     first {BRACKET} kWh @ ${BASE_RATE:.2f}, then ${HIGH_RATE:.2f} -> ${tiered:.2f}")
    print(f"tiering premium: ${tiered - flat_total:.2f}")
```

`bill_for` est une fonction à deux branches : sous le palier, une multiplication ; au-dessus, les *premiers 250* sont tarifés au taux de base et le *reste* à la prime. Les constantes vivent en haut du fichier, donc « changer le tarif à 275 kWh » consiste à éditer trois nombres, pas à chasser une formule. La démo imprime à la fois un coût plat par appareil (pour la vue « quel appareil vaut la peine d'être traqué ») et la prime — qui est exactement les 4,53 $ que la structure tarifaire ajoute à une facture qui semblait devoir être plate.

**🎯 Résultat attendu :**

```
heater      flat-rate cost  27.00 $/mo
fridge      flat-rate cost  21.60 $/mo
tv          flat-rate cost   3.60 $/mo
ps5         flat-rate cost   2.40 $/mo
router      flat-rate cost   1.44 $/mo

flat rate:  280.20 kWh @ $0.20 -> $56.04
tiered:     first 250 kWh @ $0.20, then $0.35 -> $60.57
tiering premium: $4.53
```

**🩹 Si ça ne marche pas :** Si la facture progressive égale la facture plate, `kwh_month <= BRACKET` compare un *décimal contre un int arrondi* du mauvais côté — vérifie que `bill_for(280.2)` renvoie 60.57, pas 56.04. Si les factures de forte consommation sortent *moins chères* que les faibles, le sous-total `- BRACKET` manque — au-dessus du palier tu factures tout le mois à la prime.

### 3.2 Vérifie le tarif

**✅ Liste de vérification**

- ✅ `bill_for(280.2) == 250×0.20 + 30.2×0.35 == 60.57` à la main.
- ✅ `bill_for(249.9) == 49.98` et est *moins cher par kWh* que `bill_for(280.2)` — le palier mord vraiment.
- ✅ La ligne par appareil utilise toujours le taux plat, honnêtement étiqueté — le classement des appareils et la tarification sont des questions distinctes.

**🤔 Question(s) socratique(s)**

- La prime est de 4,53 $ (8 % de la facture) mais les kWh du palier sont 10,8 % de l'usage. Pourquoi les appareils *sous* le palier sont-ils toujours implicitement « au taux de base », et qu'est-ce qui déplacerait les lignes de coût par appareil si tu tarifais la *part de dépassement* de chaque appareil à la place ?
- Le tarif publie deux seuils. Un vrai service public a des fenêtres *heures creuses* (nuit moins chère que soirée). Comment `bill_for` changerait-il si le prix devenait `price(hour)` — et que fait cela au modèle `avg_hours_per_day` ?

## Étape 4 : Auditer le gaspillage en veille

L'essentiel d'une facture n'est pas les appareils *allumés* — c'est les appareils *éteints mais branchés* : la LED du téléviseur, l'électronique du chauffage, la console qui attend un signal. La consommation en veille est petite par appareil et énorme en agrégat, et l'audit de cette étape la trouve : charge les watts de veille, convertit en kWh mensuels, et *suggère* ce qui vaut la peine d'être débranché avec une règle de seuil.

### 4.1 Écris l'audit de veille

**👟 Indice de départ :** La veille est `watts/1000 × 24` (une journée ne s'arrête jamais) ; la liste de conseils ne se déclenche que lorsqu'un appareil dépasse un `WASTE_THRESHOLD_KWH` :

```bash
cat > standby.csv <<'EOF'
device,standby_watts
tv,4
heater,20
ps5,7
router,8
EOF
```

```python
# standby.py
import csv

WASTE_THRESHOLD_KWH = 5.0  # monthly alert level

def load_standby(path: str = "standby.csv") -> list[dict]:
    with open(path, newline="") as f:
        rows = list(csv.DictReader(f))
    for row in rows:
        row["standby_watts"] = float(row["standby_watts"])
        row["kwh_per_day"] = row["standby_watts"] / 1000 * 24
        row["kwh_per_month"] = row["kwh_per_day"] * 30
    return rows

if __name__ == "__main__":
    standby = load_standby()
    for s in sorted(standby, key=lambda s: s["kwh_per_month"], reverse=True):
        print(f"{s['device']:<9} standby {s['standby_watts']:>5.1f} W  "
              f"waste {s['kwh_per_month']:>6.2f} kWh/mo")

    total_month = sum(s["kwh_per_month"] for s in standby)
    print(f"\ntotal standby waste: {total_month:.2f} kWh/mo")
    print(f"cost at $0.20/kWh: ${total_month * 0.20:.2f}/mo")

    print("\n== savings hints ==")
    for s in standby:
        if s["kwh_per_month"] >= WASTE_THRESHOLD_KWH:
            print(f" - unplug {s['device']} at night "
                  f"(saves {s['kwh_per_month']:.1f} kWh/mo)")
```

Le trait distinctif de la veille est le `24` — pas d'intrant d'heures, car « éteint mais branché » ne dort jamais. Le seuil fait le travail de jugement : un appareil gaspillant 5+ kWh/mois remonte comme un verbe d'action (« débrancher ... »), tandis que le téléviseur à 2.88 kWh reste une note de bas de page plutôt qu'une enquiquineuse. Le rapport d'audit *sépare la mesure du conseil* : le tableau des nombres est la vérité brute, les conseils sont une règle qui peut être réglée à 10 kWh ou à 1 — les mêmes données, un seuil différent, une liste différente.

**🎯 Résultat attendu :**

```
heater    standby  20.0 W  waste  14.40 kWh/mo
router    standby   8.0 W  waste   5.76 kWh/mo
ps5       standby   7.0 W  waste   5.04 kWh/mo
tv        standby   4.0 W  waste   2.88 kWh/mo

total standby waste: 28.08 kWh/mo
cost at $0.20/kWh: $5.62/mo

== savings hints ==
 - unplug heater at night (saves 14.4 kWh/mo)
 - unplug ps5 at night (saves 5.0 kWh/mo)
 - unplug router at night (saves 5.8 kWh/mo)
```

**🩹 Si ça ne marche pas :** Si la liste de conseils est vide, `>=` est devenu `>` et la ps5 à 5.04 kWh passe sous la barre — ou `WASTE_THRESHOLD_KWH` est une chaîne issue d'une config, comparée à tort contre des flottants. Si le gaspillage de veille d'un appareil s'imprime en *watts* (`0.20 kWh/mo` pour le chauffage), le `/1000` manque — les watts ne sont pas encore des kWh.

### 4.2 Vérifie l'audit

**✅ Liste de vérification**

- ✅ Le chauffage mène à 14.4 kWh/mois, la TV traîne à 2.88 — le reverse du tri correspond à la réalité.
- ✅ Le seuil 5.0 admet exactement 3 appareils sur 4 ; le passer à 6 exclut la ps5 et change la liste, pas les maths.
- ✅ Total = 28.08 kWh/mois, tarifé à 5,62 $ — le même taux plat que l'étape 3, délibérément.

**🤔 Question(s) socratique(s)**

- « Débrancher le chauffage la nuit » est le conseil de la *règle* — mais l'électronique de veille du chauffage existe pour garder son horloge et sa sécurité vivantes. Quel est le compromis que le chiffre de 5,62 $ ne peut pas voir, et qu'est-ce qu'une colonne coût-bénéfice ajouterait avant que tu tires la prise ?
- Le routeur gaspille 5.76 kWh/mois et vaut sans doute *toujours la peine d'être alimenté* (l'internet de ta maison en dépend). Qu'est-ce qui est dangereux à laisser le seul seuil de l'audit être la seule voix — et quel est le second intrant (priorité d'appareil, sécurité, nécessité) dont un outil de qualité décisionnelle a besoin ?

## Étape 5 : Comparer les scénarios d'usage

La compétence finale est le *what-if* : « si je réduis le chauffage de 3 à 2 heures et la TV de 5 à 3, qu'arrive-t-il à la facture ? » Une fonction `scenario(hours_map)` prend le CSV des appareils, *écrase* les heures des appareils choisis, recalcule les kWh mensuels, et tarife les deux mondes — actuel et optimisé — avec le même tarif progressif. La sortie — 14,97 $ économisés, une réduction de 18,6 % — est tout l'intérêt du moniteur : les questions d'énergie deviennent des questions de dollars.

### 5.1 Écris le comparateur de scénarios

**👟 Indice de départ :** `hours_map.get(device, avg_hours_per_day)` retombe sur les heures du CSV pour tout ce qui n'est pas dans la carte :

```python
# scenarios.py
import csv
from tariff import bill_for

def scenario(hours_map: dict) -> float:
    total_kwh = 0.0
    with open("appliances.csv", newline="") as f:
        for a in csv.DictReader(f):
            watts = float(a["watts"])
            hours = hours_map.get(a["device"], float(a["avg_hours_per_day"]))
            total_kwh += watts / 1000 * hours
    return total_kwh * 30

if __name__ == "__main__":
    current = scenario({})
    optimized = scenario({"heater": 2.0, "tv": 3.0})

    print(f"current:    {current:.1f} kWh/mo -> ${bill_for(current):.2f}")
    print(f"optimized:  {optimized:.1f} kWh/mo -> ${bill_for(optimized):.2f}")
    saved_kwh = current - optimized
    print(f"savings:    {saved_kwh:.1f} kWh/mo = ${bill_for(current) - bill_for(optimized):.2f} "
          f"({100 * saved_kwh / current:.1f}% cut)")
```

`scenario({})` envoie une carte vide → chaque appareil garde ses heures CSV → c'est *cela*, « actuel », en réutilisant la même fonction au lieu de coder en dur 280.2. La carte d'écrasement est additive, pas une fourche : seuls `heater` et `tv` changent, tout le reste relit ses heures CSV, donc le modèle ne peut pas oublier le frigo. La comparaison re-tarife *les deux* mondes via `bill_for`, ce qui rend le chiffre d'économies sensible au tarif : une facture aplatie aurait « économisé » 10,44 $ — sous le palier, les vrais dollars sont 14,97 $, car les kWh bon marché ont été chassés du dépassement.

**🎯 Résultat attendu :**

```
current:    280.2 kWh/mo -> $60.57
optimized:  228.0 kWh/mo -> $45.60
savings:    52.2 kWh/mo = $14.97 (18.6% cut)
```

**🩹 Si ça ne marche pas :** Si `optimized` égale `current`, les clés d'écrasement ratent les valeurs exactes de `device` du CSV — `"Heater"` (H majuscule) ne correspond jamais à `"heater"`, donc le repli l'avale. Si le pourcentage d'économies ressemble à la réduction *de kWh* plutôt qu'à un 18,6 %, le print divise `saved_kwh` par `current` déjà correctement — mais vérifie que tu divises les bons termes, pas `optimized/current`.

### 5.2 Vérifie le scénario

**✅ Liste de vérification**

- ✅ `optimized(228.0) < current(280.2)` et les deux passent par `bill_for` progressif (228 reste sous le palier ; 280.2 paie la prime).
- ✅ Maths d'économies : `52.2 kWh` retirés → `$60.57 − $45.60 = $14.97` ; `52.2/280.2 = 18.6%`.
- ✅ Une entrée de carte hypothétique supplémentaire (par ex. `{"router": 0}`) fusionne proprement — la carte est le seul bouton qui change.

**🤔 Question(s) socratique(s)**

- Le palier mord sur les exceptions : couper exactement les kWh *de dépassement* économise 0,35 $ chacun, tandis que couper des kWh au taux de base économise 0,20 $. Avec `optimized = 228 kWh`, ce scénario a-t-il déjà *sélectionné* quels kWh couper — et comment une variante « économise les 52 kWh du haut quel que soit l'appareil » différerait-elle dans le résultat ?
- Les cartes d'heures ne portent aucun jugement sur le *confort* — « chauffage à 2 heures » est une prémisse sans prix. Quelle est la manière honnête de présenter une suggestion qui économise de l'argent mais refroidit la pièce : imprimer le compromis comme une *paire*, ou enterrer la prémisse ?

## ⚠️ Pièges courants

- **Des watts sans le /1000.** Le kWh est `watts/1000 × heures`. Sauter la conversion kilo- tarife un chauffage de 1500 W comme 45 kWh/jour au lieu de 4.5 — un fantôme décuplé sur la facture.
- **Diviser une chaîne.** Les cellules CSV arrivent en texte ; `float(...)` avant l'arithmétique ou `sum` concatène en silence et rend le rapport NaN. Enrichis la ligne une fois, au chargement, pas chez chaque consommateur.
- **Un `30` magique à double emploi.** Il multiplie *une fois* dans `load_appliances`. Si un second `* 30` se glisse dans un rapport, le mois devient 900 jours. Définis-le une fois, commente-le comme « mois de 30 jours ».
- **Calculer les totaux dans une boucle.** `total = sum(...)` recalculé par ligne est O(n²) et, pire, la part de chaque ligne se divise contre un total *partiel*. Totalise une fois, à l'extérieur.
- **Dérive de casse ou d'espace dans les noms d'appareils.** `HeroMap` indexée par un nom CSV qui diffère d'un espace (`"heater "` contre `"heater"`) retombe en silence sur les heures par défaut — le scénario « ne voit pas » le changement. Fais correspondre la casse CSV exacte.

## Ce que tu viens de construire

Un moniteur d'énergie qui se lit comme un rapport qu'un propriétaire payerait : watts → kWh, totaux + parts, un tarif qui mord sur le dépassement, un audit de veille à seuils réglables, et un choc de scénario montrant de vrais dollars. Le fil conducteur est la *discipline de dérivation* : chaque nombre est une fonction pure des intrants CSV plus des constantes explicites (`30`, `0.20`, `250`, `5.0`), deux instructions d'impression ne se contredisent jamais, et l'histoire — le chauffage est la moitié de la facture ; la veille fait 5,62 $ ; réduire les heures et la TV fait 14,97 $ — vient des données, pas d'une impression.

:::tip[Exécute une version plus complète sans aucune configuration locale]
[`examples/energy-monitor/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/energy-monitor) dans le dépôt du cours contient les scripts complets plus l'`appliances.csv` et le `standby.csv` d'échantillon. Ou ouvre tout le dépôt dans un [GitHub Codespaces](https://codespaces.new/abderrahim-lectures/python-data-analysis-course).
:::

## Où aller ensuite

- Ajoute la **tarification heures creuses** : remplace les paliers plats par des plages `price(hour)` et passe une `hours_map` par appareil *par heure* (planning de jour, planning de nuit) — le modèle devient saisonnier gratuitement.
- Fais **renvoyer des dollars à `scenario`**, pas des kWh : remanie l'étape 5 pour comparer `bill_for(scenario(map_a))` contre `bill_for(scenario(map_b))` et imprimer *à la fois* le delta de kWh et le delta de dollars, comme fonction `compare(map_a, map_b)`.
- Charge un **vrai fichier de lectures** : remplace `avg_hours_per_day` par de vrais nombres d'énergie par heure (d'un compteur de prise ou du portail du service public) et laisse `kwh_per_day` venir du fichier à la place de watts×heures — même rapport, vraies données.
- Persiste le rapport : sérialise le tableau des parts en `monthly_report.csv` et recharge-le dans un tableau markdown — l'audit devient un artefact à joindre au fil d'email du propriétaire.

## Partage ton projet avec la classe

Tu as construit quelque chose dont tu es fier ? [`examples/student-projects/`](https://github.com/abderrahim-lectures/python-data-analysis-course/tree/main/examples/student-projects) est une galerie de projets soumis par d'autres étudiants — et son README contient un parcours complet et accessible aux débutants pour ajouter le tien via une **pull request**, même si tu n'as jamais utilisé git auparavant : forker le dépôt, créer une branche, commiter tes fichiers et ouvrir la PR, une étape à la fois. Aucune expérience préalable de git n'est supposée.

Bienvenue dans l'écriture de Python en dehors du navigateur. 🎓