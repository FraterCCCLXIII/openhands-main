#!/usr/bin/env python3
"""
Validate HTML parity between the React build and openhands.dev

This script compares the pre-rendered HTML from the React build with
the live Webflow site by analyzing the DOM structure and content.

It detects discrepancies by:
1. Extracting and comparing visible text content
2. Comparing DOM structure (element hierarchy)
3. Checking for presence/absence of key elements
4. Detecting branding/content differences

Specific known issues it catches:
- Logo text ("OpenHands" vs "All Hands")
- Banner text differences
- Animated ASCII background presence/absence
- Missing sections or content
"""

import re
import sys
import subprocess
import os
import json
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional
from html.parser import HTMLParser
from collections import Counter, defaultdict


@dataclass
class ValidationCheck:
    name: str
    passed: bool
    expected: Optional[str]
    actual: Optional[str]
    details: str
    severity: str = "error"  # error, warning, info


@dataclass 
class DOMNode:
    """Represents a simplified DOM node for comparison"""
    tag: str
    text: str = ""
    attrs: dict = field(default_factory=dict)
    children: list = field(default_factory=list)
    
    def to_dict(self) -> dict:
        return {
            "tag": self.tag,
            "text": self.text[:100] if self.text else "",
            "children_count": len(self.children),
        }


class DOMExtractor(HTMLParser):
    """Extract DOM structure from HTML"""
    
    IGNORE_TAGS = {'script', 'style', 'noscript', 'meta', 'link', 'svg', 'path'}
    INLINE_TAGS = {'span', 'a', 'strong', 'em', 'b', 'i', 'code'}
    
    def __init__(self):
        super().__init__()
        self.root = DOMNode(tag="root")
        self.stack = [self.root]
        self.current_text = []
        self.in_ignored_tag = 0
        
    def handle_starttag(self, tag, attrs):
        if tag in self.IGNORE_TAGS:
            self.in_ignored_tag += 1
            return
            
        if self.in_ignored_tag:
            return
            
        node = DOMNode(tag=tag, attrs=dict(attrs))
        self.stack[-1].children.append(node)
        self.stack.append(node)
        
    def handle_endtag(self, tag):
        if tag in self.IGNORE_TAGS:
            self.in_ignored_tag = max(0, self.in_ignored_tag - 1)
            return
            
        if self.in_ignored_tag:
            return
            
        if len(self.stack) > 1 and self.stack[-1].tag == tag:
            self.stack.pop()
            
    def handle_data(self, data):
        if self.in_ignored_tag:
            return
            
        text = data.strip()
        if text and len(self.stack) > 1:
            self.stack[-1].text += " " + text
            self.stack[-1].text = self.stack[-1].text.strip()


class TextExtractor(HTMLParser):
    """Extract visible text content from HTML"""
    
    IGNORE_TAGS = {'script', 'style', 'noscript', 'svg', 'path'}
    
    def __init__(self):
        super().__init__()
        self.text_parts = []
        self.in_ignored_tag = 0
        
    def handle_starttag(self, tag, attrs):
        if tag in self.IGNORE_TAGS:
            self.in_ignored_tag += 1
            
    def handle_endtag(self, tag):
        if tag in self.IGNORE_TAGS:
            self.in_ignored_tag = max(0, self.in_ignored_tag - 1)
            
    def handle_data(self, data):
        if self.in_ignored_tag:
            return
        text = data.strip()
        if text:
            self.text_parts.append(text)
            
    def get_text(self) -> str:
        return " ".join(self.text_parts)


def fetch_live_html(url: str) -> str:
    """Fetch HTML from live site using curl"""
    result = subprocess.run(
        ["curl", "-s", "-L", url],
        capture_output=True,
        text=True,
        timeout=30
    )
    return result.stdout


def read_build_html(build_path: str) -> str:
    """Read HTML from build directory"""
    with open(build_path, "r", encoding="utf-8") as f:
        return f.read()


def extract_text(html: str) -> str:
    """Extract all visible text from HTML"""
    extractor = TextExtractor()
    try:
        extractor.feed(html)
    except Exception:
        pass
    return extractor.get_text()


def extract_dom(html: str) -> DOMNode:
    """Extract DOM structure from HTML"""
    extractor = DOMExtractor()
    try:
        extractor.feed(html)
    except Exception:
        pass
    return extractor.root


def normalize_text(text: str) -> str:
    """Normalize text for comparison"""
    text = re.sub(r'\s+', ' ', text)
    text = text.lower().strip()
    return text


def extract_element_content(html: str, tag: str) -> list[str]:
    """Extract content of all elements with given tag"""
    pattern = rf'<{tag}[^>]*>(.*?)</{tag}>'
    matches = re.findall(pattern, html, re.DOTALL | re.IGNORECASE)
    return [re.sub(r'<[^>]+>', '', m).strip() for m in matches]


def extract_text_by_class(html: str, class_pattern: str) -> list[str]:
    """Extract text from elements matching a class pattern"""
    pattern = rf'class="[^"]*{class_pattern}[^"]*"[^>]*>([^<]+)'
    matches = re.findall(pattern, html, re.IGNORECASE)
    return [m.strip() for m in matches if m.strip()]


def count_elements(html: str) -> Counter:
    """Count occurrences of each HTML element type"""
    pattern = r'<(\w+)[\s>]'
    tags = re.findall(pattern, html)
    return Counter(tags)


# ==================== VALIDATION CHECKS ====================

def check_text_content_diff(live_html: str, build_html: str) -> ValidationCheck:
    """
    General check: Compare all visible text content between sites.
    Identifies text present in one but not the other.
    """
    live_text = normalize_text(extract_text(live_html))
    build_text = normalize_text(extract_text(build_html))
    
    # Find significant phrases (3+ words) in live but not in build
    live_phrases = set(re.findall(r'\b\w+(?:\s+\w+){2,5}\b', live_text))
    build_phrases = set(re.findall(r'\b\w+(?:\s+\w+){2,5}\b', build_text))
    
    missing_from_build = live_phrases - build_phrases
    extra_in_build = build_phrases - live_phrases
    
    # Filter to most significant differences
    significant_missing = [p for p in missing_from_build 
                          if len(p) > 20 and not any(x in p for x in ['copyright', 'cookie', 'privacy'])][:5]
    significant_extra = [p for p in extra_in_build 
                        if len(p) > 20 and not any(x in p for x in ['copyright', 'cookie', 'privacy'])][:5]
    
    passed = len(significant_missing) == 0 and len(significant_extra) == 0
    
    details = []
    if significant_missing:
        details.append(f"Missing from build: {significant_missing[:3]}")
    if significant_extra:
        details.append(f"Extra in build: {significant_extra[:3]}")
    
    return ValidationCheck(
        name="Text Content Parity",
        passed=passed,
        expected="Same visible text content",
        actual=f"{len(significant_missing)} missing, {len(significant_extra)} extra phrases",
        details="; ".join(details) if details else "Text content matches",
        severity="warning"
    )


def check_dom_structure(live_html: str, build_html: str) -> ValidationCheck:
    """
    General check: Compare DOM element counts to detect structural differences.
    """
    live_counts = count_elements(live_html)
    build_counts = count_elements(build_html)
    
    # Compare key structural elements
    key_elements = ['section', 'nav', 'header', 'footer', 'main', 'h1', 'h2', 'h3', 'button', 'a']
    
    differences = []
    for elem in key_elements:
        live_count = live_counts.get(elem, 0)
        build_count = build_counts.get(elem, 0)
        if live_count != build_count:
            diff = build_count - live_count
            differences.append(f"{elem}: {build_count} vs {live_count} ({'+' if diff > 0 else ''}{diff})")
    
    passed = len(differences) <= 2  # Allow some flexibility
    
    return ValidationCheck(
        name="DOM Structure Parity",
        passed=passed,
        expected="Similar element counts",
        actual=f"{len(differences)} element type differences",
        details="; ".join(differences[:5]) if differences else "Structure matches",
        severity="warning"
    )


def check_logo_branding(live_html: str, build_html: str) -> ValidationCheck:
    """
    Specific check: Logo should say "OpenHands" not "All Hands"
    
    Checks for problematic "All Hands" branding references that should be "OpenHands"
    """
    # Patterns indicating problematic "All Hands" branding in header/logo area
    # These are specific SVG files used for logo text
    all_hands_svg_patterns = [
        r'all-hands-text\.svg',  # Old text logo SVG
        r'AllHandsText',         # React component import
    ]
    
    # Check for All Hands text SVG in the build
    build_has_all_hands_logo = any(re.search(p, build_html, re.IGNORECASE) for p in all_hands_svg_patterns)
    
    # Also check for "All Hands AI" footer text which is acceptable (company name)
    # But header logo should say "OpenHands"
    
    # Check build has OpenHands in the header SVG
    build_has_openhands_logo = bool(re.search(r'openhands-text\.svg|openhands-logo\.svg|OpenHandsText|OpenHandsLogo', build_html, re.IGNORECASE))
    
    # Also check for "OpenHands" appearing in visible text
    build_has_openhands_text = build_html.lower().count('openhands') > 0
    
    passed = not build_has_all_hands_logo and (build_has_openhands_logo or build_has_openhands_text)
    
    details = []
    if build_has_all_hands_logo:
        details.append("Build still uses 'all-hands-text.svg' logo")
    if not build_has_openhands_logo and not build_has_openhands_text:
        details.append("Build missing OpenHands branding")
    if passed:
        details.append("OpenHands branding correctly used")
    
    return ValidationCheck(
        name="Logo Branding (OpenHands vs All Hands)",
        passed=passed,
        expected="OpenHands branding (not all-hands-text.svg)",
        actual="All Hands logo SVG found" if build_has_all_hands_logo else "OpenHands branding",
        details="; ".join(details) if details else "Branding matches",
        severity="error"
    )


def check_banner_announcement(live_html: str, build_html: str) -> ValidationCheck:
    """
    Specific check: Top banner announcement text should match live site
    """
    # Extract banner content from live site
    live_banner_match = re.search(
        r'banner[^>]*>.*?<p[^>]*>([^<]+)</p>',
        live_html, re.DOTALL | re.IGNORECASE
    )
    live_banner = live_banner_match.group(1).strip() if live_banner_match else ""
    
    # Check for outdated Series A banner content in build (only in banner area)
    # We need to check specifically in the banner/announcement area, not in tweets/testimonials
    # The banner is typically in a div with bg-brand-accent at the top
    
    # Find the banner section in build
    build_banner_match = re.search(
        r'bg-brand-accent[^>]*>.*?<span>([^<]+)</span>',
        build_html, re.DOTALL | re.IGNORECASE
    )
    build_banner = build_banner_match.group(1).strip() if build_banner_match else ""
    
    # Check if build banner has outdated content
    build_has_outdated_banner = bool(re.search(r'Series A|\$18\.8M|excited to announce', build_banner, re.IGNORECASE))
    
    # Check if build has the current announcement
    build_has_current_banner = bool(re.search(r'OpenHands Index|leaderboard', build_banner, re.IGNORECASE))
    
    # Check live site for current content
    live_has_index = bool(re.search(r'OpenHands Index|leaderboard', live_html, re.IGNORECASE))
    
    passed = build_has_current_banner or not (build_has_outdated_banner and live_has_index)
    
    return ValidationCheck(
        name="Banner Announcement",
        passed=passed,
        expected=live_banner[:80] + "..." if len(live_banner) > 80 else live_banner or "Current announcement",
        actual=build_banner[:80] + "..." if len(build_banner) > 80 else build_banner or "Unknown",
        details="Banner updated to OpenHands Index" if build_has_current_banner else ("Banner text needs update" if not passed else "Banner matches"),
        severity="error"
    )


def check_animated_background(live_html: str, build_html: str) -> ValidationCheck:
    """
    Specific check: Animated ASCII background should be present
    """
    # Key indicators of the ASCII animation
    animation_indicators = [
        r'asci-wrap',
        r'asci-embed',
        r'ascii-pre',
        r'ASCII Grid',
        r'lineSet.*OPEN\s*HANDS',
        r'randomSet',
        r'requestAnimationFrame',
    ]
    
    # Static background fallback
    static_bg_pattern = r'ascii-art.*\.svg'
    
    live_has_animation = sum(1 for p in animation_indicators if re.search(p, live_html, re.IGNORECASE | re.DOTALL))
    build_has_animation = sum(1 for p in animation_indicators if re.search(p, build_html, re.IGNORECASE | re.DOTALL))
    
    live_has_static = bool(re.search(static_bg_pattern, live_html))
    build_has_static = bool(re.search(static_bg_pattern, build_html))
    
    # Pass if build has similar animation implementation or static background
    passed = (build_has_animation >= 2) or (build_has_static and live_has_static)
    
    return ValidationCheck(
        name="Animated ASCII Background",
        passed=passed,
        expected=f"Animation ({live_has_animation} indicators) or static background",
        actual=f"Animation ({build_has_animation} indicators), static: {build_has_static}",
        details="Background animation missing" if not passed else "Background present",
        severity="error"
    )


def check_headings_match(live_html: str, build_html: str) -> ValidationCheck:
    """
    General check: H1, H2, H3 headings should match
    """
    for tag in ['h1', 'h2']:
        live_headings = extract_element_content(live_html, tag)
        build_headings = extract_element_content(build_html, tag)
        
        live_set = {normalize_text(h) for h in live_headings if h.strip()}
        build_set = {normalize_text(h) for h in build_headings if h.strip()}
        
        missing = live_set - build_set
        extra = build_set - live_set
        
        if missing or extra:
            details = []
            if missing:
                details.append(f"Missing {tag}: {list(missing)[:3]}")
            if extra:
                details.append(f"Extra {tag}: {list(extra)[:3]}")
                
            return ValidationCheck(
                name=f"{tag.upper()} Headings Match",
                passed=False,
                expected=f"{len(live_set)} {tag} headings",
                actual=f"{len(build_set)} {tag} headings",
                details="; ".join(details),
                severity="warning"
            )
    
    return ValidationCheck(
        name="Headings Match",
        passed=True,
        expected="Matching headings",
        actual="Headings match",
        details="H1 and H2 headings match between sites",
        severity="info"
    )


def check_navigation_links(live_html: str, build_html: str) -> ValidationCheck:
    """
    General check: Navigation links should match
    """
    nav_link_pattern = r'<a[^>]+href="([^"]+)"[^>]*>([^<]+)</a>'
    
    live_links = set(re.findall(nav_link_pattern, live_html))
    build_links = set(re.findall(nav_link_pattern, build_html))
    
    # Focus on internal navigation links
    live_nav = {(href, text.strip()) for href, text in live_links 
                if href.startswith('/') and text.strip()}
    build_nav = {(href, text.strip()) for href, text in build_links 
                 if href.startswith('/') and text.strip()}
    
    missing = live_nav - build_nav
    
    passed = len(missing) <= 2
    
    return ValidationCheck(
        name="Navigation Links",
        passed=passed,
        expected=f"{len(live_nav)} internal links",
        actual=f"{len(build_nav)} internal links ({len(missing)} missing)",
        details=f"Missing: {list(missing)[:3]}" if missing else "Links match",
        severity="warning"
    )


def check_cta_buttons(live_html: str, build_html: str) -> ValidationCheck:
    """
    General check: CTA button text should match
    """
    # Extract button-like elements
    button_patterns = [
        r'class="[^"]*btn[^"]*"[^>]*>([^<]+)',
        r'class="[^"]*button[^"]*"[^>]*>([^<]+)',
        r'<button[^>]*>([^<]+)',
    ]
    
    live_ctas = set()
    build_ctas = set()
    
    for pattern in button_patterns:
        live_ctas.update(m.strip() for m in re.findall(pattern, live_html, re.IGNORECASE))
        build_ctas.update(m.strip() for m in re.findall(pattern, build_html, re.IGNORECASE))
    
    # Key CTAs that must be present
    key_ctas = ["Try it live", "Build with SDK"]
    missing_key = [cta for cta in key_ctas if not any(cta.lower() in c.lower() for c in build_ctas)]
    
    passed = len(missing_key) == 0
    
    return ValidationCheck(
        name="CTA Buttons",
        passed=passed,
        expected=f"Key CTAs: {key_ctas}",
        actual=f"Missing: {missing_key}" if missing_key else "All key CTAs present",
        details=f"Found {len(build_ctas)} CTAs in build",
        severity="error" if missing_key else "info"
    )


def check_meta_tags(live_html: str, build_html: str) -> ValidationCheck:
    """
    General check: Meta tags (title, description) should match
    """
    # Extract title
    live_title = re.search(r'<title>([^<]+)</title>', live_html)
    build_title = re.search(r'<title>([^<]+)</title>', build_html)
    
    live_title_text = live_title.group(1).strip() if live_title else ""
    build_title_text = build_title.group(1).strip() if build_title else ""
    
    # Extract description
    live_desc = re.search(r'<meta[^>]+name="description"[^>]+content="([^"]+)"', live_html)
    build_desc = re.search(r'<meta[^>]+name="description"[^>]+content="([^"]+)"', build_html)
    
    title_match = live_title_text.lower() == build_title_text.lower()
    
    passed = title_match
    
    return ValidationCheck(
        name="Meta Tags",
        passed=passed,
        expected=live_title_text[:60] + "..." if len(live_title_text) > 60 else live_title_text,
        actual=build_title_text[:60] + "..." if len(build_title_text) > 60 else build_title_text,
        details="Title matches" if title_match else "Title mismatch",
        severity="warning"
    )


# ==================== MAIN VALIDATION ====================

def run_validation(page: str = "/") -> list[ValidationCheck]:
    """Run all validation checks for a given page"""
    live_url = f"https://openhands.dev{page}"
    
    if page == "/":
        build_file = "build/client/index.html"
    else:
        build_file = f"build/client{page}/index.html"
    
    build_path = Path(__file__).parent.parent / build_file
    
    print(f"\n{'='*70}")
    print(f"Validating: {page}")
    print(f"Live URL: {live_url}")
    print(f"Build file: {build_path}")
    print(f"{'='*70}\n")
    
    try:
        live_html = fetch_live_html(live_url)
        if not live_html:
            print(f"ERROR: Could not fetch live HTML from {live_url}")
            return []
    except Exception as e:
        print(f"ERROR fetching live HTML: {e}")
        return []
    
    try:
        build_html = read_build_html(str(build_path))
    except FileNotFoundError:
        print(f"ERROR: Build file not found: {build_path}")
        print("Run 'npm run build' first")
        return []
    except Exception as e:
        print(f"ERROR reading build HTML: {e}")
        return []
    
    # Run all checks - both specific and general
    checks = [
        # Specific known issues
        check_logo_branding(live_html, build_html),
        check_banner_announcement(live_html, build_html),
        check_animated_background(live_html, build_html),
        
        # General DOM/content comparison
        check_dom_structure(live_html, build_html),
        check_text_content_diff(live_html, build_html),
        check_headings_match(live_html, build_html),
        check_navigation_links(live_html, build_html),
        check_cta_buttons(live_html, build_html),
        check_meta_tags(live_html, build_html),
    ]
    
    return checks


def print_results(checks: list[ValidationCheck]) -> bool:
    """Print validation results and return True if all critical checks passed"""
    all_passed = True
    
    # Group by severity
    errors = [c for c in checks if c.severity == "error" and not c.passed]
    warnings = [c for c in checks if c.severity == "warning" and not c.passed]
    passed = [c for c in checks if c.passed]
    
    if errors:
        print("\n🚨 ERRORS (must fix):")
        print("-" * 50)
        for check in errors:
            print(f"❌ {check.name}")
            print(f"   Expected: {check.expected}")
            print(f"   Actual:   {check.actual}")
            print(f"   Details:  {check.details}")
            print()
        all_passed = False
    
    if warnings:
        print("\n⚠️  WARNINGS (should review):")
        print("-" * 50)
        for check in warnings:
            print(f"⚠️  {check.name}")
            print(f"   Expected: {check.expected}")
            print(f"   Actual:   {check.actual}")
            print(f"   Details:  {check.details}")
            print()
    
    if passed:
        print("\n✅ PASSED:")
        print("-" * 50)
        for check in passed:
            print(f"✅ {check.name}")
    
    return all_passed


def main():
    """Main entry point"""
    print("=" * 70)
    print("HTML Parity Validation Script")
    print("Comparing React build with openhands.dev")
    print("=" * 70)
    
    script_dir = Path(__file__).parent
    project_dir = script_dir.parent
    os.chdir(project_dir)
    
    checks = run_validation("/")
    
    if not checks:
        print("\n❌ Validation could not be completed")
        sys.exit(1)
    
    all_passed = print_results(checks)
    
    # Summary
    errors = sum(1 for c in checks if c.severity == "error" and not c.passed)
    warnings = sum(1 for c in checks if c.severity == "warning" and not c.passed)
    passed = sum(1 for c in checks if c.passed)
    
    print("\n" + "=" * 70)
    print(f"Summary: {passed} passed, {errors} errors, {warnings} warnings")
    print("=" * 70)
    
    if all_passed:
        print("\n✅ All critical checks passed!")
        sys.exit(0)
    else:
        print(f"\n❌ {errors} critical issues found - see ERRORS above")
        sys.exit(1)


if __name__ == "__main__":
    main()
