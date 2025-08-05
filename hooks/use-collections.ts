"use client"

import { useState, useCallback } from 'react'
import { CollectionsAPI } from '@/lib/collections-api'
import { Collection, CollectionDataset, CreateCollectionData } from '@/types/collections'
import { useToast } from '@/hooks/use-toast'

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
  const [collectionDatasets, setCollectionDatasets] = useState<CollectionDataset[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const loadCollections = useCallback(async () => {
    try {
      setLoading(true)
      const data = await CollectionsAPI.getCollections()
      setCollections(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar coleções'
      toast({
        variant: "destructive",
        title: "Erro",
        description: message
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const createCollection = useCallback(async (data: CreateCollectionData): Promise<string | null> => {
    try {
      setLoading(true)
      const id = await CollectionsAPI.createCollection(data)
      
      toast({
        title: "Sucesso",
        description: "Coleção criada com sucesso"
      })
      
      await loadCollections()
      return id
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar coleção'
      toast({
        variant: "destructive",
        title: "Erro",
        description: message
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [toast, loadCollections])

  const updateCollection = useCallback(async (id: string, updates: Partial<CreateCollectionData>): Promise<boolean> => {
    try {
      setLoading(true)
      await CollectionsAPI.updateCollection(id, updates)
      
      toast({
        title: "Sucesso",
        description: "Coleção atualizada com sucesso"
      })
      
      await loadCollections()
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar coleção'
      toast({
        variant: "destructive",
        title: "Erro",
        description: message
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [toast, loadCollections])

  const deleteCollection = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true)
      await CollectionsAPI.deleteCollection(id)
      
      toast({
        title: "Sucesso",
        description: "Coleção excluída com sucesso"
      })
      
      await loadCollections()
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir coleção'
      toast({
        variant: "destructive",
        title: "Erro",
        description: message
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [toast, loadCollections])

  const loadCollectionDatasets = useCallback(async (collectionId: string) => {
    try {
      setLoading(true)
      const data = await CollectionsAPI.getCollectionDatasets(collectionId)
      setCollectionDatasets(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar datasets'
      toast({
        variant: "destructive",
        title: "Erro",
        description: message
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const selectCollection = useCallback(async (collection: Collection) => {
    setSelectedCollection(collection)
    await loadCollectionDatasets(collection.id)
  }, [loadCollectionDatasets])

  const clearSelection = useCallback(() => {
    setSelectedCollection(null)
    setCollectionDatasets([])
  }, [])

  return {
    collections,
    selectedCollection,
    collectionDatasets,
    loading,
    loadCollections,
    createCollection,
    updateCollection,
    deleteCollection,
    selectCollection,
    loadCollectionDatasets,
    clearSelection
  }
}