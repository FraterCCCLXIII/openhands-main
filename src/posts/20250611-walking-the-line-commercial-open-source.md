---
title: "Walking the Line with Commercial Open Source"
excerpt: "Navigating the challenges and opportunities of building commercial open source software, and how we're approaching it with OpenHands."
coverImage: "/assets/blog/20250611-walking-the-line-commercial-open-source/cover.png"
date: "2025-06-11T09:00:00.000Z"
authors:
  - name: Robert Brennan
    picture: "/assets/blog/authors/robert.webp"
ogImage:
  url: "/assets/blog/20250611-walking-the-line-commercial-open-source/cover.png"
---

I've been building commercial open source software for over a decade. I'd like to think I've figured out all the tricks, that I know how to do it perfectly, and give everyone—users, contributors, maintainers, employees, investors, customers—exactly what they want.

But different stakeholders have different needs. Even when they don't *directly* conflict with each other, you have limited time and resources. It's impossible to make everyone happy all the time.

So I'll share a few things I've learned about managing commercial open source, and discuss the approach we're taking with [OpenHands](https://github.com/OpenHands/OpenHands), our open source coding agent.

## 1. Be Honest

The worst mistake you can make is pretending there is no conflict.

There are two main sides to the conflict: the people who would rather everything be free (e.g. open source users), and the people who would rather everything generate revenue (e.g. investors).

Open source users are quite savvy. They'll know if you're sandbagging a PR because your worried it'll eat into your business. They'll know if you're ignoring their feature requests. They'll notice if your open source commits drop off as you shift priorities to the internal code base. They'll notice if you try to sneak in a phone-home or user analytics package.

So just tell them! "We've decided to close this PR because it will hurt the sustainability of the project" is a perfectly valid reply. When we realized we needed better intel about who was using OpenHands and how, we [opened an issue](https://github.com/OpenHands/OpenHands/issues/4533) about adding analytics, and started a discussion in Slack. (Surprisingly, were mostly supportive, especially when we made it opt-in.)

Similarly, you need to be clear with investors: the open source project is a very long-term investment. The ROI is not always obvious or easy to calculate. Investors will frequently be tempted to sacrifice a bit of community health for short term revenue.

Acknowledge this up front! Tell your investors what percent of the development team's time you expect to be spent on open source contributions and community management, and what percent will be spent on building commercial software (for us, it's about 50/50). Tell them what sort of functionality you plan to build for the community, and what you'll hold back. Tell them very explicitly what lines you're not willing to cross.

And make sure you're telling the same story to both sides! If your open source users are hearing one thing, and your investors another, you're setting yourself up for disappointment and disaster.

## 2. Communicate Value

It's important to remind both sides that they depend on each other.

At All Hands, we're lucky to have investors that understand the value of open source. They get that it leads to mass distribution and adoption. They get that everyone—from individual devs to big enterprises—would rather clone a GitHub repo than talk to a sales representative.

But sometimes investors think of open source as a "freemium" model: offer some crappy-but-free solution to hook people, then upsell. This is bad.

A great open source project isn't just a free tier. It's a self-sustaining community, a public domain good that can easily outlive the company that generated it.

It's that sense of participation in a Wikipedia-esque public mission, to build something [not just *gratis* free but *libre* free](https://en.wikipedia.org/wiki/Gratis_versus_libre), which fuels the growth of open source communities. You'll need to repeatedly remind investors of this.

Conversely, the community needs to understand the value of having for-profit investment behind the project. Maintaining a popular open source project takes an immense amount of work. Unpaid volunteers routinely burn out, leaving behind a diaspora of poorly-maintained forks.

We got pretty far with OpenHands in the early days, purely as a team of volunteers. Within a few weeks we'd replicated the main functionality of Cognition's Devin, and within a few more weeks we were topping the SWE-bench leaderboards.

But very quickly things became unsustainable. I was working 2-4 hours per day *on top of a full-time job*, mostly just responding to issues and giving feedback on pull requests. Any time I spent writing code was just refactoring the pile of spaghetti that inevitably emerges when 50 different people make large contributions to the same codebase in the same week. A planned beach vacation turned into me working ~4 hours per day, even on the weekend, just to tread water.

I started to burn out. And our stargazer count—a good proxy for how many people are interested in or using the project—started to trail off.

So I took a leap of faith and quit my job in hopes of saving the project. I couldn't have done that if I didn't believe there was commercial potential, with a steady paycheck waiting for me in the near future.

Once we [got some money in the bank](https://techcrunch.com/2024/09/05/all-hands-ai-raises-5m-to-build-open-source-agents-for-developers/), things started to get better. We brought on a couple full-time developers. And we hired an incredible community manager to handle the deluge of PRs and support requests.

Sure enough, the community responded to all that investment.

![This is what sustainable open source looks like](/assets/blog/20250611-walking-the-line-commercial-open-source/github-stars.png)

Your open source community needs to understand just how much having financial investment helps.

## 3. Draw a Clear Line

You need to communicate a clear vision for what belongs in your open source project, and what is part of your commercial offering.

With OpenHands, we want our open source project to be as valuable as possible for *individual developers* working on their laptop.

Commercially, we're developing features for *teams of developers* working together in the cloud.

This means that all of our research on code generation—the output of about 1/3 of our engineering team—goes directly into the open source. It means any developer can run a state-of-the-art coding agent, with whatever LLM they want, without giving their data to anyone. It means that academic teams can build on engineer-years worth of work to push the state-of-the-art forward, without getting anyone's permission.

But it also means that OpenHands, as an open source project, has some limitations. In particular, there's no built-in authentication or user management—OpenHands is only meant to run on your personal workstation. You'll need to buy our commercial product if you want more.

It's not a perfect line.

There are some small, non-commercial teams that'd like to use OpenHands in the cloud, but don't have the budget for a commercial license. We'll do our best to accommodate them. And we recently had to turn down a pull request that added a Helm Chart for deploying OpenHands into a Kubernetes cluster—even with all the warnings in the world, it'd set the wrong expectation.

Investors sometimes question our decision to put all our (very expensive) research into the open. They want to see intellectual property! We have to repeatedly remind them that this policy attracts academic contributions, and is the reason we have one of the [most accurate coding agents in the world](http://www.swebench.com/).

![SWE-bench leaderboard](/assets/blog/20250611-walking-the-line-commercial-open-source/swebench.png)

## 4. Repeat Yourself

People are constantly filtering in and out of your community. And as you grow, new investors and employees will come on board. And even folks who have been around since the beginning will forget exactly what the mission is.

So you need to constantly remind the community what it is you're building. What value are you offering as a public good, and how will you sustain that commercially? How will you navigate the tradeoffs and conflicts that inevitably come up? Where are the lines in the sand?

With OpenHands, we want to put state-of-the-art coding agents into the hands of every developer, for free, forever.

And to sustain that, we'll build commercial complements that enable *teams* of developers to collaborate with agents at enterprise scale.

I can't promise that this line will make everyone happy all the time. But it's our best shot at making sure the software development community gets a say in how the future of coding evolves.

*Check out [OpenHands on GitHub](https://github.com/OpenHands/OpenHands)! You can also see the README for links to our Slack and Discord communities.*