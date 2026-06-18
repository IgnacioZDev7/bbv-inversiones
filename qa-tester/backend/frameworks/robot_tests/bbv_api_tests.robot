*** Settings ***
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
