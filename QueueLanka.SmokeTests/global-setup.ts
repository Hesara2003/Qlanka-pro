import type { FullConfig } from "@playwright/test";

export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use?.baseURL as string | undefined;
  if (!baseURL) {
    throw new Error("Smoke tests require a baseURL. Set SMOKE_BASE_URL.");
  }

  const healthUrl = `${baseURL.replace(/\/$/, "")}/health`;
  let response: Response;

  try {
    response = await fetch(healthUrl);
  } catch (error) {
    throw new Error(
      `Smoke preflight failed: cannot reach ${healthUrl}. ${String(error)}`
    );
  }

  const body = await response.text();
  const lowerBody = body.toLowerCase();

  if (response.status === 403 && lowerBody.includes("web app is stopped")) {
    throw new Error(
      `Smoke preflight failed: target app is stopped at ${baseURL}. Start the app service or point SMOKE_BASE_URL to a running environment.`
    );
  }

  const uiBaseUrl = process.env.UI_BASE_URL;
  if (uiBaseUrl) {
    const uiUrl = uiBaseUrl.replace(/\/$/, "");

    try {
      const uiResponse = await fetch(uiUrl);
      if (!uiResponse.ok) {
        throw new Error(`Unexpected HTTP ${uiResponse.status}`);
      }
    } catch (error) {
      throw new Error(
        `Smoke preflight failed: cannot reach the frontend at ${uiUrl}. ${String(error)}`
      );
    }
  }
}
