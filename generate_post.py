import os, json, random, datetime

# Get current script directory
base_dir = os.path.dirname(os.path.abspath(__file__))

# Paths
facts_path = os.path.join(base_dir, "facts.json")
html_path = os.path.join(base_dir, "dailyfacts.html")

# Load facts
try:
    with open(facts_path, "r") as f:
        facts = json.load(f)
except Exception as e:
    print(f"❌ Error loading facts.json: {e}")
    exit()

# Pick a random fact
try:
    fact = random.choice(facts)
    title = fact["title"]
    content = fact["content"]
except Exception as e:
    print(f"❌ Error selecting fact: {e}")
    exit()

# Format date
today = datetime.datetime.today().strftime("%A, %B %d")

# Create HTML block
html = f"""
<article class="post" data-aos="fade-up">
  <h2>{title}</h2>
  <p class="date">Posted on {today}</p>
  <p>{content}</p>
</article>
<hr>
"""

# Append to dailyfacts.html
try:
    with open(html_path, "a") as f:
        f.write(html)
    print("✅ Post added to dailyfacts.html")
except Exception as e:
    print(f"❌ Error writing to dailyfacts.html: {e}")
