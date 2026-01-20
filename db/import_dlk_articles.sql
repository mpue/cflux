-- Import DLK Articles
-- Generated on 2026-01-20 13:17:13

-- Article 1: HAZOP (Hazard and Operability Study) - Risiken erk...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '5bbc3786-a024-4ff5-b1e7-2b5296cbeabc',
  '1',
  'HAZOP (Hazard and Operability Study) - Risiken erkennen, Prozesse optimieren',
  'Die HAZOP ist eine strukturierte, teambasierte Methode zur Identifikation und Bewertung von Gefahren und Betriebsabweichungen in technischen Prozessen. Sie wird insbesondere in der Chemie-, Pharma-, Öl-, Gas- und Nuklearindustrie eingesetzt.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T13:17:13.381909',
  '2026-01-20T13:17:13.381909'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 2: Abfallmanagement - Ressourcen schonen, Vorschrifte...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '1fb286fe-c3ea-4d4e-8a6a-59e316eb5e1a',
  '2',
  'Abfallmanagement - Ressourcen schonen, Vorschriften erfüllen',
  'Wir unterstützen Sie bei der Entwicklung und Umsetzung eines projektspezifischen Abfallmanagements – mit dem Ziel, Abfallmengen auf Baustellen und im laufenden Betrieb gezielt zu reduzieren und gesetzeskonform zu entsorgen.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T13:17:13.382502',
  '2026-01-20T13:17:13.382502'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 3: Alleinarbeiterschutz - Sicherheit gewährleisten, V...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  'a134ee38-f5b5-4783-8f7e-6a929402d0f6',
  '3',
  'Alleinarbeiterschutz - Sicherheit gewährleisten, Verantwortung übernehmen',
  'Wir erstellen für Ihren Betrieb oder Ihr Projekt ein spezifisches Schutzkonzept zur sicheren Organisation von Alleinarbeit – basierend auf einer strukturierten Risikoanalyse. Ziel ist es, potenzielle Gefährdungen frühzeitig zu erkennen und gezielte Schutzmassnahmen zu definieren, die Ihre Mitarbeitenden und Projektbeteiligten wirksam absichern.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T13:17:13.383222',
  '2026-01-20T13:17:13.383222'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 4: Permit to Work (PtW) - Arbeitsfreigabe strukturier...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  'edc26b8c-bbdd-45db-a098-40a1ede2d245',
  '4',
  'Permit to Work (PtW) - Arbeitsfreigabe strukturieren, Risiken kontrollieren',
  'Wir übernehmen die vollständige Organisation Ihres Arbeitsgenehmigungsprozesses für bevorstehende Projekte – oder entwickeln für Sie ein massgeschneidertes Arbeitsgenehmigungssystem, das auf Ihre betrieblichen Anforderungen und regulatorischen Rahmenbedingungen abgestimmt ist.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T13:17:13.383671',
  '2026-01-20T13:17:13.383671'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 5: Audit - Risiken erkennen, Compliance sichern, Proz...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  'dab4e02e-3c21-45d6-b959-81b112609255',
  '5',
  'Audit - Risiken erkennen, Compliance sichern, Prozesse verbessern',
  'Ein EHS-Audit umfasst eine strukturierte Reihe von Dienstleistungen zur Überprüfung und Verbesserung der Einhaltung von gesetzlichen, normativen und betrieblichen Anforderungen in den Bereichen Arbeitssicherheit, Gesundheitsschutz und Umweltschutz.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T13:17:13.384107',
  '2026-01-20T13:17:13.384107'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 6: Ausbildung Hubarbeitsbühne - Sicher arbeiten in de...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  'd1ff9cb3-4c90-42be-9894-a6189206a898',
  '6',
  'Ausbildung Hubarbeitsbühne - Sicher arbeiten in der Höhe, international zertifiziert',
  'Wir organisieren für Sie die gesetzlich konforme Ausbildung zur Bedienung von Hubarbeitsbühnen – entweder direkt bei Ihnen vor Ort oder bei einem unserer zertifizierten Partner in Ihrer Nähe. Die Schulung entspricht den Anforderungen der Verordnung über die Unfallverhütung (VUV Art. 8) sowie den Empfehlungen des VSAA und der IPAF (International Powered Access Federation).',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T13:17:13.385057',
  '2026-01-20T13:17:13.385057'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 7: Ausbildung PSAgA - Persönliche Sicherheit bei Arbe...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  'fb08860b-43d2-4fbf-a782-e7ef347ed3e7',
  '7',
  'Ausbildung PSAgA - Persönliche Sicherheit bei Arbeiten mit Absturzrisiko',
  'Wir organisieren für Sie die gesetzlich konforme Ausbildung zum sicheren Einsatz von persönlicher Schutzausrüstung gegen Absturz (PSAgA) – entweder direkt bei Ihnen vor Ort oder bei einem unserer zertifizierten Partner in Ihrer Nähe. Die Schulung entspricht den Anforderungen der SUVA, der EKAS-Richtlinien, der VUV Art. 8 sowie den Empfehlungen des Vereins absturzrisiko.ch.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T13:17:13.385725',
  '2026-01-20T13:17:13.385725'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 8: Bau- / Projektleitungssitzung - EHS-Fachbegleitung...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '9ec7d10d-d8e9-4dd1-b442-d9a832b0cbaa',
  '8',
  'Bau- / Projektleitungssitzung - EHS-Fachbegleitung',
  'Wir begleiten Sie bei Bau- und Projektleitungssitzungen und vertreten Ihre Interessen als Bauherrenvertreter – engagiert, kompetent und mit Fokus auf Sicherheit, Gesundheit und Umwelt. Unsere Teilnahme stellt sicher, dass relevante EHS-Themen frühzeitig erkannt und wirksam adressiert werden.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T13:17:13.386275',
  '2026-01-20T13:17:13.386275'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 9: Betriebsanweisungen - Sicherheit schriftlich gereg...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  'f0acd8be-781e-4366-b47b-e591e03edf5d',
  '9',
  'Betriebsanweisungen - Sicherheit schriftlich geregelt',
  'Wir erstellen für Sie spezifische Betriebsanweisungen, die den sicheren Umgang mit Gefahrstoffen und die Durchführung von Tätigkeiten am Arbeitsplatz klar und verständlich regeln. Die Dokumente entsprechen den gesetzlichen Vorgaben und sind ein zentraler Bestandteil Ihres Arbeitsschutzsystems.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T13:17:13.387346',
  '2026-01-20T13:17:13.387346'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 10: EHS Plan - Sicherheit, Gesundheit und Umwelt syste...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '9f208b78-f88a-467d-bfb1-110f8a4539fc',
  '10',
  'EHS Plan - Sicherheit, Gesundheit und Umwelt systematisch geregelt',
  'Wir erstellen für Sie einen spezifischen EHS Plan, der alle relevanten Massnahmen und Verfahren zur Einhaltung von Umwelt-, Gesundheits- und Sicherheitsstandards in Ihrem Betrieb oder Projekt umfasst. Das Dokument bildet die Grundlage für eine strukturierte und gesetzeskonforme Umsetzung Ihrer EHS-Ziele.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T13:17:13.388034',
  '2026-01-20T13:17:13.388034'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 12: Gerüstloses Bauen - Sicherheit ohne Standardgerüst...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '82156f1f-71c9-468d-9c0e-e0bd468deac6',
  '12',
  'Gerüstloses Bauen - Sicherheit ohne Standardgerüst',
  'Gerüstloses Bauen ist in der Schweiz bewilligungspflichtig. Gemäss den gesetzlichen Vorgaben muss ab einer Absturzhöhe von zwei Metern ein Fassadengerüst errichtet werden. In Ausnahmefällen kann die Suva eine schriftliche Bewilligung erteilen – vorausgesetzt, die gewählte Ersatzlösung erfüllt die Schutzziele für Arbeitnehmende und die Öffentlichkeit gleichwertig oder besser.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T13:17:13.389489',
  '2026-01-20T13:17:13.389489'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 13: Gerüstkontrollen und Abnahme - Sicherheit vor Arbe...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '993a2d3c-816e-4adb-85ed-7e3d75b79a10',
  '13',
  'Gerüstkontrollen und Abnahme - Sicherheit vor Arbeitsbeginn',
  'Wir führen für Sie fachgerechte Gerüstkontrollen und Abnahmen gemäss den gesetzlichen Vorgaben durch. Diese Prüfungen sind unerlässlich, um die Sicherheit der Mitarbeitenden zu gewährleisten und die Einhaltung der Schutzmassnahmen auf der Baustelle sicherzustellen.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T13:17:13.389972',
  '2026-01-20T13:17:13.389972'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 14: Incident Management - Zwischenfälle systematisch e...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  'f6536ff1-37c0-4960-84d2-c00f86ef301c',
  '14',
  'Incident Management - Zwischenfälle systematisch erfassen und beheben',
  'Wir übernehmen für Sie das Incident Management oder unterstützen Sie bei der Einführung eines strukturierten Systems zur Erfassung, Analyse und Behebung von sicherheits-, gesundheits- oder umweltrelevanten Zwischenfällen. Die Tiefe und Ausgestaltung richten sich nach Ihren spezifischen Anforderungen und Projektbedingungen.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T13:17:13.390306',
  '2026-01-20T13:17:13.390306'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 15: Instruktion - Praxisnahe Anleitung direkt am Arbei...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '521902c3-cb91-4e40-b880-c1ec620c6ae3',
  '15',
  'Instruktion - Praxisnahe Anleitung direkt am Arbeitsplatz',
  'Wir bieten ein breites Spektrum an praxisorientierten Instruktionen für einzelne Tätigkeiten direkt am Arbeitsplatz. Die Instruktion vermittelt den sicheren Umgang mit Geräten, Anlagen oder Arbeitsmitteln und ist ein zentraler Bestandteil der Arbeitssicherheit.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T13:17:13.390794',
  '2026-01-20T13:17:13.390794'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 16: JSA (Job Safety Analyse) - Arbeitssicherheitsanaly...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '508ac874-1df0-4727-a079-4ab2e2772570',
  '16',
  'JSA (Job Safety Analyse) - Arbeitssicherheitsanalyse für strukturierte Risikominimierung',
  'Wir unterstützen Sie bei der Einführung und Umsetzung der Arbeitssicherheitsanalyse (JSA) in Ihrem Betrieb. Die Methode dient der systematischen Ermittlung und Minimierung von Gefahren am Arbeitsplatz, indem Arbeitsprozesse in einzelne Phasen unterteilt und die damit verbundenen Risiken analysiert werden.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T13:17:13.392719',
  '2026-01-20T13:17:13.392719'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 17: Kennzeichnungen & Beschriftungen - Orientierung sc...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  'd8ac5aaf-9564-4d28-82a5-0a2cc7db4fab',
  '17',
  'Kennzeichnungen & Beschriftungen - Orientierung schafft Sicherheit',
  'Wir übernehmen für Sie die fachgerechte Umsetzung von Kennzeichnungen und Beschriftungen im Rahmen Ihres Projekts oder Betriebs. Diese organisatorische Massnahme trägt wesentlich dazu bei, die Sicherheit und Gesundheit Ihrer Mitarbeitenden zu gewährleisten und die Umwelt zu schützen.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T13:17:13.393264',
  '2026-01-20T13:17:13.393264'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 18: Kick Off Meeting - EHS von Beginn an integriert...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  'b4904f02-d146-4e60-a4f1-522103094beb',
  '18',
  'Kick Off Meeting - EHS von Beginn an integriert',
  'Wir empfehlen Ihnen, EHS als festen Bestandteil Ihres Kick Off Meetings zu integrieren. Das Meeting findet mit ausreichend Vorlaufzeit vor Projektstart statt und wird in der Regel durch die Bau- oder Projektleitung organisiert und durchgeführt.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T13:17:13.393831',
  '2026-01-20T13:17:13.393831'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 19: Konsequenzen Management - Verhalten gezielt steuer...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '1a97aa30-834f-4e0c-8cfb-062ddb5a8c88',
  '19',
  'Konsequenzen Management - Verhalten gezielt steuern und fördern',
  'Wir unterstützen Sie bei der Einführung und Umsetzung eines strukturierten Konsequenzenmanagements in Ihrem Projekt oder Betrieb. Ziel ist es, das Verhalten Ihrer Mitarbeitenden im Hinblick auf Umwelt-, Gesundheits- und Sicherheitsvorschriften systematisch zu steuern und nachhaltig zu verbessern.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T13:17:13.394761',
  '2026-01-20T13:17:13.394761'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 20: Lessons Learned - Lernen aus Erfahrung für mehr Si...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '3712e428-1981-4b1e-8b15-958ccf39772f',
  '20',
  'Lessons Learned - Lernen aus Erfahrung für mehr Sicherheit',
  'Wir unterstützen Sie bei der systematischen Erfassung und Auswertung von Erkenntnissen aus sicherheitsrelevanten Ereignissen. Lessons Learned bezeichnet das Lernen aus Erfahrung mit dem Ziel, gewonnene Einsichten aktiv zu nutzen und zukünftige Risiken zu minimieren.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T13:17:13.395604',
  '2026-01-20T13:17:13.395604'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 21: LMRA (Last Minute Risk Assessment) - Sicherheit pr...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '9d970ff5-b72f-453a-9d83-307a17ce6ce8',
  '21',
  'LMRA (Last Minute Risk Assessment) - Sicherheit prüfen, bevor die Arbeit beginnt',
  'Wir unterstützen Sie bei der Einführung und Umsetzung einer Last Minute Risk Assessment (LMRA) in Ihrem Betrieb oder Projekt. Die LMRA ist eine kurzfristige Risikobewertung, die unmittelbar vor Beginn einer Tätigkeit durchgeführt wird. Ziel ist es, potenzielle Gefahren zu erkennen und sicherzustellen, dass alle notwendigen Schutzmassnahmen getroffen wurden.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T13:17:13.396273',
  '2026-01-20T13:17:13.396273'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 22: Methode Statement - Sicherheit und Effizienz in de...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  'df9ffdee-d0c8-4736-8aca-5dabc13c3b69',
  '22',
  'Methode Statement - Sicherheit und Effizienz in der Arbeitsausführung',
  'Wir erstellen oder überprüfen für Sie ein auf Ihre Tätigkeiten zugeschnittenes Methode Statement. Dieses Dokument ist Teil des Sicherheits- und Gesundheitsschutzkonzepts und beschreibt die baustellenspezifischen Massnahmen zur sicheren Durchführung von Arbeiten. Seit 2022 ist ein solches Konzept gemäss BauAV Artikel 4 für jede Baustelle verpflichtend.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T13:17:13.396958',
  '2026-01-20T13:17:13.396958'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 23: Notfall- / Brandschutzkonzept - Sicherheit im Erns...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '69d7950d-be4d-4a61-b009-4a3cc4d3922a',
  '23',
  'Notfall- / Brandschutzkonzept - Sicherheit im Ernstfall gewährleisten',
  'Wir erstellen für Sie ein umfassendes Notfall- und Brandschutzkonzept, das darauf abzielt, Personen und Sachwerte im Falle eines Brandes oder eines anderen Notfalls bestmöglich zu schützen. Das Konzept berücksichtigt projektspezifische Risiken und definiert klare Abläufe für den Ernstfall – strukturiert, praxisnah und gesetzeskonform.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T13:17:13.397993',
  '2026-01-20T13:17:13.397993'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 24: Risk Assessment - Gefahren erkennen, bevor sie ent...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '42390034-2f0d-4a9d-9465-6f97085f5ec1',
  '24',
  'Risk Assessment - Gefahren erkennen, bevor sie entstehen',
  'Wir unterstützen Sie bei der Durchführung einer strukturierten Risikoanalyse für Ihre Tätigkeiten, Projekte oder betrieblichen Abläufe. Ziel ist es, potenzielle Gefahren frühzeitig zu identifizieren und wirksame Massnahmen zur Risikominimierung zu entwickeln.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T13:17:13.398679',
  '2026-01-20T13:17:13.398679'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 25: Safety Stand Down - Sicherheit bewusst in den Mitt...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '0b6649af-3242-431c-9930-3477d510767d',
  '25',
  'Safety Stand Down - Sicherheit bewusst in den Mittelpunkt stellen',
  'Wir unterstützen Sie bei der Planung und Durchführung eines Safety Stand Down – einer gezielten Unterbrechung der Tätigkeiten, bei der Führungskräfte und Mitarbeitende zusammenkommen, um sicherheitsrelevante Themen zu besprechen, Bedenken zu adressieren und bewährte Praktiken zu stärken.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T13:17:13.400287',
  '2026-01-20T13:17:13.400287'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 26: Ausbildungen - Qualifikation durch Theorie und Pra...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  'e780f894-a21d-4c52-bdb4-788a827db96c',
  '26',
  'Ausbildungen - Qualifikation durch Theorie und Praxis',
  'Wir organisieren für Sie spezifische und qualitativ hochwertige Ausbildungen – entweder direkt im Rahmen Ihres Projekts oder in einem qualifizierten Partnerbetrieb in Ihrer Nähe. Die Ausbildung vermittelt theoretische und praktische Kenntnisse zu einem umfassenden Thema und schliesst mit einem Ausbildungsnachweis ab, sofern die erforderlichen Kompetenzen nachgewiesen werden.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T13:17:13.401125',
  '2026-01-20T13:17:13.401125'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 27: Sicherheitsrundgänge - Sicherheit sichtbar machen...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '01b7126a-9645-4caf-ac5a-2d29cedf8754',
  '27',
  'Sicherheitsrundgänge - Sicherheit sichtbar machen',
  'Wir führen für Sie dokumentierte Sicherheitsrundgänge im Projekt oder Betrieb durch, um die Einhaltung gesetzlicher Vorschriften sicherzustellen und die Sicherheit sowie Gesundheit Ihrer Mitarbeitenden aktiv zu fördern. Die Rundgänge dienen der frühzeitigen Erkennung von Gefahren, der Optimierung von Prozessen und der Stärkung der Sicherheitskultur vor Ort.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T13:17:13.402688',
  '2026-01-20T13:17:13.402688'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 28: Tool Box - Sicherheit im täglichen Austausch...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '1d209548-9686-4089-994d-8a0be4292d13',
  '28',
  'Tool Box - Sicherheit im täglichen Austausch',
  'Wir unterstützen Sie bei der Einführung und Aufrechterhaltung von Tool Box Meetings – kurzen, informellen Sicherheitsbesprechungen, die täglich vor Arbeitsbeginn stattfinden. Ziel dieser Treffen ist es, sicherheitsrelevante Themen zu besprechen, Bedenken zu adressieren und das Bewusstsein für potenzielle Gefahren zu schärfen.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T13:17:13.403175',
  '2026-01-20T13:17:13.403175'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 29: Workshop - Interaktives Lernen für mehr Sicherheit...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '3986ee8d-e12d-465f-ad9e-2d8d1201aa6a',
  '29',
  'Workshop - Interaktives Lernen für mehr Sicherheit',
  'Wir unterstützen Sie bei der Planung und Durchführung spezifischer Workshops, die auf die Bedürfnisse Ihres Unternehmens zugeschnitten sind. Ein Workshop ist ein zeitlich begrenztes, praxisorientiertes Format, bei dem sich Teams intensiv mit einem sicherheitsrelevanten Thema auseinandersetzen. Im Gegensatz zu klassischen Schulungen sind die Teilnehmenden aktiv eingebunden und erarbeiten gemeinsam Lösungen.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T13:17:13.403926',
  '2026-01-20T13:17:13.403926'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 30: Erste Hilfe - Sofortmassnahmen im Ernstfall...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  'ec14b9f3-3da1-465c-91fc-f200b6ea1a22',
  '30',
  'Erste Hilfe - Sofortmassnahmen im Ernstfall',
  'Wir unterstützen Sie bei der Organisation und Umsetzung eines wirksamen Erste-Hilfe-Konzepts in Ihrem Betrieb oder Projekt. Erste Hilfe umfasst alle Massnahmen, die bei Unfällen oder akuten gesundheitlichen Problemen sofort ergriffen werden, um Leben zu retten und Folgeschäden zu minimieren.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T13:17:13.404817',
  '2026-01-20T13:17:13.404817'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 31: Konzept Zwischendecke - Sicherheit und Struktur fü...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '33dc6be4-6879-4a96-b0c7-628cee288846',
  '31',
  'Konzept Zwischendecke - Sicherheit und Struktur für Deckensysteme',
  'Wir erstellen für Sie ein projektspezifisches Konzept zur sicheren Planung, Ausführung und Kontrolle von Zwischendecken. Diese Deckensysteme kommen häufig bei Umbauten, Sanierungen oder technischen Installationen zum Einsatz und erfordern besondere Aufmerksamkeit hinsichtlich Statik, Zugangssicherheit und Brandschutz.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T13:17:13.406289',
  '2026-01-20T13:17:13.406289'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 32: Flucht & Rettungspläne - Orientierung im Ernstfall...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '7d81da38-13c2-449d-a488-faf470c6f238',
  '32',
  'Flucht & Rettungspläne - Orientierung im Ernstfall',
  'Wir erstellen für Sie projektspezifische Flucht- und Rettungspläne, die im Notfall eine sichere und strukturierte Evakuierung von Personen aus Gebäuden oder Anlagen ermöglichen. Diese Pläne sind ein zentraler Bestandteil des Notfallmanagements und tragen wesentlich zur Sicherheit Ihrer Mitarbeitenden und Besucher bei.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T13:17:13.407105',
  '2026-01-20T13:17:13.407105'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 33: Hebekonzept - Sicheres Heben beginnt mit klarer Pl...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  'c697541e-cdcc-427d-9ca0-72c8bbe2595e',
  '33',
  'Hebekonzept - Sicheres Heben beginnt mit klarer Planung',
  'Wir erstellen für Sie ein massgeschneidertes Hebekonzept, das alle sicherheitsrelevanten Aspekte Ihrer Hebetätigkeiten berücksichtigt – sei es bei Einbringungen, Montagearbeiten oder temporären Hebevorgängen. Ziel ist es, die Sicherheit und Gesundheit Ihrer Mitarbeitenden zu gewährleisten und gleichzeitig die gesetzlichen Anforderungen zu erfüllen.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T13:17:13.407798',
  '2026-01-20T13:17:13.407798'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 34: Gap Analyse - Lücken erkennen, Standards erreichen...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '388c993e-b6af-41e4-be9b-d0839eec0fc8',
  '34',
  'Gap Analyse - Lücken erkennen, Standards erreichen',
  'Wir erstellen für Sie eine fundierte Gap Analyse, um den Unterschied zwischen dem aktuellen Zustand Ihres Unternehmens und dem angestrebten Zielzustand zu identifizieren. Dieses strategische Instrument hilft dabei, gezielte Massnahmen zu entwickeln, um bestehende Lücken zu schliessen und Ihre EHS-Strategien kontinuierlich zu verbessern.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T13:17:13.408385',
  '2026-01-20T13:17:13.408385'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 35: Gefahrenstoffbeauftragte / -r - Verantwortung doku...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  'f30f7fe6-51fb-42bc-abc0-c93d3ad7fb08',
  '35',
  'Gefahrenstoffbeauftragte / -r - Verantwortung dokumentieren und Sicherheit gewährleisten',
  'In der Schweiz besteht für Unternehmen eine gesetzliche Pflicht zur regelmässigen Erstellung eines Jahresberichts über Gefahrstoffe. Dieser Bericht muss durch einen qualifizierten Gefahrenstoffbeauftragten geprüft und freigegeben werden. Die Anforderungen sind Teil der übergeordneten Regelungen zur nachhaltigen Unternehmensführung sowie zur Sicherstellung von Arbeitssicherheit und Umweltschutz.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T13:17:13.408905',
  '2026-01-20T13:17:13.408905'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 36: Krankonzepte - Risiken minimieren und Sicherheit g...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  'aae6a379-ecde-40d5-826a-8dfb0fa472e0',
  '36',
  'Krankonzepte - Risiken minimieren und Sicherheit gewährleisten',
  'In der Schweiz ist für den Betrieb von Kränen ein spezifisches Sicherheitskonzept erforderlich. Dieses Konzept muss auf den jeweiligen Einsatzort abgestimmt sein und dient der Einhaltung gesetzlicher Vorschriften sowie der Sicherstellung von Arbeitssicherheit und Schutz Dritter. Die Anforderungen sind Teil der übergeordneten Regelungen zur sicheren Baustellenorganisation und zur Prävention von Unfällen im Hoch- und Tiefbau.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T13:17:13.409389',
  '2026-01-20T13:17:13.409389'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 37: SiBe Brandschutz - Verantwortung übernehmen und Ri...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '08c28b9b-9b69-4736-941f-5805a822dc1c',
  '37',
  'SiBe Brandschutz - Verantwortung übernehmen und Risiken vorbeugen',
  'In der Schweiz ist die Bestellung eines Sicherheitsbeauftragten für den Brandschutz (SiBe) ein zentraler Bestandteil eines professionellen Sicherheitskonzepts. Der SiBe trägt die Verantwortung für die Einhaltung brandschutztechnischer Vorgaben und unterstützt die Projektleitung bei der Umsetzung präventiver Massnahmen. Diese Rolle ist essenziell für die Sicherheit von Personen, Sachwerten und Infrastruktur – insbesondere in komplexen Bau- und Industrieprojekten.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T13:17:13.409961',
  '2026-01-20T13:17:13.409961'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";

-- Article 38: Instruktion Brandwache - Sicherheit beginnt mit Wi...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  'ff1c0d81-570f-4e88-b024-f52562c44bb5',
  '38',
  'Instruktion Brandwache - Sicherheit beginnt mit Wissen und Vorbereitung',
  'In Projekten mit erhöhtem Brandrisiko ist die Instruktion der Brandwache ein zentraler Bestandteil des Sicherheitskonzepts. Ziel ist es, die eingesetzten Personen gezielt auf ihre Aufgaben vorzubereiten und sicherzustellen, dass sie im Ernstfall schnell, effektiv und sicher reagieren können. Die vermittelten Inhalte orientieren sich an den geltenden Vorschriften und Best Practices im vorbeugenden Brandschutz.',
  'Dienstleistung',
  0,
  7.7,
  true,
  '2026-01-20T13:17:13.410482',
  '2026-01-20T13:17:13.410482'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";
