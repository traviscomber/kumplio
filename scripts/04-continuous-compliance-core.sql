-- KUMPLIO continuous compliance core
-- Additive migration: preserves existing projects, documents, obligations, risks and roadmaps.
-- Apply through the Supabase SQL editor or CLI after reviewing against the target project.

begin;

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Extend existing records with tenant and trace