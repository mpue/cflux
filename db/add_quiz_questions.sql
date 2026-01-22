-- Füge Fragen zum KI Quiz hinzu

-- Frage 1: Single Choice - KI Definition
INSERT INTO questions (id, "quizId", "questionText", "questionType", points, "order", explanation, "caseSensitive", "isActive", "createdAt", "updatedAt")
VALUES (
  'ki-q1',
  'ki-quiz-01-data',
  'Was bedeutet KI (Künstliche Intelligenz)?',
  'SINGLE_CHOICE',
  1,
  1,
  'KI bezeichnet die Fähigkeit von Maschinen, Aufgaben auszuführen, die normalerweise menschliche Intelligenz erfordern.',
  false,
  true,
  NOW(),
  NOW()
);

INSERT INTO answers (id, "questionId", "answerText", "isCorrect", "order", "createdAt", "updatedAt")
VALUES
  ('ki-q1-a1', 'ki-q1', 'Die Fähigkeit von Maschinen, menschliche Intelligenz zu simulieren', true, 1, NOW(), NOW()),
  ('ki-q1-a2', 'ki-q1', 'Ein Computerprogramm zum Spielen von Schach', false, 2, NOW(), NOW()),
  ('ki-q1-a3', 'ki-q1', 'Eine neue Programmiersprache', false, 3, NOW(), NOW()),
  ('ki-q1-a4', 'ki-q1', 'Ein Hardware-Komponente im Computer', false, 4, NOW(), NOW());

-- Frage 2: Multiple Choice - Machine Learning Typen
INSERT INTO questions (id, "quizId", "questionText", "questionType", points, "order", explanation, "caseSensitive", "isActive", "createdAt", "updatedAt")
VALUES (
  'ki-q2',
  'ki-quiz-01-data',
  'Welche der folgenden sind Hauptarten des Machine Learning? (Mehrfachauswahl)',
  'MULTIPLE_CHOICE',
  2,
  2,
  'Die drei Hauptarten sind: Überwachtes Lernen, Unüberwachtes Lernen und Verstärkendes Lernen.',
  false,
  true,
  NOW(),
  NOW()
);

INSERT INTO answers (id, "questionId", "answerText", "isCorrect", "order", "createdAt", "updatedAt")
VALUES
  ('ki-q2-a1', 'ki-q2', 'Supervised Learning (Überwachtes Lernen)', true, 1, NOW(), NOW()),
  ('ki-q2-a2', 'ki-q2', 'Unsupervised Learning (Unüberwachtes Lernen)', true, 2, NOW(), NOW()),
  ('ki-q2-a3', 'ki-q2', 'Reinforcement Learning (Verstärkendes Lernen)', true, 3, NOW(), NOW()),
  ('ki-q2-a4', 'ki-q2', 'Automatic Learning', false, 4, NOW(), NOW()),
  ('ki-q2-a5', 'ki-q2', 'Manual Learning', false, 5, NOW(), NOW());

-- Frage 3: True/False - Deep Learning
INSERT INTO questions (id, "quizId", "questionText", "questionType", points, "order", explanation, "caseSensitive", "isActive", "createdAt", "updatedAt")
VALUES (
  'ki-q3',
  'ki-quiz-01-data',
  'Deep Learning verwendet künstliche neuronale Netze mit vielen Schichten.',
  'TRUE_FALSE',
  1,
  3,
  'Richtig! Deep Learning basiert auf tiefen neuronalen Netzen mit vielen versteckten Schichten.',
  false,
  true,
  NOW(),
  NOW()
);

INSERT INTO answers (id, "questionId", "answerText", "isCorrect", "order", "createdAt", "updatedAt")
VALUES
  ('ki-q3-a1', 'ki-q3', 'Wahr', true, 1, NOW(), NOW()),
  ('ki-q3-a2', 'ki-q3', 'Falsch', false, 2, NOW(), NOW());

-- Frage 4: Single Choice - CNN Anwendung
INSERT INTO questions (id, "quizId", "questionText", "questionType", points, "order", explanation, "caseSensitive", "isActive", "createdAt", "updatedAt")
VALUES (
  'ki-q4',
  'ki-quiz-01-data',
  'Wofür werden Convolutional Neural Networks (CNNs) hauptsächlich verwendet?',
  'SINGLE_CHOICE',
  1,
  4,
  'CNNs sind spezialisiert auf Bilderkennung und Computer Vision Aufgaben.',
  false,
  true,
  NOW(),
  NOW()
);

INSERT INTO answers (id, "questionId", "answerText", "isCorrect", "order", "createdAt", "updatedAt")
VALUES
  ('ki-q4-a1', 'ki-q4', 'Textverarbeitung', false, 1, NOW(), NOW()),
  ('ki-q4-a2', 'ki-q4', 'Bilderkennung', true, 2, NOW(), NOW()),
  ('ki-q4-a3', 'ki-q4', 'Sprachsynthese', false, 3, NOW(), NOW()),
  ('ki-q4-a4', 'ki-q4', 'Datenbankverwaltung', false, 4, NOW(), NOW());

-- Frage 5: Single Choice - KI im Alltag
INSERT INTO questions (id, "quizId", "questionText", "questionType", points, "order", explanation, "caseSensitive", "isActive", "createdAt", "updatedAt")
VALUES (
  'ki-q5',
  'ki-quiz-01-data',
  'Welches dieser Beispiele ist KEINE Anwendung von KI im Alltag?',
  'SINGLE_CHOICE',
  1,
  5,
  'Ein einfacher Taschenrechner verwendet keine KI - er führt nur vordefinierte Berechnungen aus.',
  false,
  true,
  NOW(),
  NOW()
);

INSERT INTO answers (id, "questionId", "answerText", "isCorrect", "order", "createdAt", "updatedAt")
VALUES
  ('ki-q5-a1', 'ki-q5', 'Sprachassistenten wie Siri oder Alexa', false, 1, NOW(), NOW()),
  ('ki-q5-a2', 'ki-q5', 'Empfehlungen auf Netflix oder Amazon', false, 2, NOW(), NOW()),
  ('ki-q5-a3', 'ki-q5', 'Ein einfacher Taschenrechner', true, 3, NOW(), NOW()),
  ('ki-q5-a4', 'ki-q5', 'Gesichtserkennung auf Smartphones', false, 4, NOW(), NOW());
