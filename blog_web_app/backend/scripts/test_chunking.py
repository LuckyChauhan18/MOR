from langchain_text_splitters import RecursiveCharacterTextSplitter
import sys

text = "This is a test blog post. It should be split into chunks."
splitter = RecursiveCharacterTextSplitter(chunk_size=10, chunk_overlap=2)
chunks = splitter.split_text(text)
print(f"Text length: {len(text)}")
print(f"Chunks: {len(chunks)}")
for i, c in enumerate(chunks):
    print(f"Chunk {i}: {c}")
