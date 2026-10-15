# CivicShield — Road Hazard Reporting System

CivicShield is a student project built with **Java 17 + Spring Boot** as the main application component. Spring Boot serves the web interface and REST API; the UI uses HTML, CSS, JavaScript, and Leaflet/OpenStreetMap for map views.

## Important: GitHub Pages vs Java

GitHub is used to store and manage the source code. **GitHub Pages cannot run a Java/Spring Boot backend.** To make the complete Java application available online without installing development tools on your computer, put this project in a GitHub repository and deploy it using a cloud host such as Render. Render builds the Java app from this repository using the included `Dockerfile` and `render.yaml`.

## Features

- Responsive dashboard with report statistics
- Create and search road-hazard reports
- Filter reports by status and severity
- Interactive OpenStreetMap map
- Update report statuses
- Insights summaries
- Spring Boot REST API and JPA persistence
- H2 database for a simple demonstration setup

## Publish online without installing software on your computer

### 1. Upload the project to GitHub using your browser

1. Download and extract the project ZIP on your computer.
2. Sign in at [GitHub](https://github.com/) and create a new repository named `CivicShield`.
3. Choose **Add file → Upload files**.
4. Upload the *contents* of the extracted `CivicShield` folder (including `pom.xml`, `Dockerfile`, `render.yaml`, `src/`, and this README). Do not upload only the ZIP file.
5. Commit the files to the repository's main branch.

### 2. Deploy the Java web application

1. Open [Render](https://render.com/) and sign up/sign in.
2. Choose **New → Blueprint** (or create a new Web Service from your GitHub repository).
3. Connect the `CivicShield` repository and let Render detect the included `render.yaml` and `Dockerfile`.
4. Start the deployment and wait for the build to finish.
5. Open the public `*.onrender.com` URL Render gives you. The website and Java API are served from that address.

The first build can take a few minutes. Free hosting availability, sleep behavior, and limits are controlled by the hosting provider and may change.

## Run locally (optional; not required for cloud deployment)

Requires Java 17+ and Maven 3.8+:

```bash
mvn spring-boot:run
```

Then open `http://localhost:8080`.

## REST API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/reports` | List reports |
| POST | `/api/reports` | Create a report |
| PATCH | `/api/reports/{id}/status` | Update report status |
| DELETE | `/api/reports/{id}` | Delete a report |
| GET | `/api/stats` | Dashboard statistics |

## Database and prototype limitations

The starter uses an H2 file database. On cloud hosts with ephemeral filesystems, data may be lost when the service restarts or is redeployed. For durable public use, configure a managed PostgreSQL database and update the datasource settings. This prototype does not yet provide user authentication, role-based permissions, real photo uploads, or official municipal integration. Do not use it as an emergency dispatch service. Verify all citizen-submitted reports before acting on them.
