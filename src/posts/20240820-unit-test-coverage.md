---
title: "Using OpenHands to Improve your Test Coverage"
excerpt: "Here is a practical example of how OpenHands (Formerly OpenDevin) can improve your unit test coverage right now."
coverImage: "/assets/blog/placeholder.png"
date: "2024-08-20T08:00:00.000Z"
authors:
  - name: Tim O'Farrell
    picture: "/assets/blog/authors/tim.png"
    link: https://www.linkedin.com/in/tim-o-129b4364/
ogImage:
  url: "/assets/blog/placeholder.png"
---

There is a lot of conjecture and abstract articles out there about what AI may or may not be able to do for you. There is also a lot of FUD about how it is going to replace everybody and crash the economy.

Here is a practical example of how [OpenHands](https://github.com/OpenHands/OpenHands) (Formerly OpenDevin) can improve your unit test coverage right now. We are constantly improving the reliability and usability of this tool, so your mileage may vary!

## Background

I used an old side project for this: [Json Urley](https://github.com/tofarr/json-urley). This project converts json objects to / from readable url parameters compatible with OpenAPI. The actual intent of this project is not that important for this article - I chose this project because:

* It is quite small
* The objective is well defined in the project README
* It already uses linting and code coverage tools. The current coverage is 100% - every line of code is run by at least 1 test

## The Sanity Check

I began by using some standard prompts - I am sanity checking here as I want to be sure that the project does what I expect at each step:

![Please check out the repository https://github.com/tofarr/json-urley into the current workspace](/assets/blog/20240820-unit-test-coverage/sanity-1.png)

![Please describe what the json-urley project in the current workspace does](/assets/blog/20240820-unit-test-coverage/sanity-2.png)

![Please run the tests for this project](/assets/blog/20240820-unit-test-coverage/sanity-3.png)

## Now to do Something Useful!

I prompted the agent: `Please create additional tests for this project` - and it did! It created a new file with 8 additional unit tests.

![Please create additional tests for this project](/assets/blog/20240820-unit-test-coverage/useful-1.png)

When I went to run this, 2 tests failed - so the agent automatically created a patch to fix the errors:

![Please run tests for the json-urley project](/assets/blog/20240820-unit-test-coverage/useful-2.png)

## Resolution

At this point I decided I needed to move over to github to see what was going on. I created [a pull request including these changes](https://github.com/tofarr/json-urley/pull/2). The first thing I noticed is my automatic checks failed - I guess I need to run black and check my tests...

![Something is afoot...](/assets/blog/20240820-unit-test-coverage/useful-3.png)

It looks like the reason is the code snippet that the Agent wanted to merge into `query_str_to_json_obj`. The agent seems to have the impression that keys within the query string should be unique - and that is not the case!

![The Agent assumed that keys must not repeat - this is not the case!](/assets/blog/20240820-unit-test-coverage/useful-4.png)

 I removed this code snippet and the `test_conflicting_types` test case. That left me with 1 failing test - `test_unicode_characters`. **This is a actually valid case that I missed, despite my best efforts with multiple passes and coverage being 100%**!!! I had not considered how non English characters would be processed ("José" and "São Paulo"). Color me impressed. A small tweak and I am ready to merge the PR.

## Conclusions

My colleague Graham has written [a fantastic article describing levels of autonomy in automated systems](../20240801-levels-of-autonomy). My practical take away is that at present, we still need a human in the mix, but that tools like OpenHands can make that human more productive and catch things they missed. AI agents will not fully replace human engineers (Yet!), but any of us that aren't using AI Agents will be soon - if only to catch our potential mistakes and make us more productive.
