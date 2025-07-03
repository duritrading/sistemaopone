// src/infrastructure/config/database.sql
-- SQL para criar as tabelas do módulo financeiro

-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Accounts table
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('conta_corrente', 'conta_poupanca', 'cartao_credito', 'cartao_debito', 'dinheiro', 'investimento', 'outros')),
  bank VARCHAR(100),
  balance DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Financial transactions table
CREATE TABLE financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  type VARCHAR(20) NOT NULL CHECK (type IN ('receita', 'despesa')),
  category VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pendente', 'recebido', 'pago', 'vencido', 'cancelado')),
  account_id UUID NOT NULL REFERENCES accounts(id),
  transaction_date DATE NOT NULL,
  due_date DATE,
  payment_date TIMESTAMP,
  client_id UUID REFERENCES clients(id),
  supplier_id UUID, -- Reference to suppliers table when created
  cost_center VARCHAR(100),
  reference_code VARCHAR(100),
  payment_method VARCHAR(50),
  installments INTEGER DEFAULT 1 CHECK (installments >= 1 AND installments <= 12),
  notes TEXT,
  attachments TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Custom categories table
CREATE TABLE custom_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('receita', 'despesa')),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_financial_transactions_account_id ON financial_transactions(account_id);
CREATE INDEX idx_financial_transactions_date ON financial_transactions(transaction_date);
CREATE INDEX idx_financial_transactions_type ON financial_transactions(type);
CREATE INDEX idx_financial_transactions_status ON financial_transactions(status);
CREATE INDEX idx_financial_transactions_category ON financial_transactions(category);
CREATE INDEX idx_financial_transactions_search ON financial_transactions USING GIN(to_tsvector('portuguese', description || ' ' || COALESCE(notes, '')));

-- Function to calculate financial metrics
CREATE OR REPLACE FUNCTION get_financial_metrics(p_year INTEGER)
RETURNS TABLE (
  receitas_em_aberto DECIMAL(15,2),
  receitas_realizadas DECIMAL(15,2),
  despesas_em_aberto DECIMAL(15,2),
  despesas_realizadas DECIMAL(15,2),
  total_periodo DECIMAL(15,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN type = 'receita' AND status = 'pendente' THEN amount ELSE 0 END), 0) AS receitas_em_aberto,
    COALESCE(SUM(CASE WHEN type = 'receita' AND status = 'recebido' THEN amount ELSE 0 END), 0) AS receitas_realizadas,
    COALESCE(SUM(CASE WHEN type = 'despesa' AND status = 'pendente' THEN amount ELSE 0 END), 0) AS despesas_em_aberto,
    COALESCE(SUM(CASE WHEN type = 'despesa' AND status = 'pago' THEN amount ELSE 0 END), 0) AS despesas_realizadas,
    COALESCE(SUM(CASE WHEN type = 'receita' AND status = 'recebido' THEN amount ELSE 0 END), 0) -
    COALESCE(SUM(CASE WHEN type = 'despesa' AND status = 'pago' THEN amount ELSE 0 END), 0) AS total_periodo
  FROM financial_transactions
  WHERE EXTRACT(YEAR FROM transaction_date) = p_year;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_transactions_updated_at
  BEFORE UPDATE ON financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_categories_updated_at
  BEFORE UPDATE ON custom_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies (adjust based on your auth system)
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_categories ENABLE ROW LEVEL SECURITY;

-- Example policies (adjust based on your auth system)
-- CREATE POLICY "Users can view their own accounts" ON accounts FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Users can insert their own accounts" ON accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
-- CREATE POLICY "Users can update their own accounts" ON accounts FOR UPDATE USING (auth.uid() = user_id);
-- CREATE POLICY "Users can delete their own accounts" ON accounts FOR DELETE USING (auth.uid() = user_id);