---
title: "8 Use Cases for Generalist Software Development Agents"
excerpt: "Exploring practical applications of generalist software development agents in real-world scenarios, with example prompts and use cases."
coverImage: "/assets/blog/20250116-use-cases-for-generalist-software-development-agents/header.png"
date: "2025-01-16T12:00:00.000Z"
authors:
  - name: Graham Neubig
    link: https://phontron.com
    picture: "/assets/blog/members/graham-neubig.jpg"
ogImage:
  url: "/assets/blog/20250116-use-cases-for-generalist-software-development-agents/header.png"
---

# 8 Use Cases for Generalist Software Development Agents (w/ Prompts)

We are developing [OpenHands](https://github.com/OpenHands/OpenHands), an agent for software development that has the ability to write code, execute code, and browse the web. It is very general and can do a lot of tasks, which is a double-edged sword:

* On the **plus side**, this makes the agent framework very powerful, and once you learn how to use it you can do most anything.
* On the **minus side**, it means that sometimes we've found users to be at a loss of how to start using it.

This blog post is meant to showcase some great use cases that we've found for OpenHands and provide some sample prompts that we have used. We'd also like to point out that OpenHands has a flexible framework for prompt customization using ["microagents"](https://github.com/OpenHands/OpenHands/tree/main/microagents), and some of these tasks are available as micro-agents within OpenHands itself as well.

Let's see what a generalist software development agent can do, and how to skillfully prompt it to do a good job!

## Fix Bugs

All non-trivial software has bugs, and we want to squash them when we can find them. Here's [an example of a bug from OpenHands](https://github.com/OpenHands/OpenHands/issues/4480) (where LLM requests being blocked by CloudFlare caused the agent to make many futile retries) that we fixed using the OpenHands agent, resulting in [this pull request](https://github.com/OpenHands/OpenHands/pull/4482).

OpenHands has the ability to view github issues through the github API, browse the file system, and run code so when I want to fix a bug with OpenHands, I will often first select the repo that I'm working on, then give it a prompt like the following:

```
Please use the github API to read this issue:
https://github.com/OpenHands/OpenHands/issues/4480

Diagnose the problem, and fix it according to the following procedure:
1. Explore the codebase to find a likely location where the problem is occurring
2. Install the project dependencies using `INSTALL_DOCKER=0 make build`
3. Write a test that should fail if the problem is not addressed
4. Run tests according to the `py-unit-tests.yml` github workflow to make sure
   that this newly written test fails as expected
5. Fix the issue, and re-run tests to confirm that the tests now pass
6. If everything is working and you are confident you fixed the error, send a PR
   to the GitHub repo
7. Wait 90 seconds and then use the GitHub API to check if github actions are
   passing. If not, fix the errors
```

Let's break this down a bit, it is in several steps:

* **Bug Localization**: In step 1, we asked the agent to find the place to modify. It will do this by using search tools like find and grep to try to identify the appropriate location in the codebase.
* **Environment Setup**: Step 2 initializes the project environment by installing dependencies. Of course the instructions will be a little different for your own project.
* **Test-driven Development**: [TDD](https://en.wikipedia.org/wiki/Test-driven_development) is a practice where you develop tests first and then do implementation afterwards. In general it's a good practice for human developers as it lays out expectations and makes for fast iteration cycles, but unfortunately human developers don't really like writing tests, especially beforehand. Fortunately, agents have no such issues, so in step 3 and 4 we have them reproduce the error in tests first and then fix the bug.
* **Implementation and Testing**: In step 5, we ask the agent to fix the issue and confirm that everything works. Often the agent will go through several iterations here before getting a good working implementation.
* **Pushing to Github**: In step 6 we have the agent open a PR to github for human review.
* **Checking and Fixing CI**: One thing that developers often *hate* to do is fix up failing CI actions. Fortunately agents can do that for you too! The agent can monitor github actions, see if any are failing due to the PR, and go in and fix them autonomously until they pass.

## Implement Features

In addition to squashing bugs, you also often want to implement new features. Here's [an example of a feature](https://github.com/OpenHands/OpenHands/pull/5807) that was implemented by the OpenHands agent – tooltips for a sidebar in the OpenHands app. When implementing features, it's reasonable to use a prompt pretty similar to the one we use for fixing bugs, for similar reasons:

```
I would like to implement tooltips for the sidebar in our web app.

1. Explore the codebase to find the place where the sidebar is located
2. Install the project dependencies using `INSTALL_DOCKER=0 make build`
3. Write a test to verify tooltips appear when mousing over sidebar elements
4. Run tests according to the `py-unit-tests.yml` github workflow to make sure
   that this newly written test fails as expected
5. Implement the tooltips, and re-run tests to confirm that the tests now pass
6. If everything is working, send a PR to the GitHub repo
7. Wait 90 seconds and then use the GitHub API to check if github actions are
   passing. If not, fix the errors
```

## Create Programs from Scratch

While the two above use-cases are for improving apps that already exist, sometimes you want to build an app from scratch. This is also possible with OpenHands. The easiest way to do this is to create an empty github repo with just a README, open it, and then put in a prompt describing the app that you want to create. Here are a couple of examples from things I've created recently.

A [frontend app for viewing github PRs](https://github.com/OpenHands/OpenHands/pull/5807):

```
I want to create a React app to view open pull requests across my team's github
repos. Here are some details:
1. Please initialize the app using vite and react-ts.
2. You can test the app on the https://github.com/OpenHands/ github org
3. You can use the GITHUB_TOKEN environment variable to test the app
4. It should have a dropdown to select a single repo within the org
5. There should be tests written using vitest

When things are working, commit the changes and send a pull request to GitHub.
```

A script for sending emails via resend.com:

```
Read the resend.com API docs and create an email script. The input will be a CSV
file with an "email" field and other fields. The subject and body will be
provided via jinja2 templates. Write and run mocked tests with pytest.
```

One thing to note here is that I always ask the model to write tests and execute them to make sure that it works. This is good test-driven development practice, as I mentioned before, but also makes it fast for the agent to iterate and fix any syntax or logic errors involved without having to give the agent credentials or access to real data.

## Fix Failing Continuous Integration

One task that software engineers dread is fixing failing continuous integration tests like these ones:

![Failing CI Tests](/assets/blog/20250116-use-cases-for-generalist-software-development-agents/image1.png)

The reason why this is so annoying is because often you need to fix the issue then push to github, see that it's not passing, click through the interface, read the logs, fix the issue, push again, etc.

OpenHands has actually been pretty revolutionary for me in this department, because you can just ask it to do this process for you with a prompt like the one below:

```
Please pull the branch add-japanese-translations associated with
https://github.com/OpenHands/OpenHands/pull/6070

Github CI actions are failing on the most recent version of this branch.

Please use the Github API to understand what is going wrong, and then follow the
corresponding Github workflow step-by-step locally to reproduce the error. Once
you have done so, please fix the error and ensure that the workflow should pass.

Once it is passing locally, push to the branch on Github, wait 90 seconds, then
check to see if the workflow has passed.
```

More than half of the time, this solves my problem and I don't have to fix tests myself!

## Fix Merge Conflicts

In addition to fixing continuous integration, another *huge* pain is fixing merge conflicts, where someone else has pushed to the main branch but it conflicts with your own files. Fortunately, OpenHands is pretty good at fixing these too, here's an example:

```
Please pull the branch add-japanese-translations associated with
https://github.com/OpenHands/OpenHands/pull/6070

There are merge conflicts with main. Run git merge main and fix the conflicts
appropriately. Then check the ".github/workflows" directory for unit testing
workflows and run them locally to verify nothing is broken.

Once it is passing locally, push to the branch on Github, wait 90 seconds, then
check to see if the workflow has passed.
```

This is another huge developer pain that agents can really help with!

## Write Documentation

Another task that all developers know needs to be done but often gets overlooked is writing documentation. It's pretty simple to request that OpenHands write documentation for you, and it's usually pretty good at creating a first draft.

```
Please read the code in the `microagents` directory and create a high-level
overview of its contents in `microagents/README.md`. Send a PR with the changes.
```

## Perform Deployments

For many, building frontend and backend apps is a lot of fun, but the fun stops when you have to actually deploy this app to the cloud. OpenHands can help with this too! I have used OpenHands to help with deployments in two ways.

First, you can use OpenHands to directly call cloud APIs to bring up a machine. For instance, when I wanted a GPU machine to use I just said:

```
Please create a GPU instance on AWS with the deep learning AMI and provide login
credentials via private key.
```

As anyone who has done this through the AWS UI before can attest, this sort of thing requires a *lot* of clicks and can be a major time sink.

Another option for performing deployments is to use *infrastructure as code*, where you specify the type of infrastructure you want as code, and execute the code to actually create the infrastructure. One common language for specifying infrastructure as code is [Terraform](https://www.terraform.io/), which is a very nice and powerful language, but also requires learning somewhat esoteric syntax. Fortunately, OpenHands is also pretty good at writing this code, so you can ask something like this:

```
Write Terraform code for a GPU instance on AWS with the deep learning AMI. Run
`terraform plan` to preview the changes.
```

One big caveat to this is that bringing up cloud machines has serious implications for security, cost, etc., so before using this sort of technique in a production setting, the code should be carefully vetted by an experienced and responsible developer.

## Perform Data Analysis

Finally, OpenHands is quite useful at performing random data analysis tasks. Here's an example where we wanted to see the number of commits and unique contributors to the OpenHands repo by week, including how frequently OpenHands itself has contributed to its own repo.

This was very easy to do with the following prompt:

```
Please clone https://github.com/OpenHands/OpenHands and create a line chart
showing weekly statistics:
1. The total number of commits
2. The number of unique contributors
3. The number of commits by a contributor that has "openhands" in their name or
   email address
```

And here is the resulting figure!

![Data Analysis Results](/assets/blog/20250116-use-cases-for-generalist-software-development-agents/image2.png)

## Conclusion

This blog post covered 8 common use cases where we've been using OpenHands a lot and found it to be pretty valuable. There are others of course, we have heard reports of using OpenHands to run machine learning experiments, create presentation slides, and do many other things as well!

But hopefully this gets you a good idea of some tasks that you can start out with, and hopefully accelerate your software development process! If you'd like to try out OpenHands, please download the open source repo, or sign up for our online app:

* Open Source: [https://github.com/OpenHands/OpenHands](https://github.com/OpenHands/OpenHands)
* Online App: [https://app.all-hands.dev](https://app.all-hands.dev)