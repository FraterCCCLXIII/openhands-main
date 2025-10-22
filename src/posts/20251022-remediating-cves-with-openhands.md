---
title: "Remediating CVEs at Scale with Agents"
excerpt: "While developers adapt to terminal-based agents, forward-thinking organizations are automating CVE remediation at scale. Learn how OpenHands enables teams to tackle millions of vulnerabilities with AI-powered agents, custom dashboards, and cloud-based automation."
coverImage: "/assets/blog/20251022-remediating-cves/cover.png"
date: "2025-10-22T12:00:00.000Z"
authors:
  - name: Robert Brennan
    picture: "/assets/blog/authors/robert.webp"
ogImage:
  url: "/assets/blog/20251022-remediating-cves/cover.png"
---

While individual developers are still getting used to running agents in their terminal (e.g. Claude Code or the OpenHands CLI), the most advanced AI adopters are using agents to build scalable automation using agents. We've seen folks use OpenHands to react to errors in Datadog logs; to automatically and intelligently pick the best reviewer for a given PR; and to keep their docs up-to-date.

But one of the highest-impact automations we've seen is around remediation of CVEs (common vulnerabilities and exposures).

## Why do CVEs matter?

Software is rarely (never?) bug-free. Novel exploits are found every day—and many of these exploits occur in widely-used libraries, utilities, and operating systems.

`cURL` is a good example here—despite being a reasonably small (180 kLOC), self-contained (few dependencies), and stable (not many new features), [dozens of new vulnerabilities are reported each year](https://app.opencve.io/cve/?vendor=curl)! And that's just one tiny corner of the open source ecosystem driving every production workload in the world.

Mature organizations track publicly-reported vulnerabilities, via aggregators like [NIST's National Vulnerability Database](https://nvd.nist.gov). They can cross-reference these databases with their code using Docker image scanners like [Trivy](https://trivy.dev/latest/), or through static analysis tools like [Dependabot](https://docs.github.com/en/code-security/getting-started/dependabot-quickstart-guide). Every time a new CVE comes out, they jump on it and get it solved, ensuring their codebase stays completely free of known vulnerabilities.

Just kidding! Keeping your codebase 100% CVE-free is a Herculean task—arguably an impossible task. Every organization has a heaping backlog of unsolved CVEs.

The key is to track and triage: make sure the most severe CVEs (according to their [CVSS score](https://en.wikipedia.org/wiki/Common_Vulnerability_Scoring_System)) get addressed ASAP, and put the rest into a backlog the team can take down over time.

## CVEs as Toil

Getting a CVE solved is not always trivial. It's a fairly rote, tedious process, but not easily automated—at least not without AI!

The workflow looks something like this:

- Identify the CVE and the source package
  - A scanner like Trivy will give you this info
- Figure out if there's a fix available in a newer version of the package
  - Scanners will often include this information as well!
- Find where inside your codebase or build process the package is being pulled in
  - It could come from a few different places:
    - Your base operating system
    - A package installed on the OS
    - An app-level dependency
    - A *transitive* app-level dependency
    - Somewhere else
- Decide if you really need this package, or if it's an unused dependency
  - If it's unused, remove it
  - If it's being used, upgrade to the fixed version
- Test the code to ensure everything still works as expected
  - Hopefully your CI pipeline is enough to give you confidence here
  - You may need to alter other dependencies or modify your application code if there are breaking changes in the update
- Merge and re-scan!

I've lost entire days to the above process, after being handed a critical-level CVE that needed to get squashed.

This isn't how developers want to spend their time! We want to build new things, not toil away hunting down dependency issues.

Fortunately today's agents are extremely capable of tackling this workflow.

## Prompt to Fix

Here's a prompt you can pass to an agent that'll address an existing CVE:

**Your job is to solve CVE $CVE_ID in this repository. DO NOT spend time fixing other CVEs.**

First, verify that you can spot $CVE_ID by building the Docker image in this repository and scanning it with trivy.

Next, determine whether the vulnerable package is being used—either directly by the application, or by a transitive dependency. If it's possible to remove the package without breaking the application, do so.

Otherwise, upgrade the package to the fixed version as reported by trivy.

Then run the tests in this repo. If any of them fail, make sure it's because of the upgraded dependency, then work to fix the codebase. You may need to make code-level changes or upgrade other dependencies. Keep your changes minimal.

Finally, re-build and scan the docker image to ensure the vulnerability is gone.

Once everything looks good, push your changes and create a pull request. The title of the pull request should be of the form `Fix CVE: $CVE_ID` and the description should include a very brief description of the changes you've made to accommodate the fix

## Prompting at Scale

This alone saves a bunch of time. But, if you're still working with a local, CLI- or IDE-based agent, you'll need to babysit the agent as it works, and can probably only handle one or two at a time.

But the biggest organizations have backlogs with literally millions of CVEs—we need a solution that scales!

Fortunately, API-driven, cloud-based agents like OpenHands can help. You can run dozens or hundreds of agents concurrently, each working to fix an individual CVE.

Of course, you still need a human in the loop! But with the right tooling and monitoring, one person can tackle dozens of CVEs at a time.

### Designing a Custom Solution

What's tricky is that every enterprise has its own way of triaging and remediating CVEs. You might want each team to handle their own CVEs, with a global dashboard showing which teams are doing the best. Or you might have a tactical team responsible for squashing CVEs across the entire codebase, and only need each individual team to approve the fix PRs.

Fortunately, the OpenHands Cloud Agent SDK allows you to quickly create custom experiences that leverage cloud coding agents at scale.

As an example, here's a vibecoded prototype that uses the OpenHands SDK to:

- Generate a list of know vulnerabilities across all our GitHub repos
- For each vulnerability, we can:
  - Start a new OpenHands conversation to fix the vulnerability
  - See the agent's status (working, finished, errored)
  - See the resulting PR's status (CI running, CI successful, CI failed)
  - Restart the agent if CI failed

![CVE Remediation Dashboard](/assets/blog/20251022-remediating-cves/dashboard.png)

An engineer can move through at their own pace, kicking off dozens of conversations at a time, getting the easiest fixes merged and iterating on the tougher ones. At any point they can drop into the corresponding OpenHands conversation, see where the agent might be getting stuck, and give it some additional instructions beyond our boilerplate prompt.

This might not be exactly the right experience for your organization. But we live in the era of vibecoding—you can easily create your own internal application that uses the OpenHands Cloud Agent SDK to operate coding agents at scale.

## The Future of Agents

Looking at our own use of OpenHands, and especially the patterns being established by our power users, it's clear to us that local agents running in CLIs and IDEs are a stop-gap, a way for engineers to get used to agents in a familiar environment.

Over the next year, we expect the bulk of coding agents will be running in the cloud, each with their own sandbox and security policy. This will be particularly helpful in addressing tech debt and maintenance tasks, where there's a heavily repeatable workflow the agents need to follow.

We're already seeing organizations use OpenHands like this—leveling mountains of tech debt with only a few highly-skilled agent engineers. It's incredible being at the forefront of agent-driven development, and we're excited to see how our users put OpenHands to work next!

*Interested in tearing down your tech debt? OpenHands provides a [Cloud Agent SDK](https://github.com/All-Hands-AI/agent-sdk/), a Refactor Kit, and other purpose-built tools for code maintenance at scale. Check out [our GitHub repos](http://github.com/all-Hands-AI/) or [get in touch with our research team](mailto:contact@openhands.dev)!*
