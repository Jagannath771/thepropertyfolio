*** Settings ***
Documentation     Chatbot Acceptance Tests
Library           Browser
Resource          resources/keywords.robot
Resource          resources/variables.robot
Suite Setup       Open Application
Suite Teardown    Close Browser

*** Test Cases ***
User Can Open Chatbot And Send Message
    [Documentation]    Verify the chatbot bubble opens a chat panel and accepts input.
    Go To          ${BASE_URL}/
    
    # Open chatbot
    Click          button="Open AI Chat"
    Get Element    text="TPF Assistant"
    
    # Send message
    Fill Text      input[placeholder="Type your message..."]    Do you have pet friendly apartments?
    Click          button="Send"
    
    # Wait for assistant response (mocked or real)
    # The response bubble will have the text
    Wait For Elements State    text="friendly"    state=visible    timeout=10s
