# Heimnett Pingapp 📡

**Produksjonsklar latency-monitor for norske og internasjonale tjenester.**

Overvåker 150+ tjenester hvert minutt med [Smokeping](https://oss.oetiker.ch/smokeping/), visualiserer med [Grafana](https://grafana.com/) og eksponerer alt via et enkelt REST API.

---

## Kom i gang

```bash
git clone https://github.com/smartlabDEV/Heimnett_pingapp
cd Heimnett_pingapp
cp .env.example .env
# Rediger .env med dine innstillinger
docker-compose up -d
```

---

## URL-oversikt

| Tjeneste | URL |
|---|---|
| Demo / dokumentasjon | http://localhost:8888 |
| REST API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |
| Smokeping grafer | http://localhost:8080 |
| Grafana | http://localhost:3000 |

---

## API Endepunkter

| Metode | Endepunkt | Beskrivelse |
|--------|-----------|-------------|
| GET | `/api/targets` | Alle tjenester (150+) |
| GET | `/api/targets?category=X` | Filtrer på kategori |
| GET | `/api/targets?search=X` | Søk i navn og host |
| GET | `/api/categories` | Alle kategorier |
| GET | `/api/categories/{id}` | En kategori med targets |
| GET | `/api/hosts` | Enkel host-liste for dropdown |
| GET | `/api/health` | Helsestatus |
| GET | `/docs` | Swagger UI (interaktiv) |

---

## Integrasjonseksempler

### iframe — Embed Grafana panel

```html
<!-- Legg til i Grafana: Configuration > Security > allow_embedding = true -->
<iframe
  src="http://DIN-SERVER:3000/d/latency/oversikt?kiosk&theme=light"
  width="100%"
  height="500"
  frameborder="0"
  style="border-radius: 8px;">
</iframe>
```

### JavaScript — fetch()

```javascript
// Hent alle tjenester
const res = await fetch('http://DIN-SERVER:8000/api/targets')
const { targets } = await res.json()

// Filtrer på kategori
const gaming = await fetch('http://DIN-SERVER:8000/api/targets?category=Gaming_Steam')

// Søk
const netflix = await fetch('http://DIN-SERVER:8000/api/targets?search=netflix')
```

### Python — requests

```python
import requests

BASE = 'http://DIN-SERVER:8000'

# Alle tjenester
targets = requests.get(f'{BASE}/api/targets').json()['targets']

# Filtrer på kategori
gaming = requests.get(f'{BASE}/api/targets', params={'category': 'Gaming_Steam'})

# Alle kategorier
categories = requests.get(f'{BASE}/api/categories').json()
```

---

## Mappestruktur

```
/
├── docker-compose.yml
├── .env.example
├── README.md
│
├── config/
│   ├── Targets          ← 150+ ping-mål
│   ├── Probes
│   └── Alerts
│
├── api/
│   ├── __init__.py
│   ├── main.py
│   ├── parser.py
│   ├── models.py
│   ├── requirements.txt
│   └── Dockerfile
│
└── web/
    ├── index.html
    ├── style.css
    └── app.js
```

---

## Overvåkede kategorier

| Kategori | Eksempler |
|---|---|
| Referanse & DNS | 1.1.1.1, 8.8.8.8, 9.9.9.9 |
| Norsk Infrastruktur | Telenor, Telia, Altibox, Ice |
| Norske Medier | VG, NRK, Dagbladet, Aftenposten |
| Norsk TV | NRK TV, TV2 Play, RiksTV, Viaplay |
| Internasjonal Streaming | Netflix CDN, Spotify, Disney+, Apple TV+ |
| Steam & Valve | Stockholm, Frankfurt, Amsterdam |
| Riot Games | Valorant EU, LoL EUW/EUNE |
| Blizzard | Battle.net EU, WoW |
| PlayStation | PSN, Store, nedlasting |
| Xbox & Microsoft | Xbox Live, Minecraft |
| Epic & Fortnite | Epic Store |
| EA Games | EA, Origin |
| Andre Spill | Roblox, Ubisoft, Rockstar, FACEIT |
| Live Streaming | Twitch Oslo/Sto/Fra/Ams, Kick |
| Sosiale Medier | Discord, Instagram, TikTok, Signal |
| Norske Tjenester | Finn, Vipps, BankID, NAV, Altinn |
| Sky & CDN | AWS, Google, Cloudflare, Fastly |
| Microsoft 365 | Teams, Office 365, Zoom, Slack |
| Norden | SVT, DR, YLE, Telia SE |
| Sikkerhet & VPN | NordVPN, Mullvad, Proton, NSM |

---

Bygget for norske bredbåndsleverandører.
