// Supabase Edge Function: r2-presign-upload
// Deploy via: supabase functions deploy r2-presign-upload
// Environment variables needed in Supabase Dashboard -> Edge Functions -> Secrets:
// - R2_ACCOUNT_ID
// - R2_ACCESS_KEY_ID
// - R2_SECRET_ACCESS_KEY
// - R2_BUCKET_NAME
// - R2_PUBLIC_DOMAIN (e.g., https://pub-xxxxxx.r2.dev or https://media.yourdomain.com)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { S3Client, PutObjectCommand } from "npm:@aws-sdk/client-s3@3.500.0";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner@3.500.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { key, contentType, folder } = await req.json();

    if (!key) {
      return new Response(JSON.stringify({ error: "Missing key" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accountId = Deno.env.get("R2_ACCOUNT_ID");
    const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
    const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");
    const bucketName = Deno.env.get("R2_BUCKET_NAME") || "safarnama-media";
    const publicDomain = Deno.env.get("R2_PUBLIC_DOMAIN")?.replace(/\/+$/, "") || "";

    if (!accountId || !accessKeyId || !secretAccessKey) {
      return new Response(
        JSON.stringify({ error: "R2 credentials are not configured in edge function secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cloudflare R2 S3-Compatible Endpoint
    const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType || "application/octet-stream",
    });

    // 15-minute pre-signed upload URL
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });
    const publicUrl = publicDomain ? `${publicDomain}/${key}` : "";

    return new Response(
      JSON.stringify({ uploadUrl, publicUrl, key }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
