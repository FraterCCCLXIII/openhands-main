---
title: "Refactoring COBOL to Java with AI Agents"
excerpt: "Learn how to use AI agents to modernize legacy COBOL codebases to Java. We walk through an iterative refinement approach that uses multiple agents to convert and verify code quality until it meets your standards."
coverImage: "/assets/blog/20251209-cobol-to-java-refactoring/cover.png"
date: "2025-12-09T12:00:00.000Z"
authors:
  - name: OpenHands Team
    picture: "/assets/blog/authors/openhands.png"
ogImage:
  url: "/assets/blog/20251209-cobol-to-java-refactoring/cover.png"
---

[COBOL](https://en.wikipedia.org/wiki/COBOL) modernization is one of the most pressing challenges facing enterprises today. Gartner estimated there were over 200 billion lines of COBOL code in existence, running 80% of the world's business systems. As of 2020, COBOL was still running background processes for 95% of credit and debit card transactions.

The challenge is acute: [47% of organizations](https://softwaremodernizationservices.com/mainframe-modernization) today struggle to fill COBOL roles, with salaries rising 25% annually. By 2027, 92% of remaining COBOL developers will have retired. Traditional modernization approaches have seen [high failure rates](https://www.linkedin.com/posts/jeanlucs_cobol-mainframe-as400-activity-7397385359770423296-VOLP), with COBOL's unique syntax making it difficult for human teams alone. AI is now achieving what armies of developers couldn't: automated code analysis, transformation, and verification at scale.

## An Iterative Refinement Approach

Simply converting COBOL syntax to Java isn't enough—the converted code needs to preserve business logic, follow Java conventions, and be maintainable by modern development teams.

At [OpenHands](https://openhands.dev), one effective method we've found is an iterative refinement pattern using multiple agents in a feedback loop:

1. A **refactoring agent** converts COBOL files to Java
2. A **critique agent** evaluates the quality of each conversion and scores it
3. If the score is below your quality threshold, the process repeats with the critique feedback

The result is more than just code that runs, it's code that faithfully reproduces the original and meets your standards on quality and maintainability.

## How It Works

The idea is simple: one agent does the work, another agent checks it, and if it's not good enough, the first agent tries again with the feedback. Here's what that looks like in code using the [OpenHands SDK](https://github.com/OpenHands/software-agent-sdk):

```python
while current_score < QUALITY_THRESHOLD and iteration < MAX_ITERATIONS:
    # Refactoring agent converts COBOL to Java
    refactoring_conversation.send_message(refactoring_prompt)
    refactoring_conversation.run()
    
    # Critique agent evaluates the conversion
    critique_conversation.send_message(critique_prompt)
    critique_conversation.run()
    
    # Parse the score and decide whether to continue
    current_score = parse_critique_score(critique_file)
```

The refactoring agent receives instructions about conversion requirements: preserve business logic, use Java naming conventions, implement error handling, and add documentation.

The critique agent evaluates each converted file on correctness, code quality, completeness, and best practices—producing a structured report with specific issues to address. If the isn't up to your specified standard, the refactoring agent runs again with the critique feedback, making targeted improvements.

## Example

Here's a COBOL customer management program:

```cobol
       1000-MAIN-PROCESS.
           DISPLAY "CUSTOMER MANAGEMENT SYSTEM"
           EVALUATE TRUE
               WHEN OP-ADD
                   PERFORM 2000-ADD-CUSTOMER
               WHEN OP-UPDATE
                   PERFORM 3000-UPDATE-CUSTOMER
               WHEN OP-DELETE
                   PERFORM 4000-DELETE-CUSTOMER
           END-EVALUATE.
```

The agent converts this to idiomatic Java:

```java
public class CustomerManagement {
    public void mainProcess() {
        System.out.println("CUSTOMER MANAGEMENT SYSTEM");
        
        switch (operation) {
            case ADD -> addCustomer();
            case UPDATE -> updateCustomer();
            case DELETE -> deleteCustomer();
            default -> System.out.println("INVALID OPERATION");
        }
    }
}
```

## Try It Yourself

The full iterative refinement example is available in the OpenHands SDK. Once the pending PRs are merged, you can find it at:

- **Code**: [examples/01_standalone_sdk/31_iterative_refinement.py](https://github.com/OpenHands/software-agent-sdk/blob/main/examples/01_standalone_sdk/31_iterative_refinement.py)
- **Documentation**: [Iterative Refinement Guide](https://docs.openhands.dev/sdk/guides/iterative-refinement)

To run the example:

```bash
export LLM_API_KEY="your-api-key"
cd software-agent-sdk
uv run python examples/01_standalone_sdk/31_iterative_refinement.py
```

For real-world COBOL files, you can use the [AWS CardDemo application](https://github.com/aws-samples/aws-mainframe-modernization-carddemo/tree/main/app/cbl), which provides a representative mainframe application for testing modernization approaches.

## Scaling Up with the Large Codebase SDK

The iterative refinement example works well for small to medium codebases. But enterprise COBOL systems can span millions of lines across thousands of programs, with complex interdependencies.

For these large-scale modernization projects, we've developed the OpenHands Large Codebase SDK. This toolkit extends the iterative refinement pattern with:

- **Dependency analysis tools** that identify independent components and optimal migration order
- **Parallel agent orchestration** for processing multiple files simultaneously
- **Progress tracking dashboards** to monitor the overall modernization status
- **Semantic equivalence verification** to ensure the new Java application behaves exactly like the legacy COBOL system

The Large Codebase SDK also includes specialized COBOL refactoring workflows that understand common mainframe patterns—CICS transactions, JCL jobs, VSAM file handling—and convert them to appropriate Java equivalents.

## Learn More

Legacy modernization is a significant undertaking, but AI agents are making it more tractable than ever. Whether you're dealing with a few hundred COBOL programs or a million-line mainframe application, the iterative refinement approach ensures quality while dramatically reducing the manual effort required.

If you're interested in modernizing your legacy systems with AI agents:

- [Contact our team](https://openhands.dev/contact) to discuss your use case
- [Join our Slack community](https://dub.sh/openhands) to connect with others tackling similar challenges
