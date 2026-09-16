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

let cachedApp: Express | null = null;

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
  if (!cachedApp) {
    cachedApp = await bootstrap();
  }
  cachedApp(req, res);
}
