#!/bin/bash

# Script to push schema to Supabase
# Usage: ./supabase/push-schema.sh

echo "📋 Pushing schema to Supabase..."
echo ""
echo "Please make sure you have:"
echo "1. Supabase CLI installed (npm install -g supabase)"
echo "2. Logged in to Supabase (supabase login)"
echo "3. Linked your project (supabase link --project-ref YOUR_PROJECT_REF)"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install it with: npm install -g supabase"
    exit 1
fi

# Push the schema
echo "🚀 Pushing schema..."
supabase db push --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" < supabase/schema.sql

echo ""
echo "✅ Schema pushed successfully!"
echo ""
echo "Alternatively, you can:"
echo "1. Go to your Supabase dashboard"
echo "2. Navigate to SQL Editor"
echo "3. Copy and paste the contents of supabase/schema.sql"
echo "4. Run the SQL"

