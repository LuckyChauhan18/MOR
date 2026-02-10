from explorer_agent import run_explorer_agent

if __name__ == "__main__":
    result = run_explorer_agent()

    print("\n🔥 TRENDING TOPICS\n")
    for i, t in enumerate(result.topics, 1):
        print(f"{i}. {t.title}")
        print(f"   Score  : {t.score}")
        print(f"   Source : {t.source}")
        print(f"   Reason : {t.reason}\n")
