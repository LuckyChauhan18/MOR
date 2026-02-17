import re
import hashlib

def normalize_question(q):
    """Normalize question to handle common variations and filler phrases."""
    q = q.lower().strip()
    # Remove punctuation
    q = re.sub(r'[?.\!]', '', q)
    # Remove common filler phrases that don't change intent
    fillers = [
        r'\b(of|about|in|on)\b',
        r'\b(this blog|the blog|this post|the post|this article|the article|blog|post|article)\b',
    ]
    for pattern in fillers:
        q = re.sub(pattern, '', q).strip()
    # Clean up double spaces
    q = re.sub(r'\s+', ' ', q).strip()
    return q

def get_hash(q):
    norm = normalize_question(q)
    return hashlib.md5(norm.encode()).hexdigest(), norm

test_cases = [
    "topic of this blog ?",
    "topic ?",
    "What is the topic of the blog?",
    "topic",
]

for q in test_cases:
    h, n = get_hash(q)
    print(f"Original: '{q}' -> Norm: '{n}' -> Hash: {h}")

case1_h, _ = get_hash("topic of this blog ?")
case2_h, _ = get_hash("topic ?")

if case1_h == case2_h:
    print("\n✅ SUCCESS: 'topic of this blog ?' and 'topic ?' normalize to the same key!")
else:
    print("\n❌ FAILURE: Keys are still different.")
