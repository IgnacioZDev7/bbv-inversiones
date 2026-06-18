import os
import json
from datetime import datetime
from typing import Optional
from test_data.test_cases import TEST_CASES
from config import BASE_DIR

GHERKIN_DIR = os.path.join(BASE_DIR, "results", "gherkin")
os.makedirs(GHERKIN_DIR, exist_ok=True)


def _build_feature_name(tc: dict) -> str:
    modulo = tc.get("modulo", "General")
    return modulo.replace(" ", "_").replace("í", "i").replace("ó", "o").lower()


def _build_scenario(tc: dict, idx: int) -> str:
    lines = []
    lines.append(f"  @TC-{idx:03d}")
    lines.append(f"  Scenario: {tc['titulo']}")
    lines.append(f"    Given el usuario accede al módulo \"{tc['modulo']}\"")
    lines.append(f"    When el usuario ejecuta {tc['endpoint']}")

    payload = tc.get("payload", "N/A")
    if payload and payload != "N/A":
        lines.append(f"    And envía el payload: {payload}")

    expected = tc.get("respuesta_esperada")
    if expected:
        if isinstance(expected, int):
            lines.append(f"    Then el sistema responde con código {expected}")
        else:
            lines.append(f"    Then el sistema responde: {expected}")

    prerreq = tc.get("prerrequisitos", [])
    if prerreq:
        for p in prerreq:
            lines.append(f"    And existe el prerrequisito: \"{p}\"")

    desc = tc.get("descripcion", "")
    if desc:
        lines.append(f"    # {desc}")

    return "\n".join(lines)


def generate_gherkin(categoria: Optional[str] = None) -> str:
    features: dict[str, list[dict]] = {}

    for tc in TEST_CASES:
        if categoria and tc.get("tipo") != categoria:
            continue
        fname = _build_feature_name(tc)
        if fname not in features:
            features[fname] = []
        features[fname].append(tc)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    combined_lines = []
    main_filename = f"bbv_inversiones_{timestamp}.feature"
    main_path = os.path.join(GHERKIN_DIR, main_filename)

    for fname, tcs in features.items():
        feature_title = tcs[0]["modulo"]
        combined_lines.append(f"Feature: {feature_title}")
        combined_lines.append(f"  As a QA engineer")
        combined_lines.append(f"  I want to verify the {feature_title} module")
        combined_lines.append(f"  So that the system meets requirements")
        combined_lines.append("")
        for i, tc in enumerate(tcs, 1):
            combined_lines.append(_build_scenario(tc, int(tc["id"].split("-")[1])))
            combined_lines.append("")
        combined_lines.append("")

    content = "\n".join(combined_lines).strip()
    with open(main_path, "w", encoding="utf-8") as f:
        f.write(content)

    per_feature = []
    for fname, tcs in features.items():
        feature_title = tcs[0]["modulo"]
        single = [
            f"Feature: {feature_title}",
            f"  As a QA engineer",
            f"  I want to verify the {feature_title} module",
            f"  So that the system meets requirements",
            "",
        ]
        for i, tc in enumerate(tcs, 1):
            single.append(_build_scenario(tc, int(tc["id"].split("-")[1])))
            single.append("")
        single_content = "\n".join(single).strip()
        single_filename = f"{fname}_{timestamp}.feature"
        single_path = os.path.join(GHERKIN_DIR, single_filename)
        with open(single_path, "w", encoding="utf-8") as f:
            f.write(single_content)
        per_feature.append({
            "filename": single_filename,
            "feature": feature_title,
            "scenarios": len(tcs),
        })

    return {
        "success": True,
        "combined": {
            "filename": main_filename,
            "path": main_path,
            "scenarios": len(TEST_CASES),
        },
        "per_feature": per_feature,
        "total_features": len(features),
    }


def list_gherkin_files() -> list[dict]:
    files = []
    for f in sorted(os.listdir(GHERKIN_DIR), reverse=True):
        if f.endswith(".feature"):
            fpath = os.path.join(GHERKIN_DIR, f)
            stats = os.stat(fpath)
            files.append({
                "filename": f,
                "size": stats.st_size,
                "created": datetime.fromtimestamp(stats.st_mtime).isoformat(),
            })
    return files


def get_gherkin_path(filename: str) -> Optional[str]:
    fpath = os.path.join(GHERKIN_DIR, filename)
    if os.path.exists(fpath) and fpath.endswith(".feature"):
        return fpath
    return None
