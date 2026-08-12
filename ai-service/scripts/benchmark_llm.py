import csv
import json
from pathlib import Path

import httpx


OLLAMA_URL = "http://localhost:11434/api/generate"

MODELS = [
    "qwen3:0.6b",
    "qwen3:1.7b",
    "llama3.2:3b",
]

RUNS_PER_PROMPT = 3

BASE_DIR = Path(__file__).resolve().parent.parent
PROMPTS_FILE = BASE_DIR / "benchmark" / "prompts.json"
RESULTS_FILE = BASE_DIR / "benchmark" / "results_3runs.csv"


def load_prompts() -> list[dict]:
    with PROMPTS_FILE.open("r", encoding="utf-8") as file:
        return json.load(file)


def run_benchmark(
    model: str,
    prompt_item: dict,
    run_number: int,
) -> dict:
    response = httpx.post(
        OLLAMA_URL,
        json={
            "model": model,
            "prompt": prompt_item["prompt"],
            "stream": False,
        },
        timeout=300,
    )

    response.raise_for_status()
    data = response.json()

    total_duration_ns = data.get("total_duration", 0)
    load_duration_ns = data.get("load_duration", 0)
    prompt_eval_duration_ns = data.get("prompt_eval_duration", 0)
    eval_duration_ns = data.get("eval_duration", 0)

    prompt_eval_count = data.get("prompt_eval_count", 0)
    eval_count = data.get("eval_count", 0)

    total_seconds = total_duration_ns / 1_000_000_000
    load_seconds = load_duration_ns / 1_000_000_000
    prompt_eval_seconds = prompt_eval_duration_ns / 1_000_000_000
    eval_seconds = eval_duration_ns / 1_000_000_000

    tokens_per_second = (
        eval_count / eval_seconds
        if eval_seconds > 0
        else 0
    )

    return {
        "model": model,
        "prompt_id": prompt_item["id"],
        "prompt_name": prompt_item["name"],
        "run_number": run_number,
        "total_seconds": round(total_seconds, 3),
        "load_seconds": round(load_seconds, 3),
        "prompt_eval_seconds": round(prompt_eval_seconds, 3),
        "eval_seconds": round(eval_seconds, 3),
        "prompt_tokens": prompt_eval_count,
        "generated_tokens": eval_count,
        "tokens_per_second": round(tokens_per_second, 2),
        "response": data.get("response", "").strip(),
    }


def main() -> None:
    prompts = load_prompts()
    results = []

    total_runs = (
        len(MODELS)
        * len(prompts)
        * RUNS_PER_PROMPT
    )

    current_run = 0

    print(
        f"Starting benchmark: "
        f"{len(MODELS)} models × "
        f"{len(prompts)} prompts × "
        f"{RUNS_PER_PROMPT} runs"
    )
    print(f"Total requests: {total_runs}")
    print()

    for model in MODELS:
        print("=" * 70)
        print(f"MODEL: {model}")
        print("=" * 70)

        for prompt_item in prompts:
            for run_number in range(
                1,
                RUNS_PER_PROMPT + 1,
            ):
                current_run += 1

                print(
                    f"[{current_run}/{total_runs}] "
                    f"{model} - "
                    f"{prompt_item['id']} - "
                    f"Run {run_number}"
                )

                try:
                    result = run_benchmark(
                        model=model,
                        prompt_item=prompt_item,
                        run_number=run_number,
                    )

                    results.append(result)

                    print(
                        "  Done | "
                        f"total={result['total_seconds']}s | "
                        f"load={result['load_seconds']}s | "
                        f"speed={result['tokens_per_second']} tok/s"
                    )

                except Exception as exc:
                    results.append(
                        {
                            "model": model,
                            "prompt_id": prompt_item["id"],
                            "prompt_name": prompt_item["name"],
                            "run_number": run_number,
                            "total_seconds": "",
                            "load_seconds": "",
                            "prompt_eval_seconds": "",
                            "eval_seconds": "",
                            "prompt_tokens": "",
                            "generated_tokens": "",
                            "tokens_per_second": "",
                            "response": f"ERROR: {exc}",
                        }
                    )

                    print(f"  ERROR: {exc}")

        print()

    RESULTS_FILE.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    fieldnames = [
        "model",
        "prompt_id",
        "prompt_name",
        "run_number",
        "total_seconds",
        "load_seconds",
        "prompt_eval_seconds",
        "eval_seconds",
        "prompt_tokens",
        "generated_tokens",
        "tokens_per_second",
        "response",
    ]

    with RESULTS_FILE.open(
        "w",
        newline="",
        encoding="utf-8-sig",
    ) as file:
        writer = csv.DictWriter(
            file,
            fieldnames=fieldnames,
        )

        writer.writeheader()
        writer.writerows(results)

    print("=" * 70)
    print("BENCHMARK COMPLETED")
    print("=" * 70)
    print(f"Total recorded rows: {len(results)}")
    print(f"Saved results to: {RESULTS_FILE}")


if __name__ == "__main__":
    main()