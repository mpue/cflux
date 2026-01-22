const axios = require('axios');

// Backend API URL
const API_URL = 'http://localhost:3001/api';

// Login als Admin (admin@timetracking.local / admin123 oder angepasst)
let authToken = '';

const login = async () => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    authToken = response.data.token;
    console.log('✅ Login erfolgreich');
    return authToken;
  } catch (error) {
    console.error('❌ Login fehlgeschlagen:', error.response?.data || error.message);
    process.exit(1);
  }
};

const createCourse = async () => {
  try {
    const response = await axios.post(`${API_URL}/elearning/courses`, {
      title: 'KI für Einsteiger',
      description: 'Ein umfassender Einführungskurs in die Welt der Künstlichen Intelligenz. Lernen Sie die Grundlagen, Anwendungen und ethischen Aspekte von KI kennen. Perfekt für alle, die in das spannende Feld der KI einsteigen möchten.',
      courseType: 'OPTIONAL',
      duration: 180,
      passingScore: 80,
      level: 'Beginner',
      tags: ['KI', 'Technologie', 'Einführung', 'Machine Learning']
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Kurs erstellt:', response.data.title);
    return response.data.id;
  } catch (error) {
    console.error('❌ Kurs-Erstellung fehlgeschlagen:', error.response?.data || error.message);
    throw error;
  }
};

const createLesson = async (courseId, lessonData) => {
  try {
    const response = await axios.post(`${API_URL}/elearning/lessons`, {
      ...lessonData,
      courseId: courseId
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`✅ Lektion erstellt: ${response.data.title}`);
    return response.data.id;
  } catch (error) {
    console.error(`❌ Lektion-Erstellung fehlgeschlagen: ${lessonData.title}`, error.response?.data || error.message);
    throw error;
  }
};

const createQuiz = async (lessonId, questions) => {
  try {
    const response = await axios.post(`${API_URL}/elearning/lessons/${lessonId}/quiz`, {
      questions: questions
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`✅ Quiz mit ${questions.length} Fragen erstellt`);
    return response.data;
  } catch (error) {
    console.error('❌ Quiz-Erstellung fehlgeschlagen:', error.response?.data || error.message);
    throw error;
  }
};

const main = async () => {
  console.log('🚀 Erstelle KI für Einsteiger Kurs...\n');
  
  // Login
  await login();
  
  // Kurs erstellen
  const courseId = await createCourse();
  
  // Lektion 1: Einführung (TEXT)
  await createLesson(courseId, {
    title: 'Was ist Künstliche Intelligenz?',
    description: 'Grundlegende Konzepte und Geschichte der KI',
    contentType: 'HTML',
    duration: 900,
    order: 1,
    content: `# Was ist Künstliche Intelligenz?

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

**Inferenz**: Die Anwendung eines trainierten Modells auf neue Daten.`
  });
  
  // Lektion 2: KI-Arten (TEXT)
  await createLesson(courseId, {
    title: 'Arten von KI-Systemen',
    description: 'Klassifizierung von KI nach Fähigkeiten',
    lessonType: 'TEXT',
    duration: 12,
    orderIndex: 2,
    content: `# Arten von KI-Systemen

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
- Social Media Feeds`
  });
  
  // Lektion 3: Video
  await createLesson(courseId, {
    title: 'Einführung in Machine Learning',
    description: 'Video-Tutorial über die Grundlagen des maschinellen Lernens',
    lessonType: 'VIDEO',
    duration: 20,
    orderIndex: 3,
    content: 'In diesem Video lernen Sie die Grundkonzepte des Machine Learning kennen.',
    videoUrl: 'https://www.youtube.com/watch?v=ukzFI9rgwfU'
  });
  
  // Quiz 1
  const quiz1LessonId = await createLesson(courseId, {
    title: 'Quiz: KI Grundlagen',
    description: 'Testen Sie Ihr Wissen über die Grundlagen der KI',
    lessonType: 'QUIZ',
    duration: 10,
    orderIndex: 4,
    content: 'Beantworten Sie die folgenden Fragen zu den KI-Grundlagen.'
  });
  
  await createQuiz(quiz1LessonId, [
    {
      questionText: 'Was bedeutet die Abkürzung "KI"?',
      questionType: 'SINGLE_CHOICE',
      points: 10,
      orderIndex: 1,
      answers: [
        { answerText: 'Künstliche Intelligenz', isCorrect: true },
        { answerText: 'Kreative Innovation', isCorrect: false },
        { answerText: 'Kommunikative Integration', isCorrect: false },
        { answerText: 'Komplexe Informatik', isCorrect: false }
      ]
    },
    {
      questionText: 'Wann wurde der Begriff "Artificial Intelligence" offiziell geprägt?',
      questionType: 'SINGLE_CHOICE',
      points: 10,
      orderIndex: 2,
      answers: [
        { answerText: '1950', isCorrect: false },
        { answerText: '1956', isCorrect: true },
        { answerText: '1970', isCorrect: false },
        { answerText: '1997', isCorrect: false }
      ]
    },
    {
      questionText: 'Welche dieser Technologien sind Beispiele für Schwache KI?',
      questionType: 'MULTIPLE_CHOICE',
      points: 15,
      orderIndex: 3,
      answers: [
        { answerText: 'Sprachassistenten wie Siri', isCorrect: true },
        { answerText: 'Selbstfahrende Autos', isCorrect: true },
        { answerText: 'Superintelligente Roboter mit Bewusstsein', isCorrect: false },
        { answerText: 'Bilderkennungssysteme', isCorrect: true }
      ]
    },
    {
      questionText: 'KI-Systeme können niemals menschliche Intelligenz erreichen.',
      questionType: 'TRUE_FALSE',
      points: 10,
      orderIndex: 4,
      answers: [
        { answerText: 'Richtig', isCorrect: false },
        { answerText: 'Falsch', isCorrect: true }
      ]
    }
  ]);
  
  // Lektion 4: Machine Learning (TEXT)
  await createLesson(courseId, {
    title: 'Machine Learning Grundlagen',
    description: 'Verstehen Sie die drei Hauptarten des maschinellen Lernens',
    lessonType: 'TEXT',
    duration: 18,
    orderIndex: 5,
    content: `# Machine Learning Grundlagen

## Die drei Hauptarten

### 1. Überwachtes Lernen (Supervised Learning)
Das System lernt aus **gelabelten Daten** - d.h., die Trainingsdaten enthalten sowohl Eingaben als auch die gewünschten Ausgaben.

**Anwendungen:**
- Spam-Filterung
- Bilderkennung
- Medizinische Diagnose
- Preisvorhersage

**Algorithmen:**
- Lineare Regression
- Random Forests
- Neuronale Netze

### 2. Unüberwachtes Lernen (Unsupervised Learning)
Das System findet **eigene Muster** in Daten **ohne Labels**.

**Anwendungen:**
- Kundensegmentierung
- Anomalie-Erkennung
- Empfehlungssysteme

**Algorithmen:**
- K-Means Clustering
- Principal Component Analysis (PCA)

### 3. Verstärkendes Lernen (Reinforcement Learning)
Das System lernt durch **Trial-and-Error** und erhält **Belohnungen** für gute Aktionen.

**Anwendungen:**
- Spielende KI (AlphaGo)
- Robotersteuerung
- Selbstfahrende Autos`
  });
  
  // Lektion 5: Deep Learning (TEXT)
  await createLesson(courseId, {
    title: 'Deep Learning verstehen',
    description: 'Einführung in neuronale Netze und Deep Learning',
    lessonType: 'TEXT',
    duration: 20,
    orderIndex: 6,
    content: `# Deep Learning verstehen

## Was ist Deep Learning?
Deep Learning ist eine spezialisierte Form des Machine Learning, die auf künstlichen neuronalen Netzen mit vielen Schichten basiert.

## Neuronale Netze - Aufbau

**1. Eingabeschicht (Input Layer)**
- Empfängt die Rohdaten
- Jeder Knoten repräsentiert ein Feature

**2. Versteckte Schichten (Hidden Layers)**
- Mehrere Schichten von Neuronen
- Extrahieren zunehmend abstrakte Features

**3. Ausgabeschicht (Output Layer)**
- Liefert die finale Vorhersage

## Arten von Deep Learning Architekturen

### Convolutional Neural Networks (CNNs)
- **Spezialisiert auf**: Bilderkennung
- **Anwendungen**: Gesichtserkennung, Autonome Fahrzeuge

### Recurrent Neural Networks (RNNs)
- **Spezialisiert auf**: Sequenzdaten
- **Anwendungen**: Textgenerierung, Spracherkennung

### Transformers
- **Spezialisiert auf**: Natural Language Processing
- **Berühmte Modelle**: GPT, BERT
- **Anwendungen**: Chatbots, Übersetzung

## Warum ist Deep Learning so erfolgreich?
1. **Big Data**: Riesige Datenmengen verfügbar
2. **Rechenleistung**: GPUs ermöglichen schnelles Training
3. **Algorithmen**: Verbesserte Architekturen
4. **Frameworks**: TensorFlow, PyTorch`
  });
  
  // Video 2
  await createLesson(courseId, {
    title: 'Neuronale Netze visualisiert',
    description: 'Animierte Erklärung wie neuronale Netze funktionieren',
    lessonType: 'VIDEO',
    duration: 15,
    orderIndex: 7,
    content: 'Dieses Video zeigt anschaulich, wie neuronale Netze aufgebaut sind und wie sie lernen.',
    videoUrl: 'https://www.youtube.com/watch?v=aircAruvnKk'
  });
  
  // Quiz 2
  const quiz2LessonId = await createLesson(courseId, {
    title: 'Quiz: Machine & Deep Learning',
    description: 'Testen Sie Ihr Wissen über ML und Deep Learning',
    lessonType: 'QUIZ',
    duration: 15,
    orderIndex: 8,
    content: 'Beantworten Sie die Fragen zu Machine Learning und Deep Learning.'
  });
  
  await createQuiz(quiz2LessonId, [
    {
      questionText: 'Welche Art von Machine Learning wird für Spam-Filterung verwendet?',
      questionType: 'SINGLE_CHOICE',
      points: 10,
      orderIndex: 1,
      answers: [
        { answerText: 'Überwachtes Lernen (Supervised Learning)', isCorrect: true },
        { answerText: 'Unüberwachtes Lernen (Unsupervised Learning)', isCorrect: false },
        { answerText: 'Verstärkendes Lernen (Reinforcement Learning)', isCorrect: false }
      ]
    },
    {
      questionText: 'Welche Aussagen über Deep Learning sind korrekt?',
      questionType: 'MULTIPLE_CHOICE',
      points: 15,
      orderIndex: 2,
      answers: [
        { answerText: 'Deep Learning nutzt neuronale Netze mit vielen Schichten', isCorrect: true },
        { answerText: 'Deep Learning benötigt weniger Daten als traditionelles ML', isCorrect: false },
        { answerText: 'GPUs beschleunigen das Training von Deep Learning Modellen', isCorrect: true },
        { answerText: 'Deep Learning ist einfach zu interpretieren', isCorrect: false }
      ]
    },
    {
      questionText: 'Was ist der Hauptvorteil von Convolutional Neural Networks (CNNs)?',
      questionType: 'SINGLE_CHOICE',
      points: 10,
      orderIndex: 3,
      answers: [
        { answerText: 'Sie sind besonders gut für Bilderkennung geeignet', isCorrect: true },
        { answerText: 'Sie brauchen keine Trainingsdaten', isCorrect: false },
        { answerText: 'Sie funktionieren nur mit Text', isCorrect: false }
      ]
    }
  ]);
  
  // Lektion 6: KI im Alltag (TEXT)
  await createLesson(courseId, {
    title: 'KI im Alltag',
    description: 'Wie KI bereits heute unser Leben beeinflusst',
    lessonType: 'TEXT',
    duration: 15,
    orderIndex: 9,
    content: `# KI im Alltag

Künstliche Intelligenz ist bereits tief in unseren Alltag integriert.

## 1. Smartphones und Digitale Assistenten

### Sprachassistenten
- **Siri, Google Assistant, Alexa**
- Natural Language Processing
- Smart Home Steuerung

### Foto-Features
- Automatische Bildoptimierung
- Gesichtserkennung
- Portrait-Modus

## 2. Social Media

### Content Empfehlungen
- Facebook/Instagram: Personalisierter Feed
- YouTube: Video-Empfehlungen
- TikTok: "Für Dich"-Seite

### Content-Moderation
- Spam-Erkennung
- Hate-Speech-Filterung

## 3. E-Commerce

- Produktempfehlungen (Amazon)
- Preisoptimierung
- Chatbots für Kundenservice

## 4. Navigation

- Google Maps Verkehrsinformationen
- Routenoptimierung
- Autonomes Fahren (Tesla, Waymo)

## 5. Gesundheit

- Fitness-Tracking
- Medizinische Diagnostik
- Symptom-Checker`
  });
  
  // Lektion 7: Ethik (TEXT)
  await createLesson(courseId, {
    title: 'Ethik in der KI',
    description: 'Ethische Herausforderungen und verantwortungsvolle KI-Entwicklung',
    lessonType: 'TEXT',
    duration: 20,
    orderIndex: 10,
    content: `# Ethik in der KI

## Hauptthemen der KI-Ethik

### 1. Bias und Fairness
**Problem**: KI-Systeme können bestehende Vorurteile verstärken.

**Beispiele:**
- Bewerbungssysteme bevorzugen ein Geschlecht
- Gesichtserkennung funktioniert schlechter bei dunkler Hautfarbe
- Kreditvergabe benachteiligt bestimmte Ethnien

**Lösungen:**
- Diverse Trainingsdaten
- Fairness-Metriken
- Regelmäßige Audits

### 2. Transparenz und Erklärbarkeit
**Problem**: Viele KI-Systeme sind "Black Boxes".

**Explainable AI (XAI):**
- LIME, SHAP
- Feature Importance
- Attention Visualisierung

### 3. Privatsphäre und Datenschutz
**Herausforderungen:**
- Datensammlung für KI-Training
- Gesichtserkennung im öffentlichen Raum
- Re-Identifikation trotz Anonymisierung

**Lösungen:**
- Differential Privacy
- Federated Learning
- DSGVO-Compliance

### 4. Arbeitsmarkt und Automatisierung
**Frage**: Werden KI-Systeme Jobs ersetzen?

**Realität:**
- Routineaufgaben am stärksten betroffen
- Neue Jobs entstehen (AI-Trainer, Ethik-Berater)
- Fokus auf Mensch-KI-Zusammenarbeit

### 5. Umweltauswirkungen
- Training großer Modelle verbraucht enorme Energie
- GPT-3 Training: ~1,287 MWh Strom

## Prinzipien verantwortungsvoller KI

1. **Fairness** - Gleiche Behandlung aller Menschen
2. **Transparenz** - Erklärbare Entscheidungen
3. **Rechenschaftspflicht** - Klare Verantwortlichkeiten
4. **Datenschutz** - Privacy by Design
5. **Sicherheit** - Robuste Systeme
6. **Menschliche Autonomie** - Mensch behält Kontrolle`
  });
  
  // Video 3
  await createLesson(courseId, {
    title: 'KI-Ethik in der Praxis',
    description: 'Video über ethische Herausforderungen',
    lessonType: 'VIDEO',
    duration: 18,
    orderIndex: 11,
    content: 'Dieses Video beleuchtet reale Beispiele ethischer Probleme in KI-Systemen.',
    videoUrl: 'https://www.youtube.com/watch?v=tJQSKWdtaHc'
  });
  
  // Abschluss-Quiz
  const finalQuizLessonId = await createLesson(courseId, {
    title: 'Abschluss-Quiz: KI für Einsteiger',
    description: 'Umfassendes Quiz über alle Kursinhalte',
    lessonType: 'QUIZ',
    duration: 20,
    orderIndex: 12,
    content: 'Zeigen Sie, was Sie gelernt haben!'
  });
  
  await createQuiz(finalQuizLessonId, [
    {
      questionText: 'Welche dieser Aussagen über Starke KI (AGI) ist korrekt?',
      questionType: 'SINGLE_CHOICE',
      points: 10,
      orderIndex: 1,
      answers: [
        { answerText: 'Sie existiert bereits und wird täglich genutzt', isCorrect: false },
        { answerText: 'Sie kann theoretisch jede intellektuelle Aufgabe eines Menschen ausführen', isCorrect: true },
        { answerText: 'Sie ist dasselbe wie Schwache KI', isCorrect: false }
      ]
    },
    {
      questionText: 'Welche Techniken gehören zum Supervised Learning?',
      questionType: 'MULTIPLE_CHOICE',
      points: 15,
      orderIndex: 2,
      answers: [
        { answerText: 'Lineare Regression', isCorrect: true },
        { answerText: 'K-Means Clustering', isCorrect: false },
        { answerText: 'Random Forests', isCorrect: true },
        { answerText: 'Support Vector Machines', isCorrect: true }
      ]
    },
    {
      questionText: 'Welche KI-Architektur eignet sich am besten für Bilderkennung?',
      questionType: 'SINGLE_CHOICE',
      points: 10,
      orderIndex: 3,
      answers: [
        { answerText: 'Recurrent Neural Networks (RNN)', isCorrect: false },
        { answerText: 'Convolutional Neural Networks (CNN)', isCorrect: true },
        { answerText: 'Transformers', isCorrect: false }
      ]
    },
    {
      questionText: 'Welche Anwendungen nutzen KI im Alltag?',
      questionType: 'MULTIPLE_CHOICE',
      points: 15,
      orderIndex: 4,
      answers: [
        { answerText: 'Gesichtserkennung auf dem Smartphone', isCorrect: true },
        { answerText: 'Netflix-Empfehlungen', isCorrect: true },
        { answerText: 'Taschenrechner-App', isCorrect: false },
        { answerText: 'Google Maps Navigation', isCorrect: true }
      ]
    },
    {
      questionText: 'Transfer Learning bedeutet, ein vortrainiertes Modell wiederzuverwenden.',
      questionType: 'TRUE_FALSE',
      points: 10,
      orderIndex: 5,
      answers: [
        { answerText: 'Richtig', isCorrect: true },
        { answerText: 'Falsch', isCorrect: false }
      ]
    }
  ]);
  
  console.log('\n🎉 KI für Einsteiger Kurs erfolgreich erstellt!');
  console.log(`📚 Kurs-ID: ${courseId}`);
  console.log('✨ 12 Lektionen mit 3 Quiz und insgesamt 13 Fragen erstellt');
};

main().catch(error => {
  console.error('❌ Fehler beim Erstellen des Kurses:', error);
  process.exit(1);
});
