export const MOCK_ANALYSIS = {
  biasScore: 0.74,
  neuralSignature: "SIG_HACK_2026_SOVEREIGN_7741",
  summary: "The input text exhibits multiple layers of systemic bias, primarily focusing on gender stereotyping and ageist framing. The linguistic structure prioritizes traditional hierarchical dominance and utilizes loaded adjectives to marginalize specific demographic groups.",
  biasTypes: {
    gender: 0.82,
    racial: 0.15,
    political: 0.34,
    age: 0.68,
    socioeconomic: 0.22
  },
  biases: [
    {
      type: "gender",
      start: 4,
      end: 12,
      explanation: "The term 'chairman' uses gendered language for a position that is gender-neutral. It reinforces outdated workplace hierarchies.",
      suggestion: "Use 'chairperson' or 'the chair' to maintain gender neutrality.",
      confidence: 0.98,
      corroboratingTruth: "Modern institutional standards prioritize inclusivity in executive titles."
    },
    {
      type: "gender",
      start: 55,
      end: 63,
      explanation: "Use of 'manpower' assumes a male-default labor force. It marginalizes non-male contributors to the project.",
      suggestion: "Substitute with 'workforce', 'staff', or 'personnel'.",
      confidence: 0.96,
      counterVector: "Diverse labor forces show 19% higher innovation rates according to industry standard neural audits."
    },
    {
      type: "age",
      start: 130,
      end: 145,
      explanation: "Framing 'young employees' as lacking 'maturity' utilizes chronological bias to diminish professional credibility without performance-based logic.",
      suggestion: "Describe specific skill gaps or experience levels without using age as a proxy for maturity.",
      confidence: 0.85
    }
  ],
  rewritten: "The chairperson led the meeting and made it clear that we need more workforce to complete the project. The recently hired employees are tech-proficient, bringing a different perspective than the more experienced staff.",
  rewriteExplanation: "Refraction removed all gendered occupational titles and eliminated age-based maturity proxies, replacing them with experience-relative descriptors.",
  propheticVector: "Continued use of this framing will likely lead to a 14% decrease in retention among non-male and junior employees within 6 months.",
  crossReferences: [
    { source: "UN Ethics Board", title: "Inclusively in Executive Discourse", link: "#", relevance: 0.92 },
    { source: "Oxford Linguistics", title: "The Evolution of Gender-Neutral Labor Terms", link: "#", relevance: 0.88 }
  ]
};

export const MOCK_WEB_SCAN = {
  url: "https://news-outlet.com/article/tech-policy",
  cached: true,
  cachedAt: new Date().toISOString(),
  metadata: {
    title: "Global Tech Policy: The New Era of Control",
    og_description: "An investigative look into how new policies might restrict growth in the sector."
  },
  analysis: {
    detected: true,
    overallAssessment: "This article utilizes alarmist framing and selected data points to create a bias against regulatory frameworks. It uses 'control' as a negative proxy for 'safety' throughout the narrative.",
    credibilityScore: 0.58,
    dominantBiasType: "political",
    biasInstances: [
      {
        phrase: "New Era of Control",
        biasType: "political",
        severity: "high",
        explanation: "Loaded language intended to trigger fear response regarding government oversight.",
        suggestion: "New Era of Regulation",
      },
      {
        phrase: "restrict growth",
        biasType: "socioeconomic",
        severity: "medium",
        explanation: "Unsubstantiated causal link presented as objective fact.",
        suggestion: "influence market dynamics",
      }
    ]
  }
};
