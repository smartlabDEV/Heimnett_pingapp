import re
from typing import List
from .models import Target, CategorySummary


def parse_targets(targets_file: str) -> List[Target]:
    targets = []
    current_category_id = ""
    current_category_menu = ""
    current_category_title = ""
    current_target_id = ""
    current_target_menu = ""
    current_target_title = ""
    in_target = False

    try:
        with open(targets_file, "r", encoding="utf-8") as f:
            lines = f.readlines()
    except FileNotFoundError:
        return []

    for line in lines:
        line = line.strip()
        if not line or line.startswith("#"):
            continue

        if re.match(r"^\+\+\s+\w", line):
            in_target = True
            current_target_id = re.sub(r"^\+\+\s+", "", line).strip()
            current_target_menu = ""
            current_target_title = ""
        elif re.match(r"^\+\s+\w", line):
            in_target = False
            current_category_id = re.sub(r"^\+\s+", "", line).strip()
            current_category_menu = ""
            current_category_title = ""
        elif "=" in line:
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip()
            if not in_target:
                if key == "menu":
                    current_category_menu = value
                elif key == "title":
                    current_category_title = value
            else:
                if key == "menu":
                    current_target_menu = value
                elif key == "title":
                    current_target_title = value
                elif key == "host":
                    targets.append(Target(
                        id=f"{current_category_id}__{current_target_id}",
                        category=current_category_id,
                        category_menu=current_category_menu or current_category_id,
                        category_title=current_category_title or current_category_id,
                        name=current_target_id,
                        menu=current_target_menu or current_target_id,
                        title=current_target_title or current_target_id,
                        host=value,
                    ))

    return targets


def get_categories(targets: List[Target]) -> List[CategorySummary]:
    seen = {}
    for t in targets:
        if t.category not in seen:
            seen[t.category] = CategorySummary(
                id=t.category,
                menu=t.category_menu,
                title=t.category_title,
                target_count=0,
            )
        seen[t.category].target_count += 1
    return list(seen.values())
