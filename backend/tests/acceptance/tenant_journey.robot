*** Settings ***
Documentation     Tenant Journey Acceptance Tests
Library           Browser
Resource          resources/keywords.robot
Resource          resources/variables.robot
Suite Setup       Open Application
Suite Teardown    Close Browser

*** Test Cases ***
Tenant Can Browse Available Properties
    [Documentation]    Verify that a tenant can navigate to availability page and filter properties.
    Go To          ${BASE_URL}/availability
    Get Title      matches    .*Available Rental Properties.*
    # Check if filters exist
    Get Element    text=Filter Options
    Get Element    select[name="propertyType"]

Tenant Login Navigation
    [Documentation]    Verify tenant can reach the login screen from the homepage.
    Go To          ${BASE_URL}/
    Click          text=Tenants
    # Could be a link to Login
    Click          text=Sign In
    Get Title      matches    .*Login.*
