-- Tabela principal para armazenar datasets
CREATE TABLE datasets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    total_rows INTEGER NOT NULL,
    total_columns INTEGER NOT NULL,
    status TEXT CHECK (status IN ('analyzing', 'pending_adjustment', 'confirmed', 'error')) DEFAULT 'analyzing',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para definir colunas e seus tipos
CREATE TABLE dataset_columns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
    column_name TEXT NOT NULL,
    column_index INTEGER NOT NULL,
    data_type TEXT CHECK (data_type IN ('text', 'number', 'date', 'boolean', 'email', 'phone')) NOT NULL,
    is_required BOOLEAN DEFAULT FALSE,
    sample_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para armazenar os dados reais
CREATE TABLE dataset_rows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
    row_index INTEGER NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para logs de upload
CREATE TABLE upload_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
    level TEXT CHECK (level IN ('info', 'warning', 'error')) NOT NULL,
    message TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_datasets_user_id ON datasets(user_id);
CREATE INDEX idx_dataset_columns_dataset_id ON dataset_columns(dataset_id);
CREATE INDEX idx_dataset_rows_dataset_id ON dataset_rows(dataset_id);
CREATE INDEX idx_upload_logs_dataset_id ON upload_logs(dataset_id);
CREATE INDEX idx_upload_logs_created_at ON upload_logs(created_at);
