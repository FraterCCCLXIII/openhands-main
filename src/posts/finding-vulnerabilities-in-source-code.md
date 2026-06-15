---
title: 'How to Find Vulnerabilities in Source Code: Methods, AI Agents, and a Step-by-Step Workflow'
importance: SEO
slug: finding-vulnerabilities-in-source-code
excerpt: 'A senior engineer''s guide to finding vulnerabilities in source code, covering flaw types, detection methods, and where AI fits.'
coverImage: /assets/notion-blog/finding-vulnerabilities-in-source-code/image.png
date: '2026-06-11'
authors:
  - name: OpenHands Team
ogImage:
  url: /assets/notion-blog/finding-vulnerabilities-in-source-code/166e3fa0-e696-4e80-b824-383468d69295.png
---
Vulnerability scanners read through source code and flag patterns that tend to be exploitable:  unsanitized database queries, hardcoded passwords, outdated dependencies with known flaws. Modern scanners do this well. Point one at a large codebase in 2026 and it returns hundreds of candidate findings in minutes, far more than anyone could turn up by hand.

The catch is that a scanner cannot tell you which of those findings actually matter. Many are noise, patterns that look risky but sit on code paths an attacker can never reach. The work that decides whether your code ships safely is what happens after the scan, when someone confirms a finding is genuinely exploitable and writes the fix. That confirmation step is the hard part, and it is what this guide is about.

This guide covers why finding vulnerabilities has gotten harder, the flaw types worth scanning for, how the main detection methods work, a workflow to run across a codebase, and where AI coding agents fit.

## **Why finding vulnerabilities in source code is harder now**

Vulnerabilities are entering codebases faster than teams can clear them, and most organizations are already behind. 82 percent now carry security debt, the backlog of unresolved flaws left sitting in production, up from 74 percent the year before, per Veracode's [2026 State of Software Security](https://www.veracode.com/resources/analyst-reports/state-of-software-security-2026/) report. Two forces keep that backlog growing. The first is dependency risk: a library you never chose directly can pull a known flaw into production, and 78 percent of audited commercial codebases contained high-risk open-source vulnerabilities, per Black Duck's 2026 [Open Source Security and Risk Analysis](https://www.blackduck.com/resources/analyst-reports/open-source-security-risk-analysis.html) report.

Machine-generated code is the second force, one that did not exist at this scale a few years ago. AI-generated code introduced security flaws in 45 percent of tests across more than 100 LLMs, per Veracode's [2025 GenAI Code Security Report](https://www.veracode.com/resources/analyst-reports/2025-genai-code-security-report/). That defect rate pushes more findings into a queue that is already behind, and remediation timelines show the result. Fixing half of an application's security flaws now takes 252 days on average, per Veracode's [2025 State of Software Security](https://www.veracode.com/resources/analyst-reports/state-of-software-security-2025/) report. A layered detection approach is how teams keep that backlog from compounding.

## **What vulnerabilities to scan for in source code**

Most source-code findings that matter cluster into a handful of categories, each with signatures you can scan for directly. You get further by recognizing the patterns than by memorizing every [common weakness enumeration (CWE)](https://cwe.mitre.org/) number, since the patterns are what a scanner or reviewer matches against.

The categories below track the weaknesses MITRE and CISA rank most dangerous in their [2024 CWE Top 25](https://cwe.mitre.org/top25/archive/2024/2024_cwe_top25.html), and they cover the bulk of what turns up in a source-code review, along with the concrete signatures worth flagging in each:

- **Injection, cross-site scripting, and request forgery:** Watch for user input concatenated into SQL queries, shell commands, or HTML output, plus calls to system(), exec(), or innerHTML on untrusted data. Request forgery shows up as state-changing operations that skip token checks.

- **Hardcoded secrets and credentials:** Scan for literals matching password =, api_key =, or token =, plus private-key headers and connection strings with embedded credentials.

- **Vulnerable and outdated dependencies:** Parse manifest files like package.json, pom.xml, and requirements.txt, then cross-reference each pinned version against the National Vulnerability Database.

- **Memory and logic flaws:** Flag unsafe C string functions like strcpy() and gets(), malloc() sizing that trusts user-controlled values, and insecure deserialization through pickle.loads().

What makes any of these dangerous comes down to whether untrusted data can reach a sensitive operation. Reachability decides whether a finding gets fixed or suppressed, and every detection method below turns on it.

## **How manual review, SAST, and SCA find vulnerabilities**

No single method finds everything, so a workable approach layers them, and relying on one leaves the gaps that show up in breach postmortems. SAST and SCA give automated breadth across first-party and third-party code. The third layer reasons about intent, the part automation has historically missed, and it can be handled by a human reviewer or, increasingly, by an AI coding agent.

### **Catch business logic flaws with manual review**

Manual review catches the class of flaw a scanner has no way to reason about, since it reads the code the way an attacker would. The core technique, which OWASP lays out in its [Secure Code Review Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Code_Review_Cheat_Sheet.html), traces untrusted input from entry to any operation it reaches. An AI coding agent can now run much of this same review, reading the surrounding code to reason about intent the way a human reviewer would, which is what makes the approach scale past the handful of files one person can read closely.

Business logic flaws are where review of intent earns its cost. Picture a checkout flow that applies a discount code without checking whether the order qualifies for it, so a shopper can stack the same coupon again and again and pay almost nothing. Every line is valid code, no scanner rule fires, and only a reviewer who knows how the feature is supposed to behave would catch it.

### **Scan first-party code with static analysis (SAST)**

Static application security testing, known as SAST, examines non-running source code at a scale manual review cannot match, using the taint and data-flow analysis that OWASP lays out in its [Static Code Analysis](https://owasp.org/www-community/controls/Static_Code_Analysis) reference. The strongest engines confirm a real path from source to sink rather than a bare syntactic match.

False positives are the well-known weakness of SAST. The tool cannot always tell whether data flowing through the application stays safe, so it errs toward flagging. A scanner that fires on every commit eventually teaches a team to ignore it. It also misses runtime issues like race conditions, so it stays one layer in the stack rather than the whole stack.

### **Track dependency risk with software composition analysis (SCA)**

Third-party code is its own attack surface, and software composition analysis (SCA) covers it by keeping a current inventory of the components you depend on. The 2017 Equifax breach exploited a common vulnerabilities and exposures (CVE) identifier, [CVE-2017-5638](https://nvd.nist.gov/vuln/detail/CVE-2017-5638), a remote-code-execution flaw in Apache Struts, and exposed roughly 147 million Americans' data from one unpatched component.

SCA runs through three moves that together produce findings you can act on:

- **Inventory every dependency:** Enumerate all direct and transitive packages so nothing inherited from a sub-dependency stays invisible. Tools like [OWASP Dependency-Track](https://owasp.org/www-project-dependency-track/) build that inventory from your manifests.

- **Match against known vulnerabilities:** Correlate each component and version against databases like the National Vulnerability Database to surface published CVEs.

- **Filter by reachability:** A basic scan flags every vulnerable component, even one your code never calls. Reachability narrows that to the findings on a path your application runs.

Skip the reachability step and SCA drowns a team in alerts for code it never executes.

## **How to find vulnerabilities across your codebase**

A repeatable workflow runs these detection methods as one continuous process instead of disconnected scans. Order the steps so each one narrows the work for the next, which leaves human attention for the spots automated steps could not reach. The sequence below is what the work settles into:

1. **Inventory the code and its dependencies.** Generate a Software Bill of Materials (SBOM) from your manifest files at build time, since every later step references it. NIST keeps a working definition in its [CSRC glossary](https://csrc.nist.gov/glossary/term/software_bill_of_materials).

1. **Run automated SAST and SCA for broad coverage.** Scan first-party source with SAST and third-party dependencies with SCA in the same pass, so both attack surfaces get covered before anyone reads a finding, which makes this step fast and deliberately noisy.

1. **Triage and prioritize what came back.** Combine severity scores, exploitation probability, reachability data, and where the affected code sits in your deployment. A payment-handling, internet-facing finding gets worked first, even above a higher-severity one nothing calls.

1. **Review the high-risk areas.** Point a human reviewer or an AI agent at the code that handles sensitive data, faces the internet, or carries findings the broad scans could not confirm. Business logic review and false-positive validation happen here.

1. **Remediate and route the rest.** Assign ownership with timelines calibrated to severity, and for upstream components without a patch, pin to a fixed fork or file the issue. Findings confirmed non-exploitable get documented, not suppressed.

1. **Shift the whole loop into the pipeline.** Wire scanning into the CI/CD pipeline so new vulnerabilities surface on every commit rather than every quarter, with pull requests gated on high and critical findings.

Run this on a schedule instead of once a year and you fix flaws while the code is still fresh, before they pile into a backlog measured in months.

## **Where AI coding agents fit into vulnerability detection**

AI coding agents earn their place at triage, the step that breaks every other approach. An agent that reads the surrounding code to judge reachability turns scanner output into prioritized work. Agents help most in a few specific places:

- **Cutting false positives through reachability:** An agent traces whether untrusted input can reach a flagged sink and drops the findings on dead paths. One study of the LLM-driven hybrid framework SAST-Genius cut false positives from 225 to 20 against Semgrep alone, roughly 91 percent, in its [published abstract](https://arxiv.org/abs/2509.15433).

- **Explaining exploitability:** Rather than returning a rule name, an agent shows why a finding is dangerous in your code, tracing the path from input to sink so a developer can confirm the risk in minutes instead of reverse-engineering the alert.

- **Drafting fixes alongside detection:** An agent can write a candidate patch and run the tests against it, so triage and remediation land in one pass.

Doing this on one finding is useful, but running it across a whole repository on a schedule is where a backlog actually shrinks. Work at that scale needs a system built to run agents on real codebases, not one developer driving a tool by hand. [OpenHands](https://openhands.dev/) is an open-source platform for building and running AI coding agents, and you can put one on a full scanner report so the unreachable findings drop out and a developer only reviews the risks worth fixing. Because it's model-agnostic, your team runs that triage on whatever model fits its cost and policy limits.

Agents have also started finding flaws nobody else had. Google's Big Sleep agent, built by Google DeepMind and Project Zero, used threat intelligence to find [CVE-2025-6965](https://thehackernews.com/2025/07/google-ai-big-sleep-stops-exploitation.html), a severe SQLite flaw known only to threat actors. They still fall short on business logic, the same gap rule engines have. A model can explain why an injection finding is exploitable and still miss a flaw that turns on what your product should charge a customer. Those checks stay with a reviewer who knows the domain.

## **How OpenHands runs vulnerability work across a repository**

Developers already point Claude Code, OpenAI Codex, or Gemini CLI at a single finding, and Cursor handles the fix from inside the editor. Confirming exploitability across a whole repository and shipping reviewable fixes at scale is a different job, the [outer-loop work](https://www.openhands.dev/blog/asynchronous-software-engineering-agents) that runs in the background rather than in one editor session.

Agent Canvas is OpenHands’s local-first interface, which runs the agent you already use via the Agent Client Protocol (ACP), so you keep your tools and subscriptions but point them at the whole repository rather than one file. From there the agent triages findings, confirms which of them are reachable, and opens a scoped fix PR for approval, which is the loop the [OpenHands Vulnerability Fixer](https://www.openhands.dev/blog/20260303-vulnerability-fixer) runs.

One developer's triage pattern does not have to stay local to that developer. The same workflow becomes a shared, scheduled scan-and-fix process that runs against the repository overnight on [OpenHands Cloud](https://app.all-hands.dev/). It then scales into the [Agent Control Plane](https://www.openhands.dev/enterprise) that security leads need for governance, with sandboxed execution, access controls, and a logged record of every agent action.

## **Put continuous vulnerability detection into your pipeline**

Staying ahead of security debt means treating detection as part of how code ships, not a periodic audit. SBOM generation, SCA, SAST, and agent-assisted triage on every commit catch a vulnerability in the pull request that introduced it, when the author still knows the code. That beats finding it months later, near the 252-day mark it now takes to clear half an application's flaws.

OpenHands meets you wherever you are, whether that's the open-source build locally, a free cloud workspace, or a self-hosted enterprise deployment. [Start your first fix](https://www.openhands.dev/pricing) on the path that fits your team.

## **Frequently asked questions about finding vulnerabilities in source code**

### **How should you find vulnerabilities in source code?**

Layering is the honest answer, since no single method reaches every part of the code. A workable approach pairs SAST and SCA for breadth, then reserves manual review and agent triage for the findings that need judgment. You can shape how an agent handles specific flaw classes with [keyword-triggered skills](https://docs.openhands.dev/usage/prompting/microagents-keyword).

### **Can vulnerability detection be fully automated?**

Most of it can be, with one consistent exception. Injection flaws, hardcoded secrets, and known dependency CVEs all automate cleanly through SAST and SCA, but business logic flaws still need a reviewer who knows what the application should do. An autonomous platform like OpenHands can clear the automatable findings end to end while routing the logic-heavy ones to that reviewer, a split you can wire up with the [OpenHands SDK](https://docs.openhands.dev/sdk).

### **How do agents reduce false positives in scanner output?**

Agents reduce false positives by reading context. A basic scanner flags a matching pattern wherever it appears, and an agent instead follows the data flow around it to drop the findings on dead paths. Since the platform is open source, your security team can inspect how that reasoning ran in the [OpenHands repository](https://github.com/All-Hands-AI/OpenHands) rather than trusting a black box.

### **Is it safe to let an agent fix vulnerabilities on its own?**

It is safe with the right gate in place. An agent that opens a scoped pull request for human approval keeps the speed of automated remediation without losing the review that catches what a model misses. OpenHands routes each agent's change through a [staged human review](https://www.openhands.dev/blog/vibe-coding-higher-quality-code), so someone with full context signs off before it merges.
