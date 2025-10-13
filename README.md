# Lily Project - AI Companion

This is a real-time, voice-interactive AI companion application built with React, TypeScript, and the Gemini API.

## How It Works: In-Browser Transpilation

This project is written in React and TypeScript (`.tsx` files). Browsers cannot run this code directly. To make it work on GitHub Pages without requiring a local build setup (like Node.js, npm, Vite, etc.), this project uses **Babel Standalone**.

A script in `index.html` loads Babel, which automatically finds the `<script type="text/babel">` tag and transpiles the TypeScript/JSX code into plain JavaScript that the browser can execute on the fly. This makes deployment as simple as pushing your code to GitHub.

## How to Deploy to GitHub Pages

This project is configured to be deployed as a static site on GitHub Pages.

### Prerequisites

1.  A GitHub account.
2.  `git` installed on your local machine.
3.  A Google Gemini API key.

### Deployment Steps

1.  **Handle the API Key (Crucial Step):**
    Before anything else, you must manually insert your Gemini API key into the code. See the "A Note on the API Key" section below for detailed instructions.

2.  **Create a GitHub Repository:**
    Create a new, empty repository on your GitHub account.

3.  **Initialize Git and Push:**
    In your project folder, run the following commands, replacing `<your-username>` and `<your-repo-name>` with your details:
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    git branch -M main
    git remote add origin https://github.com/<your-username>/<your-repo-name>.git
    git push -u origin main
    ```

4.  **Configure GitHub Pages:**
    *   Go to your repository on GitHub.
    *   Click on the **"Settings"** tab.
    *   In the left sidebar, click on **"Pages"**.
    *   Under the "Build and deployment" section, for "Source", select **"Deploy from a branch"**.
    *   Under "Branch", select `main` and `/ (root)`.
    *   Click **"Save"**.

5.  **Wait for Deployment:**
    GitHub will start a deployment process. It might take a few minutes. Once it's done, your site will be live at `https://<your-username>.github.io/<your-repo-name>/`. You can find the URL on the same "Pages" settings screen.

---

### A Note on the API Key

**This is the most important step.** The application cannot work without a valid Gemini API key.

The code in `hooks/useLiveSession.ts` has a placeholder for your API key. You must replace it with your actual key before you push your code to GitHub.

**Follow these steps:**

1.  Open the file `hooks/useLiveSession.ts`.
2.  Find this line:
    ```typescript
    // IMPORTANT: Replace "YOUR_API_KEY_HERE" with your actual Gemini API key
    const ai = new GoogleGenAI({ apiKey: "YOUR_API_KEY_HERE" });
    ```
3.  Replace the `"YOUR_API_KEY_HERE"` string with your actual key, keeping the quotation marks:
    ```typescript
    // Example:
    const ai = new GoogleGenAI({ apiKey: "AIzaSy...your-very-long-api-key" });
    ```

> **Warning:** Be aware that doing this will make your API key visible in your site's public code. This is acceptable for a personal demo, but for a real application, you should use a backend server to protect your key. Do not commit your key to a public repository if you are concerned about its security.