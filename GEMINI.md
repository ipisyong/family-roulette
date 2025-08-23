# GEMINI.md: Project "Family Roulette"

## Project Overview

This is a "Family Roulette" web application, designed as a single-page application using vanilla HTML, CSS, and JavaScript. Its core functionality is an interactive, SVG-based roulette wheel for making weighted random selections.

The application is enhanced with optional 3D visual effects powered by `three.js`, including particle explosions (confetti), dynamic lighting, and camera shake effects upon winning. It ensures fair selection by using the browser's built-in `crypto.getRandomValues` for random number generation.

Application state, specifically the list of roulette items and their properties (name, weight, color), is persisted locally in the user's browser via `localStorage`.

## Key Technologies

*   **Frontend:** HTML5, CSS3, Vanilla JavaScript (ESM)
*   **Graphics:** SVG for the roulette wheel, `three.js` for optional 3D effects.
*   **Deployment:** GitHub Actions for continuous deployment to GitHub Pages.

## File Structure

```
/
├── index.html          # Main application page
├── css/
│   └── styles.css      # Styles for the application
├── js/
│   ├── app.js          # Core application logic, UI, and state management
│   └── threefx.js      # three.js effects controller
├── .github/
│   └── workflows/
│       └── deploy.yml  # GitHub Actions workflow for deployment
└── README.md           # Project README
```

## Building and Running

This project consists of static files and does not require a build step.

### Local Development

To run the project locally, it is recommended to use a simple HTTP server to avoid potential browser restrictions on loading ES modules from the local filesystem.

1.  **Navigate to the project directory.**
2.  **Start a local server.** A common way is to use Python's built-in server:
    ```bash
    python3 -m http.server
    ```
3.  **Open your browser** and go to `http://localhost:8000` (or the port specified by your server).

### Deployment

The project is automatically deployed to GitHub Pages whenever changes are pushed to the `main` branch. The deployment process is defined in `.github/workflows/deploy.yml` and requires no manual intervention.

## Development Conventions

*   **Modularity:** The application logic is separated into two main files: `app.js` for the core functionality and `threefx.js` for the 3D effects.
*   **ES Modules:** The project uses native JavaScript modules (`import`/`export`).
*   **External Libraries:** `three.js` is loaded via a CDN, as specified in `js/threefx.js`.
*   **State Management:** The list of roulette items is stored in `localStorage`, allowing for persistence across sessions.
*   **Fairness:** Item selection is weighted and uses a cryptographically secure pseudo-random number generator (CSPRNG).

- 기능 수정 후, README에 개발 현황이나 변경된 스펙들을 제대로 반영해줄 것