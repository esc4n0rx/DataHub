-- Adicionar colunas para suporte a coleções e upload fluido
ALTER TABLE public.datasets 
ADD COLUMN IF NOT EXISTS collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_current BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- Índices para as novas colunas
CREATE INDEX IF NOT EXISTS idx_datasets_collection_id ON public.datasets(collection_id);
CREATE INDEX IF NOT EXISTS idx_datasets_is_current ON public.datasets(is_current);
CREATE INDEX IF NOT EXISTS idx_datasets_version ON public.datasets(version);
CREATE INDEX IF NOT EXISTS idx_datasets_collection_current ON public.datasets(collection_id, is_current) WHERE is_current = true;

-- Constraint para garantir que só existe um dataset atual por coleção fluida
CREATE UNIQUE INDEX IF NOT EXISTS idx_datasets_collection_current_unique 
ON public.datasets(collection_id) 
WHERE is_current = true AND collection_id IS NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN public.datasets.collection_id IS 'ID da coleção à qual este dataset pertence (opcional)';
COMMENT ON COLUMN public.datasets.is_current IS 'Indica se este é o dataset atual em uma coleção fluida';
COMMENT ON COLUMN public.datasets.version IS 'Número da versão do dataset dentro da coleção';