"""
Beehiiv Growth Prediction Tool
Analyzes newsletter metrics and predicts target achievement by March 31, 2026.
"""

import requests
import json
import time
from datetime import datetime, timezone
from statistics import mean
from pathlib import Path

# Configuration
API_KEY = "VhYyKKTmtmwtPcNyPaGsH14ipeDwmksxqKgkYpk3GfCLYvxeAIoeDT9mfMzd6e7u"
BASE_URL = "https://api.beehiiv.com/v2"
CONTENT_DOMAIN = "inquisitr.com"

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Targets
TARGET_SUBS = 30000
TARGET_OPEN_RATE_MIN = 35
TARGET_OPEN_RATE_MAX = 40
TARGET_CTOR_MIN = 16
TARGET_CTOR_MAX = 17
TARGET_TRAFFIC = 3000
DEADLINE = datetime(2026, 3, 31, tzinfo=timezone.utc)

# Rate limiting delay (ms)
RATE_LIMIT_DELAY = 0.2


def api_request(endpoint, params=None):
    """Make an API request with rate limiting and error handling."""
    time.sleep(RATE_LIMIT_DELAY)
    url = f"{BASE_URL}{endpoint}"
    try:
        response = requests.get(url, headers=HEADERS, params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"API Error: {e}")
        return None


def get_publication():
    """Get publication ID and current stats."""
    data = api_request("/publications", {"expand[]": "stats"})
    if not data or "data" not in data or not data["data"]:
        raise Exception("Failed to fetch publication data")

    pub = data["data"][0]
    stats = pub.get("stats", {})

    return {
        "id": pub["id"],
        "name": pub.get("name", "Unknown"),
        "active_subscriptions": stats.get("active_subscriptions", 0),
        "average_open_rate": stats.get("average_open_rate", 0) * 100,  # Convert to percentage
        "average_click_rate": stats.get("average_click_rate", 0) * 100
    }


def get_posts(pub_id, limit=100):
    """Get recent posts with stats."""
    data = api_request(
        f"/publications/{pub_id}/posts",
        {"expand[]": "stats", "status": "confirmed", "limit": limit}
    )
    if not data or "data" not in data:
        return []

    posts = []
    for post in data["data"]:
        stats = post.get("stats", {})
        email_stats = stats.get("email", {})
        clicks = stats.get("clicks", [])

        unique_opens = email_stats.get("unique_opens", 0)
        unique_clicks = email_stats.get("unique_clicks", 0)

        # Calculate CTOR
        ctor = (unique_clicks / unique_opens * 100) if unique_opens > 0 else 0

        # Calculate article clicks (traffic to content domain)
        article_clicks = sum(
            click.get("total_clicks", 0)
            for click in clicks
            if CONTENT_DOMAIN in click.get("url", "").lower()
        )

        # Parse publish date
        publish_date = post.get("publish_date")
        if publish_date:
            publish_dt = datetime.fromtimestamp(publish_date, tz=timezone.utc)
        else:
            publish_dt = None

        # Get open rate (normalize to percentage)
        open_rate = email_stats.get("open_rate", 0)
        if open_rate < 1:  # Decimal format
            open_rate *= 100

        posts.append({
            "id": post.get("id"),
            "title": post.get("title", "Untitled"),
            "publish_date": publish_dt,
            "recipients": email_stats.get("recipients", 0),
            "unique_opens": unique_opens,
            "unique_clicks": unique_clicks,
            "open_rate": open_rate,
            "ctor": ctor,
            "article_clicks": article_clicks
        })

    return posts


def get_subscriber_growth(pub_id):
    """Get subscriber data with pagination to calculate growth."""
    subscribers = []
    cursor = None

    while True:
        params = {"status": "active", "limit": 100}
        if cursor:
            params["cursor"] = cursor

        data = api_request(f"/publications/{pub_id}/subscriptions", params)
        if not data or "data" not in data:
            break

        for sub in data["data"]:
            created = sub.get("created")
            if created:
                created_dt = datetime.fromtimestamp(created, tz=timezone.utc)
                subscribers.append({
                    "created": created_dt,
                    "status": sub.get("status")
                })

        # Check for next page
        cursor = data.get("next_cursor")
        if not cursor or len(data["data"]) < 100:
            break

        # Safety limit to avoid excessive API calls
        if len(subscribers) >= 10000:
            print("Note: Limited subscriber fetch to 10,000 for performance")
            break

    return subscribers


def calculate_daily_growth(subscribers, days=30):
    """Calculate average daily growth over the specified period."""
    from datetime import timedelta
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=days)

    recent_subs = [s for s in subscribers if s["created"] >= cutoff]
    return len(recent_subs) / days if days > 0 else 0


def calculate_trend(values):
    """Determine if values are improving, declining, or stable."""
    if len(values) < 4:
        return "insufficient data"

    # Compare first half average to second half average
    mid = len(values) // 2
    first_half = mean(values[:mid])
    second_half = mean(values[mid:])

    diff_pct = ((second_half - first_half) / first_half * 100) if first_half > 0 else 0

    if diff_pct > 5:
        return "improving"
    elif diff_pct < -5:
        return "declining"
    else:
        return "stable"


def generate_recommendations(metrics):
    """Generate actionable recommendations based on gaps."""
    recommendations = []

    if metrics["sub_status"] == "BEHIND":
        gap = metrics["required_daily_growth"] - metrics["actual_daily_growth"]
        recommendations.append(
            f"Subscriber growth needs to increase by {gap:.1f} subs/day. "
            "Consider: referral programs, cross-promotions, or paid acquisition."
        )

    if metrics["avg_open_rate"] < TARGET_OPEN_RATE_MIN:
        recommendations.append(
            f"Open rate ({metrics['avg_open_rate']:.1f}%) is below target ({TARGET_OPEN_RATE_MIN}%). "
            "Test subject lines, optimize send times, and clean inactive subscribers."
        )

    if metrics["avg_ctor"] < TARGET_CTOR_MIN:
        recommendations.append(
            f"CTOR ({metrics['avg_ctor']:.1f}%) is below target ({TARGET_CTOR_MIN}%). "
            "Improve CTA placement, use more compelling link text, and ensure content matches subject promises."
        )

    if metrics["avg_traffic"] < TARGET_TRAFFIC:
        recommendations.append(
            f"Traffic per send ({metrics['avg_traffic']:.0f}) is below target ({TARGET_TRAFFIC}). "
            "Add more article links, use curiosity-driven teasers, and test link positioning."
        )

    if not recommendations:
        recommendations.append("All metrics are on track! Maintain current strategies and continue monitoring.")

    return recommendations[:3]  # Return top 3


def generate_report(pub_info, posts, subscribers):
    """Generate the prediction report."""
    now = datetime.now(timezone.utc)
    days_remaining = (DEADLINE - now).days

    # Filter posts with meaningful data (recipients > 100)
    valid_posts = [p for p in posts if p["recipients"] > 100][:20]

    # Subscriber calculations
    current_subs = pub_info["active_subscriptions"]
    subs_needed = TARGET_SUBS - current_subs
    required_daily_growth = subs_needed / days_remaining if days_remaining > 0 else 0
    actual_daily_growth = calculate_daily_growth(subscribers, 30)
    projected_subs = current_subs + (actual_daily_growth * days_remaining)

    if projected_subs >= TARGET_SUBS * 1.05:
        sub_status = "AHEAD"
    elif projected_subs >= TARGET_SUBS:
        sub_status = "ON TRACK"
    else:
        sub_status = "BEHIND"

    # Engagement metrics
    avg_open_rate = mean([p["open_rate"] for p in valid_posts]) if valid_posts else 0
    avg_ctor = mean([p["ctor"] for p in valid_posts]) if valid_posts else 0
    avg_traffic = mean([p["article_clicks"] for p in valid_posts]) if valid_posts else 0

    open_rate_status = "On Track" if TARGET_OPEN_RATE_MIN <= avg_open_rate <= TARGET_OPEN_RATE_MAX else "Below Target" if avg_open_rate < TARGET_OPEN_RATE_MIN else "Above Target"
    ctor_status = "On Track" if avg_ctor >= TARGET_CTOR_MIN else "Below Target"
    traffic_status = "On Track" if avg_traffic >= TARGET_TRAFFIC else "Below Target"

    # Trends
    open_rates = [p["open_rate"] for p in valid_posts]
    ctors = [p["ctor"] for p in valid_posts]

    open_trend = calculate_trend(open_rates)
    ctor_trend = calculate_trend(ctors)
    growth_trend = "stable"  # Would need historical data for accurate trend

    metrics = {
        "current_subs": current_subs,
        "projected_subs": projected_subs,
        "actual_daily_growth": actual_daily_growth,
        "required_daily_growth": required_daily_growth,
        "sub_status": sub_status,
        "avg_open_rate": avg_open_rate,
        "avg_ctor": avg_ctor,
        "avg_traffic": avg_traffic
    }

    recommendations = generate_recommendations(metrics)

    # Generate report text
    report = f"""
============================================================
         BEEHIIV GROWTH PREDICTION REPORT
         Generated: {now.strftime('%Y-%m-%d %H:%M:%S UTC')}
============================================================

SUBSCRIBER PROJECTION
------------------------------------------------------------
Current Subscribers:     {current_subs:,}
Target (Mar 31):         {TARGET_SUBS:,}
Gap:                     {subs_needed:,}
Days Remaining:          {days_remaining}

Current Daily Growth:    {actual_daily_growth:.1f} subs/day
Required Daily Growth:   {required_daily_growth:.1f} subs/day

Projected by Mar 31:     {projected_subs:,.0f}
Status:                  {sub_status}

ENGAGEMENT METRICS (Last {len(valid_posts)} Posts)
------------------------------------------------------------
                    Current     Target      Status
Open Rate:          {avg_open_rate:.1f}%        35-40%      {open_rate_status}
CTOR:               {avg_ctor:.1f}%        16-17%      {ctor_status}
Traffic/Send:       {avg_traffic:.0f}         3,000       {traffic_status}

TREND ANALYSIS
------------------------------------------------------------
Open Rate Trend:    {open_trend}
CTOR Trend:         {ctor_trend}
Growth Trend:       {growth_trend}

RECOMMENDATIONS
------------------------------------------------------------
"""
    for i, rec in enumerate(recommendations, 1):
        report += f"{i}. {rec}\n"

    report += "\n============================================================\n"

    # Prepare JSON data
    json_data = {
        "generated_at": now.isoformat(),
        "publication": pub_info,
        "targets": {
            "subscribers": TARGET_SUBS,
            "open_rate": {"min": TARGET_OPEN_RATE_MIN, "max": TARGET_OPEN_RATE_MAX},
            "ctor": {"min": TARGET_CTOR_MIN, "max": TARGET_CTOR_MAX},
            "traffic_per_send": TARGET_TRAFFIC,
            "deadline": DEADLINE.isoformat()
        },
        "current_metrics": {
            "subscribers": current_subs,
            "daily_growth": actual_daily_growth,
            "avg_open_rate": avg_open_rate,
            "avg_ctor": avg_ctor,
            "avg_traffic_per_send": avg_traffic
        },
        "projections": {
            "projected_subscribers": projected_subs,
            "days_remaining": days_remaining,
            "required_daily_growth": required_daily_growth,
            "subscriber_status": sub_status
        },
        "status": {
            "open_rate": open_rate_status,
            "ctor": ctor_status,
            "traffic": traffic_status
        },
        "trends": {
            "open_rate": open_trend,
            "ctor": ctor_trend,
            "growth": growth_trend
        },
        "recommendations": recommendations,
        "posts_analyzed": len(valid_posts),
        "post_details": [
            {
                "title": p["title"],
                "publish_date": p["publish_date"].isoformat() if p["publish_date"] else None,
                "recipients": p["recipients"],
                "open_rate": p["open_rate"],
                "ctor": p["ctor"],
                "article_clicks": p["article_clicks"]
            }
            for p in valid_posts
        ]
    }

    return report, json_data


def main():
    """Main execution function."""
    print("Fetching Beehiiv data...")

    # Step 1: Get publication info
    print("  - Getting publication info...")
    pub_info = get_publication()
    print(f"    Publication: {pub_info['name']}")
    print(f"    Active subscribers: {pub_info['active_subscriptions']:,}")

    # Step 2: Get posts
    print("  - Fetching recent posts...")
    posts = get_posts(pub_info["id"])
    print(f"    Retrieved {len(posts)} posts")

    # Step 3: Get subscriber growth data
    print("  - Fetching subscriber data (this may take a moment)...")
    subscribers = get_subscriber_growth(pub_info["id"])
    print(f"    Retrieved {len(subscribers)} subscriber records")

    # Generate report
    print("\nGenerating report...")
    report, json_data = generate_report(pub_info, posts, subscribers)

    # Output to console
    print(report)

    # Save files
    output_dir = Path(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)

    report_path = output_dir / "report.txt"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report)
    print(f"Report saved to: {report_path}")

    json_path = output_dir / "data.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(json_data, f, indent=2, default=str)
    print(f"Data saved to: {json_path}")


if __name__ == "__main__":
    main()
