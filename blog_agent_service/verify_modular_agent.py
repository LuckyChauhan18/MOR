import os
import datetime
from agents.blog_writer import blog_writer_app

def test_blog_writer():
    print("🚀 Starting Blog Writer Verification...")
    
    # Simple topic that shouldn't require too much research/generation
    # But enough to trigger the flow
    topic = "The importance of modular code in Python"
    
    current_date = datetime.date.today().isoformat()
    
    initial_state = {
        "topic": topic,
        "as_of": current_date,
        # We can force a mode to speed things up or test specific paths
        # "mode": "closed_book" 
    }
    
    print(f"📝 Topic: {topic}")
    print(f"📅 As of: {current_date}")
    
    try:
        # invoke the graph
        # utilizing a recursion limit to prevent infinite loops if any
        final_state = blog_writer_app.invoke(initial_state, {"recursion_limit": 50})
        
        print("\n✅ Execution Finished!")
        
        if "final" in final_state:
            print("📄 Final Markdown Generated (first 500 chars):")
            print("-" * 40)
            print(final_state["final"][:500] + "...")
            print("-" * 40)
        else:
            print("⚠️ Key 'final' not found in state.")
            
        if "plan" in final_state:
            print(f"📊 Plan Title: {final_state['plan'].blog_title}")
            
    except Exception as e:
        print(f"❌ Error during execution: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_blog_writer()
