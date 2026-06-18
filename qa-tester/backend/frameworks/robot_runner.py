import subprocess
import sys
import os


def run_robot_tests() -> dict:
    robot_dir = os.path.join(os.path.dirname(__file__), "robot_tests")
    if not os.path.exists(robot_dir):
        os.makedirs(robot_dir, exist_ok=True)

    test_file = os.path.join(robot_dir, "bbv_api_tests.robot")
    if not os.path.exists(test_file):
        _create_default_test(test_file)

    result = subprocess.run(
        ["robot", "--outputdir", os.path.join(os.path.dirname(__file__), "..", "results", "robot"),
         test_file],
        capture_output=True, text=True, timeout=120,
    )
    return {
        "framework": "robot_framework",
        "status": "completed",
        "returncode": result.returncode,
        "stdout": result.stdout[-1500:] if result.stdout else "",
        "stderr": result.stderr[-1500:] if result.stderr else "",
        "passed": result.returncode == 0,
    }


def _create_default_test(path: str):
    content = """*** Settings ***
Library    RequestsLibrary
Library    Collections

*** Variables ***
${BASE_URL}    http://localhost:8000/api

*** Test Cases ***
GET Empresas Returns 200
    Create Session    bbv    ${BASE_URL}
    GET On Session    bbv    /empresas/
    Status Should Be    200

GET Sectores Returns 200
    GET On Session    bbv    /sectores/
    Status Should Be    200
"""
    with open(path, "w") as f:
        f.write(content)
