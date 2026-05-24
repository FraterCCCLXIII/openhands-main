---
title: 'SOTA on SWE-Bench Verified with Inference-Time Scaling and Critic Model'
slug: sota-on-swe-bench-verified-with-inference-time-scaling-and-critic-model
redirectFrom:
  - 20250416-inference-time-scaling-sota
excerpt: 'OpenHands now tops the SWE-Bench Verified leaderboard! By training a critic model to select the best solutions from multiple agent attempts, we''ve significantly improved performance on real-world programming tasks.'
coverImage: /assets/webflow/misc/6914ea781d6d5cf27100d131_6914ea769e3520100138ff4d_inference-time-scaling-fig.png
coverAlt: 'Cover image'
date: '2025-04-17T12:00:00.000+00:00'
authors:
  - name: Xingyao Wang
ogImage:
  url: /assets/webflow/misc/6914ea781d6d5cf27100d131_6914ea769e3520100138ff4d_inference-time-scaling-fig.png
seoTitleDate: 'Nov 12, 2025'
---
We're thrilled to announce that OpenHands has reached a new milestone, achieving state-of-the-art results on SWE-Bench Verified!

![OpenHands Performance on Leaderboard](/assets/webflow/blog/20250416-inference-time-scaling-sota/leaderboard.png)

## SWE-Bench and OpenHands

to verify they have appropriately scoped unit tests and well-specified issue descriptions.
Due to its realism and the potential vast benefits of AI agents that could autonomously solve real-world software development challenges, it is used widely throughout academia and industry as a gold-standard for measuring the abilities of AI coding agents.

open-source software development agent, and its performance on this dataset is currently at 60.6% - not too shabby!
But we wondered, what happens if we really push the limits?

## Inference-Time Scaling: More Compute, Better Results

Our approach leverages a simple but powerful idea: for challenging software engineering tasks, trying multiple solutions and picking the best one can lead to better outcomes. Here's how it works:

This method of inference-time scaling lets us achieve substantially better results without modifying the underlying agent model and scaffold.
We observe log-linear performance improvement from 60.6% on a single trajectory rollout to 66.4% with five attempts, which will make

![OpenHands Inference-Time Scaling Result](/assets/webflow/misc/6914ea781d6d5cf27100d131_6914ea769e3520100138ff4d_inference-time-scaling-fig.png)

## Building a Better Critic

This idea of using choosing the best of multiple solutions has been tried by other SWE-bench submissions, but these strategies were generally based on prompting an existing model like Claude.
Rather than using this prompt-based reranking strategy, we trained a dedicated critic model, which we found provided more effective results.

For the training process, we:

- Roll out agent trajectories from

 to avoid data leakage

- Implement a temporal difference (TD) learning objective to propagate trajectory-level success signals from unit test execution backward through each trajectory

- Add a regression head on top of the last layer to predict reward values

The TD learning objective is particularly powerful because it helps the model understand which actions contributed to the final outcome:

$$
r*t = \gamma r*{t+1}
$$

Where $r*t$ is the reward at time step $t$ (i.e., the t-th action produced by agent), $\gamma$ is the discount factor. The process starts with the final reward $r*T$ which is determined by running the unit tests on the completed solution - 1 for passing all tests and 0 for failing. This terminal reward is then propagated backwards through the trajectory, with each previous step discounted by $\gamma$. We use $\gamma=0.99$.

We use [veRL](https://github.com/volcengine/verl) to finetune [Qwen 2.5 Coder Instruct 32B](https://huggingface.co/Qwen/Qwen2.5-Coder-32B-Instruct) as a critic model. During inference, we use a [modified version of vLLM](https://github.com/xingyaoww/vllm/tree/add-token-classification-support) to serve this model for evaluation (fun fact: OpenHands agent itself wrote most of the functional [code](https://github.com/vllm-project/vllm/compare/main...xingyaoww:vllm:add-token-classification-support) there).

We're making the critic model [publicly available on huggingface](https://huggingface.co/all-hands/openhands-critic-32b-exp-20250417) for researchers who want to explore its capabilities or build upon our work.

## Why We Built a Critic Model and Where It's Going

We chose to invest in a trained critic model for several reasons:

**Genuine usefulness through generalization**: While prompt-engineering-based reranker can help boost benchmark scores, real-world generalization is not easy to guarantee. We believe with sufficient data, a trained critic model could generalize to diverse software engineering scenarios beyond SWE-Bench. This makes it a valuable tool for solving real-world problems in everyday coding tasks.

: While our current implementation focuses on selecting the best complete solution from multiple trajectories, the intermediate rewards predicted throughout each trajectory opens up exciting possibilities for enhancing our agent's capabilities.
-
).
-

We're actively working on integrating these signals more deeply into the OpenHands agent experience, which could enable more efficient assistance even in scenarios where generating multiple complete solutions isn't practical.

## Try OpenHands Today

Besides being state-of-the-art on SWE-Bench Verified, OpenHands is also a top-performing agent on [LiveSWEBench](https://liveswebench.github.io/), a contamination-free benchmark for AI software engineers. Additionally, OpenHands ranks first on [Multi-SWE-Bench](https://multi-swe-bench.github.io/), a variant of SWE-Bench that evaluates across 8 different programming languages.

Overall, we feel confident in saying that OpenHands is the best agent out there for a wide variety of tasks!
If you'd like to try it out today you can:

We can't wait to see what you'll build with OpenHands!
