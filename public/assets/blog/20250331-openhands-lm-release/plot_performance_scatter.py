import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import matplotlib
from matplotlib.offsetbox import OffsetImage, AnnotationBbox
import matplotlib.image as mpimg

# Use Agg backend which doesn't require a display
matplotlib.use('Agg')

# Set the font to be compatible with most systems
matplotlib.rcParams['font.family'] = 'sans-serif'
matplotlib.rcParams['font.sans-serif'] = ['Arial', 'Helvetica', 'DejaVu Sans']

# Set reasonable figure parameters
matplotlib.rcParams['figure.max_open_warning'] = 0
matplotlib.rcParams['agg.path.chunksize'] = 10000

# Increase the default font sizes but not too large
matplotlib.rcParams['font.size'] = 10
matplotlib.rcParams['axes.titlesize'] = 12
matplotlib.rcParams['axes.labelsize'] = 12
matplotlib.rcParams['xtick.labelsize'] = 10
matplotlib.rcParams['ytick.labelsize'] = 10

# Data for the scatter plot
models = [
    'OpenHands LM 32B v0.1',
    'Deepseek V3 0324',
    'Deepseek V3',
    'Deepseek R1',
    'QwQ 32b',
    'Gemma-3 27b'
]

# Performance values (SWE-Bench Verified %)
performance = [37.2, 38.8, 32.4, 34.0, 18.8, 10.2]

# Model sizes in billions of parameters
model_sizes = [32, 671, 671, 671, 32, 27]

# Create a DataFrame
df = pd.DataFrame({
    'Model': models,
    'Performance': performance,
    'Size': model_sizes
})

# Create a smaller scatter plot but keep the 16:9 aspect ratio
plt.figure(figsize=(12, 6.75))  # 12:6.75 = 16:9 ratio but smaller overall size

# Remove the top and right spines
plt.gca().spines['top'].set_visible(False)
plt.gca().spines['right'].set_visible(False)

# Function to add logos with error handling
def add_logo(x, y, logo_path, zoom=0.15):
    try:
        img = mpimg.imread(logo_path)
        imagebox = OffsetImage(img, zoom=zoom)
        ab = AnnotationBbox(imagebox, (x, y), frameon=False, pad=0)
        plt.gca().add_artist(ab)
        return True
    except Exception as e:
        print(f"Warning: Could not add logo from {logo_path}: {e}")
        return False

# Define logo paths relative to the current directory
logo_paths = {
    'OpenHands LM 32B v0.1': '../../all-hands-logo.png',
    'Deepseek V3 0324': './deepseek-ai-icon-seeklogo.png',
    'Deepseek V3': './deepseek-ai-icon-seeklogo.png',
    'Deepseek R1': './deepseek-ai-icon-seeklogo.png',
    'QwQ 32b': './qwen-icon-seeklogo.png',
    'Gemma-3 27b': './gemma-seeklogo.png'
}

# Define zoom levels for each logo - drastically adjusted for better balance
logo_zoom = {
    'OpenHands LM 32B v0.1': 0.18,       # Much larger 
    'Deepseek V3 0324': 0.013,           # Much smaller
    'Deepseek V3': 0.013,                # Much smaller
    'Deepseek R1': 0.013,                # Much smaller
    'QwQ 32b': 0.015,                    # Much smaller
    'Gemma-3 27b': 0.02                 # Much smaller
}

# Define fallback colors for models in case logos don't load
colors = {
    'OpenHands LM 32B v0.1': '#FFD700',  # Gold color for our model
    'Deepseek V3 0324': '#4285F4',       # Blue
    'Deepseek V3': '#4285F4',            # Blue
    'Deepseek R1': '#4285F4',            # Blue
    'QwQ 32b': '#34A853',                # Green
    'Gemma-3 27b': '#EA4335'             # Red
}

# Create scatter plot with model size on x-axis and performance on y-axis
for i, row in df.iterrows():
    model_name = row['Model']
    
    # Try to add a logo, if it fails use a marker
    logo_added = False
    if model_name in logo_paths:
        logo_added = add_logo(row['Size'], row['Performance'], 
                            logo_paths[model_name], 
                            zoom=logo_zoom[model_name])
    
    # Add model names with performance values using consistent font styling
    # Create label with performance
    label = f"{model_name} ({row['Performance']}%)"
    
    # Add annotations with consistent styling, only OpenHands is bold
    if model_name == 'OpenHands LM 32B v0.1':
        plt.annotate(label, (row['Size'], row['Performance']), 
                    xytext=(30, -8), textcoords='offset points', 
                    fontweight='bold', fontsize=16, color='#000000',
                    ha='left')
    elif 'Deepseek' in model_name:
        plt.annotate(label, (row['Size'], row['Performance']), 
                    xytext=(-20, -5), textcoords='offset points', 
                    fontweight='bold', fontsize=14, color='#444444',
                    ha='right')
    else:
        plt.annotate(label, (row['Size'], row['Performance']), 
                    xytext=(20, -5), textcoords='offset points', 
                    fontweight='bold', fontsize=14, color='#444444',
                    ha='left')

# Set x-axis to log scale since model sizes vary by orders of magnitude
plt.xscale('log')

# Set labels with larger font size
plt.xlabel('Model Size (Billions of Parameters)', fontsize=16, fontweight='bold')
plt.ylabel('SWE-Bench Verified Performance (%)', fontsize=16, fontweight='bold')

# Define specific tick positions for x-axis
# Using major ticks at model sizes present in the data plus additional reference points
x_ticks = [25, 32, 50, 100, 200, 400, 671]
plt.xticks(x_ticks, labels=[str(x) for x in x_ticks])

# Add a grid
plt.grid(linestyle='--', alpha=0.6, linewidth=0.8)

# # Add a darker gray background
# plt.gca().set_facecolor('#eeeeee')

# Add a subtle box around the plot area
plt.gca().spines['bottom'].set_linewidth(1.2)
plt.gca().spines['left'].set_linewidth(1.2)

# Set reasonable axis limits
plt.xlim(20, 800)
plt.ylim(5, 45)

# # Add a text annotation highlighting the performance advantage
# plt.annotate('OpenHands LM achieves performance\ncomparable to models 20x larger', 
#             xy=(32, 37.2), xytext=(100, 25), 
#             arrowprops=dict(facecolor='black', shrink=0.05, width=1.2, headwidth=6),
#             fontsize=12, ha='center', fontweight='bold')

# Apply tight layout
plt.tight_layout(pad=1)

# Save the figure with the correct aspect ratio
plt.savefig('performance_scatter.png', dpi=150, bbox_inches='tight', format='png', facecolor='white')
plt.close()

print("Scatter plot visualization saved as 'performance_scatter.png'")
