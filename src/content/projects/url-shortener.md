---
title: "URL Shortener API"
description: "Build a URL shortener with analytics — track clicks, referrers, and geographic data."
tags: ["api", "backend", "database"]
---

# URL Shortener API

Build a fully functional URL shortener service with click analytics.

## What You'll Build

A REST API that shortens URLs and tracks:
- Total clicks per short link
- Referrer sources
- Geographic distribution
- Time-series click data

## Features

- **Short code generation** — Base62 encoding for compact URLs
- **Click tracking** — Record every visit with metadata
- **Analytics dashboard** — Visualize click patterns over time
- **Rate limiting** — Prevent abuse with configurable limits
- **Custom aliases** — Let users choose their own short codes

## Tech Stack

- Python 3.12+
- FastAPI for the REST API
- SQLite for storage
- Charts for analytics visualization

## Stretch Goals

- [ ] Add QR code generation for each short URL
- [ ] Implement link expiration
- [ ] Add UTM parameter parsing
- [ ] Build a simple analytics dashboard
