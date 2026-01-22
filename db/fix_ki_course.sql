-- Kategorie erstellen
INSERT INTO course_categories (id, name, description, "createdAt", "updatedAt", "isActive")
VALUES ('ki-tech-cat', 'Technologie & KI', 'Kurse über Technologie und Künstliche Intelligenz', NOW(), NOW(), true)
ON CONFLICT (id) DO NOTHING;

-- Kurs aktualisieren (falls schon vorhanden) oder erstellen
INSERT INTO courses (id, title, description, "courseType", status, duration, "passingScore", level, tags, "createdById", "updatedById", "isActive", "createdAt", "updatedAt", "categoryId", "publishedAt")
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
  'ki-tech-cat',
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE id = 'ki-kurs-2026');

-- Lektion 1: Einführung
INSERT INTO lessons (id, "courseId", title, description, "contentType", content, "order", duration, "isActive", "createdAt", "updatedAt")
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
INSERT INTO lessons (id, "courseId", title, description, "contentType", content, "order", duration, "isActive", "createdAt", "updatedAt")
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
INSERT INTO lessons (id, "courseId", title, description, "contentType", "videoUrl", "order", duration, "isActive", "createdAt", "updatedAt")
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
INSERT INTO lessons (id, "courseId", title, description, "contentType", content, "order", duration, "isActive", "createdAt", "updatedAt")
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
INSERT INTO quizzes (id, "lessonId", title, description, "passingScore", "shuffleQuestions", "shuffleAnswers", "showResults", "createdAt", "updatedAt")
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
INSERT INTO quiz_questions (id, "quizId", "questionText", "questionType", points, "order", "createdAt", "updatedAt")
VALUES
  ('kiq1-1', 'ki-quiz-01-data', 'Was bedeutet die Abkürzung "KI"?', 'SINGLE_CHOICE', 10, 1, NOW(), NOW()),
  ('kiq1-2', 'ki-quiz-01-data', 'Wann wurde der Begriff "Artificial Intelligence" offiziell geprägt?', 'SINGLE_CHOICE', 10, 2, NOW(), NOW()),
  ('kiq1-3', 'ki-quiz-01-data', 'Welche dieser Technologien sind Beispiele für Schwache KI? (Mehrfachauswahl)', 'MULTIPLE_CHOICE', 15, 3, NOW(), NOW()),
  ('kiq1-4', 'ki-quiz-01-data', 'Deep Learning ist eine Unterkategorie von Machine Learning.', 'TRUE_FALSE', 10, 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Antworten für Frage 1
INSERT INTO quiz_answers (id, "questionId", "answerText", "isCorrect", "order", "createdAt", "updatedAt")
VALUES
  ('kia1-1-1', 'kiq1-1', 'Künstliche Intelligenz', true, 1, NOW(), NOW()),
  ('kia1-1-2', 'kiq1-1', 'Kreative Innovation', false, 2, NOW(), NOW()),
  ('kia1-1-3', 'kiq1-1', 'Kommunikative Integration', false, 3, NOW(), NOW()),
  ('kia1-1-4', 'kiq1-1', 'Komplexe Informatik', false, 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Antworten für Frage 2
INSERT INTO quiz_answers (id, "questionId", "answerText", "isCorrect", "order", "createdAt", "updatedAt")
VALUES
  ('kia1-2-1', 'kiq1-2', '1950', false, 1, NOW(), NOW()),
  ('kia1-2-2', 'kiq1-2', '1956', true, 2, NOW(), NOW()),
  ('kia1-2-3', 'kiq1-2', '1970', false, 3, NOW(), NOW()),
  ('kia1-2-4', 'kiq1-2', '1997', false, 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Antworten für Frage 3
INSERT INTO quiz_answers (id, "questionId", "answerText", "isCorrect", "order", "createdAt", "updatedAt")
VALUES
  ('kia1-3-1', 'kiq1-3', 'Sprachassistenten wie Siri', true, 1, NOW(), NOW()),
  ('kia1-3-2', 'kiq1-3', 'Selbstfahrende Autos', true, 2, NOW(), NOW()),
  ('kia1-3-3', 'kiq1-3', 'Superintelligente Roboter mit Bewusstsein', false, 3, NOW(), NOW()),
  ('kia1-3-4', 'kiq1-3', 'Bilderkennungssysteme', true, 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Antworten für Frage 4 (TRUE/FALSE)
INSERT INTO quiz_answers (id, "questionId", "answerText", "isCorrect", "order", "createdAt", "updatedAt")
VALUES
  ('kia1-4-1', 'kiq1-4', 'Richtig', true, 1, NOW(), NOW()),
  ('kia1-4-2', 'kiq1-4', 'Falsch', false, 2, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Lektion 5: Machine Learning
INSERT INTO lessons (id, "courseId", title, description, "contentType", content, "order", duration, "isActive", "createdAt", "updatedAt")
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
<li>Logistische Regression</li>
<li>Random Forests</li>
<li>Neuronale Netze</li>
</ul>

<h3>2. Unüberwachtes Lernen (Unsupervised Learning)</h3>
<p>Das System findet <strong>eigene Muster</strong> in Daten <strong>ohne Labels</strong>.</p>

<h4>Anwendungen:</h4>
<ul>
<li>Kundensegmentierung (Gruppen ähnlicher Kunden finden)</li>
<li>Anomalie-Erkennung (Betrugserkennung)</li>
<li>Dimensionsreduktion (Daten vereinfachen)</li>
<li>Empfehlungssysteme (ähnliche Produkte finden)</li>
</ul>

<h4>Algorithmen:</h4>
<ul>
<li>K-Means Clustering</li>
<li>Hierarchisches Clustering</li>
<li>Principal Component Analysis (PCA)</li>
</ul>

<h3>3. Verstärkendes Lernen (Reinforcement Learning)</h3>
<p>Das System lernt durch <strong>Trial-and-Error</strong> und erhält <strong>Belohnungen</strong> für gute Aktionen.</p>

<h4>Anwendungen:</h4>
<ul>
<li>Spielende KI (AlphaGo, Schach, Videospiele)</li>
<li>Robotersteuerung</li>
<li>Selbstfahrende Autos</li>
<li>Ressourcenmanagement</li>
</ul>

<h2>Der ML-Workflow</h2>
<ol>
<li><strong>Problemdefinition</strong>: Was wollen wir vorhersagen?</li>
<li><strong>Datensammlung</strong>: Relevante Daten sammeln</li>
<li><strong>Datenaufbereitung</strong>: Daten bereinigen und vorbereiten</li>
<li><strong>Feature Engineering</strong>: Relevante Merkmale auswählen</li>
<li><strong>Modellauswahl</strong>: Passenden Algorithmus wählen</li>
<li><strong>Training</strong>: Modell mit Trainingsdaten trainieren</li>
<li><strong>Evaluierung</strong>: Modellleistung testen</li>
<li><strong>Optimierung</strong>: Modell verbessern</li>
<li><strong>Deployment</strong>: Modell in Produktion bringen</li>
</ol>',
  5,
  1080,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Lektion 6: Deep Learning
INSERT INTO lessons (id, "courseId", title, description, "contentType", content, "order", duration, "isActive", "createdAt", "updatedAt")
VALUES (
  'ki-lesson-05',
  'ki-kurs-2026',
  'Deep Learning verstehen',
  'Einführung in neuronale Netze und Deep Learning',
  'HTML',
  '<h1>Deep Learning verstehen</h1>

<h2>Was ist Deep Learning?</h2>
<p>Deep Learning ist eine spezialisierte Form des Machine Learning, die auf künstlichen neuronalen Netzen mit vielen Schichten basiert. Es ist von der Funktionsweise des menschlichen Gehirns inspiriert.</p>

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
<li>Bei Deep Learning: viele Schichten (10, 50, 100+)</li>
</ul>

<h3>3. Ausgabeschicht (Output Layer)</h3>
<ul>
<li>Liefert die finale Vorhersage</li>
<li>Anzahl der Knoten = Anzahl der möglichen Ausgaben</li>
</ul>

<h2>Arten von Deep Learning Architekturen</h2>

<h3>Convolutional Neural Networks (CNNs)</h3>
<ul>
<li><strong>Spezialisiert auf</strong>: Bilderkennung</li>
<li><strong>Besonderheit</strong>: Convolutional Layers extrahieren räumliche Features</li>
<li><strong>Anwendungen</strong>: 
  <ul>
    <li>Gesichtserkennung</li>
    <li>Medizinische Bildanalyse</li>
    <li>Autonome Fahrzeuge</li>
    <li>Objekterkennung</li>
  </ul>
</li>
</ul>

<h3>Recurrent Neural Networks (RNNs)</h3>
<ul>
<li><strong>Spezialisiert auf</strong>: Sequenzdaten</li>
<li><strong>Besonderheit</strong>: Haben ein "Gedächtnis" für vorherige Eingaben</li>
<li><strong>Varianten</strong>: LSTM (Long Short-Term Memory), GRU</li>
<li><strong>Anwendungen</strong>:
  <ul>
    <li>Textgenerierung</li>
    <li>Spracherkennung</li>
    <li>Zeitreihenvorhersage</li>
    <li>Übersetzung</li>
  </ul>
</li>
</ul>

<h3>Transformers</h3>
<ul>
<li><strong>Spezialisiert auf</strong>: Natural Language Processing</li>
<li><strong>Besonderheit</strong>: Attention-Mechanismus</li>
<li><strong>Berühmte Modelle</strong>: GPT, BERT, T5</li>
<li><strong>Anwendungen</strong>:
  <ul>
    <li>Chatbots (ChatGPT)</li>
    <li>Übersetzung</li>
    <li>Textgenerierung</li>
    <li>Textanalyse</li>
  </ul>
</li>
</ul>

<h2>Warum ist Deep Learning so erfolgreich?</h2>
<ol>
<li><strong>Big Data</strong>: Riesige Datenmengen verfügbar</li>
<li><strong>Rechenleistung</strong>: GPUs ermöglichen schnelles Training</li>
<li><strong>Algorithmen</strong>: Verbesserte Architekturen und Techniken</li>
<li><strong>Frameworks</strong>: TensorFlow, PyTorch machen es zugänglich</li>
<li><strong>Transfer Learning</strong>: Vortrainierte Modelle wiederverwenden</li>
</ol>

<h2>Herausforderungen</h2>
<ul>
<li><strong>Daten</strong>: Benötigt sehr viele Trainingsdaten</li>
<li><strong>Rechenressourcen</strong>: Training kann Tage oder Wochen dauern</li>
<li><strong>Interpretierbarkeit</strong>: "Black Box" - schwer zu verstehen</li>
<li><strong>Overfitting</strong>: Gefahr bei zu komplexen Modellen</li>
<li><strong>Energie</strong>: Hoher Energieverbrauch beim Training</li>
</ul>',
  6,
  1200,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Video 2
INSERT INTO lessons (id, "courseId", title, description, "contentType", "videoUrl", "order", duration, "isActive", "createdAt", "updatedAt")
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

-- Lektion 7: KI im Alltag
INSERT INTO lessons (id, "courseId", title, description, "contentType", content, "order", duration, "isActive", "createdAt", "updatedAt")
VALUES (
  'ki-lesson-07',
  'ki-kurs-2026',
  'KI im Alltag',
  'Wie KI bereits heute unser Leben beeinflusst',
  'HTML',
  '<h1>KI im Alltag</h1>

<p>Künstliche Intelligenz ist bereits tief in unseren Alltag integriert - oft ohne dass wir es bewusst wahrnehmen.</p>

<h2>1. Smartphones und Digitale Assistenten</h2>

<h3>Sprachassistenten</h3>
<ul>
<li><strong>Siri (Apple)</strong>: Natürliche Sprachverarbeitung für Anfragen</li>
<li><strong>Google Assistant</strong>: Kontextbezogene Antworten und Aktionen</li>
<li><strong>Alexa (Amazon)</strong>: Smart Home Steuerung und Information</li>
</ul>

<h3>Foto-Features</h3>
<ul>
<li>Automatische Bildoptimierung: HDR, Nachtmodus</li>
<li>Gesichtserkennung: Fotoalben organisieren</li>
<li>Objekterkennung: Google Lens identifiziert Pflanzen, Gebäude</li>
<li>Portrait-Modus: Bokeh-Effekt durch Tiefenerkennung</li>
</ul>

<h2>2. Social Media und Content</h2>

<h3>Content Empfehlungen</h3>
<ul>
<li><strong>Facebook/Instagram</strong>: Personalisierter Feed</li>
<li><strong>YouTube</strong>: Video-Empfehlungen basierend auf Sehverhalten</li>
<li><strong>TikTok</strong>: "Für Dich"-Seite mit hochpersonalisierten Inhalten</li>
</ul>

<h3>Content-Moderation</h3>
<ul>
<li>Automatische Erkennung von problematischen Inhalten</li>
<li>Spam- und Bot-Erkennung</li>
<li>Fake-News-Identifizierung</li>
<li>Hassrede-Filterung</li>
</ul>

<h2>3. E-Commerce und Shopping</h2>

<h3>Produktempfehlungen</h3>
<ul>
<li><strong>Amazon</strong>: "Kunden kauften auch..."</li>
<li><strong>Netflix</strong>: "Weil Sie X geschaut haben..."</li>
<li><strong>Spotify</strong>: Personalisierte Playlists</li>
</ul>

<h3>Chatbots</h3>
<ul>
<li>24/7 Kundenservice</li>
<li>Bestellverfolgung</li>
<li>Produktberatung</li>
<li>Problemlösung</li>
</ul>

<h2>4. Navigation und Mobilität</h2>

<h3>Google Maps / Waze</h3>
<ul>
<li><strong>Echtzeit-Verkehrsinformationen</strong>: Stauvorhersage</li>
<li><strong>Routenoptimierung</strong>: Schnellste Route finden</li>
<li><strong>ETA-Berechnung</strong>: Ankunftszeit vorhersagen</li>
</ul>

<h3>Autonomes Fahren</h3>
<ul>
<li><strong>Tesla Autopilot</strong>: Assistiertes Fahren</li>
<li><strong>Waymo</strong>: Vollautonome Taxis (USA)</li>
<li><strong>Parkhilfe</strong>: Automatisches Einparken</li>
<li><strong>Spurassistent</strong>: Aktive Spurhaltung</li>
</ul>

<h2>5. Gesundheit und Medizin</h2>

<h3>Fitness-Tracking</h3>
<ul>
<li><strong>Apple Watch / Fitbit</strong>: Aktivitätserkennung</li>
<li><strong>Schlafanalyse</strong>: Schlafphasen identifizieren</li>
<li><strong>Herzfrequenz-Anomalien</strong>: Warnung bei Unregelmäßigkeiten</li>
</ul>

<h3>Medizinische Diagnostik</h3>
<ul>
<li><strong>Hautkrebs-Erkennung</strong>: Foto-basierte Voruntersuchung</li>
<li><strong>Röntgenbilder</strong>: Automatische Anomalie-Erkennung</li>
<li><strong>EKG-Analyse</strong>: Herzrhythmusstörungen erkennen</li>
</ul>

<h2>6. Kommunikation</h2>

<h3>E-Mail</h3>
<ul>
<li><strong>Gmail</strong>: Smart Compose (Auto-Vervollständigung)</li>
<li><strong>Spam-Filter</strong>: 99%+ Genauigkeit</li>
<li><strong>Kategorisierung</strong>: Automatische Sortierung</li>
</ul>

<h3>Übersetzung</h3>
<ul>
<li><strong>Google Translate</strong>: 100+ Sprachen</li>
<li><strong>DeepL</strong>: Hochwertige Übersetzungen</li>
<li><strong>Live-Übersetzung</strong>: In Echtzeit bei Videocalls</li>
</ul>',
  8,
  900,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Erfolgs-Nachricht
SELECT 
  '✅ KI für Einsteiger Kurs erfolgreich erstellt!' as status,
  (SELECT COUNT(*) FROM lessons WHERE "courseId" = 'ki-kurs-2026') as "Lektionen erstellt",
  (SELECT COUNT(*) FROM quizzes WHERE "lessonId" IN (SELECT id FROM lessons WHERE "courseId" = 'ki-kurs-2026')) as "Quizzes erstellt",
  (SELECT COUNT(*) FROM quiz_questions WHERE "quizId" IN (SELECT id FROM quizzes WHERE "lessonId" IN (SELECT id FROM lessons WHERE "courseId" = 'ki-kurs-2026'))) as "Quiz-Fragen";
