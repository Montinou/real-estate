#!/bin/bash
# Install all required SDK packages for the real estate platform

echo "Installing SDK packages..."

npm install \
  @neondatabase/serverless \
  @upstash/redis \
  @upstash/qstash \
  ai \
  @ai-sdk/google \
  @google/generative-ai \
  groq-sdk \
  @huggingface/inference \
  imagekit-javascript \
  @sentry/nextjs \
  @stackframe/stack \
  @aws-sdk/client-s3 \
  @aws-sdk/lib-storage

echo "✅ SDK installation complete!"
echo ""
echo "Verifying installations..."
npm list --depth=0 | grep -E "(neon|upstash|ai|groq|hugging|imagekit|sentry|stack|aws-sdk)"
