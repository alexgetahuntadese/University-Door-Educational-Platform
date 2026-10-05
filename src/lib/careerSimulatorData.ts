export interface SimulatorCareer {
  id: string;
  name: string;
  icon: string;
  description: string;
  field: string;
  color: string;
}

export const simulatorCareers: SimulatorCareer[] = [
  { id: 'doctor', name: 'Doctor', icon: '🩺', description: 'Diagnose and treat patients in hospitals and clinics', field: 'Healthcare', color: 'from-emerald-500 to-teal-600' },
  { id: 'software-engineer', name: 'Software Engineer', icon: '💻', description: 'Design and build software applications and systems', field: 'Technology', color: 'from-blue-500 to-indigo-600' },
  { id: 'civil-engineer', name: 'Civil Engineer', icon: '🏗️', description: 'Design and oversee construction of infrastructure', field: 'Engineering', color: 'from-amber-500 to-orange-600' },
  { id: 'journalist', name: 'Journalist', icon: '📰', description: 'Investigate and report news stories to the public', field: 'Media', color: 'from-rose-500 to-pink-600' },
  { id: 'agronomist', name: 'Agronomist', icon: '🌾', description: 'Improve crop production and farming techniques', field: 'Agriculture', color: 'from-green-500 to-lime-600' },
  { id: 'lawyer', name: 'Lawyer', icon: '⚖️', description: 'Represent clients and advocate for justice in courts', field: 'Law', color: 'from-purple-500 to-violet-600' },
  { id: 'teacher', name: 'Teacher', icon: '📚', description: 'Educate and inspire the next generation of leaders', field: 'Education', color: 'from-cyan-500 to-sky-600' },
  { id: 'architect', name: 'Architect', icon: '🏛️', description: 'Design buildings and urban spaces', field: 'Design', color: 'from-slate-500 to-gray-600' },
  { id: 'pharmacist', name: 'Pharmacist', icon: '💊', description: 'Dispense medications and advise on drug interactions', field: 'Healthcare', color: 'from-red-500 to-rose-600' },
  { id: 'data-scientist', name: 'Data Scientist', icon: '📊', description: 'Analyze data to discover insights and drive decisions', field: 'Technology', color: 'from-violet-500 to-purple-600' },
  { id: 'veterinarian', name: 'Veterinarian', icon: '🐄', description: 'Care for animals and support livestock health', field: 'Agriculture', color: 'from-yellow-500 to-amber-600' },
  { id: 'accountant', name: 'Accountant', icon: '🧮', description: 'Manage finances and ensure regulatory compliance', field: 'Business', color: 'from-indigo-500 to-blue-600' },
  { id: 'tourism-guide', name: 'Tourism Guide', icon: '🗺️', description: 'Showcase Ethiopia\'s rich history and culture to visitors', field: 'Tourism', color: 'from-orange-500 to-red-600' },
  { id: 'coffee-exporter', name: 'Coffee Exporter', icon: '☕', description: 'Manage Ethiopia\'s world-renowned coffee trade internationally', field: 'Business', color: 'from-amber-700 to-yellow-800' },
  { id: 'telecom-engineer', name: 'Telecom Engineer', icon: '📡', description: 'Build and maintain Ethiopia\'s growing telecommunications network', field: 'Engineering', color: 'from-teal-500 to-cyan-600' },
  { id: 'public-health-officer', name: 'Public Health Officer', icon: '🏥', description: 'Lead community health initiatives and disease prevention', field: 'Healthcare', color: 'from-pink-500 to-rose-600' },
  { id: 'bank-manager', name: 'Bank Manager', icon: '🏦', description: 'Oversee banking operations and financial services', field: 'Business', color: 'from-emerald-600 to-green-700' },
  { id: 'textile-engineer', name: 'Textile Engineer', icon: '🧵', description: 'Manage Ethiopia\'s growing textile and garment industry', field: 'Engineering', color: 'from-purple-600 to-indigo-700' },
  { id: 'electrician', name: 'Electrician', icon: '⚡', description: 'Install and maintain electrical systems in buildings', field: 'Technical', color: 'from-yellow-500 to-orange-500' },
  { id: 'chef', name: 'Chef', icon: '👨‍🍳', description: 'Create culinary experiences and manage kitchen operations', field: 'Hospitality', color: 'from-red-500 to-orange-500' },
  { id: 'graphic-designer', name: 'Graphic Designer', icon: '🎨', description: 'Create visual content for brands and media', field: 'Creative', color: 'from-pink-500 to-purple-500' },
  { id: 'mechanic', name: 'Mechanic', icon: '🔧', description: 'Repair and maintain vehicles and machinery', field: 'Technical', color: 'from-gray-500 to-slate-600' },
  { id: 'real-estate-agent', name: 'Real Estate Agent', icon: '🏠', description: 'Help people buy, sell, and rent properties', field: 'Business', color: 'from-blue-500 to-cyan-500' },
  { id: 'photographer', name: 'Photographer', icon: '📷', description: 'Capture moments and tell stories through images', field: 'Creative', color: 'from-indigo-500 to-purple-500' },
  { id: 'environmental-scientist', name: 'Environmental Scientist', icon: '🌍', description: 'Study and protect natural ecosystems', field: 'Science', color: 'from-green-500 to-teal-500' },
  { id: 'social-worker', name: 'Social Worker', icon: '🤝', description: 'Support vulnerable individuals and communities', field: 'Social Services', color: 'from-rose-500 to-pink-500' },
  { id: 'logistics-manager', name: 'Logistics Manager', icon: '🚚', description: 'Coordinate supply chains and transportation', field: 'Business', color: 'from-amber-500 to-yellow-500' },
  { id: 'interior-designer', name: 'Interior Designer', icon: '🛋️', description: 'Design beautiful and functional indoor spaces', field: 'Design', color: 'from-fuchsia-500 to-pink-500' },
  { id: 'flight-attendant', name: 'Flight Attendant', icon: '✈️', description: 'Ensure passenger safety and comfort on flights', field: 'Aviation', color: 'from-sky-500 to-blue-500' },
  { id: 'fitness-trainer', name: 'Fitness Trainer', icon: '💪', description: 'Help people achieve their health and fitness goals', field: 'Health', color: 'from-lime-500 to-green-500' },
];
