from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import os

from .parser import parse_targets, get_categories
from .models import Target, TargetsResponse, CategoriesResponse

TARGETS_FILE = os.getenv("SMOKEPING_TARGETS_FILE", "/config/Targets")

app = FastAPI(
    title="Heimnett Pingapp API",
    description="""
## Heimnett Pingapp — REST API

Eksponerer alle overvakede tjenester som JSON.

### URL-er nar Docker kjoerer
| Tjeneste | URL |
|---|---|
| **Demo og dokumentasjon** | http://localhost:8888 |
| **REST API** | http://localhost:8000 |
| **Swagger UI** | http://localhost:8000/docs |
| **Smokeping grafer** | http://localhost:8080 |
| **Grafana** | http://localhost:3000 |
    """,
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


def load():
    return parse_targets(TARGETS_FILE)


@app.get("/api/health", tags=["System"])
async def health():
    """Helsestatus for API-et."""
    t = load()
    return {"status": "ok", "targets": len(t), "file": TARGETS_FILE}


@app.get("/api/targets", response_model=TargetsResponse, tags=["Targets"])
async def get_targets(
    category: Optional[str] = Query(None, description="Filtrer pa kategori-ID, eks: Gaming_Steam"),
    search: Optional[str] = Query(None, description="Soek i host, navn eller tittel"),
    limit: int = Query(500, ge=1, le=1000, description="Maks antall resultater"),
):
    """Hent alle overvakede tjenester. Kan filtreres pa kategori og soek."""
    targets = load()
    if category:
        targets = [t for t in targets if t.category.lower() == category.lower()]
    if search:
        q = search.lower()
        targets = [
            t for t in targets
            if q in t.host.lower() or q in t.title.lower() or q in t.category_menu.lower()
        ]
    targets = targets[:limit]
    return TargetsResponse(
        total=len(targets),
        categories=len(set(t.category for t in targets)),
        targets=targets,
    )


@app.get("/api/categories", response_model=CategoriesResponse, tags=["Categories"])
async def list_categories():
    """Hent alle kategorier med antall targets per kategori."""
    cats = get_categories(load())
    return CategoriesResponse(total=len(cats), categories=cats)


@app.get("/api/categories/{category_id}", tags=["Categories"])
async def get_category(category_id: str):
    """Hent en kategori med alle tilhoerende targets."""
    targets = [t for t in load() if t.category.lower() == category_id.lower()]
    if not targets:
        raise HTTPException(status_code=404, detail=f"Kategori '{category_id}' ikke funnet")
    cats = get_categories(targets)
    return {"category": cats[0], "targets": targets}


@app.get("/api/hosts", tags=["Targets"])
async def hosts(
    category: Optional[str] = Query(None, description="Filtrer pa kategori"),
    search: Optional[str] = Query(None, description="Soek"),
):
    """Enkel liste med bare host og navn. Perfekt for dropdown og autocomplete."""
    targets = load()
    if category:
        targets = [t for t in targets if t.category.lower() == category.lower()]
    if search:
        q = search.lower()
        targets = [t for t in targets if q in t.host.lower() or q in t.title.lower()]
    return [{"host": t.host, "name": t.title, "category": t.category_menu} for t in targets]
