import { createStart, createMiddleware } from "@tanstack/react-start";
import { isRedirect, isNotFound } from "@tanstack/react-router";
import { renderErrorPage } from "./lib/error-page";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error: any) {
    // If it's a redirect or explicit Response object, rethrow so TanStack Start processes the redirect/response
    if (
      isRedirect(error) ||
      error instanceof Response ||
      (error != null &&
        typeof error === "object" &&
        "statusCode" in error &&
        error.statusCode >= 300 &&
        error.statusCode < 400)
    ) {
      throw error;
    }

    // Handle 404 Not Found cleanly
    if (
      isNotFound(error) ||
      (error != null &&
        typeof error === "object" &&
        "statusCode" in error &&
        error.statusCode === 404)
    ) {
      return new Response("404 Not Found", {
        status: 404,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    // Log the actual underlying SSR error to server stdout/stderr
    console.error("SSR Middleware caught unhandled error:", error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware],
}));

