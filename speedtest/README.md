# SpeedTest Server — Selvhostet TR-143-kompatibel hastighetstest

> Kjør din **egen** speedtest-server i Docker — med fullt TR-143-kompatibelt HTTP-API og et moderne, mørkt web-UI.

---

## Hva er TR-143?

**TR-143** (Broadband Forum Diagnostics) definerer standardiserte bredbåndsdiagnostikker brukt av CPE-er (rutere/modem) via TR-069/CWMP og ACS-systemer.
Kjernen er HTTP-basert:

| Operasjon | Metode | Beskrivelse |
|-----------|--------|-------------|
| Nedlasting | `GET` | Laster ned en stor binær blob |
| Opplasting | `PUT`/`POST` | Sender data til server for å måle opplasting |
| Ping | `GET` | Latency/RTT-måling |

---

## Hurtigstart

```bash
cd speedtest
docker-compose up -d
```

Åpne nettleseren: **http://localhost:8080**

---

## Manuell Docker-kjøring

```bash
cd speedtest
docker build -t speedtest-tr143 .
docker run -p 8080:8080 \
  -e SERVER_NAME="Min SpeedTest" \
  -e MAX_SIZE_MB=100 \
  speedtest-tr143
```

---

## API-endepunkter

| Metode | Endepunkt | Beskrivelse |
|--------|-----------|-------------|
| `GET` | `/` | Web-UI (index.html) |
| `GET` | `/ping` | Latency-test → `{"status":"ok","timestamp":<epoch_ms>}` |
| `GET` | `/download?size=10MB` | Last ned tilfeldig blob (1/5/10/25/50/100 MB) |
| `POST` | `/upload` | Last opp data → `{"bytes_received":...,"elapsed_s":...,"mbps":...}` |
| `PUT` | `/upload` | Samme som POST (TR-143 bruker PUT) |
| `GET` | `/speedtest/status` | Serverinfo: versjon, oppetid, hostname, IP |
| `GET` | `/docs` | Swagger UI (automatisk fra FastAPI) |

---

## Curl-eksempler (TR-143 CPE-integrasjon)

```bash
# Nedlasting — vis hastighet i bytes/s
curl -o /dev/null -w "%{speed_download}" http://SERVER_IP:8080/download?size=25MB

# Nedlasting — vis i Mbit/s (via awk)
curl -o /dev/null -s -w "%{speed_download}" http://SERVER_IP:8080/download?size=25MB \
  | awk '{printf "%.1f Mbit/s\n", $1*8/1024/1024}'

# Opplasting (TR-143 PUT)
curl -X PUT -H "Content-Type: application/octet-stream" \
  --data-binary @/dev/urandom \
  --max-time 10 \
  http://SERVER_IP:8080/upload

# Ping
curl http://SERVER_IP:8080/ping

# Serverinfo
curl http://SERVER_IP:8080/speedtest/status
```

---

## Web-UI

Åpne **http://localhost:8080** for et moderne, mørkt web-UI:

- **Header**: Servernavn, hostname og IP
- **Gauge**: Stor, animert hastighetsvisning med pulserende ring under test
- **3 testkort**:
  - 🔽 **Nedlasting** — velg 10 / 25 / 100 MB
  - 🔼 **Opplasting** — velg 10 / 25 / 100 MB
  - 🏓 **Ping / Latency** — 5 pings, viser min / avg / max
- **Historikk**: Siste 10 tester med tid, type og resultat
- **Ingen eksterne avhengigheter** — alt er self-contained

---

## Konfigurasjon (miljøvariabler)

| Variabel | Standard | Beskrivelse |
|----------|----------|-------------|
| `PORT` | `8080` | Port serveren lytter på |
| `MAX_SIZE_MB` | `100` | Maks filstørrelse for ned-/opplasting |
| `SERVER_NAME` | `Heimnett SpeedTest` | Visningsnavn i web-UI |

Kopier `config/config.env.example` til `config/config.env` og juster verdiene.

---

## TR-069 / ACS-konfigurasjon (informativt)

For å peke en CPE mot denne serveren via TR-069 ACS, sett følgende parametere i ACS-en:

```
InternetGatewayDevice.LANDevice.1.LANEthernetInterfaceConfig.1.Stats.
Device.IP.Diagnostics.DownloadDiagnostics.DownloadURL = http://SERVER_IP:8080/download?size=25MB
Device.IP.Diagnostics.DownloadDiagnostics.Interface   = Device.IP.Interface.1
Device.IP.Diagnostics.UploadDiagnostics.UploadURL     = http://SERVER_IP:8080/upload
Device.IP.Diagnostics.IPPing.Host                     = SERVER_IP
```

---

## Prosjektstruktur

```
speedtest/
├── Dockerfile
├── docker-compose.yml
├── README.md
├── server/
│   ├── app.py              # FastAPI backend
│   ├── requirements.txt
│   └── static/
│       ├── index.html      # Web-UI
│       ├── style.css       # Stilrent mørkt design
│       └── app.js          # Frontend JavaScript
└── config/
    └── config.env.example  # Eksempel på konfigurasjonsfil
```
