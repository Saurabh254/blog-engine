---
title: Chatbot Evaluators and Observability with Langfuse
description: How to add evaluators and observability to a chatbot using Langfuse for better monitoring and debugging.
date: 2026-06-25
tags: [langfuse, chatbot, observability, evaluation]
---

Table of Contents


1. [Overview](#overview)
2. The Problem With "Just Check the Logs”
3. What Langfuse Does in My Stack
4. How the Tracing Is Structured
5. Running Evaluations Against the Live System
6. Closing Thoughts


---

# Overview

Recently we have been building an AI application. It started as a fairly straightforward assistant that could answer natural language questions by calling a few tools and returning results. But as it grew more capable, a quiet, uncomfortable question started following me around: *is it actually giving good answers?*

For a while we convinced ourself that reading logs and spot checking responses was enough. It wasn't. The system had gotten complex enough that a single user question could trigger multiple sequential LLM calls, several tool invocations, and a fair amount of data retrieval logic. Things could go wrong in subtle ways that logs would never surface. We needed something better.

That's when I properly committed to Langfuse as my observability and evaluation layer. This post is about what I built, why we made the decisions I did, and what I'd do differently.


---

## The Problem With "Just Check the Logs"

Before we get into the setup, I want to explain why we felt evaluation was necessary in the first place, because we think a lot of teams skip this step longer than they should.

Our application has a fairly large system prompt with a lot of behavioral constraints baked in. Things like how it should handle date ranges, when it should refuse a question, how it should behave when data is missing. Whenever we edited the prompt to fix one category of responses, we had no reliable way to know if someone had silently broken something else. We were flying blind after every change.

There was also a tool selection problem. The assistant has access to several tools and needs to pick the right one based on the user's question. A wrong tool selection produces an answer that *looks* reasonable but is factually wrong. Nothing in my logs told me whether the right tool was called. Only evaluation could tell me that.

And then there was the feedback problem. When users had complaints, they'd tell me informally. We had no way to trace a complaint back to a specific LLM call, a specific prompt version, or a specific tool result. Everything was hidden.

So we needed three things: 


1. full trace visibility into every inference step
2. a way to attach user feedback to the exact trace that produced a response
3. a repeatable way to run known good questions against the system and see if the answers regressed.

Langfuse gave me all three.


---

## What Langfuse Does in My Stack

I use Langfuse in four distinct ways and I think it's worth being explicit about each one because people often think of it as just a logging tool. 

**Tracing** is the core. Every user turn produces a hierarchical trace that records each LLM call (input messages, output, token usage) and each tool invocation (tool name, arguments, result). I can open any conversation in the Langfuse UI and see exactly what the model received, what it decided to do, what the tools returned, and what it finally said.

**Prompt management** is something I didn't expect to rely on as much as I do. My system prompt lives in Langfuse as a versioned artifact rather than as a string in my codebase. This means I can iterate on the prompt without touching code, and every LLM generation in my traces is linked to the specific prompt version that produced it. When I run evaluations, I can compare results across prompt versions side by side.

**User feedback scoring** is how I close the loop between subjective reactions and objective traces. When a user gives a thumbs up or thumbs down, that reaction gets written to Langfuse as a score on the exact trace that produced the response. Not approximately linked. Exactly linked, because I propagate the trace ID through the response stream and persist it with the message.

**Dataset-driven evaluation** is how I test for regressions. I maintain a golden dataset of known inputs with defined success criteria. I run experiments against the live system and compare results across runs. If a prompt change breaks something, it shows up here before it shows up in user complaints.


---


## How the Tracing Is Structured

The trace hierarchy I settled on looks like this:

```
Session
  └── Trace  (one per user turn)
        ├── Generation  (first LLM call)
        ├── Span        (tool invocation)
        ├── Generation  (second LLM call after tool result)
        └── ...
```

Sessions group all turns in a single conversation thread. Traces capture one complete user turn from input to final output. Generations capture individual LLM calls, and Spans capture tool invocations.

The reason we model it this way is that our agent loop can run multiple LLM rounds within a single user turn. The first round decides which tools to call. The tools run. Then a second round synthesizes the results into a final answer. If I only traced at the turn level, I'd lose visibility into each individual round. Modeling generations separately means I can see the exact input and output of every LLM call, not just the final response.

One thing I'm careful about with tool spans is truncating large outputs. Some of my tools can return quite a lot of data. I cap the trace payload at a reasonable size so the Langfuse UI stays usable, and I keep the full output in server-side logs for debugging.


---

## The Trace ID Bridge

The feedback scoring setup is the part of this system I'm most proud of, and also the part that required the most careful thinking.

The problem is that tracing happens in my Python backend during inference, but feedback scoring happens in my TypeScript frontend layer when a user reacts to a message, which might be hours later. These are two separate services, two separate Langfuse SDK clients, and two completely different moments in time.

The solution is to treat the trace ID as a durable artifact. When the backend starts processing a turn, it generates a trace and emits the trace ID as an early event in the response stream. The frontend captures it and persists it alongside the message content in the database. Later, when the user reacts, the frontend reads the trace ID from the stored message and sends the feedback score to Langfuse.

```python
# early in the response stream

yield f"data-trace-metadata: {json.dumps({'langfuseTraceId': tracer.trace_id})}\n\n"
```

This is simple but it makes feedback attribution exact and permanent. A user can react to a response a week later and the score still attaches to the right trace.


---

## Running Evaluations Against the Live System

My evaluation tests send real inputs to the live endpoint and record what comes back. Not mocked components. Not isolated unit tests. The full stack.

```python

def test_company_info_queries(langfuse_client, auth_token):
    dataset = langfuse_client.get_dataset("company-info-queries")
    result = dataset.run_experiment(
        name="regression-run-after-prompt-change",
        task=partial(call_live_endpoint, auth_token),
    )
    print(result.format())
```

The reason we insist on end-to-end evaluation is that my tools have their own failure modes. Schema mismatches, permission errors, serialization bugs. These would all be invisible if we evaluated the prompt in isolation. Running against the live system means evaluation catches exactly what production would catch.

The dataset items are organized by capability area so I can do targeted regression testing. If I change something about how the prompt handles date ranges, I run the date-range dataset specifically and check for regressions before I run the full suite.


---

## Closing Thoughts

The thing I've come to believe is that evaluation isn't something you add after the AI is "done." It's the thing that tells you whether any of your other work is actually having the effect you think it is.

Before I had this in place, every prompt change was a guess. Every user complaint was a mystery. Now I can look at a trace and understand exactly why a response came out the way it did, attach user feedback to the specific inference run that caused it, and run a regression suite before shipping any change.

If you're building an AI application and you're still relying on spot checks and vibes, I'd genuinely recommend setting this up sooner rather than later. The instrumentation cost is low and the clarity it gives you is hard to overstate.
