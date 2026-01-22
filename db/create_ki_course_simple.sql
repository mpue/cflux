-- Einfacher KI-Testkurs
-- Kategorie erstellen
INSERT INTO course_categories (id, name, description, created_at, updated_at, is_active)
VALUES ('ki-tech-cat', 'Technologie & KI', 'Kurse über Technologie und Künstliche Intelligenz', NOW(), NOW(), true)
ON CONFLICT (id) DO NOTHING;

-- Kurs erstellen
INSERT INTO courses (id, title, description, course_type, status, duration, passing_score, level, tags, created_by_id, updated_by_id, is_active, created_at, updated_at, category_id)
SELECT 
  'ki-kurs-2026',
  'KI für Einsteiger',
  'Ein umfassender Einführungskurs in die Welt der Künstlichen Intelligenz. Lernen Sie die Grundlagen, Anwendungen und ethischen Aspekte von KI kennen.',
  'OPTIONAL',
  'PUBLISHED',
  180,
  80,
  'Beginner',
  ARRAY['KI', 'Technologie', 'Machine Learning', 'Deep Learning'],
  (SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1),
  (SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1),
  true,
  NOW(),
  NOW(),
  'ki-tech-cat'
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE id = 'ki-kurs-2026');

-- Lektion 1: Einführung
INSERT INTO lessons (id, course_id, title, description, content_type, content, "order", duration, is_active, created_at, updated_at)
VALUES (
  'ki-lesson-01',
  'ki-kurs-2026',
  'Was ist Künstliche Intelligenz?',
  'Grundlegende Konzepte und Geschichte der KI',
  'HTML',
  '<h1>Was ist Künstliche Intelligenz?</h1>

<h2>Definition</h2>
<p>Künstliche Intelligenz (KI oder AI - Artificial Intelligence) bezeichnet die Fähigkeit von Maschinen und Computersystemen, Aufgaben auszuführen, die normalerweise menschliche Intelligenz erfordern.</p>

<h3>Hauptbereiche:</h3>
<ul>
<li><strong>Lernen</strong>: Die Fähigkeit, aus Erfahrungen zu lernen und sich zu verbessern</li>
<li><strong>Problemlösung</strong>: Das Finden von Lösungen für komplexe Herausforderungen</li>
<li><strong>Mustererkennung</strong>: Das Identifizieren von Mustern in großen Datenmengen</li>
<li><strong>Sprachverarbeitung</strong>: Das Verstehen und Generieren natürlicher Sprache</li>
<li><strong>Entscheidungsfindung</strong>: Das Treffen rationaler Entscheidungen basierend auf Daten</li>
</ul>

<h2>Geschichte der KI</h2>
<h3>Die Anfänge (1950er Jahre)</h3>
<p>Alan Turing stellte 1950 die Frage: "Können Maschinen denken?" und entwickelte den berühmten Turing-Test. 1956 wurde bei der Dartmouth Conference der Begriff "Artificial Intelligence" offiziell geprägt.</p>

<h3>Moderne Ära (2010er-heute)</h3>
<p>Mit Deep Learning, Big Data und Cloud Computing erlebt KI einen beispiellosen Durchbruch. Von Sprachassistenten bis zu selbstfahrenden Autos - KI ist allgegenwärtig.</p>

<h2>Schlüsselbegriffe</h2>
<ul>
<li><strong>Machine Learning</strong>: Algorithmen, die aus Daten lernen</li>
<li><strong>Deep Learning</strong>: Künstliche neuronale Netze mit vielen Schichten</li>
<li><strong>Training</strong>: Der Prozess, bei dem ein KI-Modell aus Beispieldaten lernt</li>
</ul>',
  1,
  900,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Lektion 2: KI-Arten
INSERT INTO lessons (id, course_id, title, description, content_type, content, "order", duration, is_active, created_at, updated_at)
VALUES (
  'ki-lesson-02',
  'ki-kurs-2026',
  'Arten von KI-Systemen',
  'Klassifizierung von KI nach Fähigkeiten',
  'HTML',
  '<h1>Arten von KI-Systemen</h1>

<h2>Nach Fähigkeiten</h2>

<h3>Schwache KI (Narrow AI)</h3>
<ul>
<li>Spezialisiert auf eine spezifische Aufgabe</li>
<li><strong>Beispiele</strong>: Sprachassistenten (Siri, Alexa), Bilderkennungssysteme, Schachcomputer</li>
<li><strong>Status</strong>: Heute weit verbreitet und im praktischen Einsatz</li>
</ul>

<h3>Starke KI (General AI)</h3>
<ul>
<li>Kann jede intellektuelle Aufgabe verstehen und lernen, die ein Mensch kann</li>
<li><strong>Status</strong>: Noch theoretisch, nicht erreicht</li>
</ul>

<h2>Anwendungsgebiete</h2>

<h3>Computer Vision</h3>
<ul>
<li>Bilderkennung und -analyse</li>
<li>Gesichtserkennung</li>
<li>Autonome Fahrzeuge</li>
<li>Medizinische Bildgebung</li>
</ul>

<h3>Natural Language Processing (NLP)</h3>
<ul>
<li>Sprachübersetzung</li>
<li>Chatbots und virtuelle Assistenten</li>
<li>Textanalyse</li>
<li>Sentiment-Analyse</li>
</ul>

<h3>Robotik</h3>
<ul>
<li>Industrieroboter</li>
<li>Service-Roboter</li>
<li>Medizinische Robotik</li>
</ul>

<h3>Empfehlungssysteme</h3>
<ul>
<li>Netflix, Spotify, Amazon</li>
<li>Personalisierte Inhalte</li>
<li>Social Media Feeds</li>
</ul>',
  2,
  720,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Lektion 3: Video
INSERT INTO lessons (id, course_id, title, description, content_type, video_url, "order", duration, is_active, created_at, updated_at)
VALUES (
  'ki-lesson-03',
  'ki-kurs-2026',
  'Einführung in Machine Learning',
  'Video-Tutorial über die Grundlagen des maschinellen Lernens',
  'VIDEO',
  'https://www.youtube.com/watch?v=ukzFI9rgwfU',
  3,
  1200,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Quiz Lektion
INSERT INTO lessons (id, course_id, title, description, content_type, content, "order", duration, is_active, created_at, updated_at)
VALUES (
  'ki-quiz-01',
  'ki-kurs-2026',
  'Quiz: KI Grundlagen',
  'Testen Sie Ihr Wissen über die Grundlagen der KI',
  'QUIZ',
  'Beantworten Sie die folgenden Fragen zu den KI-Grundlagen.',
  4,
  600,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Quiz erstellen
INSERT INTO quizzes (id, lesson_id, title, description, passing_score, shuffle_questions, shuffle_answers, show_results, created_at, updated_at)
VALUES (
  'ki-quiz-01-data',
  'ki-quiz-01',
  'KI Grundlagen Quiz',
  'Testen Sie Ihr Verständnis der KI-Grundkonzepte',
  80,
  true,
  true,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Quiz-Fragen
INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, points, "order", created_at, updated_at)
VALUES
  ('kiq1-1', 'ki-quiz-01-data', 'Was bedeutet die Abkürzung "KI"?', 'SINGLE_CHOICE', 10, 1, NOW(), NOW()),
  ('kiq1-2', 'ki-quiz-01-data', 'Wann wurde der Begriff "Artificial Intelligence" offiziell geprägt?', 'SINGLE_CHOICE', 10, 2, NOW(), NOW()),
  ('kiq1-3', 'ki-quiz-01-data', 'Welche dieser Technologien sind Beispiele für Schwache KI? (Mehrfachauswahl)', 'MULTIPLE_CHOICE', 15, 3, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Antworten für Frage 1
INSERT INTO quiz_answers (id, question_id, answer_text, is_correct, "order", created_at, updated_at)
VALUES
  ('kia1-1-1', 'kiq1-1', 'Künstliche Intelligenz', true, 1, NOW(), NOW()),
  ('kia1-1-2', 'kiq1-1', 'Kreative Innovation', false, 2, NOW(), NOW()),
  ('kia1-1-3', 'kiq1-1', 'Kommunikative Integration', false, 3, NOW(), NOW()),
  ('kia1-1-4', 'kiq1-1', 'Komplexe Informatik', false, 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Antworten für Frage 2
INSERT INTO quiz_answers (id, question_id, answer_text, is_correct, "order", created_at, updated_at)
VALUES
  ('kia1-2-1', 'kiq1-2', '1950', false, 1, NOW(), NOW()),
  ('kia1-2-2', 'kiq1-2', '1956', true, 2, NOW(), NOW()),
  ('kia1-2-3', 'kiq1-2', '1970', false, 3, NOW(), NOW()),
  ('kia1-2-4', 'kiq1-2', '1997', false, 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Antworten für Frage 3
INSERT INTO quiz_answers (id, question_id, answer_text, is_correct, "order", created_at, updated_at)
VALUES
  ('kia1-3-1', 'kiq1-3', 'Sprachassistenten wie Siri', true, 1, NOW(), NOW()),
  ('kia1-3-2', 'kiq1-3', 'Selbstfahrende Autos', true, 2, NOW(), NOW()),
  ('kia1-3-3', 'kiq1-3', 'Superintelligente Roboter mit Bewusstsein', false, 3, NOW(), NOW()),
  ('kia1-3-4', 'kiq1-3', 'Bilderkennungssysteme', true, 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Lektion 4: Machine Learning
INSERT INTO lessons (id, course_id, title, description, content_type, content, "order", duration, is_active, created_at, updated_at)
VALUES (
  'ki-lesson-04',
  'ki-kurs-2026',
  'Machine Learning Grundlagen',
  'Verstehen Sie die drei Hauptarten des maschinellen Lernens',
  'HTML',
  '<h1>Machine Learning Grundlagen</h1>

<h2>Die drei Hauptarten</h2>

<h3>1. Überwachtes Lernen (Supervised Learning)</h3>
<p>Das System lernt aus <strong>gelabelten Daten</strong> - d.h., die Trainingsdaten enthalten sowohl Eingaben als auch die gewünschten Ausgaben.</p>

<h4>Anwendungen:</h4>
<ul>
<li>Spam-Filterung (E-Mail ist Spam: ja/nein)</li>
<li>Bilderkennung (Bild zeigt: Katze/Hund/Auto)</li>
<li>Medizinische Diagnose (Tumor ist: gutartig/bösartig)</li>
<li>Preisvorhersage</li>
</ul>

<h4>Algorithmen:</h4>
<ul>
<li>Lineare Regression</li>
<li>Random Forests</li>
<li>Neuronale Netze</li>
</ul>

<h3>2. Unüberwachtes Lernen (Unsupervised Learning)</h3>
<p>Das System findet <strong>eigene Muster</strong> in Daten <strong>ohne Labels</strong>.</p>

<h4>Anwendungen:</h4>
<ul>
<li>Kundensegmentierung</li>
<li>Anomalie-Erkennung (Betrugserkennung)</li>
<li>Empfehlungssysteme</li>
</ul>

<h3>3. Verstärkendes Lernen (Reinforcement Learning)</h3>
<p>Das System lernt durch <strong>Trial-and-Error</strong> und erhält <strong>Belohnungen</strong> für gute Aktionen.</p>

<h4>Anwendungen:</h4>
<ul>
<li>Spielende KI (AlphaGo, Schach)</li>
<li>Robotersteuerung</li>
<li>Selbstfahrende Autos</li>
<li>Ressourcenmanagement</li>
</ul>

<h2>Der ML-Workflow</h2>
<ol>
<li>Problemdefinition</li>
<li>Datensammlung</li>
<li>Datenaufbereitung</li>
<li>Modellauswahl</li>
<li>Training</li>
<li>Evaluierung</li>
<li>Deployment</li>
</ol>',
  5,
  1080,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Lektion 5: Deep Learning
INSERT INTO lessons (id, course_id, title, description, content_type, content, "order", duration, is_active, created_at, updated_at)
VALUES (
  'ki-lesson-05',
  'ki-kurs-2026',
  'Deep Learning verstehen',
  'Einführung in neuronale Netze und Deep Learning',
  'HTML',
  '<h1>Deep Learning verstehen</h1>

<h2>Was ist Deep Learning?</h2>
<p>Deep Learning ist eine spezialisierte Form des Machine Learning, die auf künstlichen neuronalen Netzen mit vielen Schichten basiert.</p>

<h2>Neuronale Netze - Aufbau</h2>
<h3>1. Eingabeschicht (Input Layer)</h3>
<ul>
<li>Empfängt die Rohdaten</li>
<li>Jeder Knoten repräsentiert ein Feature</li>
</ul>

<h3>2. Versteckte Schichten (Hidden Layers)</h3>
<ul>
<li>Mehrere Schichten von Neuronen</li>
<li>Extrahieren zunehmend abstrakte Features</li>
</ul>

<h3>3. Ausgabeschicht (Output Layer)</h3>
<ul>
<li>Liefert die finale Vorhersage</li>
</ul>

<h2>Arten von Deep Learning Architekturen</h2>

<h3>Convolutional Neural Networks (CNNs)</h3>
<ul>
<li><strong>Spezialisiert auf</strong>: Bilderkennung</li>
<li><strong>Anwendungen</strong>: Gesichtserkennung, Autonome Fahrzeuge, Medizinische Bildanalyse</li>
</ul>

<h3>Recurrent Neural Networks (RNNs)</h3>
<ul>
<li><strong>Spezialisiert auf</strong>: Sequenzdaten</li>
<li><strong>Anwendungen</strong>: Textgenerierung, Spracherkennung, Zeitreihenvorhersage</li>
</ul>

<h3>Transformers</h3>
<ul>
<li><strong>Spezialisiert auf</strong>: Natural Language Processing</li>
<li><strong>Berühmte Modelle</strong>: GPT, BERT, T5</li>
<li><strong>Anwendungen</strong>: Chatbots (ChatGPT), Übersetzung, Textgenerierung</li>
</ul>

<h2>Warum ist Deep Learning so erfolgreich?</h2>
<ol>
<li><strong>Big Data</strong>: Riesige Datenmengen verfügbar</li>
<li><strong>Rechenleistung</strong>: GPUs ermöglichen schnelles Training</li>
<li><strong>Algorithmen</strong>: Verbesserte Architekturen und Techniken</li>
<li><strong>Frameworks</strong>: TensorFlow, PyTorch machen es zugänglich</li>
</ol>',
  6,
  1200,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Video 2
INSERT INTO lessons (id, course_id, title, description, content_type, video_url, "order", duration, is_active, created_at, updated_at)
VALUES (
  'ki-lesson-06',
  'ki-kurs-2026',
  'Neuronale Netze visualisiert',
  'Animierte Erklärung wie neuronale Netze funktionieren',
  'VIDEO',
  'https://www.youtube.com/watch?v=aircAruvnKk',
  7,
  900,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Erfolgs-Nachricht
SELECT 
  'KI für Einsteiger Kurs erfolgreich erstellt!' as status,
  (SELECT COUNT(*) FROM lessons WHERE course_id = 'ki-kurs-2026') as lektionen,
  (SELECT COUNT(*) FROM quizzes WHERE lesson_id IN (SELECT id FROM lessons WHERE course_id = 'ki-kurs-2026')) as quizzes;
