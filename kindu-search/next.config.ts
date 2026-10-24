import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Plusieurs package-lock.json existent (KND OS + Kindu Search) : on fixe la
  // racine de traçage pour éviter que Next remonte au dossier parent.
  outputFileTracingRoot: process.cwd(),
  // Le pont de démonstration est souvent ouvert via 127.0.0.1 en local.
  allowedDevOrigins: ['127.0.0.1'],
};

export default nextConfig;
