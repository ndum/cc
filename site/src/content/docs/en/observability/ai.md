---
title: A local AI service
description: A language model with Ollama in your own cluster, model size versus speed and quality, why AVX2 matters, inference as load, access for members and the OpenAI-compatible interface.
sidebar:
  order: 5
---

:::assignment
"Our members are asking about AI," Simone Wyss writes. "But Praxis Rosenweg must not send patient data to a service abroad. Can you run a language model here, and how good is it?"
:::

:::goals
After this chapter you can

- explain when a local model is preferable to a service on the internet,
- run Ollama in the cluster from Git and load a model,
- measure speed in tokens per second and explain what it depends on,
- treat inference as a load on the platform,
- control the members' access to the model.
:::

## Local or on the internet

A large language model produces text token by token, a token being roughly a part of a word. The well-known services run in their providers' data centers, often abroad. Whoever sends them text hands it over. For Praxis Rosenweg with health data, which the Swiss data protection act classes as particularly sensitive, that is a high hurdle. A model in your own cluster processes the text where it already lives.

The price is size. The models of large providers have hundreds of billions of parameters and run on graphics cards. In the lab, small models run on four CPU cores without a graphics card. They summarize, classify and suggest, but they make more mistakes. This chapter measures what they deliver, and chapter 5.6 puts one to work in operations.

## Ollama

Ollama downloads and runs open language models behind an HTTP interface. It runs in the namespace `ai` on the agent, while the server keeps the control plane and monitoring. The files came into your repo with the copy in chapter 5.1, and the application `ai` rolls them out.

::code{file="platform/observability/repo/ai/ollama.yaml"}

`OLLAMA_KEEP_ALIVE` keeps the model in memory for 30 minutes after the last request, otherwise Ollama loads it from disk for every new request. `OLLAMA_NUM_PARALLEL` allows two requests at the same time. More would share the four cores, and each answer would come slower. `Recreate` ends the old pod before the new one starts, because the volume belongs to a single node.

A job that Argo CD starts after every sync loads the model.

::code{file="platform/observability/repo/ai/pull-model.yaml"}

In the lab, Meta's `llama3.2:3b` with three billion parameters was ready 196 seconds after the push. The file is 2.0 GB. The weights are shrunk to about four bits per parameter, which is called quantization. That costs some accuracy and makes the model small enough for the agent's memory.

## The disk

The Ollama image is large because of its libraries for graphics cards, 3.4 GB compressed. In the lab, the agent's disk was 87 % full afterwards, and Prometheus reported `KubePersistentVolumeFillingUp`. The local-path volumes live on the same disk as the images. The template of chapter 4.2 therefore gives the cluster VMs 30 GB, the variable `disk_size`. In the lab, `tofu apply` grew the disks from 20 to 30 GB without restarting the VMs, and the file system grew with them.

## Speed

Speed is measured in tokens per second, separately for reading the question and writing the answer. The Ollama interface returns both.

```bash
kubectl -n ai port-forward svc/ollama 11434:11434 &
curl -s localhost:11434/api/generate -d '{
  "model": "llama3.2:3b", "stream": false,
  "prompt": "Der Webshop beantwortet seit zehn Minuten 30 % der Anfragen mit Fehler 500. Was soll das Plattform-Team zuerst prüfen? Drei Sätze."
}' | python3 -c 'import json, sys; d = json.load(sys.stdin)
print(d["eval_count"] / d["eval_duration"] * 1e9, "tokens/s"); print(d["response"])'
```

| Measurement in the lab | Value |
|---|---|
| loading the model on the first call | 2.8 s |
| reading the question, 77 tokens | 75 tokens/s |
| writing the answer | 22.6 tokens/s |
| whole answer, first call | 10.3 s |
| whole answer, second call | 5.4 s |

On the second call the model was loaded and the same question was cached. The answer takes most of the time, because each token depends on the one before and has to be computed on its own.

## AVX2 and FMA

On a CPU, a model computes with vector instructions such as AVX2 and FMA. In chapter 4.2 the cluster VMs got `host-passthrough` and thus see the node's real CPU. In the test setup, a VM without this setting only saw a generic CPU without AVX2, and the same model wrote about eight times slower, 2.2 instead of 19.4 tokens per second. The agent itself shows whether the instructions arrive.

```bash
ssh root@<agent-address> "grep -o -w -E 'avx2|fma' /proc/cpuinfo | sort | uniq -c"
```

## Inference as load

While answering, Ollama uses nearly all four cores of the agent, about 3.9 in the test setup. That is a new kind of load for the platform. A single request can keep a node busy for seconds, and two members asking at the same time wait for each other. A quota per namespace does not help here, since all requests run in the Ollama pod. So the platform first controls who can reach the model at all.

::code{file="platform/observability/repo/ai/networkpolicy.yaml"}

A member gets access when its namespace carries the label `ai: allowed`. That belongs in its folder under `members`, as a patch on the namespace.

```yaml
  - target:
      kind: Namespace
    patch: |-
      - op: add
        path: /metadata/labels
        value:
          ai: allowed
```

In the lab, a pod in `velo` first got no connection and, after the push with the label, the answer "Ollama is running". Limiting how much a member may ask would need a gateway in front of Ollama that counts requests per member.

## The OpenAI-compatible interface

Many programs speak the OpenAI interface. Ollama offers the same shape at `/v1/chat/completions`. A program that otherwise uses a service on the internet then only needs a different address and no key.

```bash
curl -s localhost:11434/v1/chat/completions -H 'Content-Type: application/json' -d '{
  "model": "llama3.2:3b",
  "messages": [{"role": "user", "content": "Antworte nur mit OK."}]
}'
```

## The quality of the answers

In the lab, the model gave plausible but generic advice on the question about the 500 errors. It recommended checking servers, network and database although the web shop has no database, and it spelled "anschliessend" with the sharp s, which Swiss German does not use. It does not know the system and guesses from what appears in similar texts. A useful answer needs context, such as the logs and the state of the deployment. Chapter 5.6 gives it this context and lets a person decide.

::::exercise[Lab]
Roll out Ollama, measure the speed three times with the same question and once with a new one, and check whether the agent sees AVX2. Let the model answer a question from your own field and judge the answer.

:::solution
`kubectl -n ai get pods` shows `ollama` as ready and the job `pull-model` as completed. The answer comes at about 20 tokens per second, and the first call takes longer because of loading. A new question has to be read in full again. The judgment names what is right, what is made up and what is missing.
:::
::::

::::exercise[Access]
Give the bike shop access to the model, but not the municipality. Show both with a test pod.

:::solution
The patch with `ai: allowed` goes into `members/velo/kustomization.yaml`, and after the push the namespace carries the label. `wget -qO- http://ollama.ai.svc:11434/` from a pod in `velo` returns "Ollama is running", from `gemeinde` the connection fails.
:::
::::

::::exercise[Bigger or faster]
The fiduciary office wants to summarize receipts and asks whether a bigger model would be better. What speaks for it, what against, and how would you test it?

:::solution
A bigger model usually writes more accurately but needs more memory and writes more slowly. With eight billion parameters it would need more than twice the memory, and the pod's 4 GB limit would no longer be enough. You would test with a handful of real receipts without personal data, noting time and quality for each model. The decision depends on whether the fiduciary office can wait for an answer.
:::
::::
