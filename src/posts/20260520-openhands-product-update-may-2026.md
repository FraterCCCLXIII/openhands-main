---
title: 'OpenHands Product Update - May 2026'
slug: openhands-product-update---may-2026
excerpt: 'We''re excited to share a round up of the latest features in OpenHands! The latest release of the OpenHands Local GUI brings significant improvements to LLM profile management, enhanced security, and a variety of quality-of-life improvements across the platform.'
coverImage: /assets/webflow/blog/openhands-product-update-may-2026/69a8470f9d00e34ff3c8d8df_openhands_product_update_v3.png
coverRadius: none
date: '2026-05-20T12:00:00.000+00:00'
authors:
  - name: Joe Pelletier
ogImage:
  url: /assets/webflow/blog/openhands-product-update-may-2026/69a8470f9d00e34ff3c8d8df_openhands_product_update_v3.png
seoTitleDate: 'May 20, 2026'
---
We're excited to share a round up of the latest features in OpenHands! The latest release of the OpenHands Local GUI brings significant improvements to LLM profile management, enhanced security, and a variety of quality-of-life improvements across the platform. We have also made a few important enhancements and fixes to OpenHands Enterprise.

## LLM Profile Management

Note: The following updates will be made available in OpenHands Cloud in a future release.

**Saved LLM Profiles** — Users can now save and manage multiple LLM configurations as reusable profiles. This eliminates the need to reconfigure model settings when switching between different use cases or providers.

**/model Slash Command** — A new `/model` command in chat lets you quickly list and switch between your saved LLM profiles. This provides a seamless way to change models mid-conversation without leaving the chat interface.

**Inline Profile Switcher** — A convenient profile switcher button is now available directly in the chat input area. One-click model switching means faster workflows for users who frequently alternate between different LLM configurations.

**Full Model Name in Header** — The conversation header now displays the complete model name instead of abbreviated versions. This clarity helps users quickly verify which model is powering their current conversation.

## Sub-agents, Critic, and Sandbox Grouping

**Sub-Agent Delegation** — OpenHands can now delegate specialized tasks to sub-agents via TaskToolSet. This enables more sophisticated multi-agent workflows where different agents handle different aspects of complex tasks.

**Critic Result Display** — A new UI component renders critic/verification results inline within conversations. Users can now see quality assessments and validation feedback directly where it's most relevant.

**Sandbox Grouping Strategy UI** — The sandbox grouping strategy setting is now exposed to all users in the application settings. This gives users more control over how their development environments are organized and managed.

**Canonical Settings Query Keys** — Frontend settings now use consistent, canonical query keys throughout. This improves reliability and makes debugging settings-related issues significantly easier.

## Enterprise Enhancements and Fixes

**Tavily MCP Proxy** — MCP connections to Tavily are now proxied through the app server for enterprise deployments. This provides better security controls and monitoring capabilities for organizations using Tavily integrations.

**LiteLLM Security Update (GHSA-xqmj-j6mv-4862)** — Updated LiteLLM to version 1.83.14 to address a security vulnerability. Keeping dependencies current is critical for maintaining a secure software supply chain.

**lxml Security Update (CVE-2026-41066)** — Updated lxml to version 6.1.0 to patch a known vulnerability. This ensures XML processing remains secure across all document handling operations.

**SAML IdP Token Handling** — Fixed token storage behavior for SAML identity providers that don't support OAuth tokens. Enterprise users authenticating via SAML will no longer encounter token-related errors.

**Organization Settings Fix** — Fixed handling of legacy `agent_kind='openhands'` values in organization responses. Organizations with older configurations will now load correctly without errors.
