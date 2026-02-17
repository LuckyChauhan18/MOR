# 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

import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

load_dotenv()

# Testing with the new key directly
model = ChatOpenAI(
    model='openai/gpt-4o-mini', 
    openai_api_key='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', 
    openai_api_base='https://openrouter.ai/api/v1'
)
print(model.invoke('hi'))