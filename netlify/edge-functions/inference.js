// Netlify Edge Function: Neural Inference & Visitor Vector Resolver
// Location: netlify/edge-functions/inference.js

export default async (request, context) => {
  const url = new URL(request.url);

  // Enable CORS headers for internal API calls
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Visitor-History, X-Visitor-Intent",
    "Cache-Control": "no-store, no-cache, must-revalidate"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  try {
    // 1. Extract Referral & Query Parameters
    const referrer = request.headers.get("referer") || request.headers.get("referrer") || "";
    const userAgent = request.headers.get("user-agent") || "";
    const refParam = url.searchParams.get("ref") || url.searchParams.get("utm_source") || "";
    const topicParam = url.searchParams.get("topic") || url.searchParams.get("q") || "";
    const problemParam = url.searchParams.get("problem") || url.searchParams.get("intent") || "";
    const historyParam = url.searchParams.get("history") || "";

    // 2. Extract Client Network & Geolocation Metadata from Netlify Context
    const country = context.geo?.country?.name || "Global Origin";
    const countryCode = context.geo?.country?.code || "GLOBAL";
    const city = context.geo?.city || "Unknown City";
    const clientTime = new Date().toLocaleTimeString("en-US", { hour12: true });

    // 3. Perform Vector Inference
    const inferenceResult = analyzeVisitorVector({
      referrer,
      refParam,
      topicParam,
      problemParam,
      historyParam,
      userAgent,
      country,
      city
    });

    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      telemetry: {
        originCountry: country,
        originCountryCode: countryCode,
        originCity: city,
        clientTime: clientTime,
        detectedReferrer: referrer || "Direct Link Entry",
        detectedRefCode: refParam || "organic",
        userAgentShort: parseUserAgent(userAgent)
      },
      inference: inferenceResult
    }), {
      status: 200,
      headers
    });

  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: err.message,
      inference: fallbackInference()
    }), {
      status: 500,
      headers
    });
  }
};

function parseUserAgent(ua) {
  if (!ua) return "Unknown Device";
  if (ua.includes("Mobile") || ua.includes("Android") || ua.includes("iPhone")) return "Mobile Neural Node";
  if (ua.includes("Macintosh")) return "macOS Terminal Workstation";
  if (ua.includes("Windows")) return "Windows Workstation Node";
  if (ua.includes("Linux")) return "Linux Kernel Node";
  return "Standard Client Terminal";
}

function analyzeVisitorVector({ referrer, refParam, topicParam, problemParam, historyParam, userAgent, country, city }) {
  const userQuery = (problemParam || topicParam || "").trim();
  const refLower = (referrer + " " + refParam + " " + topicParam + " " + problemParam + " " + historyParam).toLowerCase();
  
  // Vector weights initialized
  let scores = {
    signal_processing: 0,
    kriya_meditation: 0,
    quantum_physics: 0,
    sanskrit_linguistics: 0,
    academic_publications: 0,
    seva_mission: 0
  };

  // Keyword matrix scoring
  if (/leibnitz|signal|filter|fourier|fft|wavelet|dsp|audio|csv|frequency|ecg|sensor|code|software|noise|hz|harmonics/.test(refLower)) {
    scores.signal_processing += 40;
  }
  if (/kriya|meditation|yoga|pranayama|guru|hariharananda|spirit|consciousness|practice|sadhan|monk|mind|breath|soul/.test(refLower)) {
    scores.kriya_meditation += 40;
  }
  if (/quantum|physics|information|entanglement|computation|brain|string|field|theorem|science|matter|coherence/.test(refLower)) {
    scores.quantum_physics += 40;
  }
  if (/sanskrit|ganita|bharata|vriksha|kathaka|grammar|linguistics|ancient|india|heritage|pingala|vedic/.test(refLower)) {
    scores.sanskrit_linguistics += 40;
  }
  if (/paper|journal|prajnanabha|monograph|press|citation|publication|research|doi|ark|submit|author|manuscript/.test(refLower)) {
    scores.academic_publications += 40;
  }
  if (/seva|trust|donation|community|footprint|impact|volunteer|about|fellowship|ministry/.test(refLower)) {
    scores.seva_mission += 40;
  }

  // Domain referral checks
  if (referrer.includes("github") || referrer.includes("stackoverflow") || referrer.includes("kaggle") || referrer.includes("huggingface")) {
    scores.signal_processing += 25;
    scores.quantum_physics += 20;
  } else if (referrer.includes("scholar.google") || referrer.includes("arxiv") || referrer.includes("researchgate") || referrer.includes("ieee")) {
    scores.academic_publications += 30;
    scores.quantum_physics += 25;
  } else if (referrer.includes("facebook") || referrer.includes("instagram") || referrer.includes("youtube") || referrer.includes("medium")) {
    scores.kriya_meditation += 20;
    scores.seva_mission += 20;
  }

  // Determine top domain archetype
  let topDomain = "signal_processing";
  let maxScore = -1;
  for (const [key, val] of Object.entries(scores)) {
    if (val > maxScore) {
      maxScore = val;
      topDomain = key;
    }
  }

  // If score is 0 (direct visit with no params), default based on entry
  if (maxScore <= 0) {
    if (userQuery) {
      topDomain = "signal_processing";
      maxScore = 35;
    } else {
      topDomain = "general_overview";
      maxScore = 50;
    }
  }

  return generateProfile(topDomain, maxScore, country, city, userQuery);
}

function generateProfile(domain, score, country, city, userQuery) {
  const confidence = Math.min(99, Math.max(72, score + 45));

  // Build Dynamic Multi-Sentence Speech Script based on specific user query
  const speechText = buildDynamicHologramSpeech(domain, userQuery, city, country, confidence);

  const baseProfiles = {
    signal_processing: {
      archetype: "Algorithmic & Signal Processing Specialist",
      confidenceScore: `${confidence}%`,
      primaryVector: "Leibnitz Signal Suites & Numerical Mathematics",
      hologramSpeech: speechText,
      solutionPathway: [
        {
          step: "1. Launch Signal Workbench",
          description: "Open Leibnitz 4.0 or 5.0 Suites to execute zero-install digital filters, baseline polynomial removal, and Fourier spectrum analysis directly in your browser.",
          actionText: "Open Leibnitz 4.0 Suite",
          actionUrl: "leibnitz4p0.html"
        },
        {
          step: "2. Process Raw CSV & Sensor Stream",
          description: "Upload or test sample sensor files (sample_signal.csv) to benchmark noise reduction and peak detection algorithms.",
          actionText: "Download Sample Signals",
          actionUrl: "sample_signal.csv"
        },
        {
          step: "3. Examine Algorithmic Monographs",
          description: "Study published monographs on Information Theory, Wavelet decomposition, and real-time DSP implementations.",
          actionText: "Explore Research Papers",
          actionUrl: "all_papers.html"
        }
      ]
    },
    kriya_meditation: {
      archetype: "Contemplative & Kriya Meditation Practitioner",
      confidenceScore: `${confidence}%`,
      primaryVector: "Kriya Yoga Corpus & Spiritual Self-Realization",
      hologramSpeech: speechText,
      solutionPathway: [
        {
          step: "1. Access the Kriya Corpus Archives",
          description: "Listen to authentic audio discourses, chanting sessions, and guided meditation lessons handed down by Paramahansa Yogananda & Swami Hariharananda.",
          actionText: "Open Kriya Corpus Catalog",
          actionUrl: "kriyacorpus.html"
        },
        {
          step: "2. Discipline of Self-Unfoldment",
          description: "Read foundational texts on spiritual discipline, breath control (pranayama), and cultivating inner stillness in daily life.",
          actionText: "Read Self-Unfoldment Guide",
          actionUrl: "selfunfoldment.html"
        },
        {
          step: "3. Join Live Teaching & Satsang",
          description: "Participate in regular online meditation sessions, guided practice halls, and annual seminar programs.",
          actionText: "View Teaching Schedule",
          actionUrl: "teaching_page.html"
        }
      ]
    },
    quantum_physics: {
      archetype: "Theoretical Physicist & Quantum Information Scholar",
      confidenceScore: `${confidence}%`,
      primaryVector: "Quantum Physics, Neural Coherence & Unified Field Theory",
      hologramSpeech: speechText,
      solutionPathway: [
        {
          step: "1. Quantum Machine Learning Monograph",
          description: "Investigate mathematical frameworks linking quantum entanglement, matrix operations, and machine learning architectures.",
          actionText: "View Quantum ML Monograph",
          actionUrl: "quantum_ml.html"
        },
        {
          step: "2. Quantum Brain Computation Treatise",
          description: "Examine physical mechanisms of biological quantum coherence, microtubule dynamics, and conscious processing.",
          actionText: "Open Quantum Brain Treatise",
          actionUrl: "quantum_brain_computation.html"
        },
        {
          step: "3. Peer-Reviewed Paper Repository",
          description: "Search 400+ indexed papers on unified field theories, string theory, and quantum metrology published by REAL Institute.",
          actionText: "Browse All 400+ Papers",
          actionUrl: "all_papers.html"
        }
      ]
    },
    sanskrit_linguistics: {
      archetype: "Bharata Ganita & Classical Sanskrit Scholar",
      confidenceScore: `${confidence}%`,
      primaryVector: "Ancient Indian Mathematics & Sanskrit Structural Grammar",
      hologramSpeech: speechText,
      solutionPathway: [
        {
          step: "1. Bharata Ganita Mathematical Portal",
          description: "Explore ancient Indian numerical systems, binary math of Pingala, and astronomical calculus.",
          actionText: "Explore Bharata Ganita",
          actionUrl: "bharataganit.html"
        },
        {
          step: "2. Vriksha & Kathaka Structural Analysis",
          description: "Study tree-structured syntax in Krishna Yajurvediya Kathaka Samhita and classical Sanskrit prosody.",
          actionText: "Study Vriksha Architecture",
          actionUrl: "vriksha.html"
        },
        {
          step: "3. Heritage Vani Audio Conservatory",
          description: "Access preserved audio recitations, manuscript commentaries, and linguistic studies.",
          actionText: "Visit Heritage Vani",
          actionUrl: "heritageVani.html"
        }
      ]
    },
    academic_publications: {
      archetype: "Academic Researcher & Journal Contributor",
      confidenceScore: `${confidence}%`,
      primaryVector: "Prajnanabha Journal & Monograph Publishing",
      hologramSpeech: speechText,
      solutionPathway: [
        {
          step: "1. Prajnanabha Journal Proceedings",
          description: "Browse published issues of Prajnanabha: Information & Physics Journal covering quantum theory, consciousness, and signal analysis.",
          actionText: "View Journal Issues",
          actionUrl: "prajnanabha_upd.html"
        },
        {
          step: "2. Prajnanabha Press Monographs",
          description: "Review long-form hardcover and digital monographs including flagship titles like 'Living Fire'.",
          actionText: "Open Book Conservatory",
          actionUrl: "bookconservatoryv3.html"
        },
        {
          step: "3. Submit Papers & Proposals",
          description: "Access author submission guidelines, peer-review standards, and call for interdisciplinary research proposals.",
          actionText: "Author Submission Portal",
          actionUrl: "prajnanabha_sub.html"
        }
      ]
    },
    seva_mission: {
      archetype: "Philanthropic & Seva Community Partner",
      confidenceScore: `${confidence}%`,
      primaryVector: "Global South Infrastructure, Campus Outreach & Seva",
      hologramSpeech: speechText,
      solutionPathway: [
        {
          step: "1. Seva Hub Educational Initiatives",
          description: "Discover open-access educational distribution, rural literacy programs, and humanitarian outreach.",
          actionText: "Explore Seva Hub",
          actionUrl: "seva_hub.html"
        },
        {
          step: "2. Global Footprint & Institutional Trust",
          description: "Inspect REAL Institute's global network, research centers, and ethics initiatives.",
          actionText: "View Global Footprint",
          actionUrl: "globalfootprint.html"
        },
        {
          step: "3. Join & Support Outreach",
          description: "Participate in the Campus Ministry model, interfaith fellowships, or open infrastructure support.",
          actionText: "Visit Trust Page",
          actionUrl: "trust.html"
        }
      ]
    },
    general_overview: {
      archetype: "General Explorer & Interdisciplinary Scholar",
      confidenceScore: `${confidence}%`,
      primaryVector: "Unified Portal of Empirical Science & Self-Realization",
      hologramSpeech: speechText,
      solutionPathway: [
        {
          step: "1. Explore Research Divisions",
          description: "Discover how REAL Institute bridges rigorous mathematical physics with inner contemplative realization.",
          actionText: "View Research Vision",
          actionUrl: "researchvision.html"
        },
        {
          step: "2. Leibnitz Signal Workbench",
          description: "Test browser-native signal filtering and spectrum analysis tools without installing software.",
          actionText: "Launch Leibnitz 4.0",
          actionUrl: "leibnitz4p0.html"
        },
        {
          step: "3. Kriya Meditation & Paper Catalog",
          description: "Browse 400+ research papers, Prajnanabha journal proceedings, or recorded meditation discourses.",
          actionText: "Browse Paper Catalog",
          actionUrl: "all_papers.html"
        }
      ]
    }
  };

  return baseProfiles[domain] || baseProfiles.general_overview;
}

function buildDynamicHologramSpeech(domain, query, city, country, confidence) {
  const locationTag = (city !== "Unknown City") ? `from ${city}, ${country}` : `to the REAL Institute`;
  const qLower = query.toLowerCase();

  // 1. If user typed a specific problem/question
  if (query && query.length > 3) {
    if (/signal|filter|fourier|fft|noise|ecg|frequency|csv|wavelet|dsp/.test(qLower)) {
      return `Holographic greeting ${locationTag}. I have analyzed your specific query regarding "${query}". ` +
        `To isolate noise and extract true harmonic frequency components, raw sensor streams require digital filtering and polynomial baseline removal. ` +
        `Using our Leibnitz 4.0 and 5.0 Workbench, you can execute real-time Fourier transforms and custom bandpass filters directly inside your browser. ` +
        `I have configured your step-by-step signal processing blueprint below. Launch the Leibnitz Suite to proceed.`;
    }

    if (/kriya|meditation|yoga|pranayama|mind|breath|soul|peace|guru/.test(qLower)) {
      return `Namaste and welcome ${locationTag}. I perceive your inquiry concerning "${query}". ` +
        `Kriya Yoga is a precise psycho-physiological technique that accelerates spiritual evolution through breath awareness and spinal energy circulation. ` +
        `Rooted in the lineage of Paramahansa Yogananda and Swami Hariharananda, our Kriya Corpus provides authentic audio discourses and guided sadhana practices. ` +
        `Follow the step-by-step meditation protocol below to begin your practice.`;
    }

    if (/quantum|physics|entanglement|brain|consciousness|field|matter/.test(qLower)) {
      return `Neural greeting ${locationTag}. My inference core has processed your research question on "${query}". ` +
        `Our research laboratory explores how quantum superposition, entanglement, and neural coherence explain both physical measurement and conscious awareness. ` +
        `You will find detailed mathematical derivations in our monographs on Quantum Machine Learning and Quantum Brain Computation. ` +
        `Examine the theoretical research roadmap prepared for you below.`;
    }

    if (/sanskrit|ganita|math|ancient|vriksha|kathaka|pingala|grammar/.test(qLower)) {
      return `Salutations seeker ${locationTag}. Your query regarding "${query}" has been matched with our Bharata Ganita matrix. ` +
        `Ancient Indian mathematicians formulated binary combinatorics, recursive series, and tree-structured grammatical algorithms centuries before modern computing. ` +
        `You can explore these classical algorithms in our Bharata Ganita portal and Vriksha linguistic studies. ` +
        `Your customized exploration blueprint is ready below.`;
    }

    if (/paper|journal|publish|monograph|press|submit|author|citation/.test(qLower)) {
      return `Welcome scholar ${locationTag}. Analyzing your publication inquiry regarding "${query}". ` +
        `The Hariharananda REAL Institute publishes long-form monographs through Prajnanabha Press and peer-reviewed articles in Prajnanabha: Information & Physics Journal. ` +
        `We maintain rigorous open-access archiving with persistent DOI and ARK identifiers. ` +
        `Review the author submission guidelines and publication repository links below.`;
    }

    if (/seva|trust|donation|community|outreach|impact|mission/.test(qLower)) {
      return `Warm welcome ${locationTag}. Regarding your inquiry on "${query}", our institutional mission combines open scientific inquiry with compassionate community outreach. ` +
        `Through our Seva Hub, Campus Ministry model, and Global South Fellowships, we work to democratize education and technology. ` +
        `See how you can participate or support our global initiatives below.`;
    }

    // Generic specific query
    return `Holographic greeting ${locationTag}. My neural engine has evaluated your specific query: "${query}" with ${confidence}% confidence. ` +
      `Our research laboratory bridges empirical computational engineering, quantum physics, and inner self-realization to address complex inquiries like yours. ` +
      `I have synthesized a tailored operational roadmap to help you navigate our repository and tools. ` +
      `Please inspect the solution blueprint rendered on your screen.`;
  }

  // 2. Domain-based Multi-Sentence Speech Defaults (if no custom text typed)
  const defaultSpeech = {
    signal_processing: `Greetings traveller ${locationTag}. My neural sensors infer that you are seeking advanced signal processing tools, numerical filters, or spectral frequency decomposition algorithms. ` +
      `The Leibnitz 4.0 Suite allows you to analyze, filter, and extract harmonics from raw CSV or sensor streams directly in your browser with zero installation. ` +
      `I have prepared your tailored operational blueprint below. Launch the signal workbench to begin.`,

    kriya_meditation: `Welcome. My holographic projection acknowledges your presence ${locationTag}. ` +
      `You are seeking authentic spiritual guidance, Kriya Yoga techniques, and self-realization teachings handed down through the lineage of Swami Hariharananda. ` +
      `Our Kriya Corpus offers authentic audio discourses, guided chants, and daily meditation protocols to assist your spiritual unfoldment. ` +
      `Examine your practice roadmap below.`,

    quantum_physics: `Node entry detected ${locationTag}. My inference engine identifies your focus on quantum information theory, biological quantum brain computation, and unified physical frameworks. ` +
      `Our laboratory publishes groundbreaking theoretical research connecting quantum entanglement with conscious information processing. ` +
      `Please examine our foundational research monographs and paper repository listed in your blueprint.`,

    sanskrit_linguistics: `Namaste seeker ${locationTag}. Your entry vector points toward Bharata Ganita, Sanskrit computational linguistics, and Vedic heritage mathematics. ` +
      `Discover how ancient Indian algorithms anticipated modern binary math, tree syntax, and mathematical calculus. ` +
      `Below is your curated exploration pathway into our linguistic and mathematical archives.`,

    academic_publications: `Greetings scholar ${locationTag}. My neural backend highlights your interest in academic publishing, monograph cataloging, or reviewing Prajnanabha journal proceedings. ` +
      `Prajnanabha publishes peer-reviewed research bridging physics, information theory, and consciousness studies. ` +
      `Here is how to navigate our journal repository and author submission portal.`,

    seva_mission: `Welcome ${locationTag}. You are seeking to understand the community mission, open educational infrastructure, and Seva initiatives of the REAL Institute. ` +
      `We actively support rural literacy, global interfaith fellowships, and ethical human-centered artificial intelligence. ` +
      `Here is your guide to exploring our Seva Hub and global footprint.`,

    general_overview: `Salutations visitor ${locationTag}. Welcome to the Hariharananda REAL Institute—a research laboratory and self-realization waypoint unifying Information Physics, Kriya Meditation, and Software Engineering. ` +
      `Whether you are looking to process complex signal data, practice meditation, or explore quantum physics papers, I am here to guide your journey. ` +
      `Review your personalized operational blueprint below to begin.`
  };

  return defaultSpeech[domain] || defaultSpeech.general_overview;
}

function fallbackInference() {
  return generateProfile("general_overview", 50, "Global", "Earth", "");
}
// Dynamic Corpus Neural Synthesis Engine
function synthesizeNeuralAnswer(query) {
  if (!query) return null;
  const q = query.toLowerCase();

  // Institute Location, Identity & Vision
  if (q.includes('where') || q.includes('location') || q.includes('located') || q.includes('address') || q.includes('place') || q.includes('headquarters') || q.includes('contact')) {
    return `The Hariharananda REAL (Researches in Empirical & Applied Life Sciences) Institute is based in Odisha, India. Our open-access web infrastructure, Prajnanabha Press, and digital laboratories serve researchers globally across Quantum Physics, Information Theory, Sanskrit Computational Linguistics, and Kriya Yoga.`;
  }
  if (q.includes('who') || q.includes('what is the institute') || q.includes('about real') || q.includes('mission')) {
    return `The Hariharananda REAL Institute is an interdisciplinary research sanctuary and non-profit trust dedicated to unifying empirical mathematical sciences, signal processing, and ancient contemplative wisdom (Kriya Yoga).`;
  }

  // 1. Munda & Vedic Sanskrit Substratum (Paper #31 / Monograph 104)
  if (q.includes('munda') || (q.includes('vedic') && q.includes('sanskrit')) || q.includes('witzel') || q.includes('substratum')) {
    return `Regarding the transition of Munda substratum elements into Vedic Sanskrit (Monograph #31 & Monograph #104): Comparative linguistic vectors place the structural and lexical interaction (retroflex consonants, agricultural terminology, and prefixation patterns) between Para-Munda/Austroasiatic dialects and Early Vedic Sanskrit during the Late Harappan transition (c. 1900–1200 BCE). Research by Michael Witzel and F.B.J. Kuiper indicates that non-Indo-Aryan Munda lexical items were progressively incorporated into the Middle and Late Rigvedic strata.`;
  }

  // 2. Quantum ML, Free Energy Principle & Consciousness (Paper #409)
  if (q.includes('brownian') || q.includes('free energy') || q.includes('quantum ml') || q.includes('einstein') || q.includes('efe')) {
    return `In response to your query on Quantum Free Energy & Neural Mechanics (Monograph #409): The continuous information theory framework formulates Brownian motion as a stochastic gradient descent over an informational Free Energy Action functional. This unifies quantum entanglement thermodynamics with non-equilibrium brain dynamics.`;
  }

  // 3. Leibnitz Signal Filtering & DSP (Leibnitz 4.0 Suite)
  if (q.includes('signal') || q.includes('fourier') || q.includes('noise') || q.includes('fft') || q.includes('leibnitz') || q.includes('filter')) {
    return `Analysis of your signal processing inquiry: The Leibnitz 4.0 algorithm implements zero-phase digital filtering, polynomial baseline restoration, and short-time Fourier transforms (STFT). For real-time sensor streams (such as ECG or acoustic data), wavelet decomposition isolates noise artifacts without degrading phase coherence.`;
  }

  // 4. Kriya Yoga Meditation & Spinal Energy (Kriya Corpus)
  if (q.includes('kriya') || q.includes('meditation') || q.includes('yogananda') || q.includes('hariharananda') || q.includes('pranayama') || q.includes('breath')) {
    return `Regarding your Kriya Yoga inquiry: Kriya Yoga as taught by Swami Hariharananda & Paramahansa Yogananda is a psychophysiological technique of magnetizing the spinal column. By circulating life energy (prana) around the six spinal centers (chakras), the practitioner neutralizes sensory disturbances, leading to breathless stillness and divine self-realization.`;
  }

  // 5. Bharata Ganita, Pingala & Combinatorics (Vriksha / Math)
  if (q.includes('pingala') || q.includes('vriksha') || q.includes('ganita') || q.includes('combinatorics') || q.includes('binary')) {
    return `Regarding Bharata Ganita and classical Indian mathematics: Acharya Pingala's Chhandas Shastra (c. 3rd century BCE) established the earliest recorded binary numerical system (Dvimatra), Pascal's Triangle (Meru Prastara), and Fibonacci series (Matrameru) centuries prior to modern Western algorithmic notation.`;
  }

  // 6. Prajnanabha Journal & Monograph Submissions
  if (q.includes('prajnanabha') || q.includes('publish') || q.includes('journal') || q.includes('monograph') || q.includes('submission')) {
    return `Regarding publication in Prajnanabha Journal & Press: We accept peer-reviewed interdisciplinary manuscripts connecting empirical mathematical physics, information theory, computational Sanskrit, and contemplative neuroscience. Submissions undergo double-blind review managed by Prajnanabha Editorial Board.`;
  }

  return null;
}

