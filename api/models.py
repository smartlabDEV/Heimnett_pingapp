from pydantic import BaseModel
from typing import List


class Target(BaseModel):
    id: str
    category: str
    category_menu: str
    category_title: str
    name: str
    menu: str
    title: str
    host: str


class CategorySummary(BaseModel):
    id: str
    menu: str
    title: str
    target_count: int


class TargetsResponse(BaseModel):
    total: int
    categories: int
    targets: List[Target]


class CategoriesResponse(BaseModel):
    total: int
    categories: List[CategorySummary]
