# 🐺 FAUNA ECHO // Tactical Pet Recovery Network

> **Fauna Echo** is the world's first high-precision forensic pet recovery network. Licensed Recovery Agents use our tactical HUD, Biometric Nose Print Mapping, and Gait DNA Analysis powered by NVIDIA's advanced LLM and Vision models to track, verify, and recover missing pets.

---

## 🚀 Key Features

* **Tactical Agent HUD:** A cyber-themed, real-time React interface for field agents.
* **Biometric Nose Mapping:** Macro-capture pet nose papillae patterns (as accurate as human fingerprints).
* **Gait DNA Analysis:** Upload up to 30s of video for skeletal movement signature verification.
* **NVIDIA AI Integration:** Powered by `meta/llama-4-maverick-17b` and `meta/llama-3.2-90b-vision-instruct` via the NVIDIA API for high-precision forensic reporting.
* **Secure Biometric Archive:** A PostgreSQL-backed database of all verified subjects and captured forensic data.
* **Solana Wallet Integration:** Mocked instant crypto payout system upon verified recovery.

## 🛠️ Tech Stack

This project is structured as a **Turborepo Monorepo**:

* **Frontend (`apps/web`):** Next.js, React, modern CSS (HUD aesthetic).
* **Backend (`apps/f-api`):** NestJS, TypeScript, Multer (Video/Image Processing).
* **AI Provider:** NVIDIA API Catalog (Serverless Inference).
* **Package Manager:** `pnpm`

---

## 💻 Local Development Setup

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) and [pnpm](https://pnpm.io/) installed. You will also need an [NVIDIA API Key](https://build.nvidia.com/).

### 2. Install Dependencies
Navigate to the root of the project and run:
```bash
pnpm install