---
title: "Velocity Is Dead: AI-Generated Compilers and the Future of Software"
excerpt: "What really matters in a world where velocity of code creation is no longer the bottleneck in software engineering?"
coverImage: "/assets/blog/20260219-velocity-is-dead/gopher-jetpack.png"
date: "2026-02-19T12:00:00.000Z"
authors:
  - name: Ray Myers
    picture: "/assets/blog/authors/ray.png"
ogImage:
   url: "/assets/blog/20260219-velocity-is-dead/gopher-jetpack.png"
---

*This post by OpenHands Chief Architect Ray Myers reflects on what really matters in a world where velocity of code creation is no longer the bottleneck in software engineering.*

This month Anthropic made headlines by [generating a C compiler](https://www.anthropic.com/engineering/building-c-compiler) using coding agents to showcase their new Opus 4.6 model. Their compiler weighs in at 100K lines of Rust, and compiles some large existing applications such as the Linux Kernel and DOOM. They report the creation process as “mostly” unsupervised, costing $20,000 in tokens.

The industry [reaction](https://betterstack.com/community/guides/ai/anthropic-ai-agents-c-compiler/) was immediate: velocity, scale, possibility - even despite some important caveats being pointed out.

To be clear, it *is* impressive. Something real has shifted over the past year.

As luck would have it, at the same time they were working on that, I was also [generating a C compiler](https://github.com/raymyers/ralph-cc-go) in preparation for our [Ralph Wiggum webinar](https://luma.com/openhands-webinar-26feb26). My version weighed in at 40K lines of Go, and was less complete, having cost 1% of the price to create. Just $200 gets you past Hello World!

I used the OpenHands agent with Anthropic's previous model Opus 4.5, the [CompCert](https://compcert.org) verified compiler as design reference, and the [csmith](https://github.com/csmith-project/csmith) testing toolkit.

It's mind-boggling that we're able to create codebases of this size with so little intervention, but what both of these examples have in common is that they are *not actually useful* for any practical purpose.

So the real question is:

What are we actually celebrating?

[Cursor’s recent demos](https://cursor.com/blog/scaling-agents) are similarly impressive as they are bewildering. An almost browser. An almost spreadsheet. Millions of lines of broken code.

So much velocity, yet nothing was delivered.

I don't mean to criticize their experiment just by plainly stating what it is. My goal here is to encourage some equally audacious experiments in *quality* as those we're seeing in *quantity*. Quantity is well on the way to being a solved problem - an outdated benchmark.

Software should work.

# The shape of progress

While skepticism is healthy, I’m not here to say “nothing has changed.” A lot has changed. We are paving the way to transform how software is delivered. We don't need to exaggerate. The value of coding agents is strong enough as it is.

Even the 2023 levels of AI code generation were very effective in some domains, adopted by millions of developers. The next year, autonomous agents including OpenHands took things to the next level. As model providers began training with agents in mind, performance shot up again.

We use these tools and feel power in our hands. The question is how to apply it.

- How do we express our intent?
- How do agents navigate existing code?
- How do we validate changes without creating QA bottlenecks?

There's a lot to figure out, but we’re not starting from scratch. These concerns are part of the very physics of software engineering. They’ve just been amplified.

# Continuous Delivery as the leverage point

Will agents be a force multiplier for your teams or will they produce lopsided results that expose other bottlenecks? We can describe this difference as the "agent readiness" of a codebase or development lifecycle. Since it requires the ability to ship frequent changes safely, agent readiness aligns closely with the practices that support Continuous Delivery.

Consider this prerequisite for Continuous Delivery as defined in [Minimum Viable CD](https://minimumcd.org/):

> The pipeline decides the releasability of changes. Its verdict is **definitive**.

In a true CD pipeline, automated checks give us high confidence that our changes are safe. Teams that want to consistently ship faster invest in tests, modular architecture, type-safety, and static analysis.

The shift-left philosophy not only makes it easier for us to be confident in agentic contributions at release time, it also helps agents run more effectively by providing environment feedback, also known as [back pressure](https://ghuntley.com/pressure/).

## Why compilers are a best-case

The need for testability gives us a hint at why coding agents are fairly successful at generating compilers. Every pass of a compiler is a *pure function*. We have well-defined inputs and outputs, and there are no other interactions. This makes them extremely easy to test. All the better if we have a reference compiler to use as an oracle.

If your needs are "compiler-like" in that way, which is to say you are in a well-understood domain with simple interaction points and a bulletproof testing strategy… then yes, perhaps software is becoming "free". Radically cheaper at least.

## What about everything else?

Unfortunately, most enterprise systems are nowhere near this ideal case. They have complex interactions and are difficult to verify. Their behavior isn't fully understood and the automated testing is far from complete.

While it's helpful to understand what the best-case looks like, we can't limit ourselves to the easy terrain. We want to unlock the most value, gaining momentum where it can do the most good.

We can breathe life back into legacy systems in the classic ways. Backfill missing tests. Isolate logic from side-effects. Capture the understanding of the current behavior in ways that people and agents can use. These are not AI techniques, though you will find AI can speed up the process.

# Velocity is dead

One thing should now be abundantly clear: *More output will not make you stand out.*

* We measure output
* We reward output
* We dashboard output

So of course AI maximizes output. We get what we ask for. Yet as output becomes abundant, having more of it stops creating an advantage.

This dynamic is nothing new in the industry. We've been here before. We mistook velocity for progress. We mistook code production for the bottleneck.

We're about to feel the weight of that misalignment even more intensely than before. Some of us already are.

Our misconceptions have been given jetpacks.

Sure, I've gotten agents to churn out huge codebases in a weekend, but I'm not going to stand proudly in front of piles of junk. I'm prouder of my more humble agentic creations of just a few thousand lines, high-quality and addressing real needs.

In a world where software that *almost* works is free, a product that works - and a process that works - will be what sets you apart.

Make what matters, and make it well.

Velocity is dead. Long live delivery.
