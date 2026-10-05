import { useState, useEffect } from 'react';
import StarField from '@/components/StarField';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sparkles, Loader2, ChevronRight, RotateCcw, GraduationCap, Banknote, Brain, TrendingUp, Trophy, Target } from 'lucide-react';
import { simulatorCareers, SimulatorCareer } from '@/lib/careerSimulatorData';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/i18n/LanguageContext';
import TopBar from "@/components/TopBar";
import { usePageTitle } from '@/hooks/usePageTitle';

type Stage = 'select' | 'loading' | 'intro' | 'scenario' | 'final';

interface Choice {
  id: string;
  text: string;
  consequence: string;
}

interface SkillProgress {
  skill: string;
  level: number;
  careers: string[];
}

const CareerSimulatorPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language } = useLanguage();
  usePageTitle('Career Simulator');
  const [stage, setStage] = useState<Stage>('select');
  const [selectedCareer, setSelectedCareer] = useState<SimulatorCareer | null>(null);
  const [introData, setIntroData] = useState<any>(null);
  const [scenarioData, setScenarioData] = useState<any>(null);
  const [finalData, setFinalData] = useState<any>(null);
  const [previousChoices, setPreviousChoices] = useState<string[]>([]);
  const [scenarioCount, setScenarioCount] = useState(0);
  const [skillProgress, setSkillProgress] = useState<SkillProgress[]>([]);
  const [completedCareers, setCompletedCareers] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  // Load saved progress from localStorage
  useEffect(() => {
    const savedSkills = localStorage.getItem('careerSkillProgress');
    const savedCareers = localStorage.getItem('completedCareers');
    if (savedSkills) setSkillProgress(JSON.parse(savedSkills));
    if (savedCareers) setCompletedCareers(JSON.parse(savedCareers));
  }, []);

  // Save skill progress
  const updateSkillProgress = (skills: string[], careerId: string) => {
    const updatedProgress = [...skillProgress];
    skills.forEach(skill => {
      const existingSkill = updatedProgress.find(s => s.skill === skill);
      if (existingSkill) {
        if (!existingSkill.careers.includes(careerId)) {
          existingSkill.careers.push(careerId);
          existingSkill.level = Math.min(existingSkill.level + 1, 5);
        }
      } else {
        updatedProgress.push({ skill, level: 1, careers: [careerId] });
      }
    });
    setSkillProgress(updatedProgress);
    localStorage.setItem('careerSkillProgress', JSON.stringify(updatedProgress));
  };

  const updateCompletedCareers = (careerId: string) => {
    const updated = [...completedCareers];
    if (!updated.includes(careerId)) {
      updated.push(careerId);
      setCompletedCareers(updated);
      localStorage.setItem('completedCareers', JSON.stringify(updated));
    }
  };

  const callSimulator = async (stageType: string, career: SimulatorCareer, choices: string[] = []) => {
    // Use local fallback instead of calling Supabase function
    return getLocalSimulatorData(stageType, career, choices);
  };

  const getLocalSimulatorData = (stageType: string, career: SimulatorCareer, choices: string[]) => {
    const localData: Record<string, any> = {
      doctor: {
        intro: {
          title: `A Day as a ${career.name}`,
          setting: `You arrive at Addis Ababa University Hospital at 7:00 AM. The morning rounds are about to begin, and the emergency department is already bustling with patients.`,
          scenario: "A patient comes in with severe chest pain and difficulty breathing. The nurse hands you their vitals: BP 90/60, HR 120, O2 sat 88%. What's your first action?",
          careerInfo: {
            salaryRange: "ETB 30,000 - 80,000 per month",
            universities: ["Addis Ababa University", "University of Gondar", "Jimma University", "St. Paul's Hospital"],
            requiredSkills: ["Medical diagnosis", "Patient care", "Emergency response", "Communication"],
            growthOutlook: "High demand in Ethiopia's growing healthcare sector"
          },
          choices: [
            { id: "1", text: "Order immediate ECG and cardiac enzymes", consequence: "Good call - you identify a potential heart attack quickly" },
            { id: "2", text: "Start oxygen and stabilize vitals first", consequence: "Smart prioritization - patient stability comes first" },
            { id: "3", text: "Call cardiology for immediate consult", consequence: "Proactive teamwork - getting specialists involved early" }
          ]
        },
        scenario: {
          title: "The Critical Decision",
          setting: "After stabilizing the patient, you receive a call from the pediatric ward. A 7-year-old child has suddenly developed a severe allergic reaction after eating lunch.",
          scenario: "The child's face is swelling, they're wheezing, and their blood pressure is dropping. The nurse asks if you should administer epinephrine. What do you do?",
          choices: [
            { id: "1", text: "Administer epinephrine immediately", consequence: "Life-saving decision - the child's airway was at risk" },
            { id: "2", text: "Check the allergy chart first", consequence: "Caution is good, but in anaphylaxis, seconds matter" },
            { id: "3", text: "Call the pediatric specialist", consequence: "In emergencies, immediate action is better than waiting" }
          ]
        },
        final: {
          title: "End of Shift",
          result: "You've handled 15 patients today, saved 3 lives, and helped several families understand their treatment plans.",
          skillsEarned: ["Emergency Medicine", "Pediatric Care", "Patient Communication", "Decision Making"],
          salary: "ETB 55,000/month",
          advice: "You showed excellent prioritization and quick thinking. Consider specializing in emergency medicine."
        }
      },
      'software-engineer': {
        intro: {
          title: `A Day as a ${career.name}`,
          setting: `You walk into the modern offices of a tech startup in Addis Ababa. Your team is building a mobile banking app for Ethiopian farmers.`,
          scenario: "The product manager rushes in - a critical bug was reported. Users can't transfer money when they have no internet connection. How do you approach this?",
          careerInfo: {
            salaryRange: "ETB 25,000 - 70,000 per month",
            universities: ["Addis Ababa University", "ASTU", "Mekelle University", "Ethio Telecom Academy"],
            requiredSkills: ["Programming", "Problem solving", "System design", "Communication"],
            growthOutlook: "Expanding rapidly with Ethiopia's digital transformation"
          },
          choices: [
            { id: "1", text: "Implement offline-first architecture with local database", consequence: "Excellent solution - handles network gracefully" },
            { id: "2", text: "Add retry mechanism with queue system", consequence: "Good approach, but doesn't fully solve offline usage" },
            { id: "3", text: "Add warning message about internet requirement", consequence: "User-friendly but doesn't solve the core problem" }
          ]
        },
        scenario: {
          title: "Security Breach",
          setting: "Your team discovers suspicious activity on the app - multiple accounts from the same IP trying different passwords.",
          scenario: "It looks like a brute force attack on user accounts. As the lead engineer, what's your immediate action?",
          choices: [
            { id: "1", text: "Implement rate limiting and account lockout", consequence: "Smart security measure - stops the attack immediately" },
            { id: "2", text: "Notify all users to change passwords", consequence: "Good communication, but causes user panic" },
            { id: "3", text: "Block the suspicious IP addresses", consequence: "Quick fix, but attackers might use different IPs" }
          ]
        },
        final: {
          title: "End of Sprint",
          result: "You deployed 3 new features, fixed 5 bugs, and improved app performance by 40%. The offline banking feature is now in beta testing.",
          skillsEarned: ["Security Engineering", "System Architecture", "Performance Optimization", "Team Leadership"],
          salary: "ETB 45,000/month",
          advice: "Your security thinking is impressive. Consider specializing in cybersecurity or fintech."
        }
      },
      'civil-engineer': {
        intro: {
          title: `A Day as a ${career.name}`,
          setting: `You're at a construction site in Hawassa, overseeing the building of a new bridge across Lake Hawassa. The project is 3 months behind schedule.`,
          scenario: "Your supervisor informs you that the soil testing revealed unexpected soft soil conditions under one of the bridge pillars. The foundation design may need to change. What's your decision?",
          careerInfo: {
            salaryRange: "ETB 20,000 - 60,000 per month",
            universities: ["Addis Ababa University", "ASTU", "Arba Minch University", "Jimma University"],
            requiredSkills: ["Structural analysis", "Project management", "Safety compliance", "Technical drawing"],
            growthOutlook: "Growing with Ethiopia's infrastructure development"
          },
          choices: [
            { id: "1", text: "Redesign foundation with deeper piles", consequence: "Safer long-term solution, adds 2 weeks but ensures stability" },
            { id: "2", text: "Use soil compaction techniques", consequence: "Faster solution, but may not be as reliable long-term" },
            { id: "3", text: "Add support pillars for extra reinforcement", consequence: "Good compromise, changes bridge design slightly" }
          ]
        },
        scenario: {
          title: "Safety Concern",
          setting: "A worker reports that some safety equipment on the site is worn out. Replacing it will cost money and delay the project further.",
          scenario: "The construction company is pressuring you to continue without replacements to meet deadlines. What do you do?",
          choices: [
            { id: "1", text: "Stop work until safety equipment is replaced", consequence: "Ethical decision - safety must never be compromised" },
            { id: "2", text: "Replace only critical equipment immediately", consequence: "Balanced approach - protects workers while minimizing delay" },
            { id: "3", text: "Continue with caution and replace after deadline", consequence: "Risky - safety shortcuts can lead to accidents" }
          ]
        },
        final: {
          title: "Project Milestone",
          result: "The bridge foundation is complete and safe. You negotiated a 2-week extension for safety upgrades. The project now meets all international safety standards.",
          skillsEarned: ["Risk Management", "Safety Engineering", "Project Planning", "Ethical Decision Making"],
          salary: "ETB 38,000/month",
          advice: "Your commitment to safety is commendable. Consider specializing in structural engineering or project management."
        }
      },
      'teacher': {
        intro: {
          title: `A Day as a ${career.name}`,
          setting: `You arrive at a high school in Bahir Dar. Your Grade 11 physics class is struggling with the concept of electromagnetism.`,
          scenario: "Three students come to you after class - they're thinking of dropping physics because they don't understand the material. What's your approach?",
          careerInfo: {
            salaryRange: "ETB 8,000 - 25,000 per month",
            universities: ["Addis Ababa University", "Bahir Dar University", "Gondar University", "Teacher Education Colleges"],
            requiredSkills: ["Subject knowledge", "Communication", "Patience", "Creativity"],
            growthOutlook: "Always in demand, especially in STEM subjects"
          },
          choices: [
            { id: "1", text: "Offer extra tutoring sessions with hands-on experiments", consequence: "Personalized attention - students feel supported" },
            { id: "2", text: "Simplify the curriculum and focus on basics", consequence: "Helpful short-term, but may leave gaps in understanding" },
            { id: "3", text: "Pair them with stronger students for peer learning", consequence: "Good collaborative approach, builds classroom community" }
          ]
        },
        scenario: {
          title: "Classroom Challenge",
          setting: "During a lab experiment, a student accidentally breaks expensive equipment. The class goes silent, waiting for your reaction.",
          scenario: "The student is visibly scared and embarrassed. The equipment cost ETB 15,000. How do you handle this?",
          choices: [
            { id: "1", text: "Turn it into a learning moment about safety, not blame", consequence: "Excellent teaching approach - student learns without shame" },
            { id: "2", text: "Report to administration per school policy", consequence: "By the book, but may discourage student from science" },
            { id: "3", text: "Have the student help clean up and document what happened", consequence: "Teaches responsibility, balanced approach" }
          ]
        },
        final: {
          title: "End of Semester",
          result: "Your class average improved by 25%. The three struggling students all passed with good grades. They now volunteer in the science club.",
          skillsEarned: ["Student Engagement", "Classroom Management", "Differentiated Instruction", "Mentoring"],
          salary: "ETB 18,000/month",
          advice: "Your ability to connect with students is special. Consider educational leadership or curriculum development."
        }
      },
      'agronomist': {
        intro: {
          title: `A Day as a ${career.name}`,
          setting: `You're at a research farm in the Oromia region, testing new drought-resistant teff varieties. This is Ethiopia's most important crop.`,
          scenario: "Early results show that one variety is thriving in dry conditions but produces 20% less grain than traditional varieties. Farmers need to eat this year.",
          careerInfo: {
            salaryRange: "ETB 15,000 - 45,000 per month",
            universities: ["Haramaya University", "Jimma University", "Addis Ababa University", "Agricultural Research Institutes"],
            requiredSkills: ["Plant science", "Research methods", "Data analysis", "Farmer communication"],
            growthOutlook: "Critical for Ethiopia's food security and export earnings"
          },
          choices: [
            { id: "1", text: "Recommend hybrid approach - plant both varieties together", consequence: "Balanced solution - ensures food security while testing innovation" },
            { id: "2", text: "Push for the drought-resistant variety despite lower yield", consequence: "Forward-thinking but may cause short-term hunger" },
            { id: "3", text: "Continue research for another season before recommendation", consequence: "Scientific caution, but farmers need solutions now" }
          ]
        },
        scenario: {
          title: "Pest Outbreak",
          setting: "A neighboring farmer reports a new pest attacking their crops. It could spread to your experimental fields within days.",
          scenario: "The pest is resistant to common pesticides. Your research team is divided on whether to use experimental organic treatments or stronger chemicals.",
          choices: [
            { id: "1", text: "Test organic treatment on small section first", consequence: "Responsible approach - protects environment while finding solution" },
            { id: "2", text: "Use stronger chemicals immediately to save crops", consequence: "Quick fix, but may harm soil and ecosystem" },
            { id: "3", text: "Share with agricultural ministry for coordinated response", consequence: "Excellent leadership - leverages resources for broader impact" }
          ]
        },
        final: {
          title: "Harvest Results",
          result: "Your hybrid recommendation helped 500 farmers adapt to drought. The organic pest control was successful and is now being adopted regionally.",
          skillsEarned: ["Agricultural Research", "Sustainable Farming", "Community Engagement", "Crisis Management"],
          salary: "ETB 32,000/month",
          advice: "Your balance of science and community needs is rare. Consider agricultural policy or international development work."
        }
      },
      'lawyer': {
        intro: {
          title: `A Day as a ${career.name}`,
          setting: `You're at your law firm in Addis Ababa. A client comes in - a small business owner is being sued by a larger corporation for trademark infringement.`,
          scenario: "Your client insists they used the name first and has documents to prove it. However, the corporation is offering a settlement of ETB 200,000 to avoid court.",
          careerInfo: {
            salaryRange: "ETB 20,000 - 80,000 per month",
            universities: ["Addis Ababa University", "St. Mary's University", "Mekelle University", "Ethiopian Civil Service University"],
            requiredSkills: ["Legal research", "Negotiation", "Public speaking", "Critical thinking"],
            growthOutlook: "Growing with Ethiopia's business development and legal reforms"
          },
          choices: [
            { id: "1", text: "Advise client to fight in court - they have the evidence", consequence: "Brave but risky - court cases are expensive and time-consuming" },
            { id: "2", text: "Negotiate better settlement terms with the corporation", consequence: "Pragmatic approach - maximizes benefit while minimizing risk" },
            { id: "3", text: "File counterclaim for trademark theft by corporation", consequence: "Aggressive strategy - could win big or cost everything" }
          ]
        },
        scenario: {
          title: "Ethical Dilemma",
          setting: "A senior partner at your firm asks you to work on a case for a major client who you know has engaged in questionable environmental practices.",
          scenario: "This case could be your big break, but your environmental principles conflict with defending this client. What do you do?",
          choices: [
            { id: "1", text: "Decline based on ethical grounds", consequence: "Integrity over opportunity - but may hurt your career" },
            { id: "2", text: "Take the case but push for environmental remediation", consequence: "Compromise - helps environment but still defends questionable client" },
            { id: "3", text: "Request to transfer to a different partner", consequence: "Avoids direct conflict while maintaining firm relationship" }
          ]
        },
        final: {
          title: "Case Resolution",
          result: "You negotiated a ETB 500,000 settlement for your client - triple the initial offer. Your reputation for tough but fair negotiation is growing.",
          skillsEarned: ["Legal Strategy", "Negotiation", "Ethical Decision Making", "Client Advocacy"],
          salary: "ETB 42,000/month",
          advice: "Your negotiation skills are exceptional. Consider specializing in corporate law or human rights advocacy."
        }
      },
      'data-scientist': {
        intro: {
          title: `A Day as a ${career.name}`,
          setting: `You work for an Ethiopian bank's analytics team. Management wants to predict which customers are likely to default on loans.`,
          scenario: "Your initial model shows that customers from certain regions have higher default rates. This could be due to economic factors or bias in the data. How do you proceed?",
          careerInfo: {
            salaryRange: "ETB 25,000 - 70,000 per month",
            universities: ["Addis Ababa University", "ASTU", "Ethio Telecom Academy", "International training programs"],
            requiredSkills: ["Statistics", "Programming", "Machine learning", "Data visualization"],
            growthOutlook: "Expanding rapidly across all industries in Ethiopia"
          },
          choices: [
            { id: "1", text: "Investigate underlying causes before implementing model", consequence: "Responsible AI - prevents discriminatory lending practices" },
            { id: "2", text: "Implement model but monitor for fairness metrics", consequence: "Balanced approach - uses model while watching for bias" },
            { id: "3", text: "Exclude regional data to avoid bias issues", consequence: "Simplifies problem but loses valuable insights" }
          ]
        },
        scenario: {
          title: "Data Quality Crisis",
          setting: "Your team discovers that 30% of customer data is incorrect or incomplete. This affects all current models and reports.",
          scenario: "Management needs quarterly reports by Friday. Cleaning the data will take two weeks. What's your approach?",
          choices: [
            { id: "1", text: "Explain the data quality issue and delay reports", consequence: "Honest communication - better to be accurate than fast" },
            { id: "2", text: "Generate reports with confidence intervals for uncertainty", consequence: "Scientific approach - shows reliability of current data" },
            { id: "3", text: "Use available data and add disclaimer about quality", consequence: "Risky - might lead to wrong business decisions" }
          ]
        },
        final: {
          title: "Model Deployment",
          result: "Your fair lending model was implemented and increased loan approvals by 15% while reducing defaults. The bank is now using your approach across all products.",
          skillsEarned: ["Machine Learning", "Ethical AI", "Data Analysis", "Business Intelligence"],
          salary: "ETB 48,000/month",
          advice: "Your ethical approach to AI is impressive. Consider specializing in algorithmic fairness or fintech analytics."
        }
      },
      'tourism-guide': {
        intro: {
          title: `A Day as a ${career.name}`,
          setting: `You're leading a group of international tourists through Lalibela's rock-hewn churches. They're fascinated but also asking about Ethiopia's recent challenges.`,
          scenario: "One tourist asks a sensitive question about political tensions in the region. Other tourists look to you for guidance on how to respond.",
          careerInfo: {
            salaryRange: "ETB 8,000 - 25,000 per month",
            universities: ["Ethiopian Tourism Organization", "Addis Ababa University", "Regional tourism colleges", "On-the-job training"],
            requiredSkills: ["Public speaking", "History knowledge", "Cultural sensitivity", "Language skills"],
            growthOutlook: "Recovering post-pandemic, Ethiopia has huge tourism potential"
          },
          choices: [
            { id: "1", text: "Acknowledge challenges but focus on cultural richness and resilience", consequence: "Balanced approach - honest but positive" },
            { id: "2", text: "Redirect to historical context of the churches", consequence: "Safe but avoids the question" },
            { id: "3", text: "Share multiple perspectives neutrally", consequence: "Educational approach - helps tourists understand complexity" }
          ]
        },
        scenario: {
          title: "Unexpected Change",
          setting: "Your tour group arrives at a historical site to find it's closed for emergency maintenance. The group is disappointed and some want refunds.",
          scenario: "You have 30 people who've traveled far for this experience. The site won't reopen for 3 days. What do you do?",
          choices: [
            { id: "1", text: "Quickly arrange alternative nearby attractions", consequence: "Proactive - saves the day with creative solutions" },
            { id: "2", text: "Reschedule and help with accommodation changes", consequence: "Honest but causes major disruption" },
            { id: "3", text: "Contact your agency for emergency alternatives", consequence: "Relies on support system, may take time" }
          ]
        },
        final: {
          title: "Tour Complete",
          result: "Your group gave you 5-star reviews. They appreciated your balanced approach to sensitive topics and your quick thinking when plans changed.",
          skillsEarned: ["Cultural Diplomacy", "Crisis Management", "Public Speaking", "Adaptability"],
          salary: "ETB 15,000/month",
          advice: "Your ability to represent Ethiopia positively is valuable. Consider tour operations or cultural diplomacy."
        }
      },
      'bank-manager': {
        intro: {
          title: `A Day as a ${career.name}`,
          setting: `You manage a branch in Adama. A long-time customer comes in - their small business loan application was rejected by headquarters despite never missing a payment.`,
          scenario: "The customer is upset and threatening to move all their accounts to another bank. They employ 20 people and need this loan to expand.",
          careerInfo: {
            salaryRange: "ETB 25,000 - 60,000 per month",
            universities: ["Addis Ababa University", "St. Mary's University", "Ethiopian Civil Service University", "Banking institutes"],
            requiredSkills: ["Financial analysis", "Risk assessment", "Customer service", "Leadership"],
            growthOutlook: "Stable growth with Ethiopia's financial sector expansion"
          },
          choices: [
            { id: "1", text: "Appeal to headquarters with customer's strong payment history", consequence: "Advocates for customer - uses your relationship and data" },
            { id: "2", text: "Help them understand why and suggest alternatives", consequence: "Educational approach - maintains relationship while managing expectations" },
            { id: "3", text: "Connect them with other lenders who might approve", consequence: "Customer-focused even if they leave the bank" }
          ]
        },
        scenario: {
          title: "Fraud Detection",
          setting: "Your team notices unusual transactions in several accounts - all from the same region, similar amounts, timing suggests coordination.",
          scenario: "This could be organized fraud or legitimate business activity. Flagging it might anger legitimate customers. Ignoring it could violate regulations.",
          choices: [
            { id: "1", text: "Investigate quietly before taking action", consequence: "Careful approach - avoids false accusations while being thorough" },
            { id: "2", text: "Report to anti-fraud unit immediately", consequence: "By the book - protects bank but may affect innocent customers" },
            { id: "3", text: "Contact customers for explanation first", consequence: "Customer-friendly but could tip off actual fraudsters" }
          ]
        },
        final: {
          title: "Quarterly Review",
          result: "Your branch customer satisfaction is at 95%. You helped 15 small businesses get approved after appeals. Your fraud detection prevented ETB 2 million in losses.",
          skillsEarned: ["Risk Management", "Customer Relations", "Regulatory Compliance", "Team Leadership"],
          salary: "ETB 45,000/month",
          advice: "Your balance of customer service and risk management is excellent. Consider regional management or product development."
        }
      }
    };

    // Return data for the requested career
    return localData[career.id] || localData['doctor'];
  };
