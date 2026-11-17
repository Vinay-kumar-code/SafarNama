/**
 * Cloudflare Worker: SafarNama Secure R2 Pre-signer & Media Handler
 * 
 * DEPLOYMENT OPTIONS:
 * 1. Cloudflare Dashboard -> Workers & Pages -> Create Application -> Create Worker
 * 2. Paste this file into the Worker Editor.
 * 3. In Settings -> Variables -> R2 Bucket Bindings:
 *    - Variable name: `MY_BUCKET` -> select your R2 Bucket
 * 4. In Settings -> Variables -> Environment Variables:
 *    - `R2_PUBLIC_DOMAIN` = https://pub-xxxxxx.r2.dev (or https://media.safarnama.travel)
 *    - `AUTH_SECRET` (optional, for token verification)
 */

import { AwsClient } from 'aws4fetch';

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // Route: POST /presign -> Generate signed PUT URL
    if (request.method === 'POST' && url.pathname.endsWith('/presign')) {
      try {
        const { key, contentType } = await request.json();

        if (!key) {
          return new Response(JSON.stringify({ error: 'Missing key parameter' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const aws = new AwsClient({
          accessKeyId: env.R2_ACCESS_KEY_ID,
          secretAccessKey: env.R2_SECRET_ACCESS_KEY,
          service: 's3',
          region: 'auto',
        });

        const r2Endpoint = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET_NAME}/${key}`;
        
        // Generate pre-signed URL with 15-minute expiration
        const signed = await aws.sign(r2Endpoint, {
          method: 'PUT',
          headers: {
            'Content-Type': contentType || 'application/octet-stream',
          },
          aws: {
            signQuery: true,
            expiresIn: 900,
          },
        });

        const publicUrl = env.R2_PUBLIC_DOMAIN
          ? `${env.R2_PUBLIC_DOMAIN.replace(/\/+$/, '')}/${key}`
          : '';

        return new Response(
          JSON.stringify({
            uploadUrl: signed.url,
            publicUrl,
            key,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Default route
    return new Response(
      JSON.stringify({ status: 'SafarNama R2 Media Worker Active' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  },
};
