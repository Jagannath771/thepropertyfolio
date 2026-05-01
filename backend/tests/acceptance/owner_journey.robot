*** Settings ***
Documentation     Owner Journey Acceptance Tests
Library           Browser
Resource          resources/keywords.robot
Resource          resources/variables.robot
Suite Setup       Open Application
Suite Teardown    Close Browser

*** Test Cases ***
Owner Can Access Registration
    [Documentation]    Verify owner registration page loads correctly.
    Go To          ${BASE_URL}/owners/register
    Get Title      matches    .*Partner with Us.*
    Get Element    role=switch[name="Business"]
    Get Element    button=Create Account

Owner Login Navigation
    [Documentation]    Verify owner can navigate to login.
    Go To          ${BASE_URL}/owners
    Click          text=Owner Portal
    Get Title      matches    .*Owner Login.*
    Get Element    label=Email
