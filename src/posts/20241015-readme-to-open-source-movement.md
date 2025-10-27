---
title: "OpenHands: From README to open source movement"
excerpt: "OpenHands exists because our community willed it. Here’s how it all started."
coverImage: "/assets/blog/20241015-readme-to-open-source-movement/all-hands-founders-full.jpg"
date: "2024-10-17T08:00:00.000Z"
authors:
  - name: Ana Hevesi
    link: https://hachyderm.io/@anthrocypher
ogImage:
  url: "/assets/blog/20241015-readme-to-open-source-movement/all-hands-founders.jpg"
---

[OpenHands](https://github.com/OpenHands/OpenHands) exists because our community willed it. 

When Cognition AI launched their demo for Devin, they captured the imaginations of developers around the world—but it was also kind of scary. The future of development was here, and it was being built in a closed source walled garden. 

In response, developers and researchers around the world came together to build AI agents with an accessible UI, completely in the open. Their work together created the project we now call OpenHands. 

Here’s how it all started.

## Part 1: Answering the call

**Robert Brennan**: I came across the project after Googling “is [Devin](https://www.cognition.ai/blog/introducing-devin) open source?” and found the OpenDevin repo (before the rename to OpenHands) when it was still just a README. It was one paragraph of text saying “We're gonna build Devin, but open source.”

I saw Graham made a commit soon after that with a front-end, kind of mocking out what Devin looked like. I made one of the first PRs after that. Graham and I found each other in the community Slack pretty quickly, because we were the two of the first contributors. 

**Graham Neubig:** I saw the Devin demo online, I was interested in it, and then on Twitter I saw that this OpenDevin project existed. I had been doing research in the area, like Xingyao had, and so I was interested. I saw that it had a ridiculous number of stars on GitHub despite only having a README. That indicated to me that people were very interested in this.

**Xingyao Wang:** When Devin first came out, I was depressed for a night. I was having trouble sleeping. I was like, "Oh, what am I gonna do for my PhD?" because Devin wasn't supposed to be my goal until the fifth year of my PhD. Suddenly, Devin just came out, and the demo looked amazing.

I was sitting in front of the Devin demo for an hour to decipher the prompting mechanism behind the scenes. Then, I wrote 14 tweets in a Twitter thread. Before I clicked send, Twitter crashed.

I said, OK, I should go to bed. I woke up the next morning, and my friend messaged me, saying, "Hey, somebody is building OpenDevin." Since my research is in this area, why not just do it in an open source way?

**Graham:** So I think [Junyang Lin](https://github.com/JustinLin610) and [Binyuan Hui](https://github.com/huybery) (who started the project) were like, “OK, let's write out an architecture diagram, let's create a plan, let's execute on this.”

I said, “Or I could use Claude and come up with an interface that looks like Devin tonight and put it online and then people can start working on it. And so I talked to Junyang and Binyuan and they said, “OK, yeah, let's do this.”

**Xingyao:** One of the biggest pains I had in the past was when you started a research codebase, but nobody else was using it. After six months, it's no longer useful because something new came out, and your old code, which no one is using, is not caught up with the latest state-of-the-art. So, why not take this opportunity to integrate my past research into this open source project and then turn it into something useful to people so everyone can help maintain it.

## Part 2: Catching the energy

**Graham:** I also had the experience of having been in a couple of startups before this and I knew that when you're in a situation like this, you need to have momentum, you need to take advantage of the fact that lots of people are interested.

**Robert:** I was supposed to be on vacation the first week or so that we had a working MVP and everybody was rushing in to use it and find it and try it.

We got [featured](https://www.producthunt.com/products/opendevin#opendevin) on Product Hunt while I was on vacation... And it was actually kind of fortuitous that I was on vacation. Because I didn't have any other responsibilities to take care of and I could just focus on helping folks out through navigating the open source project. 

**Robert:** There wasn't as much of an existing set of maintainers, nobody really had responsibility over the project. It was kind of Wild West.

It was a lot of responding to issues, making sure people felt like their voice was being heard. Helping PRs get merged was a big one because it was early days, everything was moving quickly. So making sure that PRs were getting attention and getting merged and getting good code review was a big piece of it. I think that helped a lot of different people feel invested in the community. 

## Part 3: Research \+ product

**Robert:** Starting with the front end, something that's visual, something that people can look at, just feels more real even if it's not doing anything yet. I think that helps the community really look at you like, “Oh, I can see where this is going,” right? 

**Graham:** Yeah, we needed something to get started with, and probably anybody could have come up with an initial interface but there was a difference between somebody doing it in two weeks and somebody doing it today.

I think researchers tend to want to do it in two weeks.

People in startups tend to want to do it today.

I felt like I could connect with the researchers like Junyang and Binyuan, which is super important because we needed those types of people to build good agents.

This would have never succeeded without Xingyao being interested in the project. But on the other hand, having an interface and something that people can play around with is also important. So, yeah, it's all important.

**Robert:** I think that's also against the grain of the research side where folks might have been more interested in starting with an agent that can just operate via an API or via a CLI.

Starting with something visual was smart.

Another helpful thing for us was that we had the Cognition demo video, so everybody had in their minds what was possible. Everybody knew where to push and what features to implement.

**Robert:** We also had a designer, Paul Bloch, who's still working with us, come pretty early and actually mock up what he thought it should look like. He did an amazing job and I think that also having that visual North Star was really helpful.

## Part 4: Making a company

**Robert:** VCs started reaching out to us within a week or two of things starting to take off. I think it was pretty clear to us like, “Oh, there's something going on here.” So the the idea was put in our heads pretty early on.

**Robert:** The three of us talked about it along with the 3 other folks (Junyang, Binyuan, and [Bowen Li](https://github.com/libowen2121)) who were early on in the project. I had a 1-1 conversation with basically all six of the different folks who invested early on in the project to gauge how interested they were in starting a company. 

**Robert:** Graham was in 100%.

Xingyao took a little bit of convincing, because he was in the middle of a PhD program. And that was a little bit of a scary jump.

The other folks have wonderful careers at Alibaba and a research lab in China. So they're like, “We’re happy where we're at.” But yeah, the three of us I think saw the potential here to really bring this technology to a much wider audience, and were really excited to start a company.

## Part 5: Why OSS?

**Robert:** I've been working in open source for a decade and I very much want the tools that I adopt to be open source as much as possible.

I like the idea that I own and control the software that I'm building into my life.

So, I'm bought into the open source ethos, especially for something that's this important of a technology. As a developer, I want whatever tool I adopt for enhancing my development workflow with AI to be open source.

But also at a social level, I just think that the technology is too powerful to be held in a closed source way by a single entity.

**Graham:** A lot of the progress that is going to go on here is going to be either done in a cloistered way within 50 companies 50 times, and they'll all do it in slightly different ways, some will be slightly better than others, but it seems like a lot of duplicated effort. 

Or as a whole open source community, we can come together once, build it once and have 1 thing that we all agree on and use. And that includes people in academia who are very interested in doing research. 

It also includes people in various varieties of industry that don't want to be building something like this from scratch, but still would like to have something that they can deploy locally and have transparency and control into.

My belief is that that's also just a good decision for making the best software. We can provide tools for other people to do the research they already want to be doing and make the changes they already want to make. We won't have to duplicate effort 50 times, we can build it together.

**Xingyao:** For doing research, reproducibility is really important. I'm skeptical about work where the results are so great, but you can't access the code to reproduce it.

Another advantage of open-source comes when you make a mistake; someone in the open-source community runs your code and helps you catch those bugs. I hope building things in the open becomes the new default, ensuring everybody can run your code, reproduce your results, and point out errors.

**Robert:** I think good science is, by definition, open.  
