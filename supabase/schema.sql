-- ============================================================
-- Cristal Desarrollos · Schema completo para Supabase
-- Ejecutar en Supabase SQL Editor (todo de una vez)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Enums
DO $$ BEGIN
  CREATE TYPE lot_status AS ENUM ('disponible', 'reservado', 'vendido', 'bloqueado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'manager', 'seller', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE reservation_status AS ENUM ('active', 'expired', 'converted', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE sale_status AS ENUM ('pending', 'signed', 'paid_in_full', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Profiles (extiende auth.users de Supabase)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(200) NOT NULL,
  email CITEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'seller',
  phone VARCHAR(50),
  commission_pct DECIMAL(5,2) NOT NULL DEFAULT 3.00,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Blocks (manzanas)
CREATE TABLE IF NOT EXISTS blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  code VARCHAR(20) NOT NULL,
  etapa SMALLINT NOT NULL DEFAULT 1,
  layout VARCHAR(20) NOT NULL DEFAULT 'perimeter24',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, code)
);

-- Lots
CREATE TABLE IF NOT EXISTS lots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  block_id UUID NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
  number INT NOT NULL,
  status lot_status NOT NULL DEFAULT 'disponible',
  area_m2 DECIMAL(10,2),
  list_price DECIMAL(14,2),       -- Precio de lista
  presale_price DECIMAL(14,2),    -- Precio en pre-venta (promocional)
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (block_id, number)
);

CREATE INDEX IF NOT EXISTS idx_lots_status ON lots(status);
CREATE INDEX IF NOT EXISTS idx_lots_block ON lots(block_id);

-- Clients
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(200) NOT NULL,
  document_id VARCHAR(50),
  email CITEXT,
  phone VARCHAR(50),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reservations
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE RESTRICT,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  status reservation_status NOT NULL DEFAULT 'active',
  reservation_amount DECIMAL(14,2),
  expires_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sales
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE RESTRICT,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  status sale_status NOT NULL DEFAULT 'pending',
  final_price DECIMAL(14,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  commission_pct DECIMAL(5,2) NOT NULL DEFAULT 3.00,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Status history
CREATE TABLE IF NOT EXISTS lot_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  from_status lot_status,
  to_status lot_status NOT NULL,
  changed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  reason VARCHAR(50),
  notes TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: auto create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'seller')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Vista expuesta a la app
CREATE OR REPLACE VIEW lots_view AS
SELECT
  l.id, l.number, l.status, l.area_m2, l.list_price, l.presale_price, l.currency, l.notes, l.updated_at,
  b.code AS block_code, b.etapa, b.layout
FROM lots l
JOIN blocks b ON b.id = l.block_id;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE lot_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth read profiles" ON profiles;
CREATE POLICY "auth read profiles" ON profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "self update profile" ON profiles;
CREATE POLICY "self update profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "auth read lots" ON lots;
CREATE POLICY "auth read lots" ON lots FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth update lots" ON lots;
CREATE POLICY "auth update lots" ON lots FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "auth read blocks" ON blocks;
CREATE POLICY "auth read blocks" ON blocks FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth read projects" ON projects;
CREATE POLICY "auth read projects" ON projects FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth all clients" ON clients;
CREATE POLICY "auth all clients" ON clients FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth all reservations" ON reservations;
CREATE POLICY "auth all reservations" ON reservations FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth all sales" ON sales;
CREATE POLICY "auth all sales" ON sales FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth all history" ON lot_status_history;
CREATE POLICY "auth all history" ON lot_status_history FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE lots;

-- ============================================================
-- SEED: Nuevo San Vicente · 28 manzanas · 644 lotes
-- ============================================================

INSERT INTO projects (id, name, slug, status)
VALUES ('00000000-0000-0000-0000-000000000010', 'Nuevo San Vicente', 'nuevo-san-vicente', 'active')
ON CONFLICT (slug) DO NOTHING;

DO $$
DECLARE
  v_project_id UUID := '00000000-0000-0000-0000-000000000010';
  v_block_id UUID;
  mz RECORD;
  i INT;
BEGIN
  FOR mz IN
    SELECT * FROM (VALUES
      ('Mz. 1',  24, 1, 'perimeter24'), ('Mz. 2',  24, 1, 'perimeter24'), ('Mz. 3',  24, 1, 'perimeter24'),
      ('Mz. 4',  24, 1, 'perimeter24'), ('Mz. 5',  24, 1, 'perimeter24'), ('Mz. 6',  24, 1, 'perimeter24'),
      ('Mz. 7',  24, 1, 'perimeter24'), ('Mz. 8',  24, 1, 'perimeter24'), ('Mz. 9',  24, 1, 'perimeter24'),
      ('Mz. 10', 21, 1, 'linear21'),     ('Mz. 11', 24, 1, 'perimeter24'),
      ('Mz. 18', 24, 1, 'perimeter24'),  ('Mz. 22', 24, 1, 'perimeter24'),  ('Mz. 26', 24, 1, 'perimeter24'),
      ('Mz. 12', 24, 2, 'perimeter24'),  ('Mz. 13', 24, 2, 'perimeter24'),  ('Mz. 14', 20, 2, 'perimeter20'),
      ('Mz. 15', 24, 2, 'perimeter24'),  ('Mz. 16', 24, 2, 'perimeter24'),  ('Mz. 17', 20, 2, 'perimeter20'),
      ('Mz. 19', 24, 2, 'perimeter24'),  ('Mz. 20', 24, 2, 'perimeter24'),  ('Mz. 21', 20, 2, 'perimeter20'),
      ('Mz. 23', 24, 2, 'perimeter24'),  ('Mz. 24', 24, 2, 'perimeter24'),  ('Mz. 25', 20, 2, 'perimeter20'),
      ('Mz. 27', 24, 2, 'perimeter24'),  ('Mz. 28', 20, 2, 'perimeter20')
    ) AS t(code, lots, etapa, layout)
  LOOP
    INSERT INTO blocks (project_id, code, etapa, layout)
    VALUES (v_project_id, mz.code, mz.etapa, mz.layout)
    ON CONFLICT (project_id, code) DO NOTHING
    RETURNING id INTO v_block_id;

    IF v_block_id IS NULL THEN
      SELECT id INTO v_block_id FROM blocks WHERE project_id = v_project_id AND code = mz.code;
    END IF;

    FOR i IN 1..mz.lots LOOP
      INSERT INTO lots (block_id, number, area_m2, list_price, presale_price, currency, status)
      VALUES (v_block_id, i, 300.00, 18000.00, 13500.00, 'USD', 'disponible')
      ON CONFLICT (block_id, number) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- Mz. 4 completa vendida
UPDATE lots SET status = 'vendido'
WHERE block_id = (SELECT id FROM blocks WHERE code = 'Mz. 4'
                  AND project_id = '00000000-0000-0000-0000-000000000010');

-- Otros lotes vendidos según masterplan actual
UPDATE lots SET status = 'vendido'
WHERE (block_id, number) IN (
  SELECT b.id, x.num FROM blocks b
  JOIN (VALUES
    ('Mz. 10', 1), ('Mz. 10', 5), ('Mz. 10', 6), ('Mz. 10', 13), ('Mz. 10', 17), ('Mz. 10', 18),
    ('Mz. 11', 5),
    ('Mz. 18', 2), ('Mz. 18', 7), ('Mz. 18', 8), ('Mz. 18', 9), ('Mz. 18', 14),
    ('Mz. 22', 2), ('Mz. 22', 5), ('Mz. 22', 7), ('Mz. 22', 9), ('Mz. 22', 10), ('Mz. 22', 15), ('Mz. 22', 18),
    ('Mz. 26', 2), ('Mz. 26', 3), ('Mz. 26', 4), ('Mz. 26', 7), ('Mz. 26', 8),
    ('Mz. 26', 17), ('Mz. 26', 18), ('Mz. 26', 20), ('Mz. 26', 21), ('Mz. 26', 23), ('Mz. 26', 24)
  ) AS x(mz, num) ON b.code = x.mz
  WHERE b.project_id = '00000000-0000-0000-0000-000000000010'
);

-- Verificación
SELECT b.code, COUNT(l.*) AS total,
       COUNT(*) FILTER (WHERE l.status='disponible') AS disp,
       COUNT(*) FILTER (WHERE l.status='vendido') AS vend
FROM blocks b LEFT JOIN lots l ON l.block_id = b.id
GROUP BY b.code ORDER BY b.code;
