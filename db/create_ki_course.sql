-- KI für Einsteiger - Umfangreicher Test-Kurs
-- Zuerst Kurs erstellen
INSERT INTO "Course" (id, title, description, "courseType", "isActive", "createdAt", "updatedAt", category, duration, "passingScore", "validityPeriod", "reminderDays")
VALUES (
  'ki-einsteiger-2026',
  'KI für Einsteiger',
  'Ein umfassender Einführungskurs in die Welt der Künstlichen Intelligenz. Lernen Sie die Grundlagen, Anwendungen und ethischen Aspekte von KI kennen. Perfekt für alle, die in das spannende Feld der KI einsteigen möchten.',
  'OPTIONAL',
  true,
  NOW(),
  NOW(),
  'Technologie & Innovation',
  180,
  80,
  365,
  7
);

-- Lektion 1: Einführung in KI (TEXT)
INSERT INTO "Lesson" (id, "courseId", title, description, content, "lessonType", "orderIndex", duration, "isActive", "createdAt", "updatedAt")
VALUES (
  'ki-lesson-01',
  'ki-einsteiger-2026',
  'Was ist Künstliche Intelligenz?',
  'Grundlegende Konzepte und Geschichte der KI',
  '# Was ist Künstliche Intelligenz?

## Definition

Künstliche Intelligenz (KI oder AI - Artificial Intelligence) bezeichnet die Fähigkeit von Maschinen und Computersystemen, Aufgaben auszuführen, die normalerweise menschliche Intelligenz erfordern. Dazu gehören:

- **Lernen**: Die Fähigkeit, aus Erfahrungen zu lernen und sich zu verbessern
- **Problemlösung**: Das Finden von Lösungen für komplexe Herausforderungen
- **Mustererkennung**: Das Identifizieren von Mustern in großen Datenmengen
- **Sprachverarbeitung**: Das Verstehen und Generieren natürlicher Sprache
- **Entscheidungsfindung**: Das Treffen rationaler Entscheidungen basierend auf Daten

## Geschichte der KI

### Die Anfänge (1950er Jahre)
Alan Turing stellte 1950 die Frage: "Können Maschinen denken?" und entwickelte den berühmten Turing-Test. 1956 wurde bei der Dartmouth Conference der Begriff "Artificial Intelligence" offiziell geprägt.

### Die ersten KI-Winter (1970er-1980er)
Nach anfänglicher Euphorie folgten Enttäuschungen aufgrund überzogener Erwartungen und begrenzter Rechenleistung.

### Renaissance (1990er-2000er)
Durch verbesserte Algorithmen, mehr Daten und stärkere Computer erlebte KI einen Aufschwung. Deep Blue besiegte 1997 den Schachweltmeister Garry Kasparov.

### Moderne Ära (2010er-heute)
Mit Deep Learning, Big Data und Cloud Computing erlebt KI einen beispiellosen Durchbruch. Von Sprachassistenten bis zu selbstfahrenden Autos - KI ist allgegenwärtig.

## Schlüsselbegriffe

**Machine Learning (Maschinelles Lernen)**: Algorithmen, die aus Daten lernen, ohne explizit programmiert zu werden.

**Deep Learning (Tiefes Lernen)**: Eine Unterkategorie von Machine Learning, die künstliche neuronale Netze mit mehreren Schichten verwendet.

**Neuronale Netze**: Von biologischen Gehirnen inspirierte Computermodelle.

**Training**: Der Prozess, bei dem ein KI-Modell aus Beispieldaten lernt.

**Inferenz**: Die Anwendung eines trainierten Modells auf neue Daten.',
  'TEXT',
  1,
  15,
  true,
  NOW(),
  NOW()
);

-- Lektion 2: KI-Arten und Kategorien (TEXT)
INSERT INTO "Lesson" (id, "courseId", title, description, content, "lessonType", "orderIndex", duration, "isActive", "createdAt", "updatedAt")
VALUES (
  'ki-lesson-02',
  'ki-einsteiger-2026',
  'Arten von KI-Systemen',
  'Klassifizierung von KI nach Fähigkeiten',
  '# Arten von KI-Systemen

## Nach Fähigkeiten

### Schwache KI (Narrow AI)
- Spezialisiert auf eine spezifische Aufgabe
- Kann nur das tun, wofür sie entwickelt wurde
- **Beispiele**: Sprachassistenten (Siri, Alexa), Bilderkennungssysteme, Schachcomputer
- **Status**: Heute weit verbreitet und im praktischen Einsatz

### Starke KI (General AI)
- Kann jede intellektuelle Aufgabe verstehen und lernen, die ein Mensch kann
- Flexible Intelligenz über verschiedene Domänen hinweg
- **Status**: Noch theoretisch, nicht erreicht

### Super-KI
- Übertrifft menschliche Intelligenz in allen Bereichen
- Hypothetisches Konzept
- **Status**: Science-Fiction, umstritten ob erreichbar

## Nach Funktionalität

### Reaktive Maschinen
- Reagieren auf Eingaben ohne Gedächtnis
- Können keine Erfahrungen speichern
- **Beispiel**: Deep Blue (Schachcomputer)

### Begrenzte Gedächtnis-KI
- Nutzen historische Daten für Entscheidungen
- Können aus Erfahrungen lernen
- **Beispiel**: Selbstfahrende Autos, moderne Chatbots

### Theory of Mind KI
- Verstehen von Emotionen, Überzeugungen und Gedanken
- Soziale Intelligenz
- **Status**: In Entwicklung

### Selbstbewusste KI
- Haben ein Bewusstsein und Selbstwahrnehmung
- **Status**: Rein theoretisch

## Anwendungsgebiete

### Computer Vision
- Bilderkennung und -analyse
- Gesichtserkennung
- Autonome Fahrzeuge
- Medizinische Bildgebung

### Natural Language Processing (NLP)
- Sprachübersetzung
- Textanalyse
- Chatbots und virtuelle Assistenten
- Sentiment-Analyse

### Robotik
- Industrieroboter
- Service-Roboter
- Medizinische Robotik
- Drohnen

### Recommender Systems
- Produktempfehlungen (Amazon)
- Filmempfehlungen (Netflix)
- Musikvorschläge (Spotify)
- Social Media Feeds',
  'TEXT',
  2,
  12,
  true,
  NOW(),
  NOW()
);

-- Lektion 3: Video über Machine Learning
INSERT INTO "Lesson" (id, "courseId", title, description, content, "lessonType", "orderIndex", duration, "isActive", "createdAt", "updatedAt", "videoUrl")
VALUES (
  'ki-lesson-03',
  'ki-einsteiger-2026',
  'Einführung in Machine Learning',
  'Video-Tutorial über die Grundlagen des maschinellen Lernens',
  'In diesem Video lernen Sie die Grundkonzepte des Machine Learning kennen. Wir erklären die Unterschiede zwischen überwachtem, unüberwachtem und verstärkendem Lernen.',
  'VIDEO',
  3,
  20,
  true,
  NOW(),
  NOW(),
  'https://www.youtube.com/watch?v=ukzFI9rgwfU'
);

-- Quiz 1: Grundlagen-Quiz
INSERT INTO "Lesson" (id, "courseId", title, description, content, "lessonType", "orderIndex", duration, "isActive", "createdAt", "updatedAt")
VALUES (
  'ki-quiz-01',
  'ki-einsteiger-2026',
  'Quiz: KI Grundlagen',
  'Testen Sie Ihr Wissen über die Grundlagen der KI',
  'Beantworten Sie die folgenden Fragen zu den KI-Grundlagen.',
  'QUIZ',
  4,
  10,
  true,
  NOW(),
  NOW()
);

-- Quiz 1 Fragen
INSERT INTO "QuizQuestion" (id, "lessonId", "questionText", "questionType", points, "orderIndex", "createdAt", "updatedAt")
VALUES
  ('ki-q1-1', 'ki-quiz-01', 'Was bedeutet die Abkürzung "KI"?', 'SINGLE_CHOICE', 10, 1, NOW(), NOW()),
  ('ki-q1-2', 'ki-quiz-01', 'Wann wurde der Begriff "Artificial Intelligence" offiziell geprägt?', 'SINGLE_CHOICE', 10, 2, NOW(), NOW()),
  ('ki-q1-3', 'ki-quiz-01', 'Welche dieser Technologien sind Beispiele für Schwache KI? (Mehrfachauswahl)', 'MULTIPLE_CHOICE', 15, 3, NOW(), NOW()),
  ('ki-q1-4', 'ki-quiz-01', 'KI-Systeme können niemals menschliche Intelligenz erreichen.', 'TRUE_FALSE', 10, 4, NOW(), NOW()),
  ('ki-q1-5', 'ki-quiz-01', 'Was ist der Hauptunterschied zwischen Machine Learning und Deep Learning?', 'TEXT', 15, 5, NOW(), NOW());

-- Quiz 1 Antworten
INSERT INTO "QuizAnswer" (id, "questionId", "answerText", "isCorrect", "orderIndex", "createdAt", "updatedAt")
VALUES
  -- Frage 1
  ('ki-a1-1-1', 'ki-q1-1', 'Künstliche Intelligenz', true, 1, NOW(), NOW()),
  ('ki-a1-1-2', 'ki-q1-1', 'Kreative Innovation', false, 2, NOW(), NOW()),
  ('ki-a1-1-3', 'ki-q1-1', 'Kommunikative Integration', false, 3, NOW(), NOW()),
  ('ki-a1-1-4', 'ki-q1-1', 'Komplexe Informatik', false, 4, NOW(), NOW()),
  
  -- Frage 2
  ('ki-a1-2-1', 'ki-q1-2', '1950', false, 1, NOW(), NOW()),
  ('ki-a1-2-2', 'ki-q1-2', '1956', true, 2, NOW(), NOW()),
  ('ki-a1-2-3', 'ki-q1-2', '1970', false, 3, NOW(), NOW()),
  ('ki-a1-2-4', 'ki-q1-2', '1997', false, 4, NOW(), NOW()),
  
  -- Frage 3 (Multiple Choice)
  ('ki-a1-3-1', 'ki-q1-3', 'Sprachassistenten wie Siri', true, 1, NOW(), NOW()),
  ('ki-a1-3-2', 'ki-q1-3', 'Selbstfahrende Autos', true, 2, NOW(), NOW()),
  ('ki-a1-3-3', 'ki-q1-3', 'Superintelligente Roboter mit Bewusstsein', false, 3, NOW(), NOW()),
  ('ki-a1-3-4', 'ki-q1-3', 'Bilderkennungssysteme', true, 4, NOW(), NOW()),
  
  -- Frage 4
  ('ki-a1-4-1', 'ki-q1-4', 'Richtig', false, 1, NOW(), NOW()),
  ('ki-a1-4-2', 'ki-q1-4', 'Falsch', true, 2, NOW(), NOW());

-- Lektion 4: Machine Learning Basics (TEXT)
INSERT INTO "Lesson" (id, "courseId", title, description, content, "lessonType", "orderIndex", duration, "isActive", "createdAt", "updatedAt")
VALUES (
  'ki-lesson-04',
  'ki-einsteiger-2026',
  'Machine Learning Grundlagen',
  'Verstehen Sie die drei Hauptarten des maschinellen Lernens',
  '# Machine Learning Grundlagen

## Was ist Machine Learning?

Machine Learning (ML) ist ein Teilgebiet der KI, bei dem Computer aus Daten lernen und sich verbessern, ohne explizit programmiert zu werden. Statt feste Regeln zu programmieren, entwickelt das System eigene Regeln aus Beispielen.

## Die drei Hauptarten

### 1. Überwachtes Lernen (Supervised Learning)

Das System lernt aus **gelabelten Daten** - d.h., die Trainingsdaten enthalten sowohl Eingaben als auch die gewünschten Ausgaben.

**Wie funktioniert es?**
1. Trainingsdaten mit richtigen Antworten bereitstellen
2. Modell lernt Muster und Zusammenhänge
3. Modell wird auf neue, ungesehene Daten angewendet

**Anwendungen:**
- Spam-Filterung (E-Mail ist Spam: ja/nein)
- Bilderkennung (Bild zeigt: Katze/Hund/Auto)
- Medizinische Diagnose (Tumor ist: gutartig/bösartig)
- Preisvorhersage (Immobilienpreis basierend auf Eigenschaften)

**Algorithmen:**
- Lineare Regression
- Logistische Regression
- Support Vector Machines (SVM)
- Random Forests
- Neuronale Netze

### 2. Unüberwachtes Lernen (Unsupervised Learning)

Das System findet **eigene Muster** in Daten **ohne Labels**. Es erhält nur Eingabedaten ohne vorgegebene Antworten.

**Wie funktioniert es?**
1. Ungelabelte Daten bereitstellen
2. Algorithmus sucht nach Strukturen, Clustern oder Mustern
3. System gruppiert oder reduziert Daten selbstständig

**Anwendungen:**
- Kundensegmentierung (Gruppen ähnlicher Kunden finden)
- Anomalie-Erkennung (Betrugserkennung)
- Dimensionsreduktion (Daten vereinfachen)
- Empfehlungssysteme (ähnliche Produkte finden)

**Algorithmen:**
- K-Means Clustering
- Hierarchisches Clustering
- Principal Component Analysis (PCA)
- Autoencoder

### 3. Verstärkendes Lernen (Reinforcement Learning)

Das System lernt durch **Trial-and-Error** und erhält **Belohnungen** für gute Aktionen.

**Wie funktioniert es?**
1. Agent (KI) agiert in einer Umgebung
2. Für jede Aktion erhält der Agent Feedback (Belohnung oder Bestrafung)
3. Agent lernt, welche Aktionen zu maximalen Belohnungen führen

**Anwendungen:**
- Spielende KI (AlphaGo, Schach, Videospiele)
- Robotersteuerung
- Selbstfahrende Autos
- Ressourcenmanagement

**Schlüsselkonzepte:**
- Agent: Die lernende KI
- Umgebung: Der Kontext, in dem der Agent agiert
- Zustand: Aktuelle Situation
- Aktion: Was der Agent tun kann
- Belohnung: Feedback für Aktionen

## Der ML-Workflow

1. **Problemdefinition**: Was wollen wir vorhersagen?
2. **Datensammlung**: Relevante Daten sammeln
3. **Datenaufbereitung**: Daten bereinigen und vorbereiten
4. **Feature Engineering**: Relevante Merkmale auswählen
5. **Modellauswahl**: Passenden Algorithmus wählen
6. **Training**: Modell mit Trainingsdaten trainieren
7. **Evaluierung**: Modellleistung testen
8. **Optimierung**: Modell verbessern
9. **Deployment**: Modell in Produktion bringen
10. **Monitoring**: Laufende Überwachung

## Wichtige Konzepte

**Overfitting**: Modell lernt Trainingsdaten auswendig, aber generalisiert schlecht auf neue Daten.

**Underfitting**: Modell ist zu simpel und erfasst die Muster in den Daten nicht.

**Training Set**: Daten zum Trainieren des Modells.

**Test Set**: Separate Daten zur Bewertung der Modellleistung.

**Validation Set**: Daten zur Feinabstimmung des Modells.',
  'TEXT',
  5,
  18,
  true,
  NOW(),
  NOW()
);

-- Lektion 5: Deep Learning (TEXT)
INSERT INTO "Lesson" (id, "courseId", title, description, content, "lessonType", "orderIndex", duration, "isActive", "createdAt", "updatedAt")
VALUES (
  'ki-lesson-05',
  'ki-einsteiger-2026',
  'Deep Learning verstehen',
  'Einführung in neuronale Netze und Deep Learning',
  '# Deep Learning verstehen

## Was ist Deep Learning?

Deep Learning ist eine **spezialisierte Form** des Machine Learning, die auf **künstlichen neuronalen Netzen** mit **vielen Schichten** (daher "deep" = tief) basiert. Es ist von der Funktionsweise des menschlichen Gehirns inspiriert.

## Neuronale Netze

### Aufbau

Ein neuronales Netz besteht aus:

**1. Eingabeschicht (Input Layer)**
- Empfängt die Rohdaten
- Jeder Knoten repräsentiert ein Feature

**2. Versteckte Schichten (Hidden Layers)**
- Mehrere Schichten von Neuronen
- Extrahieren zunehmend abstrakte Features
- Bei Deep Learning: viele Schichten (10, 50, 100+)

**3. Ausgabeschicht (Output Layer)**
- Liefert die finale Vorhersage
- Anzahl der Knoten = Anzahl der möglichen Ausgaben

### Wie funktioniert ein Neuron?

Jedes künstliche Neuron:
1. Empfängt Eingaben von vorherigen Neuronen
2. Multipliziert jede Eingabe mit einem Gewicht
3. Addiert alle gewichteten Eingaben plus einen Bias
4. Wendet eine Aktivierungsfunktion an
5. Gibt das Ergebnis an die nächste Schicht weiter

### Aktivierungsfunktionen

- **ReLU** (Rectified Linear Unit): Einfach und effektiv
- **Sigmoid**: Ausgabe zwischen 0 und 1
- **Tanh**: Ausgabe zwischen -1 und 1
- **Softmax**: Für Mehrklassen-Klassifikation

## Training eines neuronalen Netzes

### 1. Forward Propagation
- Daten fließen durch das Netz
- Jede Schicht berechnet ihre Ausgabe
- Am Ende: Vorhersage

### 2. Loss-Berechnung
- Vergleich der Vorhersage mit der echten Antwort
- Loss-Funktion misst den Fehler
- Ziel: Loss minimieren

### 3. Backpropagation
- Fehler wird rückwärts durch das Netz propagiert
- Berechnung, wie jedes Gewicht zum Fehler beiträgt
- Verwendung der Kettenregel (Calculus)

### 4. Optimierung
- Gewichte werden angepasst
- Gradient Descent: Schritt in Richtung geringerer Fehler
- Learning Rate: Wie groß die Schritte sind

### 5. Iteration
- Prozess wird für viele Epochen wiederholt
- Jede Epoche = einmal durch alle Trainingsdaten

## Arten von Deep Learning Architekturen

### Convolutional Neural Networks (CNNs)
- **Spezialisiert auf**: Bilderkennung
- **Besonderheit**: Convolutional Layers extrahieren räumliche Features
- **Anwendungen**: 
  - Gesichtserkennung
  - Medizinische Bildanalyse
  - Autonome Fahrzeuge
  - Objekterkennung

### Recurrent Neural Networks (RNNs)
- **Spezialisiert auf**: Sequenzdaten
- **Besonderheit**: Haben ein "Gedächtnis" für vorherige Eingaben
- **Varianten**: LSTM (Long Short-Term Memory), GRU
- **Anwendungen**:
  - Textgenerierung
  - Spracherkennung
  - Zeitreihenvorhersage
  - Übersetzung

### Transformers
- **Spezialisiert auf**: Natural Language Processing
- **Besonderheit**: Attention-Mechanismus
- **Berühmte Modelle**: GPT, BERT, T5
- **Anwendungen**:
  - Chatbots (ChatGPT)
  - Übersetzung
  - Textgenerierung
  - Textanalyse

### Generative Adversarial Networks (GANs)
- **Besonderheit**: Zwei Netze konkurrieren (Generator vs. Discriminator)
- **Anwendungen**:
  - Bildgenerierung
  - Stilübertragung
  - Deepfakes
  - Datenaugmentation

### Autoencoders
- **Besonderheit**: Komprimieren und rekonstruieren Daten
- **Anwendungen**:
  - Dimensionsreduktion
  - Anomalie-Erkennung
  - Entrauschen
  - Kompression

## Warum ist Deep Learning so erfolgreich?

1. **Big Data**: Riesige Datenmengen verfügbar
2. **Rechenleistung**: GPUs ermöglichen schnelles Training
3. **Algorithmen**: Verbesserte Architekturen und Techniken
4. **Frameworks**: TensorFlow, PyTorch machen es zugänglich
5. **Transfer Learning**: Vortrainierte Modelle wiederverwenden

## Herausforderungen

- **Daten**: Benötigt sehr viele Trainingsdaten
- **Rechenressourcen**: Training kann Tage oder Wochen dauern
- **Interpretierbarkeit**: "Black Box" - schwer zu verstehen
- **Overfitting**: Gefahr bei zu komplexen Modellen
- **Energie**: Hoher Energieverbrauch beim Training',
  'TEXT',
  6,
  20,
  true,
  NOW(),
  NOW()
);

-- Video 2: Neural Networks Explained
INSERT INTO "Lesson" (id, "courseId", title, description, content, "lessonType", "orderIndex", duration, "isActive", "createdAt", "updatedAt", "videoUrl")
VALUES (
  'ki-lesson-06',
  'ki-einsteiger-2026',
  'Neuronale Netze visualisiert',
  'Animierte Erklärung wie neuronale Netze funktionieren',
  'Dieses Video zeigt anschaulich, wie neuronale Netze aufgebaut sind und wie sie lernen. Mit visuellen Animationen wird der Lernprozess Schritt für Schritt erklärt.',
  'VIDEO',
  7,
  15,
  true,
  NOW(),
  NOW(),
  'https://www.youtube.com/watch?v=aircAruvnKk'
);

-- Quiz 2: Machine Learning & Deep Learning
INSERT INTO "Lesson" (id, "courseId", title, description, content, "lessonType", "orderIndex", duration, "isActive", "createdAt", "updatedAt")
VALUES (
  'ki-quiz-02',
  'ki-einsteiger-2026',
  'Quiz: Machine & Deep Learning',
  'Testen Sie Ihr Wissen über ML und Deep Learning',
  'Beantworten Sie die Fragen zu Machine Learning und Deep Learning.',
  'QUIZ',
  8,
  15,
  true,
  NOW(),
  NOW()
);

-- Quiz 2 Fragen
INSERT INTO "QuizQuestion" (id, "lessonId", "questionText", "questionType", points, "orderIndex", "createdAt", "updatedAt")
VALUES
  ('ki-q2-1', 'ki-quiz-02', 'Welche Art von Machine Learning wird für Spam-Filterung verwendet?', 'SINGLE_CHOICE', 10, 1, NOW(), NOW()),
  ('ki-q2-2', 'ki-quiz-02', 'Welche Aussagen über Deep Learning sind korrekt? (Mehrfachauswahl)', 'MULTIPLE_CHOICE', 15, 2, NOW(), NOW()),
  ('ki-q2-3', 'ki-quiz-02', 'Overfitting bedeutet, dass ein Modell zu gut auf den Trainingsdaten funktioniert.', 'TRUE_FALSE', 10, 3, NOW(), NOW()),
  ('ki-q2-4', 'ki-quiz-02', 'Was ist der Hauptvorteil von Convolutional Neural Networks (CNNs)?', 'SINGLE_CHOICE', 10, 4, NOW(), NOW()),
  ('ki-q2-5', 'ki-quiz-02', 'Nennen Sie zwei Anwendungsgebiete von Reinforcement Learning.', 'TEXT', 15, 5, NOW(), NOW());

-- Quiz 2 Antworten
INSERT INTO "QuizAnswer" (id, "questionId", "answerText", "isCorrect", "orderIndex", "createdAt", "updatedAt")
VALUES
  -- Frage 1
  ('ki-a2-1-1', 'ki-q2-1', 'Überwachtes Lernen (Supervised Learning)', true, 1, NOW(), NOW()),
  ('ki-a2-1-2', 'ki-q2-1', 'Unüberwachtes Lernen (Unsupervised Learning)', false, 2, NOW(), NOW()),
  ('ki-a2-1-3', 'ki-q2-1', 'Verstärkendes Lernen (Reinforcement Learning)', false, 3, NOW(), NOW()),
  ('ki-a2-1-4', 'ki-q2-1', 'Transfer Learning', false, 4, NOW(), NOW()),
  
  -- Frage 2 (Multiple Choice)
  ('ki-a2-2-1', 'ki-q2-2', 'Deep Learning nutzt neuronale Netze mit vielen Schichten', true, 1, NOW(), NOW()),
  ('ki-a2-2-2', 'ki-q2-2', 'Deep Learning benötigt weniger Daten als traditionelles ML', false, 2, NOW(), NOW()),
  ('ki-a2-2-3', 'ki-q2-2', 'GPUs beschleunigen das Training von Deep Learning Modellen', true, 3, NOW(), NOW()),
  ('ki-a2-2-4', 'ki-q2-2', 'Deep Learning ist einfach zu interpretieren', false, 4, NOW(), NOW()),
  
  -- Frage 3
  ('ki-a2-3-1', 'ki-q2-3', 'Richtig', true, 1, NOW(), NOW()),
  ('ki-a2-3-2', 'ki-q2-3', 'Falsch', false, 2, NOW(), NOW()),
  
  -- Frage 4
  ('ki-a2-4-1', 'ki-q2-4', 'Sie sind besonders gut für Bilderkennung geeignet', true, 1, NOW(), NOW()),
  ('ki-a2-4-2', 'ki-q2-4', 'Sie brauchen keine Trainingsdaten', false, 2, NOW(), NOW()),
  ('ki-a2-4-3', 'ki-q2-4', 'Sie funktionieren nur mit Text', false, 3, NOW(), NOW()),
  ('ki-a2-4-4', 'ki-q2-4', 'Sie sind die schnellsten neuronalen Netze', false, 4, NOW(), NOW());

-- Lektion 6: KI-Anwendungen im Alltag (TEXT)
INSERT INTO "Lesson" (id, "courseId", title, description, content, "lessonType", "orderIndex", duration, "isActive", "createdAt", "updatedAt")
VALUES (
  'ki-lesson-07',
  'ki-einsteiger-2026',
  'KI im Alltag',
  'Wie KI bereits heute unser Leben beeinflusst',
  '# KI im Alltag

Künstliche Intelligenz ist bereits tief in unseren Alltag integriert - oft ohne dass wir es bewusst wahrnehmen. Hier sind die wichtigsten Anwendungsbereiche:

## 1. Smartphones und Digitale Assistenten

### Sprachassistenten
- **Siri (Apple)**: Natürliche Sprachverarbeitung für Anfragen
- **Google Assistant**: Kontextbezogene Antworten und Aktionen
- **Alexa (Amazon)**: Smart Home Steuerung und Information
- **Cortana (Microsoft)**: Produktivitätsassistent

**KI-Techniken**: Natural Language Processing, Speech Recognition, Intent Detection

### Foto-Features
- **Automatische Bildoptimierung**: HDR, Nachtmodus
- **Gesichtserkennung**: Fotoalben organisieren
- **Objekterkennung**: Google Lens identifiziert Pflanzen, Gebäude etc.
- **Portrait-Modus**: Bokeh-Effekt durch Tiefenerkennung

## 2. Social Media und Content

### Content Empfehlungen
- **Facebook/Instagram**: Personalisierter Feed
- **YouTube**: Video-Empfehlungen basierend auf Sehverhalten
- **TikTok**: "Für Dich"-Seite mit hochpersonalisierten Inhalten
- **Twitter/X**: Timeline-Sortierung

### Content-Moderation
- Automatische Erkennung von problematischen Inhalten
- Spam- und Bot-Erkennung
- Fake-News-Identifizierung
- Hassrede-Filterung

### Filter und Effekte
- Face Filters (Snapchat, Instagram)
- Beauty-Filter
- AR-Effekte
- Sticker und Animationen

## 3. E-Commerce und Shopping

### Produktempfehlungen
- **Amazon**: "Kunden kauften auch..."
- **Netflix**: "Weil Sie X geschaut haben..."
- **Spotify**: Personalisierte Playlists
- **Zalando**: Outfit-Vorschläge

### Preisoptimierung
- Dynamische Preisanpassung
- Personalisierte Rabatte
- Bestandsoptimierung

### Chatbots
- 24/7 Kundenservice
- Bestellverfolgung
- Produktberatung
- Problemlösung

## 4. Navigation und Mobilität

### Google Maps / Waze
- **Echtzeit-Verkehrsinformationen**: Stauvorhersage
- **Routenoptimierung**: Schnellste Route finden
- **ETA-Berechnung**: Ankunftszeit vorhersagen
- **Parkplatzsuche**: Verfügbarkeit prognostizieren

### Autonomes Fahren
- **Tesla Autopilot**: Assistiertes Fahren
- **Waymo**: Vollautonome Taxis (USA)
- **Parkhilfe**: Automatisches Einparken
- **Spurassistent**: Aktive Spurhaltung

## 5. Gesundheit und Medizin

### Fitness-Tracking
- **Apple Watch / Fitbit**: Aktivitätserkennung
- **Schlafanalyse**: Schlafphasen identifizieren
- **Herzfrequenz-Anomalien**: Warnung bei Unregelmäßigkeiten

### Medizinische Diagnostik
- **Hautkrebs-Erkennung**: Foto-basierte Voruntersuchung
- **Röntgenbilder**: Automatische Anomalie-Erkennung
- **EKG-Analyse**: Herzrhythmusstörungen erkennen

### Persönliche Assistenz
- Medikamentenerinnerungen
- Symptom-Checker
- Therapie-Apps (mental health)

## 6. Unterhaltung

### Streaming-Dienste
- **Netflix**: Personalisierte Empfehlungen
- **Spotify**: Discover Weekly Playlist
- **YouTube**: Autoplay-Vorschläge

### Gaming
- **NPC-Verhalten**: Intelligentere Computergegner
- **Prozedurale Generierung**: Dynamische Welten
- **Matchmaking**: Faire Spielerpaarungen

## 7. Kommunikation

### E-Mail
- **Gmail**: Smart Compose (Auto-Vervollständigung)
- **Spam-Filter**: 99%+ Genauigkeit
- **Kategorisierung**: Automatische Sortierung

### Übersetzung
- **Google Translate**: 100+ Sprachen
- **DeepL**: Hochwertige Übersetzungen
- **Live-Übersetzung**: In Echtzeit bei Videocalls

### Textverbesserung
- **Grammarly**: Grammatik und Stil
- **Auto-Korrektur**: Rechtschreibung
- **Smart Reply**: Vorgeschlagene Antworten

## 8. Sicherheit

### Biometrische Authentifizierung
- **Face ID**: 3D-Gesichtserkennung
- **Touch ID**: Fingerabdruck
- **Stimmerkennung**: Voice Authentication

### Betrugserkennung
- Kreditkarten-Transaktionen überwachen
- Ungewöhnliche Login-Versuche erkennen
- Phishing-Erkennung

### Home Security
- Smart Cameras mit Personenerkennung
- Bewegungsmeldesysteme
- Einbruchserkennung

## Zukunftsausblick

In den nächsten Jahren wird KI noch stärker integriert:
- **Persönliche KI-Assistenten**: Umfassende Unterstützung im Alltag
- **Ambient Computing**: Unsichtbare, allgegenwärtige KI
- **Predictive Services**: Vorhersage von Bedürfnissen
- **Augmented Reality**: KI-gestützte AR-Erlebnisse',
  'TEXT',
  9,
  15,
  true,
  NOW(),
  NOW()
);

-- Lektion 7: Ethik und KI (TEXT)
INSERT INTO "Lesson" (id, "courseId", title, description, content, "lessonType", "orderIndex", duration, "isActive", "createdAt", "updatedAt")
VALUES (
  'ki-lesson-08',
  'ki-einsteiger-2026',
  'Ethik in der KI',
  'Ethische Herausforderungen und verantwortungsvolle KI-Entwicklung',
  '# Ethik in der KI

Mit der zunehmenden Verbreitung von KI-Systemen entstehen wichtige ethische Fragen. Verantwortungsvolle KI-Entwicklung ist entscheidend für eine positive Zukunft.

## Hauptthemen der KI-Ethik

### 1. Bias und Fairness

**Problem**: KI-Systeme können bestehende gesellschaftliche Vorurteile verstärken.

**Wie entsteht Bias?**
- **Daten-Bias**: Trainingsdaten spiegeln historische Ungleichheiten
- **Algorithmus-Bias**: Design-Entscheidungen bevorzugen bestimmte Gruppen
- **Interaktions-Bias**: Nutzer verstärken Bias durch ihr Verhalten

**Beispiele:**
- **Bewerbungssysteme**: Bevorzugung eines Geschlechts
- **Gesichtserkennung**: Höhere Fehlerrate bei dunkler Hautfarbe
- **Kreditvergabe**: Benachteiligung bestimmter Ethnien
- **Strafrechtssysteme**: COMPAS-Algorithmus mit rassistischem Bias

**Lösungsansätze:**
- Diverse Trainingsdaten
- Fairness-Metriken bei der Entwicklung
- Regelmäßige Audits
- Diverse Entwicklungsteams

### 2. Transparenz und Erklärbarkeit

**Problem**: Viele KI-Systeme sind "Black Boxes" - ihre Entscheidungen sind nicht nachvollziehbar.

**Warum ist das wichtig?**
- Vertrauen in KI-Entscheidungen
- Rechtliche Rechenschaftspflicht
- Debugging und Verbesserung
- Faire Behandlung gewährleisten

**Explainable AI (XAI)**
- LIME (Local Interpretable Model-agnostic Explanations)
- SHAP (SHapley Additive exPlanations)
- Attention Visualisierung
- Feature Importance

**Herausforderung**: Trade-off zwischen Leistung und Erklärbarkeit

### 3. Privatsphäre und Datenschutz

**Herausforderungen:**
- **Datensammlung**: KI benötigt große Datenmengen
- **Identifizierung**: Re-Identifikation trotz Anonymisierung möglich
- **Überwachung**: Gesichtserkennung im öffentlichen Raum
- **Datenlecks**: Sensible Informationen können durchsickern

**Lösungsansätze:**
- **Differential Privacy**: Mathematische Garantien für Privatsphäre
- **Federated Learning**: Training ohne zentrale Datenspeicherung
- **Verschlüsselung**: Homomorphe Verschlüsselung
- **Datenminimierung**: Nur notwendige Daten sammeln

**Regulierung:**
- DSGVO (Europa)
- CCPA (Kalifornien)
- Recht auf Vergessenwerden
- Opt-out Möglichkeiten

### 4. Autonome Waffensysteme

**Kontroverse**: Sollten KI-Systeme über Leben und Tod entscheiden?

**Argumente dagegen:**
- Keine Rechenschaftspflicht
- Fehlende moralische Urteilsfähigkeit
- Eskalationsrisiko
- Verletzung der Menschenwürde

**Argumente dafür:**
- Präzisere Zielerfassung (weniger Kollateralschäden?)
- Kein emotionales Handeln
- Soldaten schützen

**Status**: UN-Diskussionen, aber kein Verbot

### 5. Arbeitsmarkt und Automatisierung

**Sorge**: Werden KI-Systeme massenhaft Jobs ersetzen?

**Betroffene Bereiche:**
- **Hoch-Risiko**: Routineaufgaben, Datenverarbeitung, Logistik
- **Mittel-Risiko**: Teile von medizinischen, juristischen Berufen
- **Niedrig-Risiko**: Kreative, soziale, strategische Tätigkeiten

**Historische Perspektive:**
- Jede technologische Revolution veränderte den Arbeitsmarkt
- Neue Jobs entstehen (AI-Trainer, Ethik-Berater etc.)
- Aber: Übergangszeit kann schmerzhaft sein

**Lösungsansätze:**
- Weiterbildung und Umschulung
- Bedingungsloses Grundeinkommen (diskutiert)
- Mensch-KI-Zusammenarbeit statt Ersatz
- Fokus auf Augmentation (Verstärkung menschlicher Fähigkeiten)

### 6. Umweltauswirkungen

**Problem**: Training großer KI-Modelle verbraucht enorme Energie.

**Fakten:**
- GPT-3 Training: ~1,287 MWh Strom
- CO2-Ausstoß vergleichbar mit 5 Autos über ihre Lebensdauer
- Wasserkühlung für Rechenzentren

**Gegenmaßnahmen:**
- Effizientere Algorithmen
- Grüne Rechenzentren
- Model Compression
- Transfer Learning (Wiederverwendung)

### 7. Superintelligenz und Existenzrisiko

**Frage**: Könnte eine superintelligente KI die Menschheit bedrohen?

**Sorgen:**
- **Kontrollproblem**: Können wir eine super-KI kontrollieren?
- **Zielfehlausrichtung**: KI verfolgt Ziele auf unerwünschte Weise
- **Instrumentale Konvergenz**: KI entwickelt Subziele (Selbsterhaltung)

**Gegenargumente:**
- Superintelligenz ist noch weit entfernt (wenn überhaupt möglich)
- Anthropomorphisierung der KI
- Fokus sollte auf aktuellen Problemen liegen

**Forschung:**
- AI Safety (DeepMind, OpenAI)
- Value Alignment Problem
- Friendly AI Entwicklung

## Prinzipien verantwortungsvoller KI

### 1. Fairness
- Gleiche Behandlung aller Menschen
- Aktive Bekämpfung von Bias
- Inklusive Entwicklung

### 2. Transparenz
- Offenlegung, wann KI verwendet wird
- Erklärbare Entscheidungen
- Open Source wo möglich

### 3. Rechenschaftspflicht
- Klare Verantwortlichkeiten
- Audit-Möglichkeiten
- Beschwerdemechanismen

### 4. Datenschutz
- Privacy by Design
- Minimale Datensammlung
- Nutzer-Kontrolle über Daten

### 5. Sicherheit
- Robuste Systeme
- Schutz vor Missbrauch
- Kontinuierliches Monitoring

### 6. Menschliche Autonomie
- Mensch behält Kontrolle
- Opt-out Möglichkeiten
- Menschliche Überprüfung bei kritischen Entscheidungen

## Regulierung und Governance

**EU AI Act** (2024):
- Risikobasierter Ansatz
- Verbote für bestimmte KI-Anwendungen
- Strenge Anforderungen für Hochrisiko-KI
- Transparenzpflichten

**Weitere Initiativen:**
- UNESCO Ethik-Empfehlungen
- OECD AI Principles
- IEEE Ethik-Standards
- Partnership on AI

## Was können Sie tun?

Als KI-Nutzer und -Entwickler:
1. **Bilden Sie sich weiter**: Verstehen Sie die Technologie
2. **Fragen Sie kritisch**: Wo wird KI eingesetzt?
3. **Fordern Sie Transparenz**: Von Unternehmen und Regierungen
4. **Entwickeln Sie verantwortungsvoll**: Ethik von Anfang an einbeziehen
5. **Engagieren Sie sich**: In Diskussionen und Politik teilnehmen',
  'TEXT',
  10,
  20,
  true,
  NOW(),
  NOW()
);

-- Video 3: AI Ethics
INSERT INTO "Lesson" (id, "courseId", title, description, content, "lessonType", "orderIndex", duration, "isActive", "createdAt", "updatedAt", "videoUrl")
VALUES (
  'ki-lesson-09',
  'ki-einsteiger-2026',
  'KI-Ethik in der Praxis',
  'Video über ethische Herausforderungen in der KI-Entwicklung',
  'Dieses Video beleuchtet reale Beispiele ethischer Probleme in KI-Systemen und zeigt Lösungsansätze auf.',
  'VIDEO',
  11,
  18,
  true,
  NOW(),
  NOW(),
  'https://www.youtube.com/watch?v=tJQSKWdtaHc'
);

-- Abschluss-Quiz
INSERT INTO "Lesson" (id, "courseId", title, description, content, "lessonType", "orderIndex", duration, "isActive", "createdAt", "updatedAt")
VALUES (
  'ki-quiz-final',
  'ki-einsteiger-2026',
  'Abschluss-Quiz: KI für Einsteiger',
  'Umfassendes Quiz über alle Kursinhalte',
  'Zeigen Sie, was Sie gelernt haben! Dieses Quiz deckt alle Themen des Kurses ab.',
  'QUIZ',
  12,
  20,
  true,
  NOW(),
  NOW()
);

-- Abschluss-Quiz Fragen
INSERT INTO "QuizQuestion" (id, "lessonId", "questionText", "questionType", points, "orderIndex", "createdAt", "updatedAt")
VALUES
  ('ki-qf-1', 'ki-quiz-final', 'Welche dieser Aussagen über Starke KI (AGI) ist korrekt?', 'SINGLE_CHOICE', 10, 1, NOW(), NOW()),
  ('ki-qf-2', 'ki-quiz-final', 'Welche Techniken gehören zum Supervised Learning? (Mehrfachauswahl)', 'MULTIPLE_CHOICE', 15, 2, NOW(), NOW()),
  ('ki-qf-3', 'ki-quiz-final', 'Backpropagation ist ein Verfahren zum Trainieren neuronaler Netze.', 'TRUE_FALSE', 10, 3, NOW(), NOW()),
  ('ki-qf-4', 'ki-quiz-final', 'Welche KI-Architektur eignet sich am besten für die Verarbeitung von Bilderdaten?', 'SINGLE_CHOICE', 10, 4, NOW(), NOW()),
  ('ki-qf-5', 'ki-quiz-final', 'Nennen Sie drei ethische Herausforderungen bei der KI-Entwicklung.', 'TEXT', 20, 5, NOW(), NOW()),
  ('ki-qf-6', 'ki-quiz-final', 'Welche dieser Anwendungen nutzen KI im Alltag? (Mehrfachauswahl)', 'MULTIPLE_CHOICE', 15, 6, NOW(), NOW()),
  ('ki-qf-7', 'ki-quiz-final', 'Was ist der Hauptunterschied zwischen CNNs und RNNs?', 'SINGLE_CHOICE', 10, 7, NOW(), NOW()),
  ('ki-qf-8', 'ki-quiz-final', 'Transfer Learning bedeutet, ein vortrainiertes Modell wiederzuverwenden.', 'TRUE_FALSE', 10, 8, NOW(), NOW());

-- Abschluss-Quiz Antworten
INSERT INTO "QuizAnswer" (id, "questionId", "answerText", "isCorrect", "orderIndex", "createdAt", "updatedAt")
VALUES
  -- Frage 1
  ('ki-af-1-1', 'ki-qf-1', 'Sie existiert bereits und wird täglich genutzt', false, 1, NOW(), NOW()),
  ('ki-af-1-2', 'ki-qf-1', 'Sie kann theoretisch jede intellektuelle Aufgabe eines Menschen ausführen', true, 2, NOW(), NOW()),
  ('ki-af-1-3', 'ki-qf-1', 'Sie ist dasselbe wie Schwache KI', false, 3, NOW(), NOW()),
  ('ki-af-1-4', 'ki-qf-1', 'Sie wurde bereits von Google entwickelt', false, 4, NOW(), NOW()),
  
  -- Frage 2
  ('ki-af-2-1', 'ki-qf-2', 'Lineare Regression', true, 1, NOW(), NOW()),
  ('ki-af-2-2', 'ki-qf-2', 'K-Means Clustering', false, 2, NOW(), NOW()),
  ('ki-af-2-3', 'ki-qf-2', 'Random Forests', true, 3, NOW(), NOW()),
  ('ki-af-2-4', 'ki-qf-2', 'Support Vector Machines', true, 4, NOW(), NOW()),
  
  -- Frage 3
  ('ki-af-3-1', 'ki-qf-3', 'Richtig', true, 1, NOW(), NOW()),
  ('ki-af-3-2', 'ki-qf-3', 'Falsch', false, 2, NOW(), NOW()),
  
  -- Frage 4
  ('ki-af-4-1', 'ki-qf-4', 'Recurrent Neural Networks (RNN)', false, 1, NOW(), NOW()),
  ('ki-af-4-2', 'ki-qf-4', 'Convolutional Neural Networks (CNN)', true, 2, NOW(), NOW()),
  ('ki-af-4-3', 'ki-qf-4', 'Transformers', false, 3, NOW(), NOW()),
  ('ki-af-4-4', 'ki-qf-4', 'Autoencoders', false, 4, NOW(), NOW()),
  
  -- Frage 6
  ('ki-af-6-1', 'ki-qf-6', 'Gesichtserkennung auf dem Smartphone', true, 1, NOW(), NOW()),
  ('ki-af-6-2', 'ki-qf-6', 'Netflix-Empfehlungen', true, 2, NOW(), NOW()),
  ('ki-af-6-3', 'ki-qf-6', 'Taschenrechner-App', false, 3, NOW(), NOW()),
  ('ki-af-6-4', 'ki-qf-6', 'Google Maps Navigation', true, 4, NOW(), NOW()),
  
  -- Frage 7
  ('ki-af-7-1', 'ki-qf-7', 'CNNs sind für Bilddaten, RNNs für Sequenzdaten optimiert', true, 1, NOW(), NOW()),
  ('ki-af-7-2', 'ki-qf-7', 'CNNs sind schneller als RNNs', false, 2, NOW(), NOW()),
  ('ki-af-7-3', 'ki-qf-7', 'RNNs brauchen keine Trainingsdaten', false, 3, NOW(), NOW()),
  ('ki-af-7-4', 'ki-qf-7', 'Es gibt keinen Unterschied', false, 4, NOW(), NOW()),
  
  -- Frage 8
  ('ki-af-8-1', 'ki-qf-8', 'Richtig', true, 1, NOW(), NOW()),
  ('ki-af-8-2', 'ki-qf-8', 'Falsch', false, 2, NOW(), NOW());

-- Erfolgs-Nachricht
SELECT 'KI für Einsteiger Kurs erfolgreich erstellt!' as status,
       (SELECT COUNT(*) FROM "Lesson" WHERE "courseId" = 'ki-einsteiger-2026') as lessons_created,
       (SELECT COUNT(*) FROM "QuizQuestion" WHERE "lessonId" IN (SELECT id FROM "Lesson" WHERE "courseId" = 'ki-einsteiger-2026' AND "lessonType" = 'QUIZ')) as questions_created;
