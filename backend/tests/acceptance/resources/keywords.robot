*** Settings ***
Library         Browser
Resource        variables.robot

*** Keywords ***
Open Application
    New Browser    ${BROWSER}    headless=${HEADLESS}
    New Context    viewport={'width': 1280, 'height': 720}
    New Page       ${BASE_URL}
    Get Title      matches    .*ThePropertyFolio.*

Login As Tenant
    [Arguments]    ${email}=${TENANT_EMAIL}    ${password}=${TENANT_PASSWORD}
    Go To          ${BASE_URL}/tenants/login
    Fill Text      label=Email       ${email}
    Fill Text      label=Password    ${password}
    Click          button=Sign In
    # We expect some visual confirmation or redirect to dashboard
    Wait For Condition    Url    should match    .*tenants/dashboard.*    timeout=5s

Login As Owner
    [Arguments]    ${email}=${OWNER_EMAIL}    ${password}=${OWNER_PASSWORD}
    Go To          ${BASE_URL}/owners/login
    Fill Text      label=Email       ${email}
    Fill Text      label=Password    ${password}
    Click          button=Sign In
    Wait For Condition    Url    should match    .*owners/dashboard.*    timeout=5s
