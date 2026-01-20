-- Import DLK Articles
-- Generated on 2026-01-20 19:35:12

-- Article 1: HAZOP (Hazard and Operability Study) - Risiken erk...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '2a1514f8-0577-47b7-9a53-330a27f11b19',
  '1',
  'HAZOP (Hazard and Operability Study) - Risiken erkennen, Prozesse optimieren',
  'Die HAZOP ist eine strukturierte, teambasierte Methode zur Identifikation und Bewertung von Gefahren und Betriebsabweichungen in technischen Prozessen. Sie wird insbesondere in der Chemie-, Pharma-, Öl-, Gas- und Nuklearindustrie eingesetzt.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T19:35:12.717710',
  '2026-01-20T19:35:12.717710'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 2: Abfallmanagement - Ressourcen schonen, Vorschrifte...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  'c9d6180f-f4cf-42a6-808a-44d33f3ab5a2',
  '2',
  'Abfallmanagement - Ressourcen schonen, Vorschriften erfüllen',
  'Wir unterstützen Sie bei der Entwicklung und Umsetzung eines projektspezifischen Abfallmanagements – mit dem Ziel, Abfallmengen auf Baustellen und im laufenden Betrieb gezielt zu reduzieren und gesetzeskonform zu entsorgen.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T19:35:12.718147',
  '2026-01-20T19:35:12.718147'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 3: Alleinarbeiterschutz - Sicherheit gewährleisten, V...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  'ffd23304-3a84-4b4a-b903-8a7c203368cf',
  '3',
  'Alleinarbeiterschutz - Sicherheit gewährleisten, Verantwortung übernehmen',
  'Wir erstellen für Ihren Betrieb oder Ihr Projekt ein spezifisches Schutzkonzept zur sicheren Organisation von Alleinarbeit – basierend auf einer strukturierten Risikoanalyse. Ziel ist es, potenzielle Gefährdungen frühzeitig zu erkennen und gezielte Schutzmassnahmen zu definieren, die Ihre Mitarbeitenden und Projektbeteiligten wirksam absichern.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T19:35:12.718566',
  '2026-01-20T19:35:12.718566'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 4: Permit to Work (PtW) - Arbeitsfreigabe strukturier...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  'bf5667d4-5a61-40ff-ba4c-74c7a67ebfcf',
  '4',
  'Permit to Work (PtW) - Arbeitsfreigabe strukturieren, Risiken kontrollieren',
  'Wir übernehmen die vollständige Organisation Ihres Arbeitsgenehmigungsprozesses für bevorstehende Projekte – oder entwickeln für Sie ein massgeschneidertes Arbeitsgenehmigungssystem, das auf Ihre betrieblichen Anforderungen und regulatorischen Rahmenbedingungen abgestimmt ist.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T19:35:12.718880',
  '2026-01-20T19:35:12.718880'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 5: Audit - Risiken erkennen, Compliance sichern, Proz...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '75fb18f4-f409-4fbb-a9e6-c2e6eb2acd22',
  '5',
  'Audit - Risiken erkennen, Compliance sichern, Prozesse verbessern',
  'Ein EHS-Audit umfasst eine strukturierte Reihe von Dienstleistungen zur Überprüfung und Verbesserung der Einhaltung von gesetzlichen, normativen und betrieblichen Anforderungen in den Bereichen Arbeitssicherheit, Gesundheitsschutz und Umweltschutz.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T19:35:12.719263',
  '2026-01-20T19:35:12.719263'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 6: Ausbildung Hubarbeitsbühne - Sicher arbeiten in de...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '2fa16e80-edeb-487d-9c03-6f0411d649c6',
  '6',
  'Ausbildung Hubarbeitsbühne - Sicher arbeiten in der Höhe, international zertifiziert',
  'Wir organisieren für Sie die gesetzlich konforme Ausbildung zur Bedienung von Hubarbeitsbühnen – entweder direkt bei Ihnen vor Ort oder bei einem unserer zertifizierten Partner in Ihrer Nähe. Die Schulung entspricht den Anforderungen der Verordnung über die Unfallverhütung (VUV Art. 8) sowie den Empfehlungen des VSAA und der IPAF (International Powered Access Federation).',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T19:35:12.719864',
  '2026-01-20T19:35:12.719864'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 7: Ausbildung PSAgA - Persönliche Sicherheit bei Arbe...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '3e945134-6e7b-4db6-8c84-fe746a92ddb5',
  '7',
  'Ausbildung PSAgA - Persönliche Sicherheit bei Arbeiten mit Absturzrisiko',
  'Wir organisieren für Sie die gesetzlich konforme Ausbildung zum sicheren Einsatz von persönlicher Schutzausrüstung gegen Absturz (PSAgA) – entweder direkt bei Ihnen vor Ort oder bei einem unserer zertifizierten Partner in Ihrer Nähe. Die Schulung entspricht den Anforderungen der SUVA, der EKAS-Richtlinien, der VUV Art. 8 sowie den Empfehlungen des Vereins absturzrisiko.ch.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T19:35:12.720276',
  '2026-01-20T19:35:12.720276'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 8: Bau- / Projektleitungssitzung - EHS-Fachbegleitung...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '8ed1d2aa-a7b1-45cb-b141-933f1442dc21',
  '8',
  'Bau- / Projektleitungssitzung - EHS-Fachbegleitung',
  'Wir begleiten Sie bei Bau- und Projektleitungssitzungen und vertreten Ihre Interessen als Bauherrenvertreter – engagiert, kompetent und mit Fokus auf Sicherheit, Gesundheit und Umwelt. Unsere Teilnahme stellt sicher, dass relevante EHS-Themen frühzeitig erkannt und wirksam adressiert werden.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T19:35:12.720706',
  '2026-01-20T19:35:12.720706'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 9: Betriebsanweisungen - Sicherheit schriftlich gereg...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  'fdb081dd-c9a7-46a3-9755-19b90169ce65',
  '9',
  'Betriebsanweisungen - Sicherheit schriftlich geregelt',
  'Wir erstellen für Sie spezifische Betriebsanweisungen, die den sicheren Umgang mit Gefahrstoffen und die Durchführung von Tätigkeiten am Arbeitsplatz klar und verständlich regeln. Die Dokumente entsprechen den gesetzlichen Vorgaben und sind ein zentraler Bestandteil Ihres Arbeitsschutzsystems.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T19:35:12.721141',
  '2026-01-20T19:35:12.721141'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 10: EHS Plan - Sicherheit, Gesundheit und Umwelt syste...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  'bad1f87c-03ec-4abb-b93a-24bff327fb11',
  '10',
  'EHS Plan - Sicherheit, Gesundheit und Umwelt systematisch geregelt',
  'Wir erstellen für Sie einen spezifischen EHS Plan, der alle relevanten Massnahmen und Verfahren zur Einhaltung von Umwelt-, Gesundheits- und Sicherheitsstandards in Ihrem Betrieb oder Projekt umfasst. Das Dokument bildet die Grundlage für eine strukturierte und gesetzeskonforme Umsetzung Ihrer EHS-Ziele.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T19:35:12.721597',
  '2026-01-20T19:35:12.721597'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 12: Gerüstloses Bauen - Sicherheit ohne Standardgerüst...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '75d9e329-d592-4194-aa3f-8a726eff63ec',
  '12',
  'Gerüstloses Bauen - Sicherheit ohne Standardgerüst',
  'Gerüstloses Bauen ist in der Schweiz bewilligungspflichtig. Gemäss den gesetzlichen Vorgaben muss ab einer Absturzhöhe von zwei Metern ein Fassadengerüst errichtet werden. In Ausnahmefällen kann die Suva eine schriftliche Bewilligung erteilen – vorausgesetzt, die gewählte Ersatzlösung erfüllt die Schutzziele für Arbeitnehmende und die Öffentlichkeit gleichwertig oder besser.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T19:35:12.722735',
  '2026-01-20T19:35:12.722735'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 13: Gerüstkontrollen und Abnahme - Sicherheit vor Arbe...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '1f786e8f-62a6-4cac-be00-e343db9cede6',
  '13',
  'Gerüstkontrollen und Abnahme - Sicherheit vor Arbeitsbeginn',
  'Wir führen für Sie fachgerechte Gerüstkontrollen und Abnahmen gemäss den gesetzlichen Vorgaben durch. Diese Prüfungen sind unerlässlich, um die Sicherheit der Mitarbeitenden zu gewährleisten und die Einhaltung der Schutzmassnahmen auf der Baustelle sicherzustellen.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T19:35:12.723440',
  '2026-01-20T19:35:12.723440'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 14: Incident Management - Zwischenfälle systematisch e...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '5a23d93a-c03c-4d28-a219-ddab6c92e44b',
  '14',
  'Incident Management - Zwischenfälle systematisch erfassen und beheben',
  'Wir übernehmen für Sie das Incident Management oder unterstützen Sie bei der Einführung eines strukturierten Systems zur Erfassung, Analyse und Behebung von sicherheits-, gesundheits- oder umweltrelevanten Zwischenfällen. Die Tiefe und Ausgestaltung richten sich nach Ihren spezifischen Anforderungen und Projektbedingungen.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T19:35:12.724132',
  '2026-01-20T19:35:12.724132'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 15: Instruktion - Praxisnahe Anleitung direkt am Arbei...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  'cb255ffc-1fe4-40da-84b5-922791c9cf16',
  '15',
  'Instruktion - Praxisnahe Anleitung direkt am Arbeitsplatz',
  'Wir bieten ein breites Spektrum an praxisorientierten Instruktionen für einzelne Tätigkeiten direkt am Arbeitsplatz. Die Instruktion vermittelt den sicheren Umgang mit Geräten, Anlagen oder Arbeitsmitteln und ist ein zentraler Bestandteil der Arbeitssicherheit.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T19:35:12.725040',
  '2026-01-20T19:35:12.725040'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 16: JSA (Job Safety Analyse) - Arbeitssicherheitsanaly...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '6f1f9446-5fcd-4eb0-a3ea-d8abc5d7e6f5',
  '16',
  'JSA (Job Safety Analyse) - Arbeitssicherheitsanalyse für strukturierte Risikominimierung',
  'Wir unterstützen Sie bei der Einführung und Umsetzung der Arbeitssicherheitsanalyse (JSA) in Ihrem Betrieb. Die Methode dient der systematischen Ermittlung und Minimierung von Gefahren am Arbeitsplatz, indem Arbeitsprozesse in einzelne Phasen unterteilt und die damit verbundenen Risiken analysiert werden.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T19:35:12.725697',
  '2026-01-20T19:35:12.725697'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 17: Kennzeichnungen & Beschriftungen - Orientierung sc...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '404d2a81-8153-4b87-b979-e0eaf9b00091',
  '17',
  'Kennzeichnungen & Beschriftungen - Orientierung schafft Sicherheit',
  'Wir übernehmen für Sie die fachgerechte Umsetzung von Kennzeichnungen und Beschriftungen im Rahmen Ihres Projekts oder Betriebs. Diese organisatorische Massnahme trägt wesentlich dazu bei, die Sicherheit und Gesundheit Ihrer Mitarbeitenden zu gewährleisten und die Umwelt zu schützen.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T19:35:12.726304',
  '2026-01-20T19:35:12.726304'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 18: Kick Off Meeting - EHS von Beginn an integriert...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '185accb7-8864-4203-afb1-67f40110e8ff',
  '18',
  'Kick Off Meeting - EHS von Beginn an integriert',
  'Wir empfehlen Ihnen, EHS als festen Bestandteil Ihres Kick Off Meetings zu integrieren. Das Meeting findet mit ausreichend Vorlaufzeit vor Projektstart statt und wird in der Regel durch die Bau- oder Projektleitung organisiert und durchgeführt.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T19:35:12.726999',
  '2026-01-20T19:35:12.726999'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 19: Konsequenzen Management - Verhalten gezielt steuer...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  'dc1e9e9e-ce02-4bbd-960a-3ac4a13c1170',
  '19',
  'Konsequenzen Management - Verhalten gezielt steuern und fördern',
  'Wir unterstützen Sie bei der Einführung und Umsetzung eines strukturierten Konsequenzenmanagements in Ihrem Projekt oder Betrieb. Ziel ist es, das Verhalten Ihrer Mitarbeitenden im Hinblick auf Umwelt-, Gesundheits- und Sicherheitsvorschriften systematisch zu steuern und nachhaltig zu verbessern.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T19:35:12.727672',
  '2026-01-20T19:35:12.727672'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 20: Lessons Learned - Lernen aus Erfahrung für mehr Si...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '82757bff-9c7c-48ae-a351-fc7b6bbc05f7',
  '20',
  'Lessons Learned - Lernen aus Erfahrung für mehr Sicherheit',
  'Wir unterstützen Sie bei der systematischen Erfassung und Auswertung von Erkenntnissen aus sicherheitsrelevanten Ereignissen. Lessons Learned bezeichnet das Lernen aus Erfahrung mit dem Ziel, gewonnene Einsichten aktiv zu nutzen und zukünftige Risiken zu minimieren.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T19:35:12.728208',
  '2026-01-20T19:35:12.728208'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 21: LMRA (Last Minute Risk Assessment) - Sicherheit pr...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '4a94adf5-470f-462d-9bac-43ab0c2c40d3',
  '21',
  'LMRA (Last Minute Risk Assessment) - Sicherheit prüfen, bevor die Arbeit beginnt',
  'Wir unterstützen Sie bei der Einführung und Umsetzung einer Last Minute Risk Assessment (LMRA) in Ihrem Betrieb oder Projekt. Die LMRA ist eine kurzfristige Risikobewertung, die unmittelbar vor Beginn einer Tätigkeit durchgeführt wird. Ziel ist es, potenzielle Gefahren zu erkennen und sicherzustellen, dass alle notwendigen Schutzmassnahmen getroffen wurden.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T19:35:12.729394',
  '2026-01-20T19:35:12.729394'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 22: Methode Statement - Sicherheit und Effizienz in de...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '759d98d9-9248-493b-a1df-76a12d2694ef',
  '22',
  'Methode Statement - Sicherheit und Effizienz in der Arbeitsausführung',
  'Wir erstellen oder überprüfen für Sie ein auf Ihre Tätigkeiten zugeschnittenes Methode Statement. Dieses Dokument ist Teil des Sicherheits- und Gesundheitsschutzkonzepts und beschreibt die baustellenspezifischen Massnahmen zur sicheren Durchführung von Arbeiten. Seit 2022 ist ein solches Konzept gemäss BauAV Artikel 4 für jede Baustelle verpflichtend.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T19:35:12.730184',
  '2026-01-20T19:35:12.730184'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 23: Notfall- / Brandschutzkonzept - Sicherheit im Erns...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '06539100-8831-4a00-82f0-a85ecac09262',
  '23',
  'Notfall- / Brandschutzkonzept - Sicherheit im Ernstfall gewährleisten',
  'Wir erstellen für Sie ein umfassendes Notfall- und Brandschutzkonzept, das darauf abzielt, Personen und Sachwerte im Falle eines Brandes oder eines anderen Notfalls bestmöglich zu schützen. Das Konzept berücksichtigt projektspezifische Risiken und definiert klare Abläufe für den Ernstfall – strukturiert, praxisnah und gesetzeskonform.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T19:35:12.731110',
  '2026-01-20T19:35:12.731110'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 24: Risk Assessment - Gefahren erkennen, bevor sie ent...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '73e5d437-0164-4218-ad9b-9a576e6b0ce1',
  '24',
  'Risk Assessment - Gefahren erkennen, bevor sie entstehen',
  'Wir unterstützen Sie bei der Durchführung einer strukturierten Risikoanalyse für Ihre Tätigkeiten, Projekte oder betrieblichen Abläufe. Ziel ist es, potenzielle Gefahren frühzeitig zu identifizieren und wirksame Massnahmen zur Risikominimierung zu entwickeln.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T19:35:12.732099',
  '2026-01-20T19:35:12.732099'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 25: Safety Stand Down - Sicherheit bewusst in den Mitt...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '86b6ead3-aaab-40e9-b34b-203b03dd1962',
  '25',
  'Safety Stand Down - Sicherheit bewusst in den Mittelpunkt stellen',
  'Wir unterstützen Sie bei der Planung und Durchführung eines Safety Stand Down – einer gezielten Unterbrechung der Tätigkeiten, bei der Führungskräfte und Mitarbeitende zusammenkommen, um sicherheitsrelevante Themen zu besprechen, Bedenken zu adressieren und bewährte Praktiken zu stärken.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T19:35:12.732822',
  '2026-01-20T19:35:12.732822'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 26: Ausbildungen - Qualifikation durch Theorie und Pra...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '256598eb-ead8-4bf2-8b09-53d5bd6fc2d3',
  '26',
  'Ausbildungen - Qualifikation durch Theorie und Praxis',
  'Wir organisieren für Sie spezifische und qualitativ hochwertige Ausbildungen – entweder direkt im Rahmen Ihres Projekts oder in einem qualifizierten Partnerbetrieb in Ihrer Nähe. Die Ausbildung vermittelt theoretische und praktische Kenntnisse zu einem umfassenden Thema und schliesst mit einem Ausbildungsnachweis ab, sofern die erforderlichen Kompetenzen nachgewiesen werden.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T19:35:12.733515',
  '2026-01-20T19:35:12.733515'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 27: Sicherheitsrundgänge - Sicherheit sichtbar machen...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '59fef67f-d78e-4706-9fbe-c29736e48f5e',
  '27',
  'Sicherheitsrundgänge - Sicherheit sichtbar machen',
  'Wir führen für Sie dokumentierte Sicherheitsrundgänge im Projekt oder Betrieb durch, um die Einhaltung gesetzlicher Vorschriften sicherzustellen und die Sicherheit sowie Gesundheit Ihrer Mitarbeitenden aktiv zu fördern. Die Rundgänge dienen der frühzeitigen Erkennung von Gefahren, der Optimierung von Prozessen und der Stärkung der Sicherheitskultur vor Ort.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T19:35:12.734430',
  '2026-01-20T19:35:12.734430'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 28: Tool Box - Sicherheit im täglichen Austausch...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  'ed7e3efe-f1f1-459f-aa69-0aeb733b6328',
  '28',
  'Tool Box - Sicherheit im täglichen Austausch',
  'Wir unterstützen Sie bei der Einführung und Aufrechterhaltung von Tool Box Meetings – kurzen, informellen Sicherheitsbesprechungen, die täglich vor Arbeitsbeginn stattfinden. Ziel dieser Treffen ist es, sicherheitsrelevante Themen zu besprechen, Bedenken zu adressieren und das Bewusstsein für potenzielle Gefahren zu schärfen.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T19:35:12.735012',
  '2026-01-20T19:35:12.735012'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 29: Workshop - Interaktives Lernen für mehr Sicherheit...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '4627b27d-2eb0-4c7a-9cf0-e3221ea8bf7a',
  '29',
  'Workshop - Interaktives Lernen für mehr Sicherheit',
  'Wir unterstützen Sie bei der Planung und Durchführung spezifischer Workshops, die auf die Bedürfnisse Ihres Unternehmens zugeschnitten sind. Ein Workshop ist ein zeitlich begrenztes, praxisorientiertes Format, bei dem sich Teams intensiv mit einem sicherheitsrelevanten Thema auseinandersetzen. Im Gegensatz zu klassischen Schulungen sind die Teilnehmenden aktiv eingebunden und erarbeiten gemeinsam Lösungen.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T19:35:12.735541',
  '2026-01-20T19:35:12.735541'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 30: Erste Hilfe - Sofortmassnahmen im Ernstfall...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  'f0304e09-dd6e-4799-8631-53bb0a3bb53b',
  '30',
  'Erste Hilfe - Sofortmassnahmen im Ernstfall',
  'Wir unterstützen Sie bei der Organisation und Umsetzung eines wirksamen Erste-Hilfe-Konzepts in Ihrem Betrieb oder Projekt. Erste Hilfe umfasst alle Massnahmen, die bei Unfällen oder akuten gesundheitlichen Problemen sofort ergriffen werden, um Leben zu retten und Folgeschäden zu minimieren.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T19:35:12.736433',
  '2026-01-20T19:35:12.736433'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 31: Konzept Zwischendecke - Sicherheit und Struktur fü...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  'aa9a4c65-c0a8-4834-b33e-dacc959a2144',
  '31',
  'Konzept Zwischendecke - Sicherheit und Struktur für Deckensysteme',
  'Wir erstellen für Sie ein projektspezifisches Konzept zur sicheren Planung, Ausführung und Kontrolle von Zwischendecken. Diese Deckensysteme kommen häufig bei Umbauten, Sanierungen oder technischen Installationen zum Einsatz und erfordern besondere Aufmerksamkeit hinsichtlich Statik, Zugangssicherheit und Brandschutz.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T19:35:12.737829',
  '2026-01-20T19:35:12.737829'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 32: Flucht & Rettungspläne - Orientierung im Ernstfall...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  'af36552f-beae-4a48-ae4b-a292e1e21bb1',
  '32',
  'Flucht & Rettungspläne - Orientierung im Ernstfall',
  'Wir erstellen für Sie projektspezifische Flucht- und Rettungspläne, die im Notfall eine sichere und strukturierte Evakuierung von Personen aus Gebäuden oder Anlagen ermöglichen. Diese Pläne sind ein zentraler Bestandteil des Notfallmanagements und tragen wesentlich zur Sicherheit Ihrer Mitarbeitenden und Besucher bei.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T19:35:12.739004',
  '2026-01-20T19:35:12.739004'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 33: Hebekonzept - Sicheres Heben beginnt mit klarer Pl...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '18644b16-842b-4817-af69-917b8990ed87',
  '33',
  'Hebekonzept - Sicheres Heben beginnt mit klarer Planung',
  'Wir erstellen für Sie ein massgeschneidertes Hebekonzept, das alle sicherheitsrelevanten Aspekte Ihrer Hebetätigkeiten berücksichtigt – sei es bei Einbringungen, Montagearbeiten oder temporären Hebevorgängen. Ziel ist es, die Sicherheit und Gesundheit Ihrer Mitarbeitenden zu gewährleisten und gleichzeitig die gesetzlichen Anforderungen zu erfüllen.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T19:35:12.739669',
  '2026-01-20T19:35:12.739669'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 34: Gap Analyse - Lücken erkennen, Standards erreichen...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '66f27941-f487-47bb-9d70-4824942859ff',
  '34',
  'Gap Analyse - Lücken erkennen, Standards erreichen',
  'Wir erstellen für Sie eine fundierte Gap Analyse, um den Unterschied zwischen dem aktuellen Zustand Ihres Unternehmens und dem angestrebten Zielzustand zu identifizieren. Dieses strategische Instrument hilft dabei, gezielte Massnahmen zu entwickeln, um bestehende Lücken zu schliessen und Ihre EHS-Strategien kontinuierlich zu verbessern.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T19:35:12.740482',
  '2026-01-20T19:35:12.740482'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 35: Gefahrenstoffbeauftragte / -r - Verantwortung doku...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '07178598-1a68-4fda-a9fb-501fb7c4a7e7',
  '35',
  'Gefahrenstoffbeauftragte / -r - Verantwortung dokumentieren und Sicherheit gewährleisten',
  'In der Schweiz besteht für Unternehmen eine gesetzliche Pflicht zur regelmässigen Erstellung eines Jahresberichts über Gefahrstoffe. Dieser Bericht muss durch einen qualifizierten Gefahrenstoffbeauftragten geprüft und freigegeben werden. Die Anforderungen sind Teil der übergeordneten Regelungen zur nachhaltigen Unternehmensführung sowie zur Sicherstellung von Arbeitssicherheit und Umweltschutz.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T19:35:12.740962',
  '2026-01-20T19:35:12.740962'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 36: Krankonzepte - Risiken minimieren und Sicherheit g...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  'f471521d-cf05-4bd5-9fc4-04b53d3e0b7a',
  '36',
  'Krankonzepte - Risiken minimieren und Sicherheit gewährleisten',
  'In der Schweiz ist für den Betrieb von Kränen ein spezifisches Sicherheitskonzept erforderlich. Dieses Konzept muss auf den jeweiligen Einsatzort abgestimmt sein und dient der Einhaltung gesetzlicher Vorschriften sowie der Sicherstellung von Arbeitssicherheit und Schutz Dritter. Die Anforderungen sind Teil der übergeordneten Regelungen zur sicheren Baustellenorganisation und zur Prävention von Unfällen im Hoch- und Tiefbau.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T19:35:12.741466',
  '2026-01-20T19:35:12.741466'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 37: SiBe Brandschutz - Verantwortung übernehmen und Ri...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '1726520b-cc26-43f6-b634-05493e7d047f',
  '37',
  'SiBe Brandschutz - Verantwortung übernehmen und Risiken vorbeugen',
  'In der Schweiz ist die Bestellung eines Sicherheitsbeauftragten für den Brandschutz (SiBe) ein zentraler Bestandteil eines professionellen Sicherheitskonzepts. Der SiBe trägt die Verantwortung für die Einhaltung brandschutztechnischer Vorgaben und unterstützt die Projektleitung bei der Umsetzung präventiver Massnahmen. Diese Rolle ist essenziell für die Sicherheit von Personen, Sachwerten und Infrastruktur – insbesondere in komplexen Bau- und Industrieprojekten.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T19:35:12.742059',
  '2026-01-20T19:35:12.742059'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 38: Instruktion Brandwache - Sicherheit beginnt mit Wi...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '78db4465-b3ab-4220-8a3a-dda6ff72bc70',
  '38',
  'Instruktion Brandwache - Sicherheit beginnt mit Wissen und Vorbereitung',
  'In Projekten mit erhöhtem Brandrisiko ist die Instruktion der Brandwache ein zentraler Bestandteil des Sicherheitskonzepts. Ziel ist es, die eingesetzten Personen gezielt auf ihre Aufgaben vorzubereiten und sicherzustellen, dass sie im Ernstfall schnell, effektiv und sicher reagieren können. Die vermittelten Inhalte orientieren sich an den geltenden Vorschriften und Best Practices im vorbeugenden Brandschutz.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T19:35:12.742518',
  '2026-01-20T19:35:12.742518'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";
