import os, json, random, datetime

# Get current script directory
base_dir = os.path.dirname(os.path.abspath(__file__))

# Load facts
with open(os.path.join(base_dir, "facts.json"), "r") as f:
    facts = json.load(f)

fact = random.choice(facts)
today = datetime.datetime.today().strftime("%A, %B %d")

# Create post
content = f"""
<h2>{today}</h2>
<p>{fact}</p>
"""

# Append to test.html
with open(os.path.join(base_dir, "test.html"), "a") as f:
    f.write(content)
    f.write("<hr>\n")
