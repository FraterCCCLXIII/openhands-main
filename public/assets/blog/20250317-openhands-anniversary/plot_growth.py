import os
import subprocess
from datetime import datetime
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path

def get_commit_data():
    """Get commit data from the OpenHands repository"""
    try:
        os.chdir('/users/gneubig/work/OpenHands')
        git_log = subprocess.check_output(['git', 'log', '--format=%H %at %ae']).decode()
        commits = []
        for line in git_log.strip().split('\n'):
            commit_hash, timestamp, email = line.split()
            date = datetime.fromtimestamp(int(timestamp))
            commits.append({
                'hash': commit_hash,
                'date': date,
                'email': email
            })
        return commits
    except Exception as e:
        print(f"Error getting commit data: {e}")
        return []

def create_growth_chart(star_history_path, commits_data, save_path):
    """Create a growth chart showing stars, commits, and contributors over time"""
    with plt.xkcd():
        # Create figure with cream background
        fig = plt.figure(figsize=(12, 7))  # Made taller for annotations
        ax = fig.add_subplot(111)

        # Define colors
        colors = {
            'text': '#1A1B24',      # Even darker gray
            'accent': '#CC9900',    # Darker yellow
            'secondary': '#8B7355', # Darker brown
            'background': '#FFFFFF', # White
            'grid': '#EEEEEE'       # Light gray for grid
        }

        # Set background colors
        fig.patch.set_facecolor(colors['background'])
        ax.set_facecolor(colors['background'])

        # Process commit data
        df = pd.DataFrame(commits_data)
        df['month'] = pd.to_datetime(df['date']).dt.to_period('M')
        monthly_commits = df.groupby('month').size().cumsum()
        monthly_contributors = df.groupby('month')['email'].nunique().cumsum()

        # Process star data from CSV
        star_df = pd.read_csv(star_history_path)
        # Clean up the date format by removing timezone info
        star_df['Date'] = star_df['Date'].str.replace(r'\s*GMT[+-]\d{4}\s*\(.*\)$', '', regex=True)
        star_df['date'] = pd.to_datetime(star_df['Date'])
        star_df['month'] = star_df['date'].dt.to_period('M')
        monthly_stars = star_df.groupby('month')['Stars'].last()  # Column name is 'Stars'

        # Ensure all series have the same months
        all_months = sorted(set(monthly_commits.index) | set(monthly_contributors.index) | set(monthly_stars.index))
        monthly_commits = monthly_commits.reindex(all_months, method='ffill')
        monthly_contributors = monthly_contributors.reindex(all_months, method='ffill')

        # Set February 2024 to 0 for all series
        feb_2024 = pd.Period('2024-02', freq='M')

        # Add February 2024 to stars
        if feb_2024 not in monthly_stars.index:
            monthly_stars = pd.concat([pd.Series({feb_2024: 0}), monthly_stars]).sort_index()
        else:
            monthly_stars[feb_2024] = 0

        # Add February 2024 to commits and contributors
        if feb_2024 not in monthly_commits.index:
            monthly_commits = pd.concat([pd.Series({feb_2024: 0}), monthly_commits]).sort_index()
        else:
            monthly_commits[feb_2024] = 0

        if feb_2024 not in monthly_contributors.index:
            monthly_contributors = pd.concat([pd.Series({feb_2024: 0}), monthly_contributors]).sort_index()
        else:
            monthly_contributors[feb_2024] = 0

        # Update all_months to include February 2024
        all_months = sorted(set(monthly_commits.index) | set(monthly_contributors.index) | set(monthly_stars.index))
        monthly_stars = monthly_stars.reindex(all_months)
        monthly_commits = monthly_commits.reindex(all_months)
        monthly_contributors = monthly_contributors.reindex(all_months)

        # Get the original non-null values
        valid_indices = monthly_stars.notna()
        valid_values = monthly_stars[valid_indices]
        valid_positions = np.where(valid_indices)[0]

        # For each gap between valid values, fill with linear interpolation
        for i in range(len(valid_positions) - 1):
            start_idx = valid_positions[i]
            end_idx = valid_positions[i + 1]
            if end_idx - start_idx > 1:  # If there's a gap
                start_val = valid_values.iloc[i]
                end_val = valid_values.iloc[i + 1]
                # Create linear interpolation for the gap
                gap_size = end_idx - start_idx
                for j in range(1, gap_size):
                    frac = j / gap_size
                    monthly_stars.iloc[start_idx + j] = start_val + (end_val - start_val) * frac

        # Forward fill any remaining NaN values at the start
        monthly_stars = monthly_stars.ffill()

        # Now apply cubic spline for extra smoothness
        from scipy.interpolate import CubicSpline
        x_orig = np.arange(len(monthly_stars))
        x_new = np.linspace(0, len(monthly_stars)-1, len(monthly_stars)*50)
        cs = CubicSpline(x_orig, monthly_stars.values)
        monthly_stars_smooth = pd.Series(cs(x_new))

        x = np.arange(len(monthly_commits))
        x_smooth = x_new

        # Create a mapping for x-axis labels
        x_ticks = np.arange(len(monthly_commits))
        x_labels = monthly_commits.index.astype(str)

        # Plot commits
        plt.plot(x, monthly_commits.values,
                color=colors['text'],
                marker='o',
                markersize=8,
                label='Total Commits')

        # Plot contributors
        plt.plot(x, monthly_contributors.values,
                color=colors['secondary'],
                marker='s',
                markersize=8,
                label='Unique Contributors')

        # Plot stars with smooth interpolation
        plt.plot(x_smooth, monthly_stars_smooth.values,
                color=colors['accent'],
                label='GitHub Stars')
        # Add markers at the actual data points
        plt.plot(x, monthly_stars.values,
                color=colors['accent'],
                marker='^',
                markersize=8,
                linestyle='none')

        # Set x-axis labels
        plt.xticks(x_ticks, x_labels, rotation=45, ha='right')

        # Customize grid with a hand-drawn look
        ax.grid(True, color=colors['grid'], linestyle='--', linewidth=0.8, alpha=0.5)

        # Style title and labels
        plt.title('One Year of OpenHands',
                 color=colors['text'],
                 pad=20,
                 fontsize=20)

        plt.xlabel('Month',
                  color=colors['text'],
                  labelpad=10,
                  fontsize=16)

        plt.ylabel('Count',
                  color=colors['text'],
                  labelpad=10,
                  fontsize=16)

        # Style legend
        legend = plt.legend(frameon=True, fontsize=14)
        frame = legend.get_frame()
        frame.set_facecolor(colors['background'])
        frame.set_edgecolor(colors['secondary'])

        # Style tick labels
        plt.xticks(color=colors['text'], fontsize=12)
        plt.yticks(color=colors['text'], fontsize=12)

        # Add some padding
        plt.margins(x=0.02)

        # Ensure everything fits
        plt.tight_layout()

        # Add annotations with arrows and hand-drawn style
        last_x = len(all_months) - 1

        # Stars annotation
        plt.annotate(
            "Over 50k stars\nin just one year!",
            xy=(last_x, monthly_stars.iloc[-1]),
            xytext=(last_x - 2, monthly_stars.iloc[-1] * 0.95),
            color=colors['accent'],
            arrowprops=dict(
                arrowstyle='->',
                color=colors['accent'],
                connectionstyle='arc3,rad=-0.2'
            ),
            fontsize=14,
            horizontalalignment='center'
        )

        # Commits annotation
        plt.annotate(
            "3.5k+ commits\nand counting!",
            xy=(last_x, monthly_commits.iloc[-1]),
            xytext=(last_x - 4, monthly_commits.iloc[-1] * 1.5),
            color=colors['text'],
            arrowprops=dict(
                arrowstyle='->',
                color=colors['text'],
                connectionstyle='arc3,rad=0.2'
            ),
            fontsize=14,
            horizontalalignment='center'
        )

        # Contributors annotation
        plt.annotate(
            "250+ amazing\ncontributors!",
            xy=(last_x, monthly_contributors.iloc[-1]),
            xytext=(last_x - 1, monthly_contributors.iloc[-1] * 12.0),
            color=colors['secondary'],
            arrowprops=dict(
                arrowstyle='->',
                color=colors['secondary'],
                connectionstyle='arc3,rad=0.1'
            ),
            fontsize=14,
            horizontalalignment='center'
        )

        # Save with high DPI for better quality
        plt.savefig(save_path,
                    dpi=150,
                    bbox_inches='tight',
                    facecolor=fig.get_facecolor(),
                    edgecolor='none')

    print(f"\nFinal statistics:")
    print(f"Total commits: {len(commits_data)}")
    print(f"Total unique contributors: {df['email'].nunique()}")
    print(f"Total stars: {monthly_stars.iloc[-1]}")

def main():
    # Setup paths
    script_dir = Path(__file__).parent
    star_history_path = script_dir / 'star-history.csv'
    image_path = script_dir / 'growth.png'

    # Get commit data
    commits = get_commit_data()

    # Create visualization
    create_growth_chart(star_history_path, commits, image_path)

if __name__ == '__main__':
    main()
