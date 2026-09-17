// Vercel serverless entry point.
//
// Vercel's Node.js runtime accepts a plain (req, res) handler, and an Express
// app is callable exactly like that — so instead of `app.listen()` (see
// src/main.ts, still used for local dev / non-Vercel hosting), we build the
// same Nest application on an Express adapter once per warm lambda instance
// and hand incoming requests straight to it.
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { type Express } from 'express';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AppModule } from '../src/app.module.js';

// Cache the in-flight bootstrap PROMISE, not just its resolved value — see
// the identical comment in the Super Admin backend's api/index.ts for the
// full race-condition rationale (a cold lambda instance routinely receives
// a CORS preflight immediately followed by the real request, before the
// first bootstrap() call resolves; caching only the resolved app lets both
// requests race to bootstrap concurrently, which can crash one outright).
let cachedAppPromise: Promise<Express> | null = null;

async function bootstrap(): Promise<Express> {
  const expressApp = express();
  const nestApp = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

  nestApp.setGlobalPrefix('api');
  nestApp.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
    credentials: true,
  });
  nestApp.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await nestApp.init();
  return expressApp;
}

// Diagnostic note: an uncaught rejection escaping this handler used to
// surface to Vercel only as a generic INTERNAL_FUNCTION_INVOCATION_FAILED
// with no detail in Runtime Logs. The try/catch and console.error calls
// below make the real failure (Prisma connection error, missing env var,
// and so on) visible in the logs instead.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!cachedAppPromise) {
      cachedAppPromise = bootstrap().catch((error) => {
        // Don't leave a rejected promise cached forever — let the next
        // request retry bootstrap instead of failing every request on this
        // instance for the rest of its lifetime.
        cachedAppPromise = null;
        console.error('[tenant-dashboard-backend] Nest bootstrap failed:', error);
        throw error;
      });
    }
    const app = await cachedAppPromise;
    app(req, res);
  } catch (error) {
    console.error('[tenant-dashboard-backend] Unhandled error while serving request:', error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json');
      res.end(
        JSON.stringify({
          message: 'Internal server error',
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    }
  }
}
