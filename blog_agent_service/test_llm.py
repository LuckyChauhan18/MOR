import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage

load_dotenv()

key = os.getenv("OPENROUTER_API_KEY")
print(f"Testing with key: {key[:10]}...")

llm = ChatOpenAI(
    model="openai/gpt-4o-mini",
    openai_api_key=key,
    openai_api_base="https://openrouter.ai/api/v1",
    temperature=0
)

try:
    response = llm.invoke([HumanMessage(content="Respond with 'TEST_SUCCESS'")])
    print(f"RESULT: {response.content}")
except Exception as e:
    if hasattr(e, 'status_code'):
        print(f"STATUS_CODE: {e.status_code}")
    if hasattr(e, 'response'):
        try:
            err_json = e.response.json()
            print(f"ERROR_MSG: {err_json.get('error', {}).get('message', 'Unknown error message')}")
        except:
            print(f"ERROR_RAW: {e.response.text[:500]}")
    else:
        print(f"ERROR: {str(e)}")
