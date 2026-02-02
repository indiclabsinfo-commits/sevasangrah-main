-- Run this in Supabase SQL Editor to check and fix the daily_expenses table

-- 1. Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'daily_expenses'
);

-- 2. If table exists, check its structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'daily_expenses'
ORDER BY ordinal_position;

-- 3. Drop and recreate the table with correct structure
DROP TABLE IF EXISTS daily_expenses CASCADE;

CREATE TABLE daily_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expense_category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_mode VARCHAR(50) DEFAULT 'CASH',
    receipt_number VARCHAR(100),
    hospital_id UUID,
    approved_by VARCHAR(255),
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_daily_expenses_date ON daily_expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_daily_expenses_hospital ON daily_expenses(hospital_id);

-- 5. Verify the table was created correctly
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'daily_expenses'
ORDER BY ordinal_position;
