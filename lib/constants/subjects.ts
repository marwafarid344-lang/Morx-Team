// FCDS Subjects based on Alexandria University Internal Regulations
// Faculty of Computers and Data Sciences - April 2019
import {
  Gamepad2,
  CodeXml,
  BriefcaseBusiness,
  Building2
} from "lucide-react"
// Common Faculty-level subjects for all programs (Level 1 - Semester 1 & 2)
export const FCDS_SUBJECTS: Record<number, Record<string, string[]>> = {
  1: {
    "DS": [
      "Linear Alg.",
      "Calculus",
      "Introduction to CS",
      "Introduction to DS",
      "Programming I",
      "Probability I",
      "Discrete Structures",
      "Data Structures",
      "Introduction to AI",
      "Programming II"
    ],
    "BA": [
      "Linear Alg.",
      "Calculus",
      "Introduction to CS",
      "Introduction to DS",
      "Programming I",
      "Probability I",
      "Discrete Structures",
      "Data Structures",
      "Introduction to AI",
      "Programming II"
    ],
    "IS": [
      "Linear Alg.",
      "Calculus",
      "Introduction to CS",
      "Introduction to DS",
      "Programming I",
      "Probability I",
      "Discrete Structures",
      "Data Structures",
      "Introduction to AI",
      "Programming II"
    ],
    "HI": [
      "Linear Alg.",
      "Calculus",
      "Introduction to CS",
      "Introduction to DS",
      "Programming I",
      "Probability I",
      "Discrete Structures",
      "Data Structures",
      "Introduction to AI",
      "Programming II"
    ],
    "CS": [
      "Linear Alg.",
      "Calculus",
      "Introduction to CS",
      "Introduction to DS",
      "Programming I",
      "Probability I",
      "Discrete Structures",
      "Data Structures",
      "Introduction to AI",
      "Programming II"
    ],
    "MA": [
      "Linear Alg.",
      "Calculus",
      "Introduction to CS",
      "Introduction to DS",
      "Programming I",
      "Probability I",
      "Discrete Structures",
      "Data Structures",
      "Introduction to AI",
      "Programming II"
    ]
  },
  2: {
    "DS": [
      // Computing and Data Sciences - Level 2
      "Probability and Statistics II",
      "Introduction to Databases",
      "Numerical Computations",
      "Advanced Calculus",
      "Data Science Methodology",
      "Cloud Computing",
      "Machine Learning",
      "Data Mining and Analytics",
      "Data Science Tools and Software",
      "Regression Analysis",
      "Field Training I"
    ],
    "BA": [
      // Business Analytics - Level 2
      "Probability and Statistics II",
      "Introduction to Databases",
      "Numerical Computations",
      "Introduction to Business",
      "Accounting as an Information Systems",
      "Cloud Computing",
      "Machine Learning",
      "Data Mining and Analytics",
      "System Analysis & Design",
      "Financial Planning and Analysis",
      "Field Training I"
    ],
    "IS": [
      // Intelligent Systems - Level 2
      "Probability and Statistics II",
      "Introduction to Databases",
      "Numerical Computations",
      "Smart Systems and Computational Intelligence",
      "Operations Research",
      "Cloud Computing",
      "Machine Learning",
      "Data Mining and Analytics",
      "Pattern Recognition",
      "Neural Networks",
      "Field Training I"
    ],
    "MA": [
      // Media Analytics - Level 2
      "Probability and Statistics II",
      "Introduction to Databases",
      "Numerical Computations",
      "Data Driven Journalism",
      "Digital Mass Communication",
      "Cloud Computing",
      "Machine Learning",
      "Data Mining and Analytics",
      "Digital Video Production",
      "News Editing and Blogging",
      "Field Training I"
    ],
    "HI": [
      // Healthcare Informatics - Level 2
      "Probability and Statistics II",
      "Introduction to Databases",
      "Numerical Computations",
      "Introduction to Epidemiology",
      "Anatomy and Physiology",
      "Cloud Computing",
      "Machine Learning",
      "Data Mining and Analytics",
      "Pharmacology and Chemistry of Drugs",
      "Ethics & Regulations in Healthcare",
      "Field Training I"
    ],
    "CS": [
      // Cybersecurity - Level 2
      "Probability and Statistics II",
      "Introduction to Databases",
      "Numerical Computations",
      "Introduction to Cybersecurity",
      "Number Theory",
      "Cloud Computing",
      "Machine Learning",
      "Data Mining and Analytics",
      "Cryptography",
      "Operating Systems",
      "Field Training I"
    ]
  },
  3: {
    "DS": [
      // Computing and Data Sciences - Level 3
      "Stochastic Processes",
      "Design and Analysis of Experiments",
      "Data Visualization Tools",
      "Data Computation and Analysis",
      "Survey Methodology",
      "Computing Intensive Statistical Methods",
      "Field Training II"
    ],
    "BA": [
      // Business Analytics - Level 3
      "Business Process Modeling and Integration",
      "Quantitative Analysis",
      "Data Warehousing & Business Intelligence",
      "Data Visualization",
      "Enterprise Information Systems",
      "Data Driven Marketing",
      "Field Training II"
    ],
    "IS": [
      // Intelligent Systems - Level 3
      "Intelligent Programming",
      "Deep Learning",
      "Modern Control Systems",
      "Embedded Systems",
      "Computer Vision",
      "AI Security Issues",
      "Field Training II"
    ],
    "MA": [
      // Media Analytics - Level 3
      "Image Processing",
      "Web Design and Search-Engine Optimization",
      "Computer Audio",
      "Infographics and Data Visualization",
      "Natural Language Processing",
      "Media Processing",
      "Field Training II"
    ],
    "HI": [
      // Healthcare Informatics - Level 3
      "Neuroscience and Robotics",
      "Health Information Systems",
      "Computer-Assisted Drug Design",
      "National and International Healthcare Systems",
      "Health Policy & Economics",
      "Healthcare Market Analytics",
      "Field Training II"
    ],
    "CS": [
      // Cybersecurity - Level 3
      "Computer Networks",
      "Operating Systems Security",
      "Secure Software Development",
      "Computer and Network Security",
      "Data Integrity and Authentication",
      "Information Security Management",
      "Field Training II"
    ]
  },
  4: {
    "DS": [
      // Computing and Data Sciences - Level 4
      "Big Data Analytics",
      "Introduction to Social Networks",
      "Simulations",
      "Project I",
      "Social Data Analytics",
      "Distributed Data Analysis",
      "Stream Processing",
      "Project II"
    ],
    "BA": [
      // Business Analytics - Level 4
      "Leadership and People Analytics",
      "Data and IT Governance",
      "Information Retrieval",
      "Project I",
      "Text and Social Media Mining",
      "Logistics and Supply Chain Analytics",
      "Information Technology Laws and Ethics",
      "Project II"
    ],
    "IS": [
      // Intelligent Systems - Level 4
      "AI Platforms",
      "Internet of Things I",
      "Natural Language Processing",
      "Project I",
      "Reinforcement Learning",
      "AI for Robotics",
      "Visual Recognition",
      "Project II"
    ],
    "MA": [
      // Media Analytics - Level 4
      "Computer Graphics",
      "Digital Broadcasting",
      "Audience research and analysis",
      "Project I",
      "Social Media Analytics",
      "Multimedia Analytics",
      "Public opinion and E Surveys",
      "Project II"
    ],
    "HI": [
      // Healthcare Informatics - Level 4
      "E-health, Telehealth and Telemedicine",
      "Mathematical Modelling for Health",
      "Clinical & Medical Care Delivery",
      "Project I",
      "Computerized Disease Registries",
      "Clinical Decision Support Systems",
      "Health Psychology",
      "Project II"
    ],
    "CS": [
      // Cybersecurity - Level 4
      "Social Network Computing",
      "Security of Distributed Systems",
      "Human Security",
      "Project I",
      "Cybersecurity Risk Management",
      "Digital Forensics",
      "Law and Cybersecurity",
      "Project II"
    ]
  }
};

// Faculty Elective Subjects (common options)
export const FACULTY_ELECTIVES: string[] = [
  "Software Engineering",
  "Systems Analysis and Design",
  "Algorithm Design",
  "Distributed Processing",
  "Mobile Programming",
  "Web Programming",
  "Operating Systems",
  "Computer Networks"
];

// Program-specific elective subjects
export const PROGRAM_ELECTIVES: Record<string, string[]> = {
  "DS": [
    "Convex Optimization",
    "Non-Linear and Combinatorial Optimization",
    "Multivariate Statistical Analysis",
    "Bayesian Statistics",
    "Data Compression Techniques",
    "Concurrent Algorithms and Data Structures",
    "Distributed Database Systems",
    "Advanced Database Systems"
  ],
  "BA": [
    "Human Computer Interaction",
    "Gamification and Games Development",
    "Technology Trends and Innovation",
    "GIS and Spatial Data Mining",
    "Managing Technology Projects",
    "Smart Cities and E-Government",
    "Digital Transformation and Digital Economics",
    "Manufacturing Analytics",
    "Predictive Analytics",
    "NLP and Semantic Analysis"
  ],
  "IS": [
    "Speech Recognition",
    "Natural Language Understanding",
    "Embedded Machine Learning",
    "Intelligence Technology Trends",
    "Internet of Things II",
    "Knowledge-Base AI",
    "Virtual Reality",
    "Game Theory"
  ],
  "MA": [
    "Interactive Media",
    "Online Journalism",
    "Computational Photography",
    "Computer Animations",
    "Video Game Design and Programming",
    "Virtual Reality",
    "Digital Media Forensics"
  ],
  "HI": [
    "Radiation Physics",
    "Cellular & Molecular Biology",
    "Radiation Biology",
    "Pathophysiology & Lab Data",
    "Principles of Biochemistry"
  ],
  "CS": [
    "AI Security Issues",
    "Proactive Computer Security",
    "Software Security Engineering",
    "Blockchain and Security of Blockchain",
    "Cloud Computing Security",
    "Social Networks Analytics",
    "Internet of Things",
    "Mobile Computing"
  ]
};

export const TEAM_PURPOSES = [
  { id: 'gaming', label: 'Gaming', icon: Gamepad2 },
  { id: 'business', label: 'Business', icon: BriefcaseBusiness },
  { id: 'development', label: 'Development', icon: CodeXml },
  { id: 'fcds', label: 'FCDS', icon: Building2 }
];

// Department names mapping
export const DEPARTMENT_NAMES: Record<string, string> = {
  "DS": "Computing and Data Sciences",
  "BA": "Business Analytics",
  "IS": "Intelligent Systems",
  "MA": "Media Analytics",
  "HI": "Healthcare Informatics",
  "CS": "Cybersecurity"
};
