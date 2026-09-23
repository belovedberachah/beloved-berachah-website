# Beloved Berachah CIC

[![Netlify Status](https://api.netlify.com/api/v1/badges/your-netlify-badge-id/deploy-status)](https://app.netlify.com/sites/belovedberachah/deploys)
[![11ty](https://img.shields.io/badge/11ty-Static%20Site%20Generator-black)](https://www.11ty.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-Framework-38B2AC)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8)](https://web.dev/progressive-web-apps/)

The official web platform and Progressive Web App (PWA) for **Beloved Berachah CIC**, a Community Interest Company dedicated to supporting women affected by trauma, addiction, domestic abuse, and mental health challenges.

This project is engineered for speed, accessibility, and offline resilience, ensuring that vital resources and emergency contacts are available to vulnerable users even without an internet connection.

---

## ✨ Key Features

* **Progressive Web App (PWA):** Fully installable on iOS and Android devices directly from the browser. Features a seamless native-style launch with a custom splash screen and `sessionStorage` logic to prevent animation looping.
* **Offline Emergency Mode:** A custom Service Worker (`sw.js`) intercepts network failures to serve a hardcoded, highly-styled offline page providing 24/7 UK crisis helpline numbers if a user loses connection.
* **Static Site Generation:** Built with Eleventy (11ty) for lightning-fast page loads, strict SEO compliance, and excellent Lighthouse scores.
* **Modern Styling:** UI designed using Tailwind CSS with a custom color palette (Slate and Amber) and premium typography (Playfair Display and Inter).
* **Serverless Bookings & Contact:** Integrated with Web3Forms to handle event booking and general enquiries securely without requiring a backend database. Forms include strict legal acknowledgment checkboxes.
* **Content Management (CMS):** Configured for Decap CMS, allowing organization leaders to publish news, blog posts, and events dynamically via a user-friendly dashboard.
* **Compliance & Legal:** Includes comprehensive, dynamically linked policies (Terms, Privacy, Cookies, Safeguarding) and a custom Javascript Cookie Consent manager.

---

## 🏗️ Tech Stack

* **Core:** HTML5, Vanilla JavaScript
* **CSS Framework:** Tailwind CSS
* **Static Site Generator:** Eleventy (11ty)
* **Hosting & CI/CD:** Netlify
* **Form Handling:** Web3Forms
* **Content Management:** Decap CMS

---

## 🚀 Local Development Setup

To run this project locally, ensure you have **Node.js** and **Git** installed on your machine.

### 1. Clone the repository

<!-- markdownlint-disable MD034 -->
```bash
git clone [https://github.com/your-username/beloved-berachah.git](https://github.com/your-username/beloved-berachah.git)
cd beloved-berachah
