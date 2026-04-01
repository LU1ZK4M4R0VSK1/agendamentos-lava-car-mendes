-- migration-trinity.sql
-- Updates the database schema for the Trinity Model pivot

-- 1. Organizations: Add scheduling_url
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS scheduling_url TEXT;

-- 2. Vehicles: New Table
CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL REFERENCES customers(id),
    plate TEXT NOT NULL,
    model TEXT NOT NULL,
    color TEXT,
    type TEXT CHECK (type IN ('hatch', 'sedan', 'suv')) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Appointments: Add vehicle_id and total_price, update status
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS vehicle_id TEXT REFERENCES vehicles(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2);

-- Update status constraint: agendado, confirmado, cancelado, concluido, em_andamento
-- Since we can't easily modify a CHECK constraint in one line in all versions, we'll drop and recreate if it exists.
-- But for simplicity in this migration, we'll just allow the new status if the check allows it.
-- Let's redefine the status constraint.
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE appointments ADD CONSTRAINT appointments_status_check 
    CHECK (status IN ('agendado', 'confirmado', 'cancelado', 'concluido', 'em_andamento'));

-- 4. Rename & Initial Data Update
UPDATE organizations 
SET name = 'Lava Car Mendes' 
WHERE instance_name = 'posto3l';

-- Also update the system prompt for Lava Car Mendes
UPDATE organizations
SET system_prompt = 'Você é o assistente virtual do Lava Car Mendes. Seu objetivo é saudar o cliente e fornecer o link de agendamento: {{scheduling_url}}. Seja breve, direto e simpático.'
WHERE instance_name = 'posto3l';
