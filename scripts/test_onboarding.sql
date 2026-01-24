-- Test-Script für Onboarding-System
-- Führe dies in der PostgreSQL-Datenbank aus

-- 1. Testbewerber erstellen (falls nicht vorhanden)
INSERT INTO applicants (
  id,
  email,
  first_name,
  last_name,
  phone,
  position,
  email_verified,
  status,
  applied_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'test.bewerber@example.ch',
  'Test',
  'Bewerber',
  '+41 79 999 88 77',
  'Full Stack Developer',
  true,  -- Bereits verifiziert
  'NEW',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  email_verified = true;

-- 2. Alle Bewerber anzeigen
SELECT 
  id,
  email,
  first_name || ' ' || last_name as name,
  position,
  status,
  email_verified,
  applied_at
FROM applicants
ORDER BY applied_at DESC;

-- 3. Bewerber mit Dokumenten-Count
SELECT 
  a.id,
  a.email,
  a.first_name || ' ' || a.last_name as name,
  a.position,
  a.status,
  COUNT(d.id) as document_count
FROM applicants a
LEFT JOIN applicant_documents d ON d.applicant_id = a.id
GROUP BY a.id, a.email, a.first_name, a.last_name, a.position, a.status
ORDER BY a.applied_at DESC;

-- 4. Alle Bewerber-Dokumente anzeigen
SELECT 
  a.first_name || ' ' || a.last_name as applicant,
  d.document_type,
  d.file_name,
  d.file_size / 1024 as size_kb,
  d.uploaded_at
FROM applicant_documents d
JOIN applicants a ON a.id = d.applicant_id
ORDER BY d.uploaded_at DESC;

-- 5. Einen Bewerber verifizieren (Email nach Registrierung)
-- ACHTUNG: Ersetze die E-Mail-Adresse mit deinem Test-Bewerber
UPDATE applicants 
SET email_verified = true 
WHERE email = 'max.mustermann@test.ch';

-- 6. Status eines Bewerbers ändern
-- ACHTUNG: Ersetze die E-Mail-Adresse
UPDATE applicants 
SET status = 'IN_REVIEW' 
WHERE email = 'test.bewerber@example.ch';

-- 7. Alle Applicant-Status-Werte
SELECT DISTINCT status FROM applicants;

-- 8. Cleanup: Testdaten löschen (VORSICHT!)
-- DELETE FROM applicant_documents WHERE applicant_id IN (SELECT id FROM applicants WHERE email LIKE '%@test.ch' OR email LIKE '%@example.ch');
-- DELETE FROM applicants WHERE email LIKE '%@test.ch' OR email LIKE '%@example.ch';
