---
title: Host Your Own Coding Agents with OpenHands using AMD Ryzen AI
slug: 20251119-amd-ryzen-ai-collaboration
excerpt: 'Coding agents can automate many software development tasks, but running them typically requires expensive cloud APIs. With AMD''s Ryzen AI Max+ 395 and Lemonade Server, you can run coding agents like OpenHands directly on your workstation while maintaining privacy and controlling costs.'
coverImage: /assets/webflow/blog/694412959429f7fe869af4ce_cover-1.png
date: '2025-11-19T12:00:00.000Z'
authors:
  - name: Xingyao Wang
  - name: Graham Neubig
ogImage:
  url: /assets/webflow/blog/694412959429f7fe869af4ce_cover-1.png
seoTitleDate: 'Nov 17, 2025'
---
Coding agents like [OpenHands](https://openhands.dev) can automate many software development tasks. However, running them typically requires expensive cloud APIs or dedicated data center infrastructure, raising concerns about cost and privacy. An alternative is to run coding agents directly on your workstation. With advances in open-weight models and edge AI processing, smaller locally-runnable models are now achieving competitive results—approaching their larger counterparts on benchmarks like [SWE-Bench Verified](https://www.swebench.com/)—making self-hosted coding agents a viable option.

## The AMD Stack for Language Model Serving

The [AMD Ryzen™ AI Max+ 395 processor](https://www.amd.com/en/products/processors/laptop/ryzen/ai-300-series/amd-ryzen-ai-max-plus-395.html) combines 16 Zen 5 CPU cores with a Radeon™ 8060S integrated GPU and an XDNA 2 Neural Processing Unit (NPU). Together, these components deliver up to 126 AI TOPS (Tera Operations Per Second), providing the compute needed to run language models locally. The processor includes 64 MB of L3 cache and supports high-bandwidth LPDDR5X memory, enabling inference with models like [Qwen3-Coder-30B](https://huggingface.co/Qwen/Qwen2.5-Coder-32B-Instruct).

To utilize this hardware, AMD has developed [Lemonade Server](https://github.com/lemonade-sdk/lemonade), a software stack that enables local large language models to run with NPU and GPU acceleration. Lemonade supports the OpenAI API standard, making it compatible with existing AI applications and tools. Lemonade provides accelerated and efficient coding agent execution by leveraging the integrated NPU, GPU, and CPU on the Ryzen AI™. The server works across platforms and supports popular inference engines, including optimized backends for AMD hardware.

By combining the Ryzen AI Max+ 395's hardware with Lemonade's software stack, developers can run models like Qwen3-Coder-30B locally while maintaining reasonable performance. This approach enables private, cost-effective AI development for those who prefer to keep their code on-premises.

## Setting Up AMD Ryzen AI with Lemonade

AMD and OpenHands are collaborating to make it easier to run coding agents locally on AMD hardware. Here's how to get started:

### Prerequisites

Before starting, ensure you have:

• A compatible Linux or Windows environment
• Administrative access to install required software

### Step 1: Install Lemonade Prerequisites

For detailed installation instructions, see the [Lemonade Getting Started guide](https://lemonade-server.ai/). On Windows, Lemonade works out of the box. On Linux, ensure that the [ROCm](https://www.amd.com/en/products/software/rocm.html) tools are installed before proceeding.

### Step 2: Install Lemonade

Lemonade is AMD's optimized software stack for running large language models on AMD hardware. To install and run Lemonade, first [download and install Lemonade](https://lemonade-server.ai/) then run

`lemonade-server serve --host 0.0.0.0 --ctx-size 32768‍`

When you start the Lemonade server, you'll see output like this:

`🍋 Open http://0.0.0.0:8000 in your browser for:🍋 💬 chat🍋 💻 model management🍋 📄 docs‍`

The Lemonade server will automatically download the Qwen3-Coder-30B-A3B-Instruct model (approximately 18.6GB) on first run.

### Step 3: Install OpenHands

There are many ways to use OpenHands through the CLI, GUI, and SDK and for detailed instructions you can see the [OpenHands documentation](https://docs.openhands.dev/openhands/usage/run-openhands/cli-mode). Here, we'll use the CLI, which is easy to install and start using through [uv](https://docs.astral.sh/uv/getting-started/installation/):

`uvx tool install openhands‍`

This will start the OpenHands interactive command-line interface.

### Step 4: Configure OpenHands to Use Lemonade

To connect OpenHands to your local Lemonade server, you'll need to configure the LLM settings. In the OpenHands CLI:

**1.** Type `/settings` and press Enter to access the configuration menu

**2.** Select **"LLM (Basic)"** to configure a custom LLM endpoint

**3.** When prompted, enter the following configuration:

**Provider:**lemonade

**Model:** `Qwen3-Coder-30B-A3B-Instruct-GGUF`

**4.** Confirm to save the settings

Your OpenHands CLI is now configured to use your local Lemonade server! The settings are persisted for all future sessions.

### Step 5: Start Your First Conversation

Back at the main CLI menu, start a new conversation by typing your request. For example:

"Create a website that showcases Ryzen AI and the ability to run the OpenHands coding agents locally through the Lemonade software stack. Make the website fun with a theme of lemonade and laptops."

The OpenHands agent will begin working on your task using the local Qwen model running on your AMD hardware. You'll see the agent writing code, testing, and iterating until everything is complete.

Once the agent completes its work, you can view and interact with the generated code in the working directory.

## Why Self-Host with AMD and OpenHands?

When using coding agents, many developers rely on powerful but closed API-based models like Claude and GPT. While these models are effective, there are compelling reasons to use open-weight models and host them yourself:

**1. Privacy:** Your code and intellectual property never leave your machine

**2. Cost:** No per-token API costs, especially beneficial for long-running tasks

**3. Compliance:** Meet regulatory requirements for government, healthcare, and finance

**4. Performance:** Low latency with local inference

**5. Flexibility:** Full control over model selection and configuration

**6. Offline Capability:** Work without internet connectivity

## Conclusion

Going forward, at OpenHands we're working on developing additional local model capabilities and methods for you to adapt models on your own data using AMD Ryzen AI.

We hope that this post has been useful, and if you'd like to try setting things up yourself, please join our [Slack community](https://all-hands.dev/joinslack) or check out our [documentation](https://docs.all-hands.dev/) for more information. And thanks to AMD for the collaboration on this integration!
