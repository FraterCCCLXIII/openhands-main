import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import matplotlib

# Use Agg backend which doesn't require a display
matplotlib.use('Agg')

# Set the font to be compatible with most systems
matplotlib.rcParams['font.family'] = 'sans-serif'
matplotlib.rcParams['font.sans-serif'] = ['Arial', 'Helvetica', 'DejaVu Sans']

# Set reasonable figure parameters to avoid rendering issues
matplotlib.rcParams['figure.max_open_warning'] = 0
matplotlib.rcParams['agg.path.chunksize'] = 10000

# Data from the blog post - with requested changes
models = [
    'OpenHands LM 32B v0.1',
    'Deepseek V3 0324',
    'Deepseek V3',
    'Deepseek R1',  # Removed hyphen
    # Removed 'o1-2024-12-17'
    # Removed 'mistral/codestral-latest'
    'QwQ 32b',
    'Gemma-3 27b'
]

performance = [37.2, 38.8, 32.4, 34.0, 18.8, 10.2]  # Removed o1-2024-12-17 and codestral-latest

# Create a DataFrame for easier manipulation
df = pd.DataFrame({
    'Model': models,
    'Performance': performance
})

# Sort by performance for better visualization
df = df.sort_values('Performance')

# Create a clean figure with standard dimensions
plt.figure(figsize=(10, 6))

# Create horizontal bars
bars = plt.barh(df['Model'], df['Performance'], color='black', height=0.6)

# Highlight our model in yellow
our_model_idx = df['Model'].tolist().index('OpenHands LM 32B v0.1')
bars[our_model_idx].set_color('#FFD700')  # Yellow color for our model

# Add performance values at the end of each bar
for i, perf in enumerate(df['Performance']):
    plt.text(perf - 0.5, i, f"{perf}%", va='center', fontsize=10)

# Set labels and style
plt.xlabel('SWE-Bench Verified Performance (%)', fontsize=12)
plt.xticks(fontsize=10)
plt.yticks(fontsize=10)

# Remove the top and right spines
plt.gca().spines['top'].set_visible(False)
plt.gca().spines['right'].set_visible(False)

# Add grid
plt.grid(axis='x', linestyle='--', alpha=0.7)

# Set x-axis limits to create padding
plt.xlim(0, max(performance) * 1.2)

# Important: apply tight_layout AFTER all other adjustments
plt.tight_layout(pad=2.0)

# Save the figure - make sure there are no conflicting adjustments
plt.savefig('performance_comparison.png', dpi=100, bbox_inches='tight', format='png', facecolor='white')
plt.close()

print("Visualization saved as 'performance_comparison.png'")
