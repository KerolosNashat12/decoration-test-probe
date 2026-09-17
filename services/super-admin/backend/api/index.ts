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

// Cache the in-flight bootstrap PROMISE, not just its resolved value. A cold
// lambda instance routinely receives a CORS preflight (OPTIONS) immediately
// followed by the real request (POST) before the first bootstrap() call has
// resolved. If we only cached the resolved app, both requests would see
// `cachedApp === null` and each kick off their own concurrent
// NestFactory.create() + Prisma connect + admin-seed — which can crash one
// of the two invocations outright (visible to the client as an opaque 503
// with no matching entry in the function logs, since the crash happens
// inside framework bootstrap before any of our own logging runs). Caching
// the promise means every concurrent request on a cold instance awaits the
// same single bootstrap.
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!cachedAppPromise) {
    cachedAppPromise = bootstrap().catch((error) => {
      // Don't leave a rejected promise cached forever — let the next
      // request retry bootstrap instead of failing every request on this
      // instance for the rest of its lifetime.
      cachedAppPromise = null;
      throw error;
    });
  }
  const app = await cachedAppPromise;
  app(req, res);
}
