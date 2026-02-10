print("1. Importing schemas...")
try:
    from agents.blog_writer import schemas
    print("✅ schemas imported")
except Exception as e:
    print(f"❌ schemas failed: {e}")

print("2. Importing router...")
try:
    from agents.blog_writer import router
    print("✅ router imported")
except Exception as e:
    print(f"❌ router failed: {e}")

print("3. Importing researcher...")
try:
    from agents.blog_writer import researcher
    print("✅ researcher imported")
except Exception as e:
    print(f"❌ researcher failed: {e}")

print("4. Importing planner...")
try:
    from agents.blog_writer import planner
    print("✅ planner imported")
except Exception as e:
    print(f"❌ planner failed: {e}")

print("5. Importing writer...")
try:
    from agents.blog_writer import writer
    print("✅ writer imported")
except Exception as e:
    print(f"❌ writer failed: {e}")

print("6. Importing reducer...")
try:
    from agents.blog_writer import reducer
    print("✅ reducer imported")
except Exception as e:
    print(f"❌ reducer failed: {e}")

print("7. Importing graph...")
try:
    from agents.blog_writer import graph
    print("✅ graph imported")
except Exception as e:
    print(f"❌ graph failed: {e}")
